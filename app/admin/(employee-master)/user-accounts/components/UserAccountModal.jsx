"use client";

import { Button, Modal } from "antd";

import UserAccountForm from "./UserAccountForm";

export default function UserAccountModal({
  open = false,
  form,
  editing = null,
  viewMode = false,
  saving = false,

  employeeOptions = [],
  employeeLoading = false,
  onEmployeeSearch,
  onEmployeePopupScroll,

  roleOptions = [],
  roleLoading = false,
  onRoleSearch,

  onCancel,
  onSubmit,
}) {
  const mode = viewMode
    ? "view"
    : editing
      ? "edit"
      : "create";

  const title = viewMode
    ? "รายละเอียดบัญชีผู้ใช้งาน"
    : editing
      ? "แก้ไขบัญชีผู้ใช้งาน"
      : "เพิ่มบัญชีผู้ใช้งาน";

  return (
    <Modal
      open={open}
      title={title}
      width={760}
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editing ? "บันทึก" : "เพิ่มผู้ใช้งาน"}
      cancelText="ยกเลิก"
      footer={
        viewMode
          ? [
              <Button
                key="close"
                onClick={onCancel}
              >
                ปิด
              </Button>,
            ]
          : undefined
      }
    >
      <UserAccountForm
        form={form}
        mode={mode}
        disabled={viewMode || saving}
        employeeOptions={employeeOptions}
        employeeLoading={employeeLoading}
        onEmployeeSearch={onEmployeeSearch}
        onEmployeePopupScroll={
          onEmployeePopupScroll
        }
        roleOptions={roleOptions}
        roleLoading={roleLoading}
        onRoleSearch={onRoleSearch}
        onFinish={onSubmit}
      />
    </Modal>
  );
}
