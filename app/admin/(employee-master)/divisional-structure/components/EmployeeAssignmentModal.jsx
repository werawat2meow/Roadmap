"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Switch,
} from "antd";

export default function EmployeeAssignmentModal({
  open,
  slot = null,
  assignment = null,
  employees = [],
  loadEmployees,
  saving = false,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const isEdit = Boolean(assignment?.id);
  const isPrimary = Form.useWatch("is_primary", form);
  const [remoteEmployees, setRemoteEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const employeeOptions = useMemo(() => {
    const sourceEmployees = remoteEmployees.length ? remoteEmployees : employees;
    const rows = (sourceEmployees || []).filter((employee) => {
      if (!slot) return false;

      const sameLineage = [
        "company_id",
        "branch_group_id",
        "branch_id",
        "department_id",
        "division_id",
        "unit_id",
      ].every((field) => {
        if (!slot?.[field]) return true;
        return String(employee?.[field] || "") === String(slot[field]);
      });

      if (!sameLineage) return false;

      if (isPrimary && slot.position_id) {
        return String(employee.position_id || "") === String(slot.position_id);
      }

      return true;
    });

    return rows.map((employee) => ({
      value: employee.id,
      label: `${employee.employee_code || ""} - ${getEmployeeName(employee)}`,
    }));
  }, [employees, remoteEmployees, slot, isPrimary]);


  const refreshEmployees = async (search = "") => {
    if (!loadEmployees || !slot) return;

    try {
      setEmployeeLoading(true);
      const rows = await loadEmployees({
        slot,
        search,
        isPrimary: Boolean(isPrimary),
      });
      setRemoteEmployees(Array.isArray(rows) ? rows : []);
    } finally {
      setEmployeeLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      employee_id: assignment?.employee_id || undefined,
      assignment_type: assignment?.assignment_type || "primary",
      is_primary:
        assignment?.is_primary === undefined
          ? true
          : Boolean(assignment.is_primary),
      effective_from: assignment?.effective_from || getBangkokToday(),
      effective_to: assignment?.effective_to || "",
      status: assignment?.status || "active",
    });
    refreshEmployees("");
  }, [open, assignment, form, slot]);

  useEffect(() => {
    if (!open) return;
    refreshEmployees("");
  }, [isPrimary]);

  const handleOk = async () => {
    const values = await form.validateFields();

    await onSubmit?.({
      ...values,
      position_slot_id: slot?.id,
      effective_to: values.effective_to || null,
    });
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "แก้ไขการครอง Position Slot" : "กำหนดพนักงานเข้า Position Slot"}
      okText={isEdit ? "บันทึกการแก้ไข" : "กำหนดพนักงาน"}
      cancelText="ยกเลิก"
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        title={`${slot?.slot_code || "-"} · ${slot?.positions?.position_name || "-"}`}
        description="Primary Assignment จะแสดงเฉพาะพนักงานที่อยู่ในสายโครงสร้างและ Position ตรงกับ Slot เท่านั้น"
      />

      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label="พนักงาน"
              name="employee_id"
              rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="พิมพ์รหัสหรือชื่อพนักงาน"
                options={employeeOptions}
                loading={employeeLoading}
                filterOption={false}
                onSearch={(value) => refreshEmployees(value)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="ประเภท Assignment" name="assignment_type">
              <Select
                options={[
                  { value: "primary", label: "Primary" },
                  { value: "acting", label: "Acting / รักษาการ" },
                  { value: "secondary", label: "Secondary" },
                  { value: "temporary", label: "Temporary" },
                ]}
                onChange={(value) => {
                  if (value === "primary") {
                    form.setFieldValue("is_primary", true);
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Primary Assignment"
              name="is_primary"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="มีผลตั้งแต่"
              name="effective_from"
              rules={[{ required: true, message: "กรุณาระบุวันที่เริ่มต้น" }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="สิ้นสุด" name="effective_to">
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="สถานะ" name="status">
              <Select
                options={[
                  { value: "active", label: "ใช้งาน" },
                  { value: "inactive", label: "ยกเลิก" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

function getEmployeeName(employee) {
  return (
    [employee?.first_name_th, employee?.last_name_th]
      .filter(Boolean)
      .join(" ") ||
    [employee?.first_name_en, employee?.last_name_en]
      .filter(Boolean)
      .join(" ") ||
    "-"
  );
}

function getBangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
