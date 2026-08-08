"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import CountryForm from "./CountryForm";

export default function CountryModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const title = viewMode
    ? "รายละเอียดประเทศ"
    : editing
      ? "แก้ไขประเทศ"
      : "เพิ่มประเทศ";

  return (
    <MasterModal
      open={open}
      title={title}
      width={1000}
      saving={saving}
      onCancel={onCancel}
      onSubmit={() =>
        form.submit()
      }
    >
      <CountryForm
        form={form}
        disabled={viewMode}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}