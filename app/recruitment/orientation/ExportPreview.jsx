"use client";

import { useRef, useState } from "react";
import { Button, Modal, Space, Typography, message } from "antd";
import { toPng } from "html-to-image";
import { staffPages, thaiDate } from "../lib/orientation/domain.mjs";
import { activityPages, tablePages, reportMatches } from "../lib/orientation/reports.mjs";
import { sendBrowserActivity } from "../lib/activity/browser";
import ActivityReportHeader from "./ActivityReportHeader";

const placeholder = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#edf0f4"/><circle cx="160" cy="112" r="52" fill="#b8c1cc"/><path d="M60 300v-45a100 100 0 0 1 200 0v45" fill="#b8c1cc"/></svg>');
const imageUrl = (row, kind = "profile") => `/recruitment/api/orientation/image?application_id=${encodeURIComponent(row.application_id)}&kind=${kind}`;
const adDate = (value, separator = ".") => value ? value.split("-").reverse().join(separator) : "ไม่ระบุวันที่";
const categoryNames = { orientation: "รูปภาพขณะ Orientation", site_visit: "รูปภาพขณะ Site Visit", handover: "รูปภาพส่งต่อหัวหน้างาน" };

function ActivityPhoto({ photo }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div data-image-failed="true" style={{ height: 245, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#64748b" }}>โหลดภาพไม่สำเร็จ</div>;
  // Native image preserves the activity's aspect ratio and private retrieval.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={categoryNames[photo.photo_type]} src={`${imageUrl(photo, "activity")}&photo_id=${encodeURIComponent(photo.id)}`} onError={() => setFailed(true)} style={{ display: "block", width: "100%", height: 245, objectFit: "contain", objectPosition: photo.photo_type === "handover" ? "left center" : "center", background: "#fff" }} />;
}

function Photo({ row, logo = false }) {
  const available = logo ? row.branch_logo_url : row.photo_url;
  if (logo && !available) return <strong>{row.branch_code}</strong>;
  // Native images are required for html-to-image capture and private same-origin retrieval.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={logo ? row.branch_code : row.full_name} src={available ? imageUrl(row, logo ? "logo" : "profile") : placeholder}
    onError={(event) => { if (event.currentTarget.src !== placeholder) event.currentTarget.src = placeholder; }}
    style={{ width: "100%", height: logo ? 120 : 225, objectFit: "contain", background: "#fff" }} />;
}

function timeout(promise, ms = 20000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("โหลดรูปหรือฟอนต์ไม่สำเร็จภายในเวลาที่กำหนด กรุณาลองใหม่")), ms); })]).finally(() => clearTimeout(timer));
}

async function waitImages(element) {
  await Promise.all([...element.querySelectorAll("img")].map((img) => new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => {
      if (img.complete && img.naturalWidth) return resolve();
      if (Date.now() - start > 15000) return reject(new Error("โหลดรูปไม่สำเร็จ กรุณาลองใหม่"));
      setTimeout(poll, 100);
    };
    poll();
  })));
}

export default function ExportPreview({ mode, rows, onClose }) {
  const refs = useRef([]);
  const [busy, setBusy] = useState(false);
  const pages = mode === "activity" ? activityPages(rows) : mode === "staff" ? staffPages(rows) : tablePages(rows);
  async function download() {
    setBusy(true);
    try {
      // Recheck export permission before capture, even if the preview is old.
      const check = await fetch("/recruitment/api/orientation?purpose=export", { cache: "no-store", signal: AbortSignal.timeout(30000) });
      if (!check.ok) throw new Error("ไม่สามารถตรวจสอบสิทธิ์ Export ได้ กรุณาปิด Preview แล้วลองใหม่");
      const current = await check.json();
      if (!reportMatches(rows, current.rows)) throw new Error("สิทธิ์หรือข้อมูลเปลี่ยนแล้ว กรุณาเปิด Preview ใหม่");
      await timeout(document.fonts.ready);
      await sendBrowserActivity("EXPORT_REQUESTED", "/recruitment/orientation");
      for (let i = 0; i < pages.length; i++) {
        const element = refs.current[i];
        await waitImages(element);
        if (element.querySelector('[data-image-failed="true"]')) throw new Error("มีภาพกิจกรรมโหลดไม่สำเร็จ กรุณาเปิด Preview ใหม่ก่อน Export");
        const png = await timeout(toPng(element, { pixelRatio: 1.5, backgroundColor: "#ffffff", cacheBust: false }), 30000);
        const link = document.createElement("a");
        link.href = png;
        link.download = `orientation-${mode}-${pages[i].date || "undated"}-${pages[i].rows[0]?.branch_code || "all"}-${i + 1}.png`.replace(/[\\/:*?"<>|]/g, "-");
        link.click();
      }
      message.success(`ส่งออก ${pages.length} ภาพแล้ว`);
    } catch (error) { message.error(error.message); }
    finally { setBusy(false); }
  }
  return <Modal open title={`Preview — ${mode === "activity" ? "กิจกรรมและส่งมอบ" : mode === "staff" ? "พนักงานใหม่แยกสังกัด" : "ตาราง Orientation"}`} width="95vw" onCancel={() => !busy && onClose()} footer={
    <Space><Button disabled={busy} onClick={onClose}>ปิด</Button><Button type="primary" loading={busy} onClick={download}>ดาวน์โหลด PNG ทั้งหมด ({pages.length})</Button></Space>}>
    <Typography.Paragraph type="secondary">{rows.length} คน • {pages.length} ภาพ • เลื่อนแนวนอนเพื่อดูภาพขนาดจริง</Typography.Paragraph>
    <div style={{ maxHeight: "70vh", overflow: "auto", background: "#e9edf2", padding: 16 }}>
      {pages.map((page, index) => <div key={`${page.session?.session_id || page.branch || "table"}-${page.date}-${page.page}`} ref={(node) => { refs.current[index] = node; }} style={{ width: 1600, background: "white", color: "#111", marginBottom: 24, fontFamily: "Arial, Tahoma, sans-serif" }}>
        {mode === "activity" ? <div style={{ padding: 36 }}>
          <ActivityReportHeader page={page} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: 20, rowGap: 10 }}>
            {page.categories.map((category) => <section key={category.type} style={{ gridColumn: category.type === "handover" ? "1 / -1" : undefined, minWidth: 0 }}><h2 style={{ background: "#15558f", color: "#fff", border: "2px solid #111", textAlign: "center", margin: "0 0 8px", padding: "4px 8px", fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}>{categoryNames[category.type]}</h2>
              {category.photos.length ? <div style={{ display: "grid", gridTemplateColumns: `repeat(${category.type === "handover" ? 4 : 3}, minmax(0, 1fr))`, gap: 10 }}>{category.photos.map((photo) => <div key={photo.id} style={{ minWidth: 0 }}><ActivityPhoto photo={photo} />{page.sessions.length > 1 && <p style={{ fontSize: 18, margin: "8px 0", overflowWrap: "anywhere" }}>{thaiDate(photo.orientation_date)} • {photo.session_name} • {photo.location_name}</p>}</div>)}</div> : <p style={{ color: "#64748b", fontSize: 20 }}>ไม่มีภาพในหมวดนี้</p>}
            </section>)}
          </div>

        </div> : mode === "staff" ? <div style={{ display: "flex", minHeight: 850 }}>
          <aside style={{ width: 175, flexShrink: 0, background: "#edf0f2", padding: 18, display: "flex", alignItems: "center", flexDirection: "column" }}>
            <Photo row={page.rows[0]} logo />
            <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 36, fontWeight: 800, marginTop: 48 }}>NEW STAFF EMPLOYEE</div>
          </aside>
          <main style={{ flex: 1, padding: "20px 28px" }}>
            <div style={{ fontWeight: 800, fontSize: 40, color: "#555", marginBottom: 24 }}>DATE : {adDate(page.date, " / ")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "32px 18px" }}>
              {page.rows.map((row) => <div key={row.application_id} style={{ textAlign: "center", fontSize: 21, overflowWrap: "anywhere" }}>
                <Photo row={row} /><div style={{ marginTop: 12 }}>{row.full_name}</div><div>{row.nickname ? `(${row.nickname})` : ""}</div><div>{row.position_name}</div>
              </div>)}
            </div>
          </main>
        </div> : <>
          <div style={{ textAlign: "center", background: "#e92cce", color: "white", fontSize: 30, fontWeight: 700, padding: 10 }}>{adDate(page.date)}</div>
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", fontSize: 20 }}>
            <thead><tr>{["วันที่ Orientation", "ชื่อ-สกุล", "ชื่อเล่น", "แผนก", "ตำแหน่ง", "ระดับ", "สังกัด", "สถานที่"].map((label) => <th key={label} style={{ background: "#424242", color: "white", border: "1px solid #999", padding: "22px 8px" }}>{label}</th>)}</tr></thead>
            <tbody>{page.rows.map((row) => <tr key={row.application_id}>{[thaiDate(row.orientation_date), row.full_name, row.nickname, row.department_name, row.position_name, row.level_code, row.branch_code, row.location_name].map((value, i) => <td key={i} style={{ border: "1px solid #ddd", padding: "12px 9px", textAlign: "center", overflowWrap: "anywhere", background: i === 7 ? row.location_color : "white" }}>{value || "-"}</td>)}</tr>)}</tbody>
          </table>
        </>}
      </div>)}
    </div>
  </Modal>;
}
