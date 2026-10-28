"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button, Modal, message } from "antd";
import { toPng } from "html-to-image";
import Image from "next/image";

import { sendBrowserActivity } from "../lib/activity/browser";
import { buildDepartmentPresentationFields } from "../lib/departmentPresentation.mjs";

const EXPORT_WIDTH = 1672;
const EXPORT_HEIGHT = 941;
const HEADER_HEIGHT = 471;
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

const DepartmentPresentationExport = forwardRef(
  function DepartmentPresentationExport(_props, ref) {
    const exportRef = useRef(null);
    const [employee, setEmployee] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [previewScale, setPreviewScale] = useState(0.6);
    const [modalWidth, setModalWidth] = useState(1200);

    useImperativeHandle(ref, () => ({
      openPreview(data) {
        const maxWidth = window.innerWidth * 0.92;
        const maxHeight = window.innerHeight - 190;
        const scale = Math.min(
          maxWidth / EXPORT_WIDTH,
          maxHeight / EXPORT_HEIGHT,
          1,
        );

        setEmployee(data);
        setPreviewScale(scale);
        setModalWidth(
          Math.min(EXPORT_WIDTH * scale + 48, window.innerWidth * 0.96),
        );
        setPreviewOpen(true);
      },
    }));

    const handleDownload = async () => {
      const element = exportRef.current;
      if (!element || exporting) return;

      setExporting(true);
      try {
        await sendBrowserActivity("EXPORT_REQUESTED");
        await document.fonts.ready;
        await waitForImages(element);

        const dataUrl = await toPng(element, {
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

        const safeEmployeeCode = String(employee?.emp_code || "employee")
          .replace(/[\\/:*?"<>|]/g, "")
          .replace(/\s+/g, "-");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `present-to-department-${safeEmployeeCode}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Present to Department export error:", error);
        message.error("ไม่สามารถ Export รูป Present to Department ได้");
      } finally {
        setExporting(false);
      }
    };

    const profileUrl = getProxyImageUrl(employee?.profile_image_url);
    const logoUrl = getProxyImageUrl(employee?.branch_logo_url);
    const presentationFields = buildDepartmentPresentationFields({
      ...employee,
      start_date: formatStartDate(employee?.start_date),
    });

    return (
      <Modal
        title="ตัวอย่าง Present to Department"
        open={previewOpen}
        onCancel={() => !exporting && setPreviewOpen(false)}
        width={modalWidth}
        centered
        destroyOnHidden
        footer={[
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
            ดาวน์โหลดรูป
          </Button>,
        ]}
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
                  top: HEADER_HEIGHT - 1,
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
                width: 260,
                height: 132,
                padding: 18,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.94)",
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
                <span
                  style={{
                    color: "#1e3a5f",
                    fontSize: 34,
                    fontWeight: 700,
                  }}
                >
                  {employee?.branch_code || "-"}
                </span>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 96,
                top: 527,
                width: 344,
                height: 342,
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
                  width={344}
                  height={342}
                  unoptimized
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                    display: "block",
                  }}
                />
              ) : (
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 86,
                    fontWeight: 700,
                  }}
                >
                  {employee?.full_name?.charAt(0) || "?"}
                </span>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 500,
                right: 96,
                top: 510,
                height: 372,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  paddingBottom: 13,
                  marginBottom: 16,
                  borderBottom: "2px solid #dbe4ef",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    color: "#13294b",
                    fontSize: 50,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    marginBottom: 4,
                  }}
                >
                  ยินดีต้อนรับ
                </div>
                <div
                  style={{
                    color: "#718096",
                    fontSize: 25,
                    fontWeight: 600,
                    lineHeight: 1.12,
                  }}
                >
                  สมาชิกใหม่สู่ครอบครัวของเรา
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  columnGap: 24,
                  rowGap: 14,
                }}
              >
                {presentationFields.map((field) => (
                  <PresentationField key={field.label} {...field} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  },
);

function PresentationField({ label, value, span = 1 }) {
  return (
    <div style={{ minWidth: 0, gridColumn: `span ${span}` }}>
      <div
        style={{
          color: "#718096",
          fontSize: 17,
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#1e293b",
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

export default DepartmentPresentationExport;
