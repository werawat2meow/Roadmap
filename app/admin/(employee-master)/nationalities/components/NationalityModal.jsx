"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import NationalityForm from "./NationalityForm";

export default function NationalityModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดสัญชาติ"
    : editing
      ? "แก้ไขสัญชาติ"
      : "เพิ่มสัญชาติ";

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
      <NationalityForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}