"use client";

import PayrollGroupForm from "./PayrollGroupForm";
import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
export default function PayrollGroupModal({
  open,
  title = "กลุ่มเงินเดือน",
  form,
  payrollCompanies = [],
  saving = false,
  disabled = false,
  onCancel,
  onSubmit,
  onFinish,
}) {
  return (
    <MasterModal
      open={open}
      title={title}
      width={900}
      saving={saving}
      okText="บันทึก"
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <PayrollGroupForm
        form={form}
        payrollCompanies={payrollCompanies}
        disabled={disabled}
        onFinish={onFinish} 
      />
    </MasterModal>
  );
}