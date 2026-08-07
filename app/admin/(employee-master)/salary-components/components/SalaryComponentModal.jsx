"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import SalaryComponentForm from "./SalaryComponentForm";

export default function SalaryComponentModal({
  open,

  title = "รายการเงินเดือน",

  form,

  saving = false,

  disabled = false,

  onCancel,

  onSubmit,
}) {
  return (
    <MasterModal
      open={open}
      title={title}
      width={900}
      saving={saving}
      destroyOnHidden
      okText="บันทึก"
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <SalaryComponentForm
        form={form}
        disabled={disabled}
      />
    </MasterModal>
  );
}