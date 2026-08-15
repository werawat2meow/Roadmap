"use client";

import { useEffect, useMemo } from "react";
import {
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from "antd";

import { buildFilteredOptions } from "./OrgStructureFilter";

export default function OrgPositionSlotModal({
  open,
  mode = "create",
  slot = null,
  seed = {},
  options = {},
  slots = [],
  saving = false,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const companyId = Form.useWatch("company_id", form);
  const branchGroupId = Form.useWatch("branch_group_id", form);
  const branchId = Form.useWatch("branch_id", form);
  const departmentId = Form.useWatch("department_id", form);
  const divisionId = Form.useWatch("division_id", form);
  const unitId = Form.useWatch("unit_id", form);

  const formFilters = {
    company_id: companyId || "",
    branch_group_id: branchGroupId || "",
    branch_id: branchId || "",
    department_id: departmentId || "",
    division_id: divisionId || "",
    unit_id: unitId || "",
  };

  const filtered = buildFilteredOptions(options, formFilters);

  const parentOptions = useMemo(() => {
    const child = formFilters;

    return (slots || [])
      .filter((item) => item?.id && item.id !== slot?.id)
      .filter((parent) => canParentContain(parent, child))
      .map((item) => ({
        value: item.id,
        label: `${item.slot_code} - ${item.positions?.position_name || item.slot_name || "-"}`,
      }));
  }, [slots, slot?.id, companyId, branchGroupId, branchId, departmentId, divisionId, unitId]);

  useEffect(() => {
    if (!open) return;

    const source = mode === "edit" && slot ? slot : seed;

    form.setFieldsValue({
      slot_code: source?.slot_code || "",
      slot_name: source?.slot_name || "",
      company_id: source?.company_id || "",
      branch_group_id: source?.branch_group_id || undefined,
      branch_id: source?.branch_id || undefined,
      department_id: source?.department_id || undefined,
      division_id: source?.division_id || undefined,
      unit_id: source?.unit_id || undefined,
      position_id: source?.position_id || undefined,
      parent_slot_id: source?.parent_slot_id || undefined,
      slot_type: source?.slot_type || "normal",
      employment_capacity: Number(source?.employment_capacity || 1),
      sort_order: Number(source?.sort_order || 0),
      status: source?.status || "active",
      effective_from: source?.effective_from || getBangkokToday(),
      effective_to: source?.effective_to || "",
    });
  }, [open, mode, slot, seed, form]);

  const handleOk = async () => {
    const values = await form.validateFields();

    await onSubmit?.({
      ...values,
      branch_group_id: values.branch_group_id || null,
      branch_id: values.branch_id || null,
      department_id: values.department_id || null,
      division_id: values.division_id || null,
      unit_id: values.unit_id || null,
      parent_slot_id: values.parent_slot_id || null,
      effective_to: values.effective_to || null,
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "edit" ? "แก้ไข Position Slot" : "เพิ่ม Position Slot"}
      okText={mode === "edit" ? "บันทึกการแก้ไข" : "เพิ่ม Position Slot"}
      cancelText="ยกเลิก"
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnHidden
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", paddingTop: 8 } }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} md={10}>
            <Form.Item
              label="รหัส Slot"
              name="slot_code"
              rules={[{ required: true, message: "กรุณาระบุรหัส Slot" }]}
            >
              <Input placeholder="เช่น ACC-MGR-01" />
            </Form.Item>
          </Col>

          <Col xs={24} md={14}>
            <Form.Item label="ชื่อ Slot" name="slot_name">
              <Input placeholder="ชื่อเรียกเพิ่มเติม (ถ้ามี)" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="บริษัท"
              name="company_id"
              rules={[{ required: true, message: "กรุณาเลือกบริษัท" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="เลือกบริษัท"
                options={filtered.companies}
                onChange={() => {
                  form.setFieldsValue({
                    branch_group_id: undefined,
                    branch_id: undefined,
                    department_id: undefined,
                    division_id: undefined,
                    unit_id: undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="กลุ่มสังกัด" name="branch_group_id">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="เลือกกลุ่มสังกัด"
                options={filtered.branchGroups}
                onChange={() => {
                  form.setFieldsValue({
                    branch_id: undefined,
                    department_id: undefined,
                    division_id: undefined,
                    unit_id: undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="สังกัด / สาขา" name="branch_id">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="เลือกสังกัด / สาขา"
                options={filtered.branches}
                onChange={() => {
                  form.setFieldsValue({
                    department_id: undefined,
                    division_id: undefined,
                    unit_id: undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="แผนก" name="department_id">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="เลือกแผนก"
                options={filtered.departments}
                onChange={() => {
                  form.setFieldsValue({
                    division_id: undefined,
                    unit_id: undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="ฝ่าย" name="division_id">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="เลือกฝ่าย"
                options={filtered.divisions}
                onChange={() => {
                  form.setFieldsValue({ unit_id: undefined });
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="หน่วย" name="unit_id">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="เลือกหน่วย"
                options={filtered.units}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="ตำแหน่ง"
              name="position_id"
              rules={[{ required: true, message: "กรุณาเลือกตำแหน่ง" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="เลือกตำแหน่ง"
                options={(options.positions || []).map((item) => ({
                  value: item.id,
                  label: `${item.position_code || ""} - ${item.position_name || "-"}`,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Parent Slot" name="parent_slot_id">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Root Slot ไม่ต้องเลือก Parent"
                options={parentOptions}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="ประเภท Slot" name="slot_type">
              <Select
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "manager", label: "Manager" },
                  { value: "supervisor", label: "Supervisor" },
                  { value: "planned", label: "Planned" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Capacity" name="employment_capacity">
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="ลำดับ" name="sort_order">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="สถานะ" name="status">
              <Select
                options={[
                  { value: "active", label: "ใช้งาน" },
                  { value: "inactive", label: "ยกเลิก" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="มีผลตั้งแต่"
              name="effective_from"
              rules={[{ required: true, message: "กรุณาระบุวันที่เริ่มต้น" }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="สิ้นสุด" name="effective_to">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

function canParentContain(parent, child) {
  const fields = [
    "company_id",
    "branch_group_id",
    "branch_id",
    "department_id",
    "division_id",
    "unit_id",
  ];

  return fields.every((field) => {
    if (!parent?.[field]) return true;
    return String(parent[field]) === String(child?.[field] || "");
  });
}

function getBangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
