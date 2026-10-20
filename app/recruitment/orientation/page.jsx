"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import { attendanceText, filterEmployees, reportRows, startWorkText, thaiDate } from "../lib/orientation/domain.mjs";
import ExportPreview from "./ExportPreview";
import { reportMatches } from "../lib/orientation/reports.mjs";

const attendanceLabels = { pending: "รอเช็กชื่อ", attended: "เข้าร่วม", absent: "ไม่มา", rescheduled: "เลื่อนรอบ" };
const attendanceColors = { pending: "gold", attended: "green", absent: "red", rescheduled: "orange" };
const options = (rows, key, label) => [...new Map(rows.filter((row) => row[key]).map((row) => [row[key], { value: row[key], label: row[label] || row[key] }])).values()].sort((a, b) => a.label.localeCompare(b.label, "th"));

async function fetchOrientation(signal) {
  const timeoutSignal = AbortSignal.timeout(30000);
  const response = await fetch("/recruitment/api/orientation", { cache: "no-store", signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "โหลดข้อมูลไม่สำเร็จ");
  return result;
}

export default function OrientationPage() {
  const [data, setData] = useState({ rows: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [copy, setCopy] = useState(null);
  const [copying, setCopying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [recipient, setRecipient] = useState("คุณม่อน");
  const [closing, setClosing] = useState("ค่ะ");
  const load = useCallback(async (signal) => {
    try {
      const result = await fetchOrientation(signal);
      setData(result); setSelected([]); setError("");
    } catch (err) { if (err.name !== "AbortError") { setError(err.message); setData({ rows: [], sessions: [] }); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetchOrientation(controller.signal).then((result) => {
      if (!controller.signal.aborted) { setData(result); setError(""); }
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);
  const filtered = useMemo(() => filterEmployees(data.rows, filters), [data.rows, filters]);
  const chosen = reportRows(filtered, selected);
  async function copyText() {
    if (!copy || copying) return;
    setCopying(true);
    try {
      const response = await fetch("/recruitment/api/orientation?purpose=export", { cache: "no-store", signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error("ตรวจสอบสิทธิ์ Copy ไม่สำเร็จ กรุณาเปิด Preview ใหม่");
      const current = await response.json();
      if (!reportMatches(copy.rows, current.rows)) throw new Error("สิทธิ์หรือข้อมูลเปลี่ยนแล้ว กรุณาเปิด Preview ใหม่");
      await navigator.clipboard.writeText(copy.text);
      message.success("คัดลอกข้อความแล้ว");
    } catch (err) { message.error(err.message || "คัดลอกไม่ได้ กรุณาลองใหม่"); }
    finally { setCopying(false); }
  }
  function changeFilter(key, value) { setFilters((old) => ({ ...old, [key]: value })); setSelected([]); }
  async function exportRows(mode) {
    if (["attendance", "activity"].includes(mode) && !filters.session_id) {
      message.warning(mode === "attendance" ? "กรุณาเลือกรอบ Orientation ก่อน Copy ผู้เข้าร่วมจริง" : "กรุณาเลือกรอบ Orientation ก่อน Preview กิจกรรมและส่งมอบ");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/recruitment/api/orientation?purpose=export", { cache: "no-store", signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ไม่มีสิทธิ์ Export");
      const rows = reportRows(filterEmployees(result.rows, filters), selected);
      if (!rows.length) throw new Error("ไม่มีรายการสำหรับรายงาน");
      if (mode === "staff" && rows.some((row) => !row.start_work_date)) throw new Error("มีพนักงานไม่ระบุวันเริ่มงาน กรุณาตรวจข้อมูลก่อนทำรายงาน");
      if (["table", "attendance", "activity"].includes(mode) && rows.some((row) => !row.orientation_date)) throw new Error("กรุณาเลือกรายการที่จัดรอบแล้ว หรือกรองตามรอบ/วันที่ Orientation");
      if (["start", "attendance"].includes(mode)) {
        const text = mode === "start" ? startWorkText(rows, { recipient, closing }) : attendanceText(rows, { recipient, closing });
        if (!text) throw new Error("ไม่มีผู้เข้าร่วมจริงในรายการที่เลือก");
        setCopy({ mode, rows, text });
      } else setPreview({ mode, rows });
    } catch (err) { message.error(err.message); }
    finally { setBusy(false); }
  }
  const columns = [
    { title: "รหัส", dataIndex: "employee_code", width: 130 },
    { title: "ชื่อ-สกุล", dataIndex: "full_name", width: 220 },
    { title: "ชื่อเล่น", dataIndex: "nickname", width: 110 },
    { title: "แผนก", dataIndex: "department_name", width: 180 },
    { title: "ตำแหน่ง", dataIndex: "position_name", width: 180 },
    { title: "ระดับ", dataIndex: "level_code", width: 80 },
    { title: "สังกัด", dataIndex: "branch_code", width: 90 },
    { title: "วันเริ่มงาน", dataIndex: "start_work_date", render: (value) => thaiDate(value), width: 130 },
    { title: "รอบ", dataIndex: "session_name", render: (value) => value || "ยังไม่จัดรอบ", width: 160 },
    { title: "Orientation", dataIndex: "orientation_date", render: (value) => thaiDate(value), width: 130 },
    { title: "สถานที่", dataIndex: "location_name", render: (value, row) => value ? <Tag style={{ background: row.location_color, color: "#111" }}>{value}</Tag> : "-", width: 180 },
    { title: "เช็กชื่อ", dataIndex: "attendance_status", render: (value) => <Tag color={attendanceColors[value]}>{attendanceLabels[value] || value || "-"}</Tag>, width: 120 },
    { title: "ความคืบหน้า", dataIndex: "workflow_status", render: (value) => <Tag color={value === "completed" ? "green" : value === "in_progress" ? "processing" : "default"}>{value || "-"}</Tag>, width: 130 },
  ];
  return <main className="min-w-0 bg-slate-50 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-5 rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">Orientation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              ติดตามพนักงานใหม่ จัดการรอบปฐมนิเทศ และเตรียมรายงานในที่เดียว
            </p>
          </div>
          <Space wrap size={[8, 8]}>
            <Button type="primary" href="/recruitment/orientation/manage">จัดการรอบ Orientation</Button>
            <Button loading={loading} onClick={() => { setLoading(true); load(); }}>โหลดใหม่</Button>
          </Space>
        </div>
      </header>

      {error && <Alert type="error" showIcon title={error} action={<Button loading={loading} onClick={() => { setLoading(true); load(); }}>ลองอีกครั้ง</Button>} style={{ marginBottom: 16 }} />}

      <Card className="mb-[15px]! w-full overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]" styles={{ body: { padding: 0 } }}>
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <Typography.Title level={2} style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>ตัวกรองข้อมูล</Typography.Title>
          <Typography.Text type="secondary" className="mt-1 block">ค้นหาพนักงานตามโครงสร้างองค์กร วันที่ และสถานะ Orientation</Typography.Text>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-5">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <label className="block text-sm font-medium text-slate-700">วันที่ Orientation<DatePicker aria-label="วันที่ Orientation" className="mt-2 w-full" placeholder="เลือกวันที่ Orientation" onChange={(_, value) => changeFilter("orientation_date", value)} /></label>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <label className="block text-sm font-medium text-slate-700">รอบ Orientation<Select aria-label="รอบ Orientation" className="mt-2 w-full" allowClear placeholder="ทุกรอบ" options={data.sessions.map((session) => ({ value: session.id, label: `${thaiDate(session.orientation_date)} ${session.session_name || session.session_code || ""}` }))} value={filters.session_id} onChange={(value) => changeFilter("session_id", value)} /></label>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <label className="block text-sm font-medium text-slate-700">ความคืบหน้า<Select aria-label="ความคืบหน้า" className="mt-2 w-full" allowClear placeholder="ทุกความคืบหน้า" options={options(data.rows, "workflow_status", "workflow_status")} onChange={(value) => changeFilter("workflow_status", value)} /></label>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <label className="block text-sm font-medium text-slate-700">สถานะเช็กชื่อ<Select aria-label="สถานะเช็กชื่อ" className="mt-2 w-full" allowClear placeholder="ทุกสถานะ" options={Object.entries(attendanceLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => changeFilter("attendance_status", value)} /></label>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <label className="block text-sm font-medium text-slate-700">วันที่เริ่มงาน<DatePicker.RangePicker aria-label="ช่วงวันที่เริ่มงาน" className="mt-2 w-full" placeholder={["เริ่มงานตั้งแต่", "ถึงวันที่"]} onChange={(_, values) => { setFilters((old) => ({ ...old, start_from: values?.[0] ?? "", start_to: values?.[1] ?? "" })); setSelected([]); }} /></label>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <label className="block text-sm font-medium text-slate-700">สังกัด<Select aria-label="สังกัด" className="mt-2 w-full" allowClear showSearch optionFilterProp="label" placeholder="ทุกสังกัด" options={options(data.rows, "branch_id", "branch_code")} value={filters.branch_id} onChange={(value) => changeFilter("branch_id", value)} /></label>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <label className="block text-sm font-medium text-slate-700">แผนก<Select aria-label="แผนก" className="mt-2 w-full" allowClear showSearch optionFilterProp="label" placeholder="ทุกแผนก" options={options(data.rows.filter((row) => !filters.branch_id || row.branch_id === filters.branch_id), "department_id", "department_name")} value={filters.department_id} onChange={(value) => changeFilter("department_id", value)} /></label>
              </Col>
            </Row>
          </div>
        </div>
      </Card>

      <Card className="w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]" styles={{ body: { padding: 0 } }}>
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Typography.Title level={2} style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>รายชื่อพนักงาน</Typography.Title>
              <Typography.Text type="secondary" className="mt-1 block">พบ {filtered.length} คน • ใช้รายงาน {chosen.length} คน{selected.length ? "ที่เลือก" : "ทั้งหมดตามตัวกรอง"}</Typography.Text>
            </div>
            <Space wrap size={[8, 8]}>
              <Button disabled={!chosen.length || loading || busy} onClick={() => exportRows("start")}>Copy แจ้งเริ่มงาน</Button>
              <Button disabled={!filters.session_id || !chosen.length || loading || busy} title={!filters.session_id ? "กรุณาเลือกรอบ Orientation ก่อน" : undefined} onClick={() => exportRows("attendance")}>Copy ผู้เข้าร่วมจริง</Button>
              <Button disabled={!chosen.length || loading || busy} onClick={() => exportRows("table")}>Preview ตาราง PNG</Button>
              <Button disabled={!chosen.length || loading || busy} onClick={() => exportRows("staff")}>Preview พนักงานใหม่ PNG</Button>
              <Button disabled={!filters.session_id || !chosen.length || loading || busy} title={!filters.session_id ? "กรุณาเลือกรอบ Orientation ก่อน" : undefined} onClick={() => exportRows("activity")}>Preview กิจกรรมและส่งมอบ</Button>
              {selected.length > 0 && <Button onClick={() => setSelected([])}>ล้างที่เลือก</Button>}
            </Space>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {!loading && (!filters.session_id || !chosen.length) && (
            <Alert
              className="mb-4"
              description={
                filters.session_id
                  ? "ปรับตัวกรองหรือเลือกรอบที่มีพนักงาน เพื่อเปิดใช้ปุ่ม “Copy ผู้เข้าร่วมจริง” และ “Preview กิจกรรมและส่งมอบ”"
                  : "ปุ่ม “Copy ผู้เข้าร่วมจริง” และ “Preview กิจกรรมและส่งมอบ” จะใช้งานได้เมื่อเลือกรอบ Orientation และมีพนักงานในผลลัพธ์"
              }
              title={
                filters.session_id
                  ? "ไม่พบพนักงานสำหรับรายงานรอบนี้"
                  : "เลือกรอบ Orientation เพื่อใช้รายงานตามรอบ"
              }
              showIcon
              type={filters.session_id ? "warning" : "info"}
            />
          )}
          <Table rowKey="application_id" dataSource={filtered} columns={columns} loading={loading || busy} scroll={{ x: 1900 }} locale={{ emptyText: "ไม่พบพนักงานตามตัวกรองที่เลือก" }} pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `ทั้งหมด ${total} คน` }} rowSelection={{ selectedRowKeys: selected, onChange: setSelected, preserveSelectedRowKeys: true }} />
        </div>
      </Card>
    </div>
    <Modal open={Boolean(copy)} title="ตรวจและแก้ข้อความก่อน Copy" onCancel={() => !copying && setCopy(null)} onOk={copyText} confirmLoading={copying} okText="Copy" width={740}>
      <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input aria-label="ผู้รับ" value={recipient} onChange={(event) => setRecipient(event.target.value)} /><Input aria-label="คำลงท้าย" value={closing} onChange={(event) => setClosing(event.target.value)} /><Button onClick={() => setCopy((old) => ({ ...old, text: old.mode === "start" ? startWorkText(old.rows, { recipient, closing }) : attendanceText(old.rows, { recipient, closing }) }))}>สร้างข้อความใหม่</Button></div>
      <Input.TextArea rows={14} value={copy?.text || ""} onChange={(event) => setCopy((old) => ({ ...old, text: event.target.value }))} />
    </Modal>
    {preview && <ExportPreview {...preview} onClose={() => setPreview(null)} />}
  </main>;
}
