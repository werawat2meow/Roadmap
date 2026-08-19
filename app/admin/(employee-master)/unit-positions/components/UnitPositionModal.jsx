"use client";

import { Alert, Form, Modal } from "antd";

import UnitPositionForm from "./UnitPositionForm";

export default function UnitPositionModal({
  open,
  editingRow,
  saving = false,
  initialValues = {},
  options = {},
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const handleFinish = async () => {
    const values = await form.validateFields();
    await onSubmit?.(values);
  };

  return (
    <Modal
      open={open}
      width={920}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={saving}
      title={editingRow ? "แก้ไข Workforce Plan" : "เพิ่ม Workforce Plan"}
      okText={editingRow ? "บันทึกการแก้ไข" : "เพิ่มแผนอัตรากำลัง"}
      cancelText="ยกเลิก"
      onCancel={() => {
        form.resetFields();
        onCancel?.();
      }}
      onOk={handleFinish}
      afterOpenChange={(opened) => {
        if (!opened) return;

        form.resetFields();
        form.setFieldsValue({
          company_id: initialValues.company_id || undefined,
          branch_group_id: initialValues.branch_group_id || undefined,
          branch_id: initialValues.branch_id || undefined,
          department_id: initialValues.department_id || undefined,
          division_id: initialValues.division_id || undefined,
          unit_id: initialValues.unit_id || undefined,
          position_id: initialValues.position_id || undefined,
          headcount_target: initialValues.headcount_target ?? 0,
          status: initialValues.status || "active",
        });
      }}
    >
      <Alert
        className="mb-4"
        type="info"
        showIcon
        title="Workforce Planning"
        description="กำหนด Target Headcount ตามสาย Company → Branch Group → Branch → Department → Division → Unit → Position โดยระบบจะเก็บจริงใน unit_positions เป็น branch_id + unit_id + position_id + headcount_target"
      />

      <UnitPositionForm
        form={form}
        options={options}
        editingRow={editingRow}
        disabled={saving}
      />
    </Modal>
  );
}
