"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tabs, Tag, Typography, message } from "antd";
import { thaiDate } from "../lib/orientation/domain.mjs";
import { assignableEmployeeRows } from "../lib/orientation/manageUi.mjs";
import { photoCountError } from "../lib/orientation/photoUpload.mjs";
import { preparePhotos } from "../lib/orientation/preparePhotos.mjs";

const required = [{ required: true, message: "กรุณาระบุข้อมูล" }];
const stateLabels = { pending: "รอเช็กชื่อ", attended: "เข้าร่วม", absent: "ไม่มา", rescheduled: "เลื่อนรอบ", draft: "แบบร่าง", open: "เปิด", closed: "ปิดรอบ", in_progress: "กำลังดำเนินการ", completed: "ปิดงานแล้ว", visited: "เยี่ยมชมแล้ว" };
const titles = { "location.create": "เพิ่มสถานที่", "session.save": "บันทึกรอบ", assign: "จัด/เลื่อนรอบ", attendance: "เช็กชื่อ", site_visit: "Site Visit", handover: "บันทึกส่งมอบ", "participant.close": "ปิดงานรายคน", "participant.reopen": "เปิดงานรายคนใหม่", "session.close": "ปิดรอบ", "session.reopen": "เปิดรอบใหม่", "photo.add": "อัปโหลดรูปกิจกรรม" };
const stateColors = { pending: "gold", attended: "green", absent: "red", rescheduled: "orange", draft: "default", open: "blue", closed: "default", in_progress: "processing", completed: "green", visited: "cyan" };

async function management(signal) {
  const [data, eligible] = await Promise.all(["/recruitment/api/orientation/manage", "/recruitment/api/orientation"].map(async (url) => {
    const response = await fetch(url, { cache: "no-store", signal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "โหลดข้อมูลไม่สำเร็จ");
    return result;
  }));
  return { ...data, eligibleRows: eligible.rows };
}

export default function WorkflowPanel({ photoPage = false, sessionId = null }) {
  const router = useRouter();
  const [data, setData] = useState({ employees: [], sessions: [], participants: [], locations: [], handovers: [], history: [], eligibleRows: [] });
  const eligibleRows = assignableEmployeeRows(data.eligibleRows);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(photoPage ? { action: "photo.add", row: null, request_id: null } : null);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [form] = Form.useForm();
  const chosenSession = Form.useWatch("session_id", form);
  const attendance = Form.useWatch("attendance_status", form);
  const photoType = Form.useWatch("photo_type", form);
  useEffect(() => {
    const controller = new AbortController();
    management(AbortSignal.any([controller.signal, AbortSignal.timeout(30000)])).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function refresh() {
    setLoading(true);
    try { setData(await management(AbortSignal.timeout(30000))); setError(""); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  const sessionName = (id) => { const s = data.sessions.find((s) => s.id === id); return s ? `${thaiDate(s.orientation_date)} ${s.session_name || s.session_code}` : "-"; };
  const activeSession = sessionId ? data.sessions.find((s) => s.id === sessionId) : null;
  const roundParticipants = activeSession ? data.participants.filter((p) => p.session_id === sessionId) : [];
  const roundHistory = activeSession ? data.history.filter((entry) => entry.session_id === sessionId) : [];
  const staffOptions = data.employees.map((e) => ({ value: e.id, label: e.label }));
  const sessionOptions = data.sessions.filter((s) => s.status !== "closed").map((s) => ({ value: s.id, label: sessionName(s.id) }));
  function open(action, row = null, extra = {}) {
    form.resetFields(); setFiles([]);
    const session = data.sessions.find((s) => s.id === row?.session_id);
    form.setFieldsValue({
      draft: true, facilitator_ids: [], color_hex: "#1677ff", start_time: "09:00", end_time: "12:00",
      attendance_status: "attended", at: `${session?.orientation_date || ""}T10:00`,
      ...(action === "session.save" && row ? { ...row, session_id: row.id, start_time: row.start_time?.slice(0, 5), end_time: row.end_time?.slice(0, 5), draft: row.status === "draft" } : {}),
      ...(action === "assign" && row ? { application_ids: [row.application_id] } : {}), ...extra,
    });
    setEditor({ action, row, request_id: crypto.randomUUID() });
  }
  async function save() {
    if (saving) return;
    try {
      const values = await form.validateFields();
      const requestId = editor.request_id || crypto.randomUUID();
      if (!editor.request_id) setEditor((old) => ({ ...old, request_id: requestId }));
      const payload = { ...values, action: editor.action, request_id: requestId };
      if (editor.row && !["session.save", "assign", "photo.add"].includes(editor.action)) {
        payload[editor.action.startsWith("session.") ? "session_id" : "participant_id"] = editor.row.id;
        payload.version = editor.row.updated_at || editor.row.created_at || null;
      }
      if (editor.action === "session.save" && editor.row) payload.version = editor.row.updated_at || editor.row.created_at || null;
      if (payload.at) payload.at = `${payload.at.length === 16 ? payload.at + ":00" : payload.at}+07:00`;
      let body, headers;
      if (editor.action === "photo.add") {
        const countError = photoCountError(payload.photo_type, files.length);
        if (countError) throw new Error(countError);
        setSaving(true);
        const prepared = await preparePhotos(files);
        body = new FormData(); prepared.forEach((file) => body.append("files", file)); body.set("payload", JSON.stringify(payload));
      } else { headers = { "Content-Type": "application/json" }; body = JSON.stringify(payload); }
      setSaving(true);
      const response = await fetch(`/recruitment/api/orientation${editor.action === "photo.add" ? "/upload" : ""}`, { method: "POST", headers, body, signal: AbortSignal.timeout(60000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "บันทึกไม่สำเร็จ");
      message.success("บันทึกเรียบร้อยแล้ว");
      if (photoPage) { router.push("/recruitment/orientation/manage"); return; }
      setEditor(null); await refresh();
    } catch (err) { if (!err.errorFields) message.error(err.message || "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  }
  const sessionColumns = [
    { title: "วัน", dataIndex: "orientation_date", render: (value) => thaiDate(value) },
    { title: "รอบ", dataIndex: "session_name" }, { title: "สถานที่", dataIndex: "location_name_snapshot" },
    { title: "สถานะ", dataIndex: "status", render: (value) => <Tag color={stateColors[value]}>{stateLabels[value] || value}</Tag> },
    { title: "จัดการ", render: (_, row) => <Space wrap>
      <Button type="primary" href={`/recruitment/orientation/manage/${encodeURIComponent(row.id)}`}>จัดการ</Button>
      <Button disabled={!row.can_manage || row.status === "closed"} onClick={() => open("session.save", row)}>แก้ไข</Button>
      <Button disabled={!row.can_manage || row.status === "closed"} onClick={() => open("assign", null, { session_id: row.id })}>เพิ่ม/เลื่อนพนักงาน</Button>
      <Button disabled={!row.can_manage} onClick={() => open(row.status === "closed" ? "session.reopen" : "session.close", row)}>{row.status === "closed" ? "เปิดใหม่" : "ปิดรอบ"}</Button>
    </Space> },
  ];
  const participantColumns = [
    { title: "พนักงาน", dataIndex: "full_name" },
    { title: "รอบ", dataIndex: "session_id", render: sessionName },
    { title: "เช็กชื่อ", dataIndex: "attendance_status", render: (value) => <Tag color={stateColors[value]}>{stateLabels[value] || value}</Tag> },
    { title: "Site Visit", dataIndex: "site_visit_status", render: (value) => <Tag color={stateColors[value]}>{stateLabels[value] || value}</Tag> },
    { title: "ความคืบหน้า", dataIndex: "workflow_status", render: (value) => <Tag color={stateColors[value]}>{stateLabels[value] || value}</Tag> },
    { title: "จัดการ", render: (_, row) => {
      const closed = data.sessions.find((s) => s.id === row.session_id)?.status === "closed";
      const completed = row.workflow_status === "completed";
      return <Space wrap>
        <Button disabled={closed || completed} onClick={() => open("attendance", row)}>เช็กชื่อ</Button>
        <Button disabled={closed || completed || row.attendance_status !== "attended"} onClick={() => open("site_visit", row)}>Site Visit</Button>
        <Button disabled={closed || completed || row.site_visit_status !== "visited"} onClick={() => open("handover", row)}>ส่งมอบ</Button>
        <Button disabled={closed || completed || row.attendance_status === "attended"} onClick={() => open("assign", row)}>เลื่อนรอบ</Button>
        <Button disabled={closed} onClick={() => open(completed ? "participant.reopen" : "participant.close", row)}>{completed ? "เปิดงานใหม่" : "ปิดงาน"}</Button>
      </Space>;
    } },
  ];
  const action = editor?.action;
  const needsReason = action?.endsWith(".reopen") || (action === "assign" && editor?.row) || (action === "attendance" && attendance === "rescheduled");
  const EditorContainer = photoPage ? Card : Modal;
  const editorProps = photoPage ? { style: { maxWidth: 900 } } : { open: Boolean(editor), title: titles[action], onCancel: () => !saving && setEditor(null), onOk: save, confirmLoading: saving, okText: "บันทึก", width: 720, destroyOnHidden: true };
  return <>
    {!photoPage && <Card className="w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]" styles={{ body: { padding: 0 } }}>
      <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <Typography.Title level={2} style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
              {sessionId && activeSession ? sessionName(sessionId) : sessionId ? "รายละเอียดรอบ Orientation" : "รอบ Orientation ทั้งหมด"}
            </Typography.Title>
            <Typography.Text type="secondary" className="mt-1 block">
              {sessionId ? "จัดการผู้เข้าร่วมและติดตามขั้นตอนของรอบนี้" : loading ? "กำลังโหลดข้อมูลรอบ..." : `พบ ${data.sessions.length} รอบ`}
            </Typography.Text>
          </div>

          <Space wrap size={[8, 8]}>
            {!sessionId && <>
              <Button type="primary" onClick={() => open("session.save")}>สร้างรอบ</Button>
              <Button onClick={() => open("location.create")}>เพิ่มสถานที่</Button>
            </>}
            <Button href={sessionId ? `/recruitment/orientation/manage/upload?session_id=${encodeURIComponent(sessionId)}` : "/recruitment/orientation/manage/upload"}>อัปโหลดรูปกิจกรรม</Button>
            <Button loading={loading} onClick={refresh}>โหลดใหม่</Button>
          </Space>
        </div>

        {sessionId && activeSession && <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <Typography.Text type="secondary">สถานะรอบ</Typography.Text>
          <Tag color={stateColors[activeSession.status]} style={{ marginInlineEnd: 0 }}>{stateLabels[activeSession.status] || activeSession.status}</Tag>
          <Typography.Text type="secondary">ผู้เข้าร่วม {roundParticipants.length} คน</Typography.Text>
        </div>}
      </div>

      <div className="p-4 sm:p-6">
        {error && <Alert type="error" showIcon title={error} action={<Button loading={loading} onClick={refresh}>ลองอีกครั้ง</Button>} style={{ marginBottom: 16 }} />}
        {sessionId && !loading && !error && !activeSession && <Alert type="warning" showIcon title="ไม่พบรอบนี้ หรือคุณไม่มีสิทธิ์เข้าถึง" description="กลับไปหน้าจัดการรอบแล้วเลือกรอบที่สามารถเข้าถึงได้" />}
        {!sessionId ? <Table rowKey="id" columns={sessionColumns} dataSource={data.sessions} loading={loading} scroll={{ x: 1100 }} locale={{ emptyText: "ยังไม่มีรอบ Orientation เริ่มต้นด้วยการสร้างรอบใหม่" }} pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `ทั้งหมด ${total} รอบ` }} /> : (loading || activeSession) && <Tabs items={[
          { key: "participants", label: `ผู้เข้าร่วม${roundParticipants.length ? ` (${roundParticipants.length})` : ""}`, children: <Table rowKey="id" columns={participantColumns} dataSource={roundParticipants} loading={loading} scroll={{ x: 1500 }} locale={{ emptyText: "ยังไม่มีผู้เข้าร่วมในรอบนี้" }} pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `ทั้งหมด ${total} คน` }} /> },
          { key: "history", label: `ประวัติ${roundHistory.length ? ` (${roundHistory.length})` : ""}`, children: <Table rowKey="id" loading={loading} dataSource={[...roundHistory].sort((a, b) => b.created_at.localeCompare(a.created_at))} locale={{ emptyText: "ยังไม่มีประวัติของรอบนี้" }} scroll={{ x: 760 }} columns={[{ title: "เวลา", dataIndex: "created_at", render: (value) => new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" }).format(new Date(value)) }, { title: "รายการ", dataIndex: "action", render: (value) => titles[value] || value }, { title: "เหตุผล", dataIndex: "note" }, { title: "จาก", dataIndex: "from_status" }, { title: "เป็น", dataIndex: "to_status" }]} /> },
        ]} />}
      </div>
    </Card>}
    <EditorContainer {...editorProps}>
      {photoPage && error && <Alert type="error" showIcon title={error} action={<Button onClick={refresh} loading={loading}>โหลดใหม่</Button>} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" disabled={saving || (photoPage && loading)} onValuesChange={() => setEditor((old) => ({ ...old, request_id: crypto.randomUUID() }))}>
        {action === "location.create" && <><Form.Item name="location_name" label="ชื่อสถานที่" rules={required}><Input maxLength={200} /></Form.Item><Form.Item name="location_detail" label="รายละเอียด"><Input.TextArea /></Form.Item><Form.Item name="color_hex" label="สี" rules={required}><Input type="color" /></Form.Item></>}
        {action === "session.save" && <>
          <Form.Item name="session_id" hidden><Input /></Form.Item>
          <Form.Item name="session_name" label="ชื่อรอบ" rules={required}><Input maxLength={200} /></Form.Item>
          <Form.Item name="orientation_date" label="วันที่ Orientation" rules={required}><Input type="date" /></Form.Item>
          <Space><Form.Item name="start_time" label="เริ่ม" rules={required}><Input type="time" /></Form.Item><Form.Item name="end_time" label="สิ้นสุด" rules={required}><Input type="time" /></Form.Item></Space>
          <Form.Item name="location_id" label="สถานที่" rules={required}><Select options={data.locations.filter((l) => l.is_active !== false).map((l) => ({ value: l.id, label: l.location_name }))} /></Form.Item>
          <Form.Item name="site_visit_location" label="สถานที่ Site Visit"><Input /></Form.Item>
          <Form.Item name="facilitator_ids" label="ผู้ดำเนินการ"><Select mode="multiple" showSearch optionFilterProp="label" options={staffOptions} /></Form.Item>
          <Form.Item name="draft" label="บันทึกแบบร่าง" valuePropName="checked"><Switch /></Form.Item>
        </>}
        {["assign", "photo.add"].includes(action) && <Form.Item name="session_id" label="รอบ" rules={required}><Select options={sessionOptions} onChange={() => form.setFieldValue("participant_ids", [])} /></Form.Item>}
        {action === "assign" && <Form.Item name="application_ids" label="พนักงาน (สูงสุด 50 คน)" rules={required}><Select mode="multiple" showSearch optionFilterProp="label" options={eligibleRows.map((row) => ({ value: row.application_id, label: `${row.employee_code || ""} ${row.full_name}` }))} /></Form.Item>}
        {action === "attendance" && <Form.Item name="attendance_status" label="ผลเช็กชื่อ" rules={required}><Select options={["pending", "attended", "absent", "rescheduled"].map((value) => ({ value, label: stateLabels[value] }))} /></Form.Item>}
        {action === "attendance" && attendance === "rescheduled" && <Form.Item name="reschedule_date" label="วันที่เลื่อน" rules={required}><Input type="date" /></Form.Item>}
        {(["site_visit", "handover", "photo.add"].includes(action) || (action === "attendance" && attendance === "attended")) && <Form.Item name="at" label="วันเวลา (ประเทศไทย)" rules={required}><Input type="datetime-local" /></Form.Item>}
        {action === "handover" && <><Form.Item name="receiver_employee_id" label="ผู้รับส่งมอบ" rules={required}><Select showSearch optionFilterProp="label" options={staffOptions} /></Form.Item><Form.Item name="handover_location" label="สถานที่ส่งมอบ" rules={required}><Input /></Form.Item><Alert type="info" title="ผู้ส่งมอบใช้พนักงานของบัญชี HR ที่ล็อกอิน บันทึกแล้วถือว่าส่งมอบสำเร็จ" /></>}
        {action === "photo.add" && <>
          <Form.Item name="photo_type" label="หมวดรูป" rules={required}><Select options={[{ value: "orientation", label: "Orientation" }, { value: "site_visit", label: "Site Visit" }, { value: "handover", label: "ส่งมอบ" }]} /></Form.Item>
          <Form.Item name="participant_ids" label="ผู้เข้าร่วมจริงในภาพ" rules={required}><Select mode="multiple" showSearch optionFilterProp="label" options={data.participants.filter((p) => p.session_id === chosenSession && p.attendance_status === "attended" && p.workflow_status !== "completed").map((p) => ({ value: p.id, label: p.full_name || "ผู้เข้าร่วม" }))} /></Form.Item>
          <Form.Item label={photoType === "handover" ? "รูปส่งมอบ 1–9 รูปต่อชุด เพิ่มชุดใหม่ได้" : "Orientation / Site Visit ต้องเลือก 3 รูป"} extra={`JPG/PNG/WebP ไม่เกิน 5 MB ต่อรูป • ระบบปรับขนาดภาพก่อนส่ง • เลือกแล้ว ${files.length} รูป`}><Input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFiles(Array.from(event.target.files || [])); setEditor((old) => ({ ...old, request_id: crypto.randomUUID() })); }} /></Form.Item>
        </>}
        {!action?.endsWith(".close") && !action?.endsWith(".reopen") && <Form.Item name="notes" label="หมายเหตุ"><Input.TextArea rows={2} /></Form.Item>}
        {action !== "location.create" && <Form.Item name="reason" label="เหตุผล (ต้องระบุเมื่อเลื่อน/เปิดงานใหม่/แก้ส่งมอบ)" rules={needsReason ? required : []}><Input.TextArea rows={2} /></Form.Item>}
      </Form>
      {photoPage && <Space wrap><Button type="primary" loading={saving} disabled={loading || Boolean(error)} onClick={save}>บันทึกรูปกิจกรรม</Button><Button href="/recruitment/orientation/manage" disabled={saving}>กลับหน้าจัดการ</Button></Space>}
    </EditorContainer>
  </>;
}
