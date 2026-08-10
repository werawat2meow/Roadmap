"use client";

import {
  Modal,
} from "antd";

import PortalMenuItemForm from "./PortalMenuItemForm";

/* =========================================================
   Helper
========================================================= */

function getTitle(mode) {
  switch (mode) {
    case "create":
      return "เพิ่ม Menu Item";

    case "edit":
      return "แก้ไข Menu Item";

    case "view":
      return "รายละเอียด Menu Item";

    default:
      return "Menu Item";
  }
}

/* =========================================================
   Component
========================================================= */

export default function PortalMenuItemModal({
  open = false,

  mode = "create",

  form,

  saving = false,

  systems = [],

  groups = [],

  parentItems = [],

  onSystemChange,

  onGroupChange,

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
      width={1000}
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
      <PortalMenuItemForm
        form={form}
        systems={systems}
        groups={groups}
        parentItems={
          parentItems
        }
        disabled={isView}
        saving={saving}
        onSystemChange={
          onSystemChange
        }
        onGroupChange={
          onGroupChange
        }
        onFinish={onSubmit}
      />
    </Modal>
  );
}