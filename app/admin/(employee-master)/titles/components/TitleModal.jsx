"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import TitleForm from "./TitleForm";

export default function TitleModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดคำนำหน้า"
    : editing
    ? "แก้ไขคำนำหน้า"
    : "เพิ่มคำนำหน้า";

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
      <TitleForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}