"use client";

import {
  Modal,
} from "antd";

import ForeignWorkerDocumentTypeForm from "./ForeignWorkerDocumentTypeForm";

export default function ForeignWorkerDocumentTypeModal({
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
      ? "ดูประเภทเอกสารแรงงานต่างชาติ"
      : isEdit
        ? "แก้ไขประเภทเอกสารแรงงานต่างชาติ"
        : "เพิ่มประเภทเอกสารแรงงานต่างชาติ";

  return (
    <Modal
      open={open}
      title={title}
      width={920}
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
      <ForeignWorkerDocumentTypeForm
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
