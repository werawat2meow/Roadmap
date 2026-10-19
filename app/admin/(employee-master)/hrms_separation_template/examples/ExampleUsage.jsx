"use client";
import { Button } from "antd";
import EmployeeSeparationTemplate from "../components/EmployeeSeparationTemplate";

export default function ExampleUsage() {
  const employee = {
    employee_code: "EXAMPLE-001", first_name_th: "สมชาย", last_name_th: "ตัวอย่าง",
    company_name: "บริษัทตัวอย่าง", branch_name: "Flying Hanuman",
    department_name: "Operations", division_name: "", unit_name: "",
    position_name: "เจ้าหน้าที่ปฏิบัติการ", position_level_name: "P5", hire_date: "2024-01-15",
    photoUrl: null,
  };
  const separation = {
    type_label: "ลาออก", request_date: "2026-10-15", last_working_date: "2026-10-31",
    effective_date: "2026-11-01", reason: "เหตุผลตัวอย่าง", remark: "ข้อมูลสมมติ",
  };
  // IMPORTANT: brand assets should come from a trusted branch-specific mapping in your own app.
  // No real addresses, IDs, or URLs are invented here.
  const brand = { name: "Flying Hanuman", subtitle: "EMPLOYEE SEPARATION", backgroundUrl: null, logoUrl: null };
  return <div style={{ padding: 24, background: "#f4f7f6" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto 16px", textAlign: "right" }}>
      <Button onClick={() => window.print()}>พิมพ์ / บันทึกเป็น PDF</Button>
    </div>
    <EmployeeSeparationTemplate employee={employee} separation={separation} brand={brand}/>
  </div>;
}
