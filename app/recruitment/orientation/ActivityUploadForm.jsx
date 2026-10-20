"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Tag, Typography, message } from "antd";
import { thaiDate } from "../lib/orientation/domain.mjs";
import { sessionDateTimeLocal } from "../lib/orientation/manageUi.mjs";
import { MAX_BATCH_PHOTOS, photoCountError, photoFileError } from "../lib/orientation/photoUpload.mjs";
import { preparePhotos } from "../lib/orientation/preparePhotos.mjs";

const categories = ["orientation", "site_visit", "handover"];
const labels = { orientation: "Orientation", site_visit: "Site Visit", handover: "ส่งมอบ" };
const emptyFiles = () => ({ orientation: [null, null, null], site_visit: [null, null, null], handover: [null] });
const required = [{ required: true, message: "กรุณาระบุข้อมูล" }];

export default function ActivityUploadForm({ initialSessionId = null }) {
  const [form] = Form.useForm();
  const [data, setData] = useState({ sessions: [], participants: [], employees: [], handovers: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [files, setFiles] = useState(emptyFiles);
  const [handoverSlots, setHandoverSlots] = useState(["initial"]);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState({});
  const [saveError, setSaveError] = useState("");
  const [generation, setGeneration] = useState(0);
  const requests = useRef(null);
  const preparedFiles = useRef({});
  const completed = useRef(new Set());
  const inFlight = useRef(false);
  const sessionId = Form.useWatch("session_id", form);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/recruitment/api/orientation/manage", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "โหลดข้อมูลไม่สำเร็จ"); return result; })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoadError("");
        const initialSession = result.sessions.find(
          (session) => session.id === initialSessionId && session.status !== "closed",
        );
        if (initialSession) {
          form.setFieldsValue({
            session_id: initialSession.id,
            participant_ids: [],
            at: sessionDateTimeLocal(initialSession),
          });
        }
      })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [form, initialSessionId, reload]);

  const allDone = categories.every((type) => status[type] === "done");
  const disabled = locked || saving || loading || Boolean(loadError);
  const names = new Map(data.employees.map((employee) => [employee.id, employee.label]));
  const participants = data.participants.filter((p) => p.session_id === sessionId && p.attendance_status === "attended" && p.workflow_status !== "completed");
  function chooseFile(type, index, file) {
    const error = file ? photoFileError(file) : "";
    if (error) message.error(error);
    setFiles((previous) => ({ ...previous, [type]: previous[type].map((item, i) => i === index ? file : item) }));
  }
  function addHandover() {
    if (disabled || files.handover.length >= MAX_BATCH_PHOTOS) return;
    setHandoverSlots((old) => [...old, crypto.randomUUID()]);
    setFiles((old) => ({ ...old, handover: [...old.handover, null] }));
  }
  function removeHandover(index) {
    if (disabled) return;
    setHandoverSlots((old) => old.filter((_, i) => i !== index));
    setFiles((old) => ({ ...old, handover: old.handover.filter((_, i) => i !== index) }));
  }
  async function save() {
    if (inFlight.current || allDone) return;
    inFlight.current = true;
    let activeType;
    try {
      if (!requests.current) {
        const values = await form.validateFields();
        if (values.participant_ids.some((id) => !participants.some((p) => p.id === id && p.site_visit_status === "visited") || !data.handovers.some((handover) => handover.participant_id === id))) {
          throw new Error("กรุณาบันทึก Site Visit และส่งมอบให้ครบทุกคนที่เลือกก่อนอัปโหลดทั้งสามหมวด");
        }
        for (const type of categories) {
          const selected = files[type];
          const countError = photoCountError(type, selected.filter(Boolean).length);
          if (countError || selected.some((file) => !file)) throw new Error(`${labels[type]}: ${countError || "กรุณาเลือกรูปให้ครบทุกช่อง"}`);
          for (const file of selected) { const error = photoFileError(file); if (error) throw new Error(`${labels[type]}: ${error}`); }
        }
        setSaving(true); setSaveError("");
        for (const type of categories) preparedFiles.current[type] = await preparePhotos(files[type]);
        // Retain payloads and request IDs across retries. A completed category
        // must not be uploaded twice if the following category fails.
        requests.current = Object.fromEntries(categories.map((type) => [type, { ...values, at: `${values.at.length === 16 ? values.at + ":00" : values.at}+07:00`, action: "photo.add", photo_type: type, request_id: crypto.randomUUID() }]));
        setLocked(true);
      }
      setSaving(true); setSaveError("");
      for (const type of categories) {
        if (completed.current.has(type)) continue;
        activeType = type;
        setStatus((old) => ({ ...old, [type]: "uploading" }));
        const body = new FormData();
        preparedFiles.current[type].forEach((file) => body.append("files", file));
        body.set("payload", JSON.stringify(requests.current[type]));
        const response = await fetch("/recruitment/api/orientation/upload", { method: "POST", body, signal: AbortSignal.timeout(60000) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "อัปโหลดไม่สำเร็จ");
        completed.current.add(type);
        setStatus((old) => ({ ...old, [type]: "done" }));
      }
      message.success("บันทึกรูปกิจกรรมครบทุกหมวดแล้ว");
    } catch (error) {
      if (activeType) setStatus((old) => ({ ...old, [activeType]: "error" }));
      if (!error.errorFields) setSaveError(`${activeType ? labels[activeType] + ": " : ""}${error.message || "บันทึกไม่สำเร็จ"}`);
    } finally { setSaving(false); inFlight.current = false; }
  }
  function reset() {
    form.resetFields(); setFiles(emptyFiles()); setHandoverSlots(["initial"]); requests.current = null; preparedFiles.current = {}; completed.current = new Set();
    setStatus({}); setSaveError(""); setLocked(false); setGeneration((value) => value + 1);
    setLoading(true); setReload((value) => value + 1);
  }

  return <Card className="w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]" styles={{ body: { padding: 0 } }}>
    <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
      <Typography.Title level={2} style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
        ข้อมูลกิจกรรม
      </Typography.Title>
      <Typography.Text type="secondary" className="mt-1 block">
        กำหนดรอบ เวลา และผู้เข้าร่วมก่อนเลือกรูปในแต่ละหมวด
      </Typography.Text>
    </div>

    <div className="p-4 sm:p-6">
      {loadError && <Alert showIcon type="error" title={loadError} action={<Button loading={loading} onClick={() => { setLoading(true); setReload((value) => value + 1); }}>ลองอีกครั้ง</Button>} style={{ marginBottom: 20 }} />}
      {saveError && <Alert showIcon type="error" title={saveError} description={locked ? "หมวดที่สำเร็จแล้วถูกบันทึกไว้ กดลองบันทึกต่อโดยใช้ข้อมูลเดิม ระบบจะข้ามหมวดที่สำเร็จแล้ว" : undefined} style={{ marginBottom: 20 }} />}
      {allDone && <Alert showIcon type="success" title="บันทึกครบทุกหมวดแล้ว" description="คุณสามารถกลับหน้าจัดการ หรือเริ่มอัปโหลดรูปชุดใหม่ได้" style={{ marginBottom: 20 }} />}

      <Form form={form} layout="vertical" disabled={disabled}>
        <div className="rounded-xl bg-slate-50 px-4 pb-1 pt-5 sm:px-5">
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={8}><Form.Item name="session_id" label="รอบ Orientation" rules={required}><Select loading={loading} placeholder="เลือกรอบ Orientation" options={data.sessions.filter((session) => session.status !== "closed").map((session) => ({ value: session.id, label: `${thaiDate(session.orientation_date)} ${session.session_name || session.session_code}` }))} onChange={(id) => { const session = data.sessions.find((item) => item.id === id); form.setFieldsValue({ participant_ids: [], at: sessionDateTimeLocal(session) }); }} /></Form.Item></Col>
            <Col xs={24} lg={6}><Form.Item name="at" label="วันเวลา (ประเทศไทย)" rules={required}><Input type="datetime-local" /></Form.Item></Col>
            <Col xs={24} lg={10}><Form.Item name="participant_ids" label="ผู้เข้าร่วมจริงในภาพ" rules={required}><Select mode="multiple" showSearch optionFilterProp="label" placeholder={sessionId ? "เลือกผู้เข้าร่วม" : "เลือกรอบก่อน"} options={participants.map((participant) => ({ value: participant.id, label: participant.full_name || "ผู้เข้าร่วม" }))} /></Form.Item></Col>
          </Row>
        </div>

        <Alert type="info" showIcon title="รายชื่อที่เลือกจะใช้กับรูปทุกหมวด" description="ผู้เข้าร่วมต้องบันทึก Site Visit และส่งมอบเรียบร้อยแล้ว" style={{ margin: "20px 0 4px" }} />

        {categories.map((type) => <section key={type} aria-labelledby={`heading-${type}`} className="border-b border-slate-200 py-6 last:border-b-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Space wrap size={[8, 8]}>
                <h2 id={`heading-${type}`} className="m-0 text-lg font-semibold text-slate-900">{labels[type]}</h2>
                <Tag color={type === "orientation" ? "blue" : type === "site_visit" ? "cyan" : "gold"} style={{ marginInlineEnd: 0 }}>
                  {type !== "handover" ? "ต้องใช้ 3 รูป" : `1–${MAX_BATCH_PHOTOS} รูป`}
                </Tag>
                {status[type] && <Tag color={status[type] === "done" ? "green" : status[type] === "error" ? "red" : "processing"}>{status[type] === "done" ? "บันทึกแล้ว" : status[type] === "error" ? "รอลองใหม่" : "กำลังอัปโหลด"}</Tag>}
              </Space>
              <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">
                JPG, PNG หรือ WebP ไม่เกิน 5 MB ต่อรูป ระบบจะปรับขนาดโดยรักษาสัดส่วน
              </p>
            </div>
            {type === "handover" && <Button disabled={disabled || files.handover.length >= MAX_BATCH_PHOTOS} onClick={addHandover}>เพิ่มรูปส่งมอบ</Button>}
          </div>

          <Row gutter={[16, 16]}>{files[type].map((file, index) => <Col xs={24} md={12} xl={8} key={`${generation}-${type}-${type === "handover" ? handoverSlots[index] : index}`}>
            <div className="h-full rounded-xl border border-slate-200 bg-white p-4 transition-colors focus-within:border-blue-500">
              <Form.Item label={`${labels[type]} รูปที่ ${index + 1}`} style={{ marginBottom: type === "handover" ? 12 : 0 }}><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(type, index, event.target.files?.[0] || null)} /></Form.Item>
              {type === "handover" && <Button danger disabled={disabled} aria-label={`ลบรูปส่งมอบที่ ${index + 1}${file ? ` ${file.name}` : ""}`} onClick={() => removeHandover(index)}>ลบรูปนี้</Button>}
            </div>
          </Col>)}</Row>
        </section>)}

        <section aria-labelledby="additional-information" className="pt-6">
          <h2 id="additional-information" className="mb-4 text-lg font-semibold text-slate-900">ข้อมูลเพิ่มเติม</h2>
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={12}><Form.Item name="notes" label="หมายเหตุ"><Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" /></Form.Item></Col>
            <Col xs={24} lg={12}><Form.Item name="reason" label="เหตุผล (ต้องระบุเมื่อเลื่อน/เปิดงานใหม่/แก้ส่งมอบ)"><Input.TextArea rows={3} placeholder="ระบุเหตุผลเมื่อเกี่ยวข้อง" /></Form.Item></Col>
          </Row>
        </section>
      </Form>
    </div>

    <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
      <Space wrap size={[8, 8]}>{allDone ? <Button type="primary" onClick={reset}>อัปโหลดชุดใหม่</Button> : <Button type="primary" loading={saving} disabled={loading || Boolean(loadError)} onClick={save}>{locked ? "ลองบันทึกหมวดที่เหลือต่อ" : "บันทึกรูปกิจกรรม"}</Button>}<Button href="/recruitment/orientation/manage" disabled={saving}>กลับหน้าจัดการ</Button></Space>
    </div>
  </Card>;
}
