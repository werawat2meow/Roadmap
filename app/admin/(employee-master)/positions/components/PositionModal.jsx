"use client";

import { Form, Modal } from "antd";
import { useEffect, useState } from "react";

import PositionForm from "./PositionForm";

export default function PositionModal({
    open,
    onCancel,
    onSubmit,
    initialValues,
    loading,
    families = [],
    jobs = [],
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,

        position_levels:
          initialValues.levels?.map(
            (item) => item.id
          ) || [],
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        status: "active",

        is_manager: false,

        is_executive: false,

        allow_multiple_assignment: false,
      });
    }
  }, [open, initialValues]);


  async function handleFinish() {
    try {
      const values = await form.validateFields();

      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (err) {
      console.error("POSITION_FORM_ERROR", err);
    }
  }

  return (
    <Modal
      open={open}
      width={900}
      destroyOnHidden
      mask={{
        closable: false,
      }}
      title={
        initialValues
          ? "แก้ไขตำแหน่ง"
          : "เพิ่มตำแหน่ง"
      }
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleFinish}
    >
      <PositionForm
        form={form}
        families={families}
        jobs={jobs}
        disabled={loading}
      />
    </Modal>
  );
}