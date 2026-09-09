"use client";

import { Modal } from "antd";

import ForeignEmploymentSchemeForm from "./ForeignEmploymentSchemeForm";

export default function ForeignEmploymentSchemeModal({
  open = false,
  mode = "create",
  form,
  companies = [],
  companyLoading = false,
  saving = false,
  onCancel,
  onSubmit,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const title = isView
    ? "ดูรูปแบบการจ้างพนักงานต่างชาติ"
    : isEdit
      ? "แก้ไขรูปแบบการจ้างพนักงานต่างชาติ"
      : "เพิ่มรูปแบบการจ้างพนักงานต่างชาติ";

  return (
    <Modal
      open={open}
      title={title}
      width={900}
      destroyOnHidden
      confirmLoading={saving}
      okText={
        isEdit ? "บันทึก" : "เพิ่มข้อมูล"
      }
      cancelText={
        isView ? "ปิด" : "ยกเลิก"
      }
      onCancel={onCancel}
      onOk={
        isView
          ? onCancel
          : () => form.submit()
      }
      okButtonProps={
        isView
          ? {
              style: {
                display: "none",
              },
            }
          : undefined
      }
    >
      <ForeignEmploymentSchemeForm
        form={form}
        companies={companies}
        companyLoading={companyLoading}
        mode={mode}
        saving={saving}
        onFinish={onSubmit}
      />
    </Modal>
  );
}
