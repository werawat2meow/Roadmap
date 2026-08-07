"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import {
  swalSuccess,
  swalError,
} from "@/app/components/Swal";

const statusOptions = [
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Inactive",
    value: "inactive",
  },
];

export default function CompetencyTypeModal({
  open,
  item,
  onCancel,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [saving, setSaving] = useState(false);

  const editing = !!item;

  useEffect(() => {
    if (!open) return;

    if (editing) {
      form.setFieldsValue({
        type_code: item.type_code,
        type_name: item.type_name,
        description: item.description,
        status: item.status,
        sort_order: item.sort_order,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      status: "active",
      sort_order: 0,
    });
  }, [
    open,
    editing,
    item,
    form,
  ]);

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        type_code: values.type_code?.trim().toUpperCase(),
        type_name: values.type_name?.trim(),
        description: values.description?.trim() || null,
        status: values.status,
        sort_order: values.sort_order ?? 0,
      };

      const res = await fetch(
        editing
          ? `/api/admin/competency-types/${item.id}`
          : "/api/admin/competency-types",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            "บันทึก Competency Type ไม่สำเร็จ"
        );
      }

      await swalSuccess(
        editing
          ? "แก้ไข Competency Type สำเร็จ"
          : "เพิ่ม Competency Type สำเร็จ"
      );

      form.resetFields();

      onSuccess?.();

    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "บันทึก Competency Type ไม่สำเร็จ"
      );

    } finally {
      setSaving(false);
    }
  };
    return (
    <Modal
      title={
        editing
          ? "แก้ไข Competency Type"
          : "เพิ่ม Competency Type"
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={saving}
      destroyOnHidden
      width={700}
      mask={{
        closable: false,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Type Code"
          name="type_code"
          rules={[
            {
              required: true,
              message: "กรุณากรอก Type Code",
            },
          ]}
        >
          <Input
            maxLength={50}
            placeholder="เช่น CORE"
          />
        </Form.Item>

        <Form.Item
          label="Type Name"
          name="type_name"
          rules={[
            {
              required: true,
              message: "กรุณากรอก Type Name",
            },
          ]}
        >
          <Input
            maxLength={255}
            placeholder="เช่น Core Competency"
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea
            rows={4}
            placeholder="Description..."
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={statusOptions}
          />
        </Form.Item>

        <Form.Item
          label="Sort Order"
          name="sort_order"
        >
          <InputNumber
            className="w-full"
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}