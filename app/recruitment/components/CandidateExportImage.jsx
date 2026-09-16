"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Modal, Button } from "antd";
import { toPng } from "html-to-image";
import dayjs from "dayjs";

import "dayjs/locale/th";

dayjs.locale("th");

const EXPORT_WIDTH = 1760;
const EXPORT_HEIGHT = 959;

const CandidateExportImage = forwardRef(function CandidateExportImage(
  _props,
  ref
) {
  const exportRef = useRef(null);

  const [application, setApplication] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(0.6);
  const [modalWidth, setModalWidth] = useState(1200);

  const getCandidatePhoto = (app) => {
    if (app?.proxy_photo_url) return app.proxy_photo_url;
    if (app?.profile_image_url) return app.profile_image_url;
    if (app?.photo_file_url) return app.photo_file_url;
    return null;
  };

  const getProxyImageUrl = (url) => {
    if (!url) return null;

    if (
      url.startsWith("/recruitment/api/image-proxy") ||
      url.startsWith("/api/image-proxy")
    ) {
      return url;
    }

    return `/recruitment/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const formatInterviewDate = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm น.") : "-";

  const formatSalary = (value) =>
    value === null || value === undefined || value === ""
      ? "-"
      : `${Number(value).toLocaleString("th-TH")} บาท`;

  const waitForImages = async (element) => {
    const images = Array.from(element.querySelectorAll("img"));
    if (images.length === 0) return;

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }

            const cleanup = () => {
              img.removeEventListener("load", handleLoad);
              img.removeEventListener("error", handleError);
            };

            const handleLoad = () => {
              cleanup();
              resolve();
            };

            const handleError = () => {
              cleanup();
              resolve();
            };

            img.addEventListener("load", handleLoad);
            img.addEventListener("error", handleError);
          })
      )
    );
  };

  const runExport = async () => {
    const element = exportRef.current;
    if (!element) return;

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
        transform: "none",
        transformOrigin: "top left",
        width: `${EXPORT_WIDTH}px`,
        height: `${EXPORT_HEIGHT}px`,
      },
    });

    const firstName = application?.first_name?.trim() || "candidate";
    const lastName = application?.last_name?.trim() || "";

    const safeFileName = `candidate-${firstName}-${lastName}`
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${safeFileName}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useImperativeHandle(ref, () => ({
    openPreview: (data) => {
      setApplication(data);

      const maxWidth = window.innerWidth * 0.92;
      const maxHeight = window.innerHeight - 180;

      const scaleByWidth = maxWidth / EXPORT_WIDTH;
      const scaleByHeight = maxHeight / EXPORT_HEIGHT;
      const nextScale = Math.min(scaleByWidth, scaleByHeight, 1);

      setScale(nextScale);
      setModalWidth(
        Math.min(EXPORT_WIDTH * nextScale + 48, window.innerWidth * 0.96)
      );

      setPreviewOpen(true);
    },
  }));

  const handleDownload = async () => {
    if (exporting) return;

    setExporting(true);
    try {
      await runExport();
    } catch (error) {
      console.error("Export candidate image error:", error);
      alert("ไม่สามารถ Export รูปได้");
    } finally {
      setExporting(false);
    }
  };

  const photoUrl = getProxyImageUrl(getCandidatePhoto(application));
  const brancheImageUrl = getProxyImageUrl(
    application?.branche_image_url?.trim()
  );

  const fullName =
    [application?.first_name, application?.last_name]
      .filter(Boolean)
      .join(" ") || "-";

  return (
    <Modal
      title="ตัวอย่างรูปที่จะ Export"
      open={previewOpen}
      onCancel={() => !exporting && setPreviewOpen(false)}
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
      width={modalWidth}
      centered
      destroyOnHidden
      styles={{
        body: {
          padding: 0,
          overflow: "hidden",
        },
      }}
    >
      <div
        style={{
          width: EXPORT_WIDTH * scale,
          height: EXPORT_HEIGHT * scale,
          overflow: "hidden",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          id="candidate-export-image"
          ref={exportRef}
          style={{
            width: `${EXPORT_WIDTH}px`,
            height: `${EXPORT_HEIGHT}px`,
            flexShrink: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundColor: "#f7f9fc",
            fontFamily: '"Bai Jamjuree", sans-serif',
            boxSizing: "border-box",
            color: "#172033",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative background */}
          <div
            style={{
              position: "absolute",
              width: "520px",
              height: "520px",
              borderRadius: "50%",
              backgroundColor: "#eaf2ff",
              right: "-220px",
              top: "-250px",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "360px",
              height: "360px",
              borderRadius: "50%",
              backgroundColor: "#f1f5f9",
              left: "-210px",
              bottom: "-190px",
              zIndex: 0,
            }}
          />

          {/* Header */}
          <div
            style={{
              height: "142px",
              padding: "24px 64px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #e7ebf1",
              backgroundColor: "rgba(255,255,255,0.94)",
              position: "relative",
              zIndex: 2,
            }}
          >
            {brancheImageUrl ? (
              <div
                style={{
                  width: "240px",
                  height: "94px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <img
                  src={brancheImageUrl}
                  alt="Logo Branch"
                  crossOrigin="anonymous"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Candidate Profile
              </div>
            )}
          </div>

          {/* Interview Confirm Stamp */}
          <div
            style={{
              position: "absolute",
              right: "72px",
              top: "30px",
              width: "252px",
              height: "252px",
              borderRadius: "50%",
              border: "5px dashed #82796a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              zIndex: 50,
              transform: "rotate(-11deg)",
              padding: "24px",
              boxSizing: "border-box",
              backgroundColor: "#fff449",
              boxShadow: "0 14px 38px rgba(126, 112, 43, 0.18)",
            }}
          >
            <span
              style={{
                fontSize: "37px",
                fontWeight: 700,
                lineHeight: 1.22,
                color: "#6f685b",
              }}
            >
              ยืนยันการ
              <br />
              สัมภาษณ์
            </span>
          </div>

          {/* Main card */}
          <div
            style={{
              position: "absolute",
              left: "64px",
              right: "64px",
              top: "178px",
              height: "570px",
              backgroundColor: "#ffffff",
              border: "1px solid #e6ebf2",
              borderRadius: "28px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              display: "flex",
              gap: "58px",
              padding: "44px",
              boxSizing: "border-box",
              zIndex: 3,
            }}
          >
            {/* Photo */}
            <div
              style={{
                width: "390px",
                height: "480px",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "14px",
                  width: "390px",
                  height: "480px",
                  borderRadius: "24px",
                  backgroundColor: "#eaf2ff",
                }}
              />

              <div
                style={{
                  position: "relative",
                  width: "390px",
                  height: "480px",
                  borderRadius: "24px",
                  overflow: "hidden",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e5eaf0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    crossOrigin="anonymous"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: "110px",
                      fontWeight: 700,
                      color: "#94a3b8",
                    }}
                  >
                    {(application?.first_name?.charAt(0) || "?").toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Information */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                paddingTop: "8px",
                paddingRight: "250px",
              }}
            >
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  letterSpacing: "2.4px",
                  color: "#94a3b8",
                  marginBottom: "10px",
                }}
              >
                CANDIDATE PROFILE
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "16px",
                  marginBottom: "16px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {/* Label */}
                <div
                  style={{
                    fontSize: "23px",
                    color: "#64748b",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  ชื่อ - นามสกุล :
                </div>

                {/* Full Name */}
                <div
                  style={{
                    fontSize: "52px",
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "#172033",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                  }}
                >
                  {fullName}
                </div>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  maxWidth: "100%",
                  minHeight: "50px",
                  padding: "8px 18px",
                  borderRadius: "12px",
                  backgroundColor: "#eef5ff",
                  color: "#2459a9",
                  fontSize: "25px",
                  fontWeight: 600,
                  boxSizing: "border-box",
                  marginBottom: "34px",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {application?.position_name || "-"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px 38px",
                }}
              >
                <InfoCard
                  label="ชื่อเล่น"
                  value={application?.nickname_th || "-"}
                />
                <InfoCard
                  label="เบอร์โทร"
                  value={application?.phone_number || "-"}
                />
                <InfoCard
                  label="เงินเดือนที่คาดหวัง"
                  value={formatSalary(application?.expected_salary)}
                  highlight
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Interview information */}
          <div
            style={{
              position: "absolute",
              left: "64px",
              right: "64px",
              bottom: "48px",
              height: "125px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              zIndex: 4,
            }}
          >
            <InterviewBox
              type="date"
              label="วันที่ยืนยันสัมภาษณ์"
              value={formatInterviewDate(application?.interview_datetime)}
            />
            <InterviewBox
              type="location"
              label="สถานที่สัมภาษณ์"
              value={application?.interview_location || "-"}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default CandidateExportImage;

function InfoCard({ label, value, highlight = false, fullWidth = false }) {
  return (
    <div
      style={{
        gridColumn: fullWidth ? "1 / -1" : "auto",
        minHeight: "92px",
        padding: "16px 20px",
        borderRadius: "16px",
        border: "1px solid #e7ebf1",
        backgroundColor: "#fbfcfe",
        boxSizing: "border-box",

        // ทำให้ label + value อยู่บรรทัดเดียวกัน
        display: "flex",
        alignItems: "center",
        gap: "14px",

        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: "18px",
          color: "#8b95a5",
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {label} :
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: "29px",
          fontWeight: 700,
          color: highlight ? "#2459a9" : "#253044",

          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InterviewBox({ type, label, value }) {
  return (
    <div
      style={{
        height: "125px",
        padding: "22px 28px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
        display: "flex",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "18px",
          flexShrink: 0,
          backgroundColor: "#eef5ff",
          color: "#2459a9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {type === "date" ? <CalendarIcon /> : <LocationIcon />}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "19px",
            color: "#7b8798",
            marginBottom: "5px",
            fontWeight: 500,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#1f2937",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="31" height="31" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3V6M17 3V6M4 9H20M5 5H19C20.1 5 21 5.9 21 7V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V7C3 5.9 3.9 5 5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="31" height="31" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21C12 21 19 15 19 9C19 5.13 15.87 2 12 2C8.13 2 5 5.13 5 9C5 15 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="9"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
