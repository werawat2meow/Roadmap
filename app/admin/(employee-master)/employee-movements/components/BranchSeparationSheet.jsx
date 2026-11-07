"use client";

import { useEffect, useState } from "react";
import styles from "./BranchSeparationSheet.module.css";

const value = (v) => String(v ?? "").trim() || "—";

function thaiDate(date) {
  if (!date) return "—";
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match
    ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}`
    : value(date);
}

export default function BranchSeparationSheet({
  record,
  photoUrl,
  templateUrl,
  onTemplateReadyChange,
}) {
  const branchCode = String(record?.branch_code || "").trim().toUpperCase();
  const validCode = /^[A-Z0-9_-]{1,24}$/.test(branchCode);
  const template = validCode
    ? templateUrl || `/separation-templates/${branchCode}.png`
    : "";

  const [failedUrl, setFailedUrl] = useState("");
  const missing = Boolean(template && failedUrl === template);
  const label = [value(record?.position_name), value(record?.level_code)]
    .filter((item) => item !== "—")
    .join(" · ");

  useEffect(() => {
    onTemplateReadyChange?.(false);
    // No image-load-dependent condition for rendering photo/text:
    // these must be present even when a cached template fires onLoad early.
  }, [template, onTemplateReadyChange]);

  return (
    <div className={styles.frame}>
      {!validCode && (
        <p className={styles.warning}>
          ไม่พบรหัสสังกัดใน Employee Master — กรุณาตรวจสอบ branches.branch_code
        </p>
      )}
      {missing && (
        <p className={styles.warning}>
          ไม่พบภาพ Template ของสังกัด {branchCode}: {template}
        </p>
      )}
      {template && !missing && (
        <div className={styles.sheet} aria-label={`รายงานพนักงานพ้นสภาพ ${branchCode}`}>
          <img
            key={template}
            className={styles.artwork}
            src={template}
            alt={`แบบฟอร์มสังกัด ${branchCode}`}
            onLoad={() => {
              setFailedUrl("");
              onTemplateReadyChange?.(true);
            }}
            onError={() => {
              setFailedUrl(template);
              onTemplateReadyChange?.(false);
            }}
          />
          {String(record?.employee_status || "").toUpperCase().includes("ลาออก") ||
          String(record?.employee_status || "").toUpperCase().includes("RESIGN") ? (
            <div className={styles.resignStamp} aria-label="RESIGN">RESIGN</div>
          ) : null}
          <div className={styles.portrait}>
            {photoUrl ? (
              <img src={photoUrl} alt="รูปพนักงาน" />
            ) : (
              <span>ไม่มีรูปพนักงาน</span>
            )}
          </div>
          <div className={styles.details}>
            <div className={styles.heading}>พนักงานลาออก</div>
            <div>ชื่อ {value(record?.name)} <span>ชื่อเล่น {value(record?.nickname)}</span></div>
            <div>รหัสพนักงาน {value(record?.employee_code)} <span>เบอร์โทร {value(record?.phone)}</span></div>
            <div>ตำแหน่ง {label || "—"}</div>
            <div>สังกัด {value(record?.branch_name)} <span>แผนก {value(record?.department)}</span></div>
            <div>เริ่มงานวันที่ {thaiDate(record?.hire_date)} <span>สิ้นสุดการทำงานวันที่ {thaiDate(record?.exit_date)}</span></div>
            <div>เหตุผล : {value(record?.reason)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
