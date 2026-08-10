"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import BankForm from "./BankForm";

export default function BankModal({
  open,
  mode = "add",
  form,
  saving = false,
  onSubmit,
  onCancel,
}) {
  const isView = mode === "view";

  const titleMap = {
    add: "เพิ่มธนาคาร",
    edit: "แก้ไขธนาคาร",
    view: "รายละเอียดธนาคาร",
  };

  return (
    <MasterModal
      open={open}
      title={titleMap[mode]}
      width={1000}
      saving={saving}
      okText={
        isView
          ? undefined
          : mode === "add"
          ? "บันทึก"
          : "บันทึกการแก้ไข"
      }
      cancelText={isView ? "ปิด" : "ยกเลิก"}
      onSubmit={() => form.submit()}
      onCancel={onCancel}
    >
      <BankForm
        form={form}
        disabled={isView}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}