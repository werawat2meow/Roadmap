"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import GenderForm from "./GenderForm";

export default function GenderModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดเพศ"
    : editing
      ? "แก้ไขข้อมูลเพศ"
      : "เพิ่มข้อมูลเพศ";

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
      <GenderForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}