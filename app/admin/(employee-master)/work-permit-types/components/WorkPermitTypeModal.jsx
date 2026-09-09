"use client";

import {
  Modal,
} from "antd";

import WorkPermitTypeForm from "./WorkPermitTypeForm";

export default function WorkPermitTypeModal({
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
      ? "ดูประเภทใบอนุญาตทำงาน"
      : isEdit
        ? "แก้ไขประเภทใบอนุญาตทำงาน"
        : "เพิ่มประเภทใบอนุญาตทำงาน";

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
      <WorkPermitTypeForm
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
