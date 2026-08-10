"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import TaxProfileForm from "./TaxProfileForm";

export default function TaxProfileModal({
  open,
  title,
  form,
  companies = [],
  saving = false,
  disabled = false,
  onSubmit,
  onCancel,
  onFinish,
}) {
  return (
    <MasterModal
      open={open}
      title={title}
      width={1000}
      saving={saving}
      okText={
        disabled ? "ปิด" : "บันทึก"
      }
      cancelText={
        disabled ? null : "ยกเลิก"
      }
      onSubmit={
        disabled
          ? onCancel
          : onSubmit
      }
      onCancel={onCancel}
      destroyOnHidden
    >
      <TaxProfileForm
        form={form}
        companies={companies}
        disabled={disabled}
        onFinish={onFinish}
      />
    </MasterModal>
  );
}