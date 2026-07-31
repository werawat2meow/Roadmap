"use client";

import { Modal, Form } from "antd";

import UnitPositionForm from "./UnitPositionForm";

export default function UnitPositionModal({
  open,
  editingRow,

  saving = false,

  initialValues = {},

  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const handleFinish = async () => {
    const values =
      await form.validateFields();

    await onSubmit(values);
  };

  return (
    <Modal
      open={open}
      width={700}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={saving}
      title={
        editingRow
          ? "แก้ไขตำแหน่งตามหน่วย"
          : "เพิ่มตำแหน่งตามหน่วย"
      }
      okText={
        editingRow
          ? "Update"
          : "Save"
      }
      cancelText="Cancel"
      onCancel={() => {
        form.resetFields();
        onCancel?.();
      }}
      onOk={handleFinish}
      afterOpenChange={(opened) => {
        if (!opened) return;

        form.resetFields();

        form.setFieldsValue({
          unit_id:
            initialValues.unit_id ??
            "",

          position_id:
            initialValues.position_id ??
            "",

          headcount_target:
            initialValues.headcount_target ??
            0,

          status:
            initialValues.status ??
            "active",
        });
      }}
    >
      <UnitPositionForm
        form={form}
        disabled={saving}
      />
    </Modal>
  );
}