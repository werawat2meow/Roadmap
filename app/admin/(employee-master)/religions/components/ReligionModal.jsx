"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import ReligionForm from "./ReligionForm";

export default function ReligionModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดศาสนา"
    : editing
      ? "แก้ไขศาสนา"
      : "เพิ่มศาสนา";

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
      <ReligionForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}