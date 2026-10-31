"use client";

import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Button,
  Modal,
  Spin,
  Space,
  Typography,
  message,
} from "antd";

import { PrinterOutlined } from "@ant-design/icons";

import BranchSeparationSheet from "./BranchSeparationSheet";

const EXIT_CODES = new Set([
  "RESIGNED",
  "RETIRED",
  "TERMINATED",
]);

// รูปพื้นหลังงง
const TEMPLATE_BY_BRANCH_CODE = {
  BB: "/separation-templates/BB.png",
  CCS: "/separation-templates/CCS.png",
  CNT: "/separation-templates/CNT.png",
  FH: "/separation-templates/FH.png",
  FHP: "/separation-templates/FHP.png",
  HL: "/separation-templates/HL.png",
  HW: "/separation-templates/HW.png",
  KE: "/separation-templates/KE.png",
  LC: "/separation-templates/LC.png",
  MR: "/separation-templates/MR.png",
  NN: "/separation-templates/NN.png",
  REN: "/separation-templates/REN.png",
  SR: "/separation-templates/SR.png",
  SS: "/separation-templates/SS.png",
};

// โลโก้สังกัดจาก public/logo (แยกจาก PNG แม่แบบ)
const LOGO_BY_BRANCH_CODE = {
  BB: "/logo/BB.jpg",
  CCS: "/logo/CCS.jpg",
  CNT: "/logo/CNT.jpg",
  FH: "/logo/FH.jpg",
  FHP: "/logo/FHP.jpg",
  HL: "/logo/HL.jpg",
  HW: "/logo/HW.jpg",
  KE: "/logo/KE.jpg",
  LC: "/logo/LC.jpg",
  MR: "/logo/MR.jpg",
  NN: "/logo/NN.jpg",
  REN: "/logo/REN.jpg",
  SR: "/logo/SR.jpg",
  SS: "/logo/SS.jpg",
};

export default function EmployeeSeparationModal({
  employee,
  open,
  onClose,
  getJson,
  imageSrc,
}) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [templateReady, setTemplateReady] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    if (!open || !employee?.id) {
      setRecord(null);
      setError("");
      setTemplateReady(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");
    setRecord(null);
    setTemplateReady(false);

    getJson(
      `/api/admin/employee-movements/print-data?type=exit&ids=${encodeURIComponent(employee.id)}`
    )
      .then((result) => {
        if (cancelled) return;

        const item = result.data?.find(
          (row) => String(row.id) === String(employee.id)
        );

        if (!item) {
          throw new Error(
            "ไม่พบข้อมูลเอกสารพ้นสภาพที่ได้รับอนุญาต"
          );
        }

        setRecord(item);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason.message || "ไม่สามารถโหลดเอกสารได้"
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employee?.id, open, getJson]);

  const isExit =
    EXIT_CODES.has(
      String(employee?.status_code || "").toUpperCase()
    ) || employee?.event === "EXITED";

  const photoSource = record?.photo_url || "";

  const photoUrl = /^https?:\/\//i.test(photoSource)
    ? photoSource
    : imageSrc?.(photoSource) || "";

  const branchCode = String(
    record?.branch_code || ""
  )
    .trim()
    .toUpperCase();

  const templateUrl =
    TEMPLATE_BY_BRANCH_CODE[branchCode] || "";
  const logoUrl = LOGO_BY_BRANCH_CODE[branchCode] || "";

  // ตรวจจาก DOM โดยตรง หากรูป PNG โหลดแล้ว
  // ไม่ต้องพึ่งเฉพาะ templateReady ที่อาจถูก reset
  const isTemplateImageLoaded = () => {
    const image = printRef.current?.querySelector(
      'img[src*="/separation-templates/"]'
    );

    return Boolean(
      image &&
      image.complete &&
      image.naturalWidth > 0
    );
  };

  // เมื่อภาพโหลดเสร็จ ให้ยืนยันความพร้อม
  const handleTemplateReady = (ready) => {
    if (ready) {
      setTemplateReady(true);
      return;
    }

    // ไม่ reset หากภาพจริงใน DOM โหลดแล้ว
    if (!isTemplateImageLoaded()) {
      setTemplateReady(false);
    }
  };

  function printReport() {
    const source = printRef.current;

    if (!source || loading || !record || !isExit) {
      return;
    }

    if (!isTemplateImageLoaded()) {
      message.warning(
        "ภาพ Template ยังโหลดไม่เสร็จ กรุณาตรวจสอบไฟล์ PNG"
      );
      return;
    }

    const popup = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!popup) {
      message.error(
        "โปรดอนุญาต Pop-up เพื่อพิมพ์รายงาน"
      );
      return;
    }

    const styles = Array.from(
      document.head.querySelectorAll(
        'link[rel="stylesheet"],style'
      )
    )
      .map((node) => node.outerHTML)
      .join("\n");

    popup.document.open();

    popup.document.write(`
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <base href="${document.baseURI}" />
          <title>ใบพนักงานพ้นสภาพ</title>

          ${styles}

          <style>
            @page { size: A4 landscape; margin: 0; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 297mm !important;
              height: 210mm !important;
              overflow: hidden !important;
              background: #fff !important;
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #exit-print-only,
            #exit-print-only > div,
            #exit-print-only > div > div {
              box-sizing: border-box !important;
              width: 297mm !important;
              height: 210mm !important;
              max-width: none !important;
              max-height: none !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: hidden !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            #exit-print-only [class*="sheet"] {
              position: relative !important;
              display: block !important;
              width: 297mm !important;
              height: 210mm !important;
              max-width: none !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              aspect-ratio: auto !important;
              overflow: hidden !important;
              break-inside: avoid !important;
            }
            #exit-print-only [class*="artwork"] {
              width: 100% !important;
              height: 100% !important;
              object-fit: fill !important;
            }
            #exit-print-only [class*="sheet"]::after {
              position: absolute;
              z-index: 20;
              right: 3.5%;
              top: 52%;
              transform: rotate(-12deg);
              border: 4px solid #bd2323;
              color: #bd2323;
              font: 900 31pt Arial, sans-serif;
              letter-spacing: 2px;
              padding: 1.5mm 3mm;
              opacity: .84;
              pointer-events: none;
            }
          </style>
        </head>

        <body>
          <main id="exit-print-only">
            ${source.innerHTML}
          </main>
        </body>
      </html>
    `);

    popup.document.close();

    async function runPrint() {
      try {
        await Promise.all(
          Array.from(
            popup.document.querySelectorAll(
              'link[rel="stylesheet"]'
            )
          ).map((link) =>
            link.sheet
              ? Promise.resolve()
              : new Promise((resolve) => {
                  link.addEventListener(
                    "load",
                    resolve,
                    { once: true }
                  );

                  link.addEventListener(
                    "error",
                    resolve,
                    { once: true }
                  );
                })
          )
        );

        await Promise.all(
          Array.from(popup.document.images).map(
            (img) =>
              img.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                    img.addEventListener(
                      "load",
                      resolve,
                      { once: true }
                    );

                    img.addEventListener(
                      "error",
                      resolve,
                      { once: true }
                    );
                  })
          )
        );

        if (popup.document.fonts?.ready) {
          await popup.document.fonts.ready;
        }

        if (!popup.closed) {
          popup.focus();
          popup.print();
        }
      } catch {
        if (!popup.closed) {
          popup.focus();
          popup.print();
        }
      }
    }

    if (popup.document.readyState === "complete") {
      void runPrint();
    } else {
      popup.addEventListener(
        "load",
        () => void runPrint(),
        { once: true }
      );
    }
  }

  const canPrint =
    !loading &&
    Boolean(record) &&
    isExit &&
    Boolean(templateUrl) &&
    templateReady;

  return (
    <Modal
      title="ใบพนักงานพ้นสภาพ · Preview"
      open={open}
      onCancel={onClose}
      width={1180}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose}>
            ปิด
          </Button>

          <Button
            type="primary"
            icon={<PrinterOutlined />}
            disabled={!canPrint}
            onClick={printReport}
          >
            พิมพ์ / บันทึก PDF
          </Button>
        </Space>
      }
    >
      <style>{`
        #employee-separation-print [class*="sheet"]::after {
          position: absolute;
          z-index: 20;
          right: 3.5%;
          top: 52%;
          transform: rotate(-12deg);
          border: 3px solid #bd2323;
          color: #bd2323;
          font: 900 clamp(20px, 3vw, 48px) Arial, sans-serif;
          letter-spacing: 2px;
          padding: 3px 10px;
          opacity: .84;
          pointer-events: none;
        }
      `}</style>
      {loading && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          <Spin description="กำลังโหลดเอกสาร..." />
        </div>
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          title="ไม่สามารถเปิดเอกสาร"
          description={error}
        />
      )}

      {!isExit && (
        <Alert
          type="warning"
          showIcon
          title="รายการนี้ยังไม่พ้นสภาพตามสถานะที่ระบบรองรับ"
        />
      )}

      {record && isExit && (
        <div
          id="employee-separation-print"
          ref={printRef}
          style={{
            paddingBlock: 12,
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <BranchSeparationSheet
              key={`${record.id}-${templateUrl}`}
              record={record}
              photoUrl={photoUrl}
              templateUrl={templateUrl}
              onTemplateReadyChange={handleTemplateReady}
            />
            {logoUrl && (
              <img
                src={logoUrl}
                alt={`โลโก้สังกัด ${branchCode}`}
                style={{
                  position: "absolute",
                  left: "2.5%",
                  top: "4%",
                  width: "13%",
                  height: "19%",
                  zIndex: 30,

                  background: "rgba(255,255,255,0.90)",
                  borderRadius: "12px",
                  padding: "10px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.18)",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            )}
          </div>
        </div>
      )}

      

      {record && isExit && (
        <Typography.Text type="secondary">
          รูปแบบรายงานเลือกตาม
          branches.branch_code ของพนักงาน
          โดยใช้ไฟล์ PNG จาก
          public/separation-templates/
        </Typography.Text>
      )}
    </Modal>
  );
}
