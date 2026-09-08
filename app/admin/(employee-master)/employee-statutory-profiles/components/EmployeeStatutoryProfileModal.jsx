"use client";

import { Button, Form, Modal } from "antd";

import EmployeeStatutoryProfileForm from "./EmployeeStatutoryProfileForm";

export default function EmployeeStatutoryProfileModal({
  open = false,
  mode = "create",
  form,
  saving = false,
  employees = [],
  companies = [],
  employeeLoading = false,
  onEmployeeSearch,
  onEmployeePopupScroll,
  onCancel,
  onSave,
}) {
  const viewMode = mode === "view";
  const title =
    mode === "view"
      ? "รายละเอียดภาษีและประกันสังคมพนักงาน"
      : mode === "edit"
        ? "แก้ไขภาษีและประกันสังคมพนักงาน"
        : "เพิ่มภาษีและประกันสังคมพนักงาน";

  return (
    <Modal
      open={open}
      title={title}
      onCancel={saving ? undefined : onCancel}
      width={980}
      forceRender
      mask={{ closable: !saving }}
      footer={
        viewMode
          ? [
              <Button key="close" onClick={onCancel}>
                ปิด
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel} disabled={saving}>
                ยกเลิก
              </Button>,
              <Button key="save" type="primary" loading={saving} onClick={onSave}>
                บันทึก
              </Button>,
            ]
      }
    >
      <Form form={form} layout="vertical" disabled={viewMode || saving}>
        <EmployeeStatutoryProfileForm
          form={form}
          disabled={viewMode || saving}
          employees={employees}
          companies={companies}
          employeeLoading={employeeLoading}
          onEmployeeSearch={onEmployeeSearch}
          onEmployeePopupScroll={onEmployeePopupScroll}
        />
      </Form>
    </Modal>
  );
}
