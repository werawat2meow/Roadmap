"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import RoleForm from "./RoleForm";

/* =========================================================
   Helpers
========================================================= */

function getModalTitle(mode) {
  switch (mode) {
    case "create":
      return "เพิ่ม Role และ Permissions";

    case "edit":
      return "แก้ไข Role และ Permissions";

    case "view":
      return "รายละเอียด Role และ Permissions";

    default:
      return "Role และ Permissions";
  }
}

/* =========================================================
   Component
========================================================= */

export default function RoleModal({
  open = false,

  mode = "create",

  form,

  saving = false,

  permissionLoading = false,

  permissions = [],

  onCancel,

  onSubmit,
}) {
  const isView =
    mode === "view";

  const handleSubmit = () => {
    if (isView) {
      onCancel?.();
      return;
    }

    form?.submit();
  };

  return (
    <MasterModal
      open={open}
      width={1200}
      saving={saving}
      title={getModalTitle(mode)}
      okText={
        isView
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <RoleForm
        form={form}
        mode={mode}
        disabled={isView}
        saving={saving}
        permissionLoading={
          permissionLoading
        }
        permissions={permissions}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}