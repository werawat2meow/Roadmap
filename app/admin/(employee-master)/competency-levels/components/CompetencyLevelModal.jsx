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
  swalConfirm,
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

export default function CompetencyLevelModal({
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
        level_code: item.level_code,
        level_name: item.level_name,
        level_number: item.level_number,
        description: item.description,
        status: item.status,
        sort_order: item.sort_order,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      level_number: 1,
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
        level_code: values.level_code?.trim(),
        level_name: values.level_name?.trim(),
        level_number: values.level_number,
        description: values.description?.trim() || null,
        status: values.status,
        sort_order: values.sort_order ?? 0,
      };

      const res = await fetch(
        editing
          ? `/api/admin/competency-levels/${item.id}`
          : "/api/admin/competency-levels",
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
            "บันทึก Competency Level ไม่สำเร็จ"
        );
      }

      await swalSuccess(
        editing
          ? "แก้ไข Competency Level สำเร็จ"
          : "เพิ่ม Competency Level สำเร็จ"
      );

      form.resetFields();

      onSuccess?.();

    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "บันทึก Competency Level ไม่สำเร็จ"
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        editing
          ? "แก้ไข Competency Level"
          : "เพิ่ม Competency Level"
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
          label="Level Code"
          name="level_code"
          rules={[
            {
              required: true,
              message: "กรุณากรอก Level Code",
            },
          ]}
        >
          <Input
            maxLength={50}
            placeholder="เช่น L1"
          />
        </Form.Item>

        <Form.Item
          label="Level Name"
          name="level_name"
          rules={[
            {
              required: true,
              message: "กรุณากรอก Level Name",
            },
          ]}
        >
          <Input
            maxLength={255}
            placeholder="เช่น Beginner"
          />
        </Form.Item>

        <Form.Item
          label="Level Number"
          name="level_number"
          rules={[
            {
              required: true,
              message: "กรุณากรอก Level Number",
            },
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
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