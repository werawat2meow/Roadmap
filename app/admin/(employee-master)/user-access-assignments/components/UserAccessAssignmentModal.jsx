"use client";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import UserAccessAssignmentForm from "./UserAccessAssignmentForm";

/* =========================================================
   Helpers
========================================================= */

function getModalTitle(mode) {
  switch (mode) {
    case "create":
      return "เพิ่มบทบาทผู้ใช้งาน";

    case "edit":
      return "แก้ไขบทบาทผู้ใช้งาน";

    case "view":
      return "รายละเอียดบทบาทผู้ใช้งาน";

    default:
      return "บทบาทผู้ใช้งาน";
  }
}

/* =========================================================
   Component
========================================================= */

export default function UserAccessAssignmentModal({
  open = false,

  mode = "create",

  form,

  saving = false,

  masterLoading = false,

  userAccounts = [],

  roles = [],

  companies = [],

  branchGroups = [],

  branches = [],

  departments = [],

  divisions = [],

  units = [],

  onCancel,

  onSubmit,
}) {
  const isView =
    mode === "view";

  return (
    <MasterModal
      open={open}
      width={1100}
      saving={saving}
      title={getModalTitle(mode)}
      okText={
        isView
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={
        isView
          ? onCancel
          : onSubmit
      }
    >
      <UserAccessAssignmentForm
        form={form}
        disabled={isView}
        masterLoading={
          masterLoading
        }
        userAccounts={
          userAccounts
        }
        roles={roles}
        companies={companies}
        branchGroups={
          branchGroups
        }
        branches={branches}
        departments={
          departments
        }
        divisions={divisions}
        units={units}
      />
    </MasterModal>
  );
}