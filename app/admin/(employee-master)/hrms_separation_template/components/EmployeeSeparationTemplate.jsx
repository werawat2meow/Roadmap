"use client";

import React from "react";
import styles from "./EmployeeSeparationTemplate.module.css";

function text(value) {
  return value === null || value === undefined || String(value).trim() === "" ? "—" : String(value);
}
function formatDate(value) {
  if (!value) return "—";
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(value));
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return text(value);
}
function Field({ label, value, wide = false }) {
  return <div className={`${styles.field} ${wide ? styles.wide : ""}`}><div className={styles.label}>{label}</div><div className={styles.value}>{text(value)}</div></div>;
}

/**
 * Reusable, presentation-only template. Does not fetch, mutate or approve records.
 * Pass URLs from trusted HRMS sources (e.g. your own asset storage).
 * Use employeePhotoUrl / brand.backgroundUrl / brand.logoUrl only after authorization.
 */
export default function EmployeeSeparationTemplate({
  employee = {},
  separation = {},
  brand = {},
  documentTitle = "ข้อมูลพนักงานพ้นสภาพ",
  showResignStamp = true,
}) {
  const name = [employee.first_name_th, employee.last_name_th].filter(Boolean).join(" ");
  const brandName = brand.name || "HRMS ENTERPRISE";
  return (
    <section className={styles.sheet} aria-label={documentTitle}>
      <header className={styles.hero} style={brand.backgroundUrl ? { backgroundImage: `linear-gradient(90deg,rgba(7,35,29,.82),rgba(7,35,29,.22)),url("${brand.backgroundUrl}")` } : undefined}>
        <div className={styles.brandRow}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt="โลโก้สังกัด" className={styles.logo} /> : null}
          <div><div className={styles.brandName}>{brandName}</div><div className={styles.brandSub}>{text(brand.subtitle || "EMPLOYEE SEPARATION RECORD")}</div></div>
        </div>
        <div className={styles.heroTitle}>{documentTitle}</div>
      </header>
      <div className={styles.content}>
        <aside className={styles.profile}>
          <div className={styles.portrait}>
            {employee.photoUrl ? <img src={employee.photoUrl} alt="รูปพนักงาน" className={styles.photo} /> : <div className={styles.photoFallback}><span className={styles.avatarCircle}>👤</span><span>รูปพนักงาน</span></div>}
          </div>
          <div className={styles.employeeName}>{name || "ชื่อ–นามสกุล"}</div>
          <div className={styles.employeeCode}>{text(employee.employee_code)}</div>
        </aside>
        <main className={styles.details}>
          {showResignStamp ? <div className={styles.stamp} aria-label="RESIGN">RESIGN</div> : null}
          <h2 className={styles.sectionTitle}>ข้อมูลพนักงาน</h2>
          <div className={styles.columns}>
            <Field label="ชื่อ–นามสกุล" value={name} />
            <Field label="รหัสพนักงาน" value={employee.employee_code} />
            <Field label="บริษัท" value={employee.company_name} />
            <Field label="สังกัด" value={employee.branch_name} />
            <Field label="แผนก" value={employee.department_name} />
            <Field label="ฝ่าย / หน่วยงาน" value={[employee.division_name, employee.unit_name].filter(Boolean).join(" / ")} />
            <Field label="ตำแหน่ง" value={employee.position_name} />
            <Field label="ระดับตำแหน่ง" value={employee.position_level_name} />
          </div>
          <h2 className={styles.sectionTitle}>ข้อมูลการพ้นสภาพ</h2>
          <div className={styles.columns}>
            <Field label="วันที่เริ่มงาน" value={formatDate(employee.hire_date || employee.start_work_date)} />
            <Field label="วันที่ยื่นลาออก" value={formatDate(separation.request_date)} />
            <Field label="วันทำงานวันสุดท้าย" value={formatDate(separation.last_working_date)} />
            <Field label="วันที่มีผลพ้นสภาพ" value={formatDate(separation.effective_date)} />
            <Field label="ประเภทการพ้นสภาพ" value={separation.type_label} />
            <Field label="เหตุผล" value={separation.reason} />
            <Field label="หมายเหตุ" value={separation.remark} wide />
          </div>
        </main>
      </div>
      <footer className={styles.footer}><span>{brand.footerText || brandName}</span><span>เอกสารสรุปข้อมูล • สร้างจาก HRMS</span></footer>
    </section>
  );
}
