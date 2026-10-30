"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button, Modal, message } from "antd";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import Image from "next/image";

import { sendBrowserActivity } from "../lib/activity/browser";
import { getExecutivePresentationImageOptions } from "../lib/executivePresentation.mjs";
import {
  getPresentationFilename,
  normalizePresentationBatch,
  waitForPresentationPaint,
} from "../lib/presentationBatch.mjs";

const EXPORT_WIDTH = 1672;
const EXPORT_HEIGHT = 941;
const HEADER_HEIGHT = 470;
const FOOTER_HEIGHT = 471;

function getProxyImageUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("/recruitment/api/image-proxy") ||
    url.startsWith("/api/image-proxy") ||
    url.startsWith("/presentation/") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `/recruitment/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  return `${number.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} บาท`;
}

function formatStartDate(value) {
  if (!value) return "-";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function waitForImages(element) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }),
    ),
  );
}

const ExecutivePresentationExport = forwardRef(
  function ExecutivePresentationExport(_props, ref) {
    const exportRef = useRef(null);
    const [employees, setEmployees] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [previewScale, setPreviewScale] = useState(0.6);
    const [modalWidth, setModalWidth] = useState(1200);

    useImperativeHandle(ref, () => ({
      openPreview(data) {
        const batch = normalizePresentationBatch(data);
        if (!batch.length) return;
        const maxWidth = window.innerWidth * 0.92;
        const maxHeight = window.innerHeight - 190;
        const scale = Math.min(
          maxWidth / EXPORT_WIDTH,
          maxHeight / EXPORT_HEIGHT,
          1,
        );

        setEmployees(batch);
        setCurrentIndex(0);
        setPreviewScale(scale);
        setModalWidth(
          Math.min(EXPORT_WIDTH * scale + 48, window.innerWidth * 0.96),
        );
        setPreviewOpen(true);
      },
    }));

    const employee = employees[currentIndex] || null;

    const handleDownload = async () => {
      const element = exportRef.current;
      if (!element || exporting) return;

      setExporting(true);
      try {
        await sendBrowserActivity("EXPORT_REQUESTED");
        await document.fonts.ready;
        const zip = employees.length > 1 ? new JSZip() : null;
        let singleDataUrl = null;

        for (let index = 0; index < employees.length; index += 1) {
          setCurrentIndex(index);
          await waitForPresentationPaint();
          await waitForImages(element);

          const dataUrl = await toPng(element, {
            ...getExecutivePresentationImageOptions(),
            width: EXPORT_WIDTH,
            height: EXPORT_HEIGHT,
            pixelRatio: 1,
            cacheBust: true,
            backgroundColor: "#ffffff",
            skipFonts: false,
            style: {
              width: `${EXPORT_WIDTH}px`,
              height: `${EXPORT_HEIGHT}px`,
              transform: "none",
              transformOrigin: "top left",
            },
          });
          const filename = getPresentationFilename(
            "present-to-executive",
            employees[index],
            zip ? index : undefined,
          );
          if (zip) zip.file(filename, dataUrl.split(",")[1], { base64: true });
          else singleDataUrl = { dataUrl, filename };
        }

        const link = document.createElement("a");
        let objectUrl = null;
        if (zip) {
          objectUrl = URL.createObjectURL(await zip.generateAsync({ type: "blob" }));
          link.href = objectUrl;
          link.download = "present-to-executive.zip";
        } else {
          link.href = singleDataUrl.dataUrl;
          link.download = singleDataUrl.filename;
        }
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error("Present to Executive export error:", error);
        message.error("ไม่สามารถ Export รูป Present to Executive ได้");
      } finally {
        setExporting(false);
      }
    };

    const profileUrl = getProxyImageUrl(employee?.profile_image_url);
    const logoUrl = getProxyImageUrl(employee?.branch_logo_url);
    const presentationTextColor =
      employee?.presentation_text_color || "#13294B";
    const presentationMutedTextColor =
      employee?.presentation_muted_text_color || "#718096";
    const finalPositionSummary = [
      employee?.final_position_name,
      employee?.position_level && employee.position_level !== "-"
        ? `(${employee.position_level})`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Modal
        title={`ตัวอย่าง Present to Executive${employees.length > 1 ? ` (${currentIndex + 1}/${employees.length})` : ""}`}
        open={previewOpen}
        onCancel={() => !exporting && setPreviewOpen(false)}
        width={modalWidth}
        centered
        destroyOnHidden
        footer={[
          employees.length > 1 ? <Button key="previous" disabled={exporting || currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}>
            ก่อนหน้า
          </Button> : null,
          employees.length > 1 ? <Button key="next" disabled={exporting || currentIndex === employees.length - 1}
            onClick={() => setCurrentIndex((index) => Math.min(index + 1, employees.length - 1))}>
            ถัดไป
          </Button> : null,
          <Button
            key="cancel"
            onClick={() => setPreviewOpen(false)}
            disabled={exporting}
          >
            ยกเลิก
          </Button>,
          <Button
            key="download"
            type="primary"
            loading={exporting}
            onClick={handleDownload}
          >
            {employees.length > 1 ? "ดาวน์โหลดทั้งหมด (.zip)" : "ดาวน์โหลดรูป"}
          </Button>,
        ].filter(Boolean)}
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div
          style={{
            width: EXPORT_WIDTH * previewScale,
            height: EXPORT_HEIGHT * previewScale,
            overflow: "hidden",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            ref={exportRef}
            data-presentation-canvas="executive"
            style={{
              width: EXPORT_WIDTH,
              height: EXPORT_HEIGHT,
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
              backgroundColor: "#ffffff",
              color: "#172033",
              fontFamily: '"Bai Jamjuree", sans-serif',
            }}
          >
            {employee?.background_header_url ? (
              <Image
                src={employee.background_header_url}
                alt=""
                aria-hidden="true"
                width={EXPORT_WIDTH}
                height={HEADER_HEIGHT}
                unoptimized
                style={{
                  position: "absolute",
                  inset: "0 0 auto 0",
                  width: EXPORT_WIDTH,
                  height: HEADER_HEIGHT,
                  objectFit: "fill",
                  display: "block",
                }}
              />
            ) : null}

            {employee?.background_footer_url ? (
              <Image
                src={employee.background_footer_url}
                alt=""
                aria-hidden="true"
                width={EXPORT_WIDTH}
                height={FOOTER_HEIGHT}
                unoptimized
                style={{
                  position: "absolute",
                  left: 0,
                  top: HEADER_HEIGHT,
                  width: EXPORT_WIDTH,
                  height: FOOTER_HEIGHT,
                  objectFit: "fill",
                  display: "block",
                }}
              />
            ) : null}

            <div
              style={{
                position: "absolute",
                left: 70,
                top: 54,
                width: 150,
                height: 150,
                padding: 10,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.4)",
                boxShadow: "0 16px 34px rgba(15, 23, 42, 0.22)",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="โลโก้สังกัด"
                  width={224}
                  height={96}
                  unoptimized
                  crossOrigin="anonymous"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <span style={{ color: "#1e3a5f", fontSize: 34, fontWeight: 700 }}>
                  {employee?.branch_code || "-"}
                </span>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 88,
                top: 526,
                width: 304,
                height: 344,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#eef2f7",
                boxShadow: "0 18px 42px rgba(15, 23, 42, 0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {profileUrl ? (
                <Image
                  src={profileUrl}
                  alt={employee?.full_name || "รูปพนักงาน"}
                  width={304}
                  height={344}
                  unoptimized
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <span style={{ color: "#64748b", fontSize: 82, fontWeight: 700 }}>
                  {employee?.full_name?.charAt(0) || "?"}
                </span>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 438,
                right: 88,
                top: 502,
                height: 380,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  paddingBottom: 7,
                  borderBottom: "2px solid #dbe4ef",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color: presentationMutedTextColor,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  ชื่อ-นามสกุล
                </span>
                <span
                  style={{
                    color: presentationTextColor,
                    fontSize: 36,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {employee?.full_name || "-"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.85fr 1.15fr 1fr",
                  gap: 18,
                  marginTop: 9,
                  marginBottom: 12,
                }}
              >
                <MetaField
                  label="ชื่อเล่น"
                  value={employee?.nickname}
                  textColor={presentationTextColor}
                  mutedTextColor={presentationMutedTextColor}
                />
                <MetaField
                  label="เบอร์โทร"
                  value={employee?.phone_number}
                  textColor={presentationTextColor}
                  mutedTextColor={presentationMutedTextColor}
                />
                <MetaField
                  label="วันเริ่มงาน"
                  value={formatStartDate(employee?.start_date)}
                  textColor={presentationTextColor}
                  mutedTextColor={presentationMutedTextColor}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.05fr 0.95fr",
                  gap: 22,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <DetailRow
                    label="ตำแหน่งที่สมัคร"
                    value={employee?.applied_position_name}
                  />
                  <DetailRow
                    label="เงินเดือนที่คาดหวัง"
                    value={formatMoney(employee?.expected_salary)}
                  />
                  <DetailRow
                    label="สรุปตำแหน่ง / ระดับ"
                    value={finalPositionSummary || "-"}
                    strong
                  />
                  <DetailRow label="สังกัด / แผนก / ฝ่าย" value={employee?.organization} />
                </div>

                <div style={{ display: "grid", gap: 9 }}>
                  <CompensationPanel employee={employee} />
                  {employee?.kpi ? <KpiPanel kpi={employee.kpi} /> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  },
);

function MetaField({ label, value, textColor, mutedTextColor }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span style={{ color: mutedTextColor, fontSize: 14, fontWeight: 600 }}>
        {label}: {" "}
      </span>
      <span
        style={{
          color: textColor,
          fontSize: 18,
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function DetailRow({ label, value, strong = false }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "170px minmax(0, 1fr)",
        gap: 12,
        alignItems: "baseline",
        minHeight: 38,
        padding: "7px 10px",
        borderRadius: 10,
        backgroundColor: strong ? "#edf4ff" : "#f8fafc",
      }}
    >
      <span style={{ color: "#718096", fontSize: 14, fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          color: strong ? "#174a8b" : "#1e293b",
          fontSize: 18,
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function CompensationPanel({ employee }) {
  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: "#13294b",
        color: "#ffffff",
        padding: "11px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          marginBottom: employee?.compensation_items?.length ? 7 : 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#cbd8ea" }}>
          เงินเดือนตามตกลง
        </span>
        <span style={{ fontSize: 24, fontWeight: 700 }}>
          {formatMoney(employee?.base_salary)}
        </span>
      </div>

      {employee?.compensation_items?.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: 14,
            rowGap: 4,
            borderTop: "1px solid rgba(255,255,255,0.18)",
            paddingTop: 7,
          }}
        >
          {employee.compensation_items.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                minWidth: 0,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  color: "#cbd8ea",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </span>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>
                {formatMoney(item.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function KpiPanel({ kpi }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gap: 12,
        alignItems: "center",
        padding: "9px 12px",
        borderRadius: 12,
        backgroundColor: "#eef5ff",
        color: "#174a8b",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700 }}>KPI</span>
      <KpiValue label="ทดลองงาน" value={kpi.probation_amount} />
      <KpiValue label="ผ่านทดลองงาน" value={kpi.confirmed_amount} />
    </div>
  );
}

function KpiValue({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span style={{ color: "#5f7897", fontSize: 12 }}>{label}: </span>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{formatMoney(value)}</span>
    </div>
  );
}

export default ExecutivePresentationExport;
