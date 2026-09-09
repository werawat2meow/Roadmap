"use client";

import {
  Modal,
} from "antd";

import VisaTypeForm from "./VisaTypeForm";

export default function VisaTypeModal({
  open = false,
  mode = "create",
  form,
  companies = [],
  companyLoading = false,
  saving = false,
  onCancel,
  onSubmit,
}) {
  const isView =
    mode === "view";

  const isEdit =
    mode === "edit";

  const title =
    isView
      ? "ดูประเภทวีซ่า"
      : isEdit
        ? "แก้ไขประเภทวีซ่า"
        : "เพิ่มประเภทวีซ่า";

  return (
    <Modal
      open={open}
      title={title}
      width={900}
      destroyOnHidden
      confirmLoading={saving}
      okText={
        isEdit
          ? "บันทึก"
          : "เพิ่มข้อมูล"
      }
      cancelText={
        isView
          ? "ปิด"
          : "ยกเลิก"
      }
      onCancel={onCancel}
      onOk={
        isView
          ? onCancel
          : () =>
              form.submit()
      }
      okButtonProps={
        isView
          ? {
              style: {
                display:
                  "none",
              },
            }
          : undefined
      }
    >
      <VisaTypeForm
        form={form}
        companies={
          companies
        }
        companyLoading={
          companyLoading
        }
        mode={mode}
        saving={saving}
        onFinish={onSubmit}
      />
    </Modal>
  );
}
