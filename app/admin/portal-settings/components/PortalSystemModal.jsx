"use client";

import {
  Modal,
} from "antd";

import PortalSystemForm from "./PortalSystemForm";

/* =========================================================
   Helpers
========================================================= */

function getTitle(mode) {
  switch (mode) {
    case "create":
      return "เพิ่มระบบ Portal";

    case "edit":
      return "แก้ไขระบบ Portal";

    case "view":
      return "รายละเอียดระบบ Portal";

    default:
      return "ระบบ Portal";
  }
}

/* =========================================================
   Component
========================================================= */

export default function PortalSystemModal({
  open = false,

  mode = "create",

  form,

  saving = false,

  onCancel,

  onSubmit,
}) {
  const isView =
    mode === "view";

  const handleOk = () => {
    if (isView) {
      onCancel?.();
      return;
    }

    form?.submit();
  };

  return (
    <Modal
      open={open}
      width={850}
      title={getTitle(mode)}
      confirmLoading={saving}
      okText={
        isView
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      cancelButtonProps={{
        style: {
          display:
            isView
              ? "none"
              : undefined,
        },
      }}
      onCancel={onCancel}
      onOk={handleOk}
      forceRender
    >
      <PortalSystemForm
        form={form}
        disabled={isView}
        saving={saving}
        onFinish={onSubmit}
      />
    </Modal>
  );
}