"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import PaymentMethodForm from "./PaymentMethodForm";

export default function PaymentMethodModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดวิธีการจ่ายเงิน"
    : editing
      ? "แก้ไขวิธีการจ่ายเงิน"
      : "เพิ่มวิธีการจ่ายเงิน";

  return (
    <MasterModal
      open={open}
      title={title}
      width={900}
      saving={saving}
      onCancel={onCancel}
      onSubmit={() => form.submit()}
    >
      <PaymentMethodForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}