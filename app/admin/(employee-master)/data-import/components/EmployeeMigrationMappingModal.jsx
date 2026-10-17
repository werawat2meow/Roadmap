"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, Input, InputNumber, Row, Col, Alert, Divider } from "antd";

const GROUPS = [
  ["ข้อมูลพื้นฐาน", ["first_name_th", "last_name_th", "nickname_th", "gender_code"]],
  ["โครงสร้างองค์กร", ["company_code", "branch_group_code", "branch_code", "department_code", "division_code", "unit_code"]],
  ["โครงสร้างตำแหน่ง", ["position_family_code", "position_level_code", "position_code", "job_code", "salary_band_code"]],
  ["ข้อมูลการจ้างงาน", ["employment_type_code", "employee_status_code", "status", "start_work_date", "employee_code_type"]],
  ["เงินเดือนและบัญชีต้นทุน", ["base_salary", "salary_structure_code", "payroll_company_code", "payroll_type_code", "payroll_group_code", "business_unit_code", "cost_center_code", "profit_center_code"]],
];
const LABELS = {
  first_name_th: "ชื่อ", last_name_th: "นามสกุล", nickname_th: "ชื่อเล่น", gender_code: "เพศ",
  company_code: "บริษัท", branch_group_code: "กรุ๊ปสังกัด", branch_code: "สังกัด", department_code: "แผนก", division_code: "ฝ่าย", unit_code: "หน่วยงาน",
  position_family_code: "กลุ่มสายงาน", position_level_code: "ระดับตำแหน่ง", position_code: "ตำแหน่ง", job_code: "บทบาทงาน", salary_band_code: "Salary Band",
  employment_type_code: "ประเภทการจ้าง", employee_status_code: "สถานะพนักงาน", status: "สถานะข้อมูล", start_work_date: "วันที่เริ่มงาน (YYYY-MM-DD)", employee_code_type: "ประเภทการออกรหัส",
  base_salary: "เงินเดือนฐาน", salary_structure_code: "โครงสร้างเงินเดือน", payroll_company_code: "บริษัทเงินเดือน", payroll_type_code: "รอบจ่ายเงิน", payroll_group_code: "กลุ่มเงินเดือน", business_unit_code: "Business Unit", cost_center_code: "Cost Center", profit_center_code: "Profit Center",
};
const DESCENDANTS = {
  company_code: ["branch_code", "department_code", "division_code", "unit_code"],
  branch_group_code: ["branch_code", "department_code", "division_code", "unit_code"],
  branch_code: ["department_code", "division_code", "unit_code"],
  department_code: ["division_code", "unit_code"],
  division_code: ["unit_code"],
  position_family_code: ["position_level_code", "position_code", "salary_band_code"],
  position_level_code: ["salary_band_code"],
};
const REQ = new Set(["first_name_th", "last_name_th", "company_code", "branch_code", "department_code", "position_family_code", "position_level_code", "position_code", "employment_type_code", "employee_status_code", "status", "start_work_date", "salary_band_code", "base_salary"]);

export default function EmployeeMigrationMappingModal({ open, row, options = {}, relations = {}, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const values = Form.useWatch([], form) || {};

  useEffect(() => {
    if (open && row) {
      form.resetFields();
      form.setFieldsValue(row.mapping || {});
    }
  }, [open, row, form]);

  const index = useMemo(() => Object.fromEntries(Object.entries(options).map(([key, arr]) => [key, new Map((arr || []).map(o => [String(o.value), o]))])), [options]);
  const get = (key) => index[key]?.get(String(values[key] ?? ""));

  function selectOptions(key) {
    const all = options[key] || [];
    if (key === "branch_code") {
      const company = get("company_code")?.id;
      const branchGroup = get("branch_group_code")?.id;
      return all.filter(o => (!company || o.company_id === company) && (!branchGroup || !o.branch_group_id || o.branch_group_id === branchGroup));
    }
    if (key === "department_code") {
      const branch = get("branch_code")?.id;
      if (!branch) return [];
      const allowed = new Set((relations.branchDepartments || []).filter(r => r.branch_id === branch).map(r => r.department_id));
      return all.filter(o => allowed.has(o.id));
    }
    if (key === "division_code") {
      const department = get("department_code")?.id;
      return department ? all.filter(o => o.department_id === department) : [];
    }
    if (key === "unit_code") {
      const division = get("division_code")?.id;
      return division ? all.filter(o => o.division_id === division) : [];
    }
    if (key === "position_level_code") {
      const family = get("position_family_code")?.id;
      if (!family) return [];
      const allowed = new Set((relations.familyLevels || []).filter(r => r.position_family_id === family).map(r => r.position_level_id));
      return all.filter(o => allowed.has(o.id));
    }
    if (key === "position_code") {
      const family = get("position_family_code")?.id;
      return family ? all.filter(o => o.position_family_id === family) : [];
    }
    if (key === "salary_band_code") {
      const level = get("position_level_code")?.id;
      return level ? all.filter(o => o.position_level_id === level) : [];
    }
    return all;
  }

  function onMasterChange(key, value) {
    const patch = { [key]: value };
    for (const child of DESCENDANTS[key] || []) patch[child] = undefined;
    form.setFieldsValue(patch);
  }

  const save = async () => {
    try {
      const data = await form.validateFields();
      setSaving(true);
      await onSave(row.id, data);
    } catch (error) {
      if (!error?.errorFields) Modal.error({ title: "บันทึก Mapping ไม่สำเร็จ", content: error?.message || "กรุณาลองใหม่" });
    } finally {
      setSaving(false);
    }
  };

  function renderField(key) {
    if (["first_name_th", "last_name_th", "nickname_th", "start_work_date"].includes(key)) return <Input placeholder={key === "start_work_date" ? "YYYY-MM-DD" : undefined} />;
    if (key === "base_salary") return <InputNumber style={{ width: "100%" }} min={0} precision={2} />;
    if (key === "employee_code_type") return <Select allowClear showSearch options={["executive", "thai", "non_b", "myanmar", "parttime"].map(v => ({ value: v, label: v }))} />;
    if (key === "status") return <Select allowClear options={["active", "inactive", "resigned"].map(v => ({ value: v, label: v }))} />;
    const arr = selectOptions(key);
    const disabled = (key === "branch_code" && !get("company_code")) ||
      (key === "department_code" && !get("branch_code")) ||
      (key === "division_code" && !get("department_code")) ||
      (key === "unit_code" && !get("division_code")) ||
      (["position_level_code", "position_code"].includes(key) && !get("position_family_code")) ||
      (key === "salary_band_code" && !get("position_level_code"));
    return <Select allowClear showSearch optionFilterProp="label" placeholder={`เลือก${LABELS[key]}`} disabled={disabled} options={arr} onChange={v => onMasterChange(key, v)} />;
  }

  return <Modal title={`Mapping พนักงานเดิม ${row?.employee_code || ""}`} open={open} width={930} onCancel={onCancel} onOk={save} okText="บันทึก Mapping (Draft)" confirmLoading={saving} destroyOnHidden>
    <Alert type="info" showIcon title="เลือกจาก Master HRMS จริง แล้วบันทึก Draft ก่อนยืนยัน Import" description="ยังไม่สร้างพนักงานและยังไม่ออกรหัส HRMS ใหม่" style={{ marginBottom: 16 }} />
    <Form form={form} layout="vertical">
      {GROUPS.map(([title, keys]) => <section key={title}>
        <Divider titlePlacement="left">{title}</Divider>
        <Row gutter={12}>{keys.map(key => <Col xs={24} md={12} key={key}>
          <Form.Item name={key} label={LABELS[key]} rules={REQ.has(key) ? [{ required: true, message: `กรุณาระบุ${LABELS[key]}` }] : []}>
            {renderField(key)}
          </Form.Item>
        </Col>)}</Row>
      </section>)}
    </Form>
  </Modal>;
}
