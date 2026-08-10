"use client";

import {
  Modal,
} from "antd";

import PortalMenuGroupForm from "./PortalMenuGroupForm";

function getTitle(mode) {
  switch (mode) {
    case "create":
      return "เพิ่ม Menu Group";

    case "edit":
      return "แก้ไข Menu Group";

    case "view":
      return "รายละเอียด Menu Group";

    default:
      return "Menu Group";
  }
}

export default function PortalMenuGroupModal({
  open = false,
  mode = "create",
  form,
  saving = false,
  systems = [],
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
      width={760}
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
      <PortalMenuGroupForm
        form={form}
        systems={systems}
        disabled={isView}
        saving={saving}
        onFinish={onSubmit}
      />
    </Modal>
  );
}