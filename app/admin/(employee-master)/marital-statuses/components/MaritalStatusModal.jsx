"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import MaritalStatusForm from "./MaritalStatusForm";

export default function MaritalStatusModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดสถานภาพสมรส"
    : editing
      ? "แก้ไขสถานภาพสมรส"
      : "เพิ่ม";

  return (
    <MasterModal
      open={open}
      title={title}
      width={900}
      saving={saving}
      onCancel={onCancel}
      onSubmit={() =>
        form.submit()
      }
    >
      <MaritalStatusForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}