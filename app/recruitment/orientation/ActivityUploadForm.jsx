"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Tag, Typography, message } from "antd";
import { thaiDate } from "../lib/orientation/domain.mjs";
import { replacePendingPhoto, replaceSectionPhotos, sectionParticipantError, sectionSlotState, sessionDateTimeLocal } from "../lib/orientation/manageUi.mjs";
import { MAX_BATCH_PHOTOS, photoFileError } from "../lib/orientation/photoUpload.mjs";
import { preparePhotos } from "../lib/orientation/preparePhotos.mjs";

const categories = ["orientation", "site_visit", "handover"];
const labels = { orientation: "Orientation", site_visit: "Site Visit", handover: "ส่งมอบ" };
const emptyFiles = () => ({ orientation: [null, null, null], site_visit: [null, null, null], handover: [null] });
const required = [{ required: true, message: "กรุณาระบุข้อมูล" }];

export default function ActivityUploadForm({ initialSessionId = null }) {
  const [form] = Form.useForm();
  const [data, setData] = useState({ sessions: [], participants: [], employees: [], handovers: [], photos: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [files, setFiles] = useState(emptyFiles);
  const [handoverSlots, setHandoverSlots] = useState(["initial"]);
  const [status, setStatus] = useState({});
  const [errors, setErrors] = useState({});
  const [generation, setGeneration] = useState(0);
  const requests = useRef({});
  const preparedFiles = useRef({});
  const completed = useRef(new Set());
  const inFlight = useRef(new Set());
  const fileInputs = useRef({});
  const sessionId = Form.useWatch("session_id", form);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/recruitment/api/orientation/manage", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "โหลดข้อมูลไม่สำเร็จ"); return result; })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData({ ...result, photos: Array.isArray(result.photos) ? result.photos : [] });
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
  const anyUploading = categories.some((type) => status[type] === "uploading");
  const formDisabled = loading || Boolean(loadError) || anyUploading;
  const sectionLocked = (type) => Boolean(requests.current[type]);
  const commonLocked = categories.some(sectionLocked);
  const participants = data.participants.filter((p) => p.session_id === sessionId && p.attendance_status === "attended" && p.workflow_status !== "completed");
  const uploadedByType = Object.fromEntries(categories.map((type) => [
    type,
    data.photos.filter((photo) => photo.session_id === sessionId && photo.photo_type === type),
  ]));
  const slotStateByType = Object.fromEntries(categories.map((type) => [
    type,
    sectionSlotState(type, uploadedByType[type]),
  ]));
  function chooseFile(type, index, file) {
    if (!file || sectionLocked(type)) return;
    const error = photoFileError(file);
    if (error) message.error(error);
    setFiles((previous) => replacePendingPhoto(previous, type, index, file));
    setStatus((previous) => ({ ...previous, [type]: "idle" }));
    setErrors((previous) => ({ ...previous, [type]: "" }));
  }
  function registerFileInput(key, node) {
    if (node) fileInputs.current[key] = node;
    else delete fileInputs.current[key];
  }
  function openFileInput(type, key) {
    if (formDisabled || sectionLocked(type)) return;
    const input = fileInputs.current[key];
    if (!input) return;
    input.value = "";
    try { input.click(); }
    catch { message.error("ไม่สามารถเปิดกล้องหรือตัวเลือกไฟล์ได้ กรุณาลองอีกครั้ง"); }
  }
  function addHandover() {
    if (formDisabled || sectionLocked("handover") || files.handover.length >= MAX_BATCH_PHOTOS) return;
    setHandoverSlots((old) => [...old, crypto.randomUUID()]);
    setFiles((old) => ({ ...old, handover: [...old.handover, null] }));
  }
  function removeHandover(index) {
    if (formDisabled || sectionLocked("handover")) return;
    setHandoverSlots((old) => old.filter((_, i) => i !== index));
    setFiles((old) => ({ ...old, handover: old.handover.filter((_, i) => i !== index) }));
  }
  async function reloadSectionPhotos(type, targetSessionId) {
    const response = await fetch("/recruitment/api/orientation/manage", { cache: "no-store", signal: AbortSignal.timeout(30000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "โหลดรายชื่อไฟล์ล่าสุดไม่สำเร็จ");
    const latest = Array.isArray(result.photos) ? result.photos : [];
    setData((previous) => ({
      ...previous,
      photos: replaceSectionPhotos(previous.photos, latest, targetSessionId, type),
    }));
  }
  async function save(type) {
    if (!categories.includes(type) || inFlight.current.has(type) || status[type] === "done") return;
    inFlight.current.add(type);
    setStatus((previous) => ({ ...previous, [type]: "uploading" }));
    setErrors((previous) => ({ ...previous, [type]: "" }));
    try {
      if (!requests.current[type]) {
        const requiredValues = await form.validateFields(["session_id", "at", "participant_ids"]);
        const values = { ...requiredValues, ...form.getFieldsValue(["notes", "reason"]) };
        const participantError = sectionParticipantError(type, values.participant_ids, participants, data.handovers);
        if (participantError) throw new Error(participantError);
        const selectedEntries = files[type].map((file, slot) => ({ file, slot })).filter((entry) => entry.file);
        if (type === "handover" && (selectedEntries.length !== files.handover.length || selectedEntries.length < 1 || selectedEntries.length > MAX_BATCH_PHOTOS)) {
          throw new Error(`รูปส่งมอบต้องเลือกให้ครบทุกช่อง จำนวน 1–${MAX_BATCH_PHOTOS} รูป`);
        }
        if (type !== "handover" && !slotStateByType[type].exactComplete && selectedEntries.length !== 3) {
          throw new Error(`${labels[type]} ยังไม่มีรูปเดิมครบ 3 ช่อง กรุณาเลือกรูปใหม่ให้ครบทั้ง 3 รูป`);
        }
        if (type !== "handover" && slotStateByType[type].exactComplete && !selectedEntries.length) {
          throw new Error(`กรุณาเลือกรูป ${labels[type]} ที่ต้องการแทนอย่างน้อย 1 ช่อง`);
        }
        for (const { file } of selectedEntries) { const error = photoFileError(file); if (error) throw new Error(error); }
        preparedFiles.current[type] = await preparePhotos(selectedEntries.map((entry) => entry.file));
        requests.current[type] = {
          ...values,
          at: `${values.at.length === 16 ? values.at + ":00" : values.at}+07:00`,
          action: "photo.replace",
          photo_type: type,
          photo_slots: selectedEntries.map((entry) => entry.slot),
          request_id: crypto.randomUUID(),
        };
      }
      if (!completed.current.has(type)) {
        const body = new FormData();
        preparedFiles.current[type].forEach((file) => body.append("files", file));
        body.set("payload", JSON.stringify(requests.current[type]));
        const response = await fetch("/recruitment/api/orientation/upload", { method: "POST", body, signal: AbortSignal.timeout(60000) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "อัปโหลดไม่สำเร็จ");
        completed.current.add(type);
      }
      try {
        await reloadSectionPhotos(type, requests.current[type].session_id);
      } catch (error) {
        throw new Error(`บันทึกรูปแล้ว แต่${error.message || "โหลดรายชื่อไฟล์ล่าสุดไม่สำเร็จ"}`);
      }
      setStatus((previous) => ({ ...previous, [type]: "done" }));
      message.success(`บันทึก ${labels[type]} สำเร็จ`);
    } catch (error) {
      setStatus((previous) => ({ ...previous, [type]: "error" }));
      setErrors((previous) => ({
        ...previous,
        [type]: error.errorFields ? "กรุณาตรวจสอบรอบ วันเวลา และผู้เข้าร่วม" : error.message || "บันทึกไม่สำเร็จ",
      }));
    } finally { inFlight.current.delete(type); }
  }
  function reset() {
    form.resetFields(); setFiles(emptyFiles()); setHandoverSlots(["initial"]); requests.current = {}; preparedFiles.current = {}; completed.current = new Set(); inFlight.current = new Set(); fileInputs.current = {};
    setStatus({}); setErrors({}); setGeneration((value) => value + 1);
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
      {allDone && <Alert showIcon type="success" title="บันทึกครบทุกหมวดแล้ว" description="คุณสามารถกลับหน้าจัดการ หรือเริ่มอัปโหลดรูปชุดใหม่ได้" style={{ marginBottom: 20 }} />}

      <Form form={form} layout="vertical" disabled={formDisabled}>
        <div className="rounded-xl bg-slate-50 px-4 pb-1 pt-5 sm:px-5">
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={8}><Form.Item name="session_id" label="รอบ Orientation" rules={required}><Select disabled={commonLocked} loading={loading} placeholder="เลือกรอบ Orientation" options={data.sessions.filter((session) => session.status !== "closed").map((session) => ({ value: session.id, label: `${thaiDate(session.orientation_date)} ${session.session_name || session.session_code}` }))} onChange={(id) => { const session = data.sessions.find((item) => item.id === id); form.setFieldsValue({ participant_ids: [], at: sessionDateTimeLocal(session) }); }} /></Form.Item></Col>
            <Col xs={24} lg={6}><Form.Item name="at" label="วันเวลา (ประเทศไทย)" rules={required}><Input disabled={commonLocked} type="datetime-local" /></Form.Item></Col>
            <Col xs={24} lg={10}><Form.Item name="participant_ids" label="ผู้เข้าร่วมจริงในภาพ" rules={required}><Select disabled={commonLocked} mode="multiple" showSearch optionFilterProp="label" placeholder={sessionId ? "เลือกผู้เข้าร่วม" : "เลือกรอบก่อน"} options={participants.map((participant) => ({ value: participant.id, label: participant.full_name || "ผู้เข้าร่วม" }))} /></Form.Item></Col>
          </Row>
        </div>

        <Alert type="info" showIcon title="บันทึกรูปแยกทีละหมวดได้" description="Orientation บันทึกได้ทันที ส่วน Site Visit และส่งมอบจะตรวจเฉพาะขั้นตอนที่เกี่ยวข้อง" style={{ margin: "20px 0 4px" }} />

        {categories.map((type) => <section key={type} aria-labelledby={`heading-${type}`} className="border-b border-slate-200 py-6 last:border-b-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Space wrap size={[8, 8]}>
                <h2 id={`heading-${type}`} className="m-0 text-lg font-semibold text-slate-900">{labels[type]}</h2>
                <Tag color={type === "orientation" ? "blue" : type === "site_visit" ? "cyan" : "gold"} style={{ marginInlineEnd: 0 }}>
                  {type === "handover" ? `1–${MAX_BATCH_PHOTOS} รูป` : slotStateByType[type].exactComplete ? "3 ช่อง • แทนบางช่องได้" : "ต้องเลือกครบ 3 รูป"}
                </Tag>
                <Tag color={status[type] === "done" ? "green" : status[type] === "error" ? "red" : status[type] === "uploading" ? "processing" : undefined}>
                  {status[type] === "done" ? "บันทึกสำเร็จ" : status[type] === "error" ? "เกิดข้อผิดพลาด" : status[type] === "uploading" ? "กำลังอัปโหลด" : files[type].some(Boolean) ? "พร้อมบันทึก" : "ยังไม่ได้เลือก"}
                </Tag>
              </Space>
              <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">
                JPG, PNG หรือ WebP ไม่เกิน 5 MB ต่อรูป ระบบจะปรับขนาดโดยรักษาสัดส่วน
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                <h3 className="m-0 text-sm font-semibold text-slate-700">ไฟล์ที่อัปโหลดแล้ว</h3>
                {!sessionId ? (
                  <p className="mb-0 mt-1 text-sm text-slate-500">เลือกรอบ Orientation เพื่อดูชื่อไฟล์เดิม</p>
                ) : slotStateByType[type].photos.length ? (
                  <ul className="mb-0 mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {slotStateByType[type].photos.map((photo, index) => (
                      <li key={photo.id} className="break-all">
                        {Number.isInteger(photo.sort_order) ? `รูปที่ ${photo.sort_order + 1}: ` : "ไม่พบตำแหน่งรูป: "}
                        {photo.original_filename || `ไม่พบชื่อไฟล์เดิม (รายการที่ ${index + 1})`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-0 mt-1 text-sm text-slate-500">ยังไม่มีไฟล์ที่อัปโหลดในหมวดนี้</p>
                )}
                {sessionId && type !== "handover" && !slotStateByType[type].exactComplete && (
                  <p className="mb-0 mt-2 text-sm font-medium text-amber-700">ต้องเลือกรูปใหม่ให้ครบทั้ง 3 ช่องก่อนบันทึก</p>
                )}
                {sessionId && type === "handover" && slotStateByType[type].photos.length > 0 && (
                  <p className="mb-0 mt-2 text-sm font-medium text-amber-700">เมื่อบันทึก ชุดใหม่จะแทนรูปส่งมอบเดิมทั้งหมด</p>
                )}
              </div>
            </div>
            {type === "handover" && <Button disabled={sectionLocked(type) || files.handover.length >= MAX_BATCH_PHOTOS} onClick={addHandover}>เพิ่มรูปส่งมอบ</Button>}
          </div>

          {errors[type] && <Alert showIcon type="error" title={errors[type]} description={sectionLocked(type) ? "กดลองอีกครั้งด้วยข้อมูลเดิม ระบบจะไม่อัปโหลดรายการที่สำเร็จแล้วซ้ำ" : undefined} style={{ marginBottom: 16 }} />}
          <Row gutter={[16, 16]}>{files[type].map((file, index) => {
            const slotKey = type === "handover" ? handoverSlots[index] : index;
            const cameraKey = `${generation}-${type}-${slotKey}-camera`;
            const pickerKey = `${generation}-${type}-${slotKey}-picker`;
            const selectedNameId = `${generation}-${type}-${slotKey}-selected-name`;
            const inputDisabled = formDisabled || sectionLocked(type);
            const uploadedSlot = type === "handover" ? null : slotStateByType[type].slots[index];
            return <Col xs={24} md={12} xl={8} key={`${generation}-${type}-${slotKey}`}>
              <div className="h-full rounded-xl border border-slate-200 bg-white p-4 transition-colors focus-within:border-blue-500">
                <fieldset className="m-0 min-w-0 border-0 p-0">
                  <legend className="mb-3 p-0 text-sm font-medium text-slate-700">{labels[type]} รูปที่ {index + 1}</legend>
                  <input
                    ref={(node) => registerFileInput(cameraKey, node)}
                    id={`photo-${cameraKey}`}
                    hidden
                    disabled={inputDisabled}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => chooseFile(type, index, event.target.files?.[0] || null)}
                  />
                  <input
                    ref={(node) => registerFileInput(pickerKey, node)}
                    id={`photo-${pickerKey}`}
                    hidden
                    disabled={inputDisabled}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => chooseFile(type, index, event.target.files?.[0] || null)}
                  />
                  <Space wrap size={[8, 8]}>
                    <Button htmlType="button" disabled={inputDisabled} aria-controls={`photo-${cameraKey}`} aria-describedby={selectedNameId} onClick={() => openFileInput(type, cameraKey)}>ถ่ายรูป</Button>
                    <Button htmlType="button" disabled={inputDisabled} aria-controls={`photo-${pickerKey}`} aria-describedby={selectedNameId} onClick={() => openFileInput(type, pickerKey)}>เลือกไฟล์</Button>
                  </Space>
                  <p id={selectedNameId} aria-live="polite" className="mb-0 mt-3 break-all text-sm text-slate-600">
                    {file ? <>ไฟล์ที่เลือก: <span className="font-medium text-slate-800">{file.name}</span></> : "ยังไม่ได้เลือกไฟล์"}
                  </p>
                  {type !== "handover" && <p className="mb-0 mt-2 break-all text-sm text-slate-500">
                    ไฟล์เดิม: {uploadedSlot?.original_filename || "ยังไม่มีไฟล์ในช่องนี้"}
                  </p>}
                </fieldset>
                {type === "handover" && <Button danger className="mt-3" disabled={sectionLocked(type)} aria-label={`ลบรูปส่งมอบที่ ${index + 1}${file ? ` ${file.name}` : ""}`} onClick={() => removeHandover(index)}>ลบรูปนี้</Button>}
              </div>
            </Col>;
          })}</Row>
          <div className="mt-4 flex justify-end">
            <Button type="primary" loading={status[type] === "uploading"} disabled={status[type] === "done"} onClick={() => save(type)}>
              {status[type] === "done" ? "บันทึกแล้ว" : status[type] === "error" && sectionLocked(type) ? "ลองบันทึกอีกครั้ง" : `บันทึก ${labels[type]}`}
            </Button>
          </div>
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
      <Space wrap size={[8, 8]}>{allDone && <Button type="primary" onClick={reset}>อัปโหลดชุดใหม่</Button>}<Button href="/recruitment/orientation/manage" disabled={anyUploading}>กลับหน้าจัดการ</Button></Space>
    </div>
  </Card>;
}
