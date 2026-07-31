"use client";

import { Modal } from "antd";
import { useEffect } from "react";

import CareerPathForm from "./CareerPathForm";

export default function CareerPathModal({
  open,
  form,
  loading = false,
  editingItem = null,
  families = [],
  onSubmit,
  onCancel,
}) {
  
  useEffect(() => {
  if (!open) return;

  if (editingItem) {
    form.setFieldsValue({
      path_code: editingItem.path_code,
      path_name: editingItem.path_name,
      position_family_id: editingItem.position_family_id,
      description: editingItem.description,
      sort_order: editingItem.sort_order,
      is_active: editingItem.is_active,
    });
  } else {
    form.setFieldsValue({
      path_code: "",
      path_name: "",
      position_family_id: undefined,
      description: "",
      sort_order: 0,
      is_active: true,
    });
  }
}, [open, editingItem, form]);

  const handleOk = async () => {
    try {
      const values =
        await form.validateFields();

      onSubmit(values);
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      open={open}
      destroyOnHidden
      mask={{ closable: false }}
      centered
      width={800}
      confirmLoading={loading}
      okText={
        editingItem
          ? "บันทึก"
          : "สร้าง"
      }
      cancelText="ยกเลิก"
      title={
        editingItem
          ? "แก้ไข Career Path"
          : "เพิ่ม Career Path"
      }
      onCancel={onCancel}
      onOk={handleOk}
    >
      <CareerPathForm
        form={form}
        families={families}
      />
    </Modal>
  );
}