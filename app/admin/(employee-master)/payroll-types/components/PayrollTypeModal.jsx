"use client";

import { Modal } from "antd";

import PayrollTypeForm from "./PayrollTypeForm";

export default function PayrollTypeModal({
  open,
  editingPayrollType,

  form,

  saving = false,

  onCancel,
  onSave,
}) {
  return (
    <Modal
      open={open}
      title={
        editingPayrollType
          ? "แก้ไข Payroll Type"
          : "เพิ่ม Payroll Type"
      }
      width={900}
      mask={{ closable: !saving }}
      keyboard={!saving}
      okText={
        editingPayrollType
          ? "อัปเดต"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <PayrollTypeForm
        form={form}
        onFinish={onSave}
      />
    </Modal>
  );
}