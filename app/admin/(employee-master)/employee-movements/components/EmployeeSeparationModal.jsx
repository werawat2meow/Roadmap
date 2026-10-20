"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spin, Space, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import EmployeeSeparationTemplate from "./EmployeeSeparationTemplate";

const EXIT_CODES = new Set(["RESIGNED", "RETIRED", "TERMINATED"]);

/** Read-only: relies on existing print-data API's permission, scope, and exit checks. */
export default function EmployeeSeparationModal({ employee, open, onClose, getJson, imageSrc }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !employee?.id) {
      setRecord(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setRecord(null);
    getJson(`/api/admin/employee-movements/print-data?type=exit&ids=${encodeURIComponent(employee.id)}`)
      .then((result) => {
        if (cancelled) return;
        const item = result.data?.find((row) => row.id === employee.id);
        if (!item) throw new Error("ไม่พบข้อมูลเอกสารพ้นสภาพที่ได้รับอนุญาต");
        setRecord(item);
      })
      .catch((reason) => { if (!cancelled) setError(reason.message || "ไม่สามารถโหลดเอกสารได้"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employee?.id, open, getJson]);

  const isExit = EXIT_CODES.has(String(employee?.status_code || "").toUpperCase()) || employee?.event === "EXITED";
  const org = employee?.organization || {};
  const safeImage = (url) => imageSrc?.(url) || "";
  const profile = record ? {
    first_name_th: employee?.first_name_th || record.name || "",
    last_name_th: employee?.last_name_th || "",
    employee_code: record.employee_code,
    company_name: org.company_id || "",
    branch_name: record.branch_name || org.branch_id || "",
    department_name: record.department || org.department_id || "",
    division_name: org.division_id || "",
    unit_name: org.unit_id || "",
    position_name: employee?.position_name || "",
    position_level_name: employee?.level_name || employee?.level_p || "",
    hire_date: record.hire_date,
    photoUrl: safeImage(record.photo_url),
  } : {};
  const separation = record ? {
    effective_date: record.exit_date,
    last_working_date: record.exit_date,
    type_label: record.employee_status || employee?.status_name || "",
    // The current print-data API does not expose request date, reason or remarks.
    request_date: null,
    reason: null,
    remark: null,
  } : {};
  const brand = record ? {
    name: record.branch_name || org.branch_id || "HRMS ENTERPRISE",
    // Existing branches.branch_image_url may be a branch photo rather than an approved document background.
    // Use it as a banner preview; later replace with a dedicated approved brand asset.
    backgroundUrl: safeImage(record.branch_image_url),
    subtitle: "EMPLOYEE SEPARATION RECORD",
  } : {};

  return (
    <Modal
      title="ใบพนักงานพ้นสภาพ · Preview"
      open={open}
      onCancel={onClose}
      width={1180}
      destroyOnHidden
      footer={<Space><Button onClick={onClose}>ปิด</Button><Button type="primary" icon={<PrinterOutlined />} disabled={loading || !record || !isExit} onClick={() => window.print()}>พิมพ์ / บันทึก PDF</Button></Space>}
    >
      <style>{`@media print {
        @page { size: A4 landscape; margin: 10mm; }
        body * { visibility: hidden !important; }
        #employee-separation-print, #employee-separation-print * { visibility: visible !important; }
        #employee-separation-print { position: fixed !important; inset: 0 auto auto 0 !important; width: 100% !important; max-height: none !important; z-index: 999999 !important; }
      }`}</style>
      {loading ? <div style={{ padding: 40, textAlign: "center" }}><Spin description="กำลังโหลดข้อมูลเอกสาร..." /></div> : null}
      {error ? <Alert type="error" showIcon title="ไม่สามารถเปิดเอกสาร" description={error} /> : null}
      {!isExit ? <Alert type="warning" showIcon title="รายการนี้ยังไม่พ้นสภาพตามสถานะที่ระบบรองรับ" /> : null}
      {record && isExit ? (
        <div id="employee-separation-print" style={{ overflowX: "auto", paddingBlock: 12 }}>
          <EmployeeSeparationTemplate employee={profile} separation={separation} brand={brand} showResignStamp={String(employee?.status_code).toUpperCase() === "RESIGNED"} />
        </div>
      ) : null}
      {record && isExit ? <Typography.Text type="secondary">ข้อมูลในเอกสารอ่านจาก HRMS เท่านั้น วันที่ยื่นลาออกและเหตุผลจะแสดงเป็น — หาก API ปัจจุบันยังไม่ได้จัดส่งข้อมูลนั้น ภาพสังกัดเป็นภาพจาก Master ไม่ใช่ Template Branding ที่อนุมัติแล้ว</Typography.Text> : null}
    </Modal>
  );
}
