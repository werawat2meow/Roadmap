"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, Input, Row, Col, Alert, Divider, Card, Radio, Typography, Space, Tag } from "antd";

const GROUPS = [
  ["ข้อมูลพื้นฐาน", ["first_name_th", "last_name_th", "nickname_th", "gender_code"]],
  ["โครงสร้างองค์กร", ["company_code", "branch_group_code", "branch_code", "department_code", "division_code", "unit_code"]],
  ["โครงสร้างตำแหน่ง (ไม่บังคับ)", ["position_family_code", "position_level_code", "position_code", "job_code"]],
  ["ข้อมูลการจ้างงาน", ["employment_type_code", "employee_status_code", "status", "start_work_date", "employee_code_type"]],
];
const LABELS = {
  first_name_th: "ชื่อ", last_name_th: "นามสกุล", nickname_th: "ชื่อเล่น", gender_code: "เพศ",
  company_code: "บริษัท", branch_group_code: "กรุ๊ปสังกัด", branch_code: "สังกัด", department_code: "แผนก", division_code: "ฝ่าย", unit_code: "หน่วยงาน",
  position_family_code: "กลุ่มสายงาน", position_level_code: "ระดับตำแหน่ง", position_code: "ตำแหน่ง", job_code: "บทบาทงาน",
  employment_type_code: "ประเภทการจ้าง", employee_status_code: "สถานะพนักงาน", status: "สถานะข้อมูล", start_work_date: "วันที่เริ่มงาน (YYYY-MM-DD)", employee_code_type: "ประเภทการออกรหัส",
};
const DESCENDANTS = {
  company_code: ["branch_code", "department_code", "division_code", "unit_code"],
  branch_group_code: ["branch_code", "department_code", "division_code", "unit_code"],
  branch_code: ["department_code", "division_code", "unit_code"],
  department_code: ["division_code", "unit_code"],
  division_code: ["unit_code"],
  position_family_code: ["position_level_code", "position_code"],
};
const REQ = new Set(["first_name_th", "last_name_th", "company_code", "branch_code", "department_code", "employment_type_code", "employee_status_code", "status", "start_work_date"]);

export default function EmployeeMigrationMappingModal({ open, row, options = {}, relations = {}, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const values = Form.useWatch([], form) || {};
  const strategy = Form.useWatch("code_strategy", form) || "GENERATE";
  const legacyCodesText = Form.useWatch("legacy_employee_codes", form) || "";
  const codes = [...new Set(String(legacyCodesText).split(/[;,\n|]+/).map(x=>x.trim()).filter(Boolean))];

  useEffect(() => {
    if (open && row) {
      form.resetFields();
      const mapped = row.mapping || {};
      const initialCodes = Array.isArray(mapped.legacy_employee_codes)
        ? mapped.legacy_employee_codes.join("; ")
        : (mapped.legacy_employee_codes || row.legacy_employee_codes || row.employee_code || "");
      form.setFieldsValue({
        ...mapped,
        legacy_employee_codes: initialCodes,
        code_strategy: mapped.code_strategy || row.code_strategy || "GENERATE",
        selected_primary_code: mapped.selected_primary_code || row.selected_primary_code || row.employee_code,
      });
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
      const oldCodes = [...new Set([row.employee_code, ...String(data.legacy_employee_codes || "").split(/[;,\n|]+/)].map(x=>String(x||"").trim()).filter(Boolean))];
      if (data.code_strategy === "KEEP_LEGACY" && !oldCodes.includes(data.selected_primary_code)) {
        throw new Error("กรุณาเลือกรหัสหลักจากรายการรหัสเก่าที่มีอยู่");
      }
      await onSave(row.id, { ...data, legacy_employee_codes: oldCodes });
    } catch (error) {
      if (!error?.errorFields) Modal.error({ title: "บันทึก Mapping ไม่สำเร็จ", content: error?.message || "กรุณาลองใหม่" });
    } finally {
      setSaving(false);
    }
  };

  function renderField(key) {
    if (["first_name_th", "last_name_th", "nickname_th", "start_work_date"].includes(key)) return <Input placeholder={key === "start_work_date" ? "YYYY-MM-DD" : undefined} />;
    if (key === "employee_code_type") return <Select allowClear showSearch options={["executive", "thai", "non_b", "myanmar", "parttime"].map(v => ({ value: v, label: v }))} />;
    if (key === "status") return <Select allowClear options={["active", "inactive", "resigned"].map(v => ({ value: v, label: v }))} />;
    const arr = selectOptions(key);
    const disabled = (key === "branch_code" && !get("company_code")) ||
      (key === "department_code" && !get("branch_code")) ||
      (key === "division_code" && !get("department_code")) ||
      (key === "unit_code" && !get("division_code")) ||
      (["position_level_code", "position_code"].includes(key) && !get("position_family_code"));
    return <Select allowClear showSearch optionFilterProp="label" placeholder={`เลือก${LABELS[key]}`} disabled={disabled} options={arr} onChange={v => onMasterChange(key, v)} />;
  }

  return <Modal title={`ตรวจสอบพนักงาน / รวมรหัสเก่า · แถว ${row?.row_no || ""}`} open={open} width={930} onCancel={onCancel} onOk={save} okText="บันทึก Mapping (Draft)" confirmLoading={saving} destroyOnHidden>
    <Alert type="info" showIcon title="เลือกจาก Master HRMS จริง แล้วบันทึก Draft ก่อนยืนยัน Import" description="ยังไม่สร้างพนักงานและยังไม่ออกรหัส HRMS ใหม่" style={{ marginBottom: 16 }} />
    <Form form={form} layout="vertical">
      <Card size="small" style={{borderRadius:14, marginBottom:16, borderColor:"#91caff"}} title="1. ตรวจรหัสเก่าของพนักงาน (หนึ่งคนต่อหนึ่งแถว)">
        <Alert type="warning" showIcon style={{marginBottom:12}}
          title="พนักงานคนเดียวมีรหัสเก่าหลายรหัสได้ แม้อยู่บริษัทเดียวกัน"
          description="กรุณารวมรหัสเก่าของคนเดียวกันในแถวนี้ หลัง Confirm ระบบจะบันทึกทุกรหัสลง employee_legacy_codes" />
        <Form.Item name="legacy_employee_codes" label="รหัสพนักงานเก่าทั้งหมด (คั่นด้วย ;)">
          <Input.TextArea autoSize={{minRows:2,maxRows:4}} placeholder="1; 35; 1058" />
        </Form.Item>
        <Space wrap style={{marginBottom:12}}>{codes.map(code=><Tag key={code}>{code}</Tag>)}</Space>
        <Form.Item name="person_reference" label="รหัสอ้างอิงบุคคล (ช่วยตรวจข้อมูลคนซ้ำ)" extra="ถ้ามีหลายแถวของบุคคลเดียวกัน ต้องรวมเป็นแถวเดียวก่อน Confirm">
          <Input placeholder="PERSON-001" maxLength={200} />
        </Form.Item>
        <Form.Item name="code_strategy" label="2. เลือกรหัสหลักที่จะใช้ใน HRMS" rules={[{required:true}]}>
          <Radio.Group>
            <Space orientation="vertical">
              <Radio value="GENERATE">สร้างรหัสพนักงาน HRMS ใหม่ผ่าน Running Number เดิม</Radio>
              <Radio value="KEEP_LEGACY">ใช้รหัสเดิมเป็นรหัสหลัก (ต้องตรวจไม่ให้ชนกับพนักงานอื่น)</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        {strategy === "KEEP_LEGACY" && <Form.Item name="selected_primary_code" label="เลือกรหัสเดิมเป็นรหัส HRMS หลัก" rules={[{required:true, message:"กรุณาเลือกรหัสหลัก"}]}>
          <Select options={codes.map(code=>({label:code,value:code}))} placeholder="เลือกรหัสหลัก" />
        </Form.Item>}
      </Card>
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
