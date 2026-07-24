"use client";

import { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";

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

export default function SkillLevelModal({
  open,
  loading = false,
  editingItem = null,

  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      form.setFieldsValue({
        level_code: editingItem.level_code,
        level_name: editingItem.level_name,
        score: editingItem.score,
        description:
          editingItem.description ?? "",
        status:
          editingItem.status ?? "active",
        sort_order:
          editingItem.sort_order ?? 0,
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        score: 1,
        status: "active",
        sort_order: 0,
      });
    }
  }, [open, editingItem, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      centered
      width={700}
      destroyOnHidden
      title={
        editingItem
          ? "แก้ไขระดับทักษะ"
          : "เพิ่มระดับทักษะ"
      }
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          label="รหัสระดับ"
          name="level_code"
          rules={[
            {
              required: true,
              message: "กรุณากรอกรหัสระดับ",
            },
          ]}
        >
          <Input
            placeholder="เช่น LV1"
            style={{ textTransform: "uppercase" }}
            onInput={(e) => {
              e.target.value =
                e.target.value.toUpperCase();
            }}
          />
        </Form.Item>

        <Form.Item
          label="ชื่อระดับ"
          name="level_name"
          rules={[
            {
              required: true,
              message: "กรุณากรอกชื่อระดับ",
            },
          ]}
        >
          <Input placeholder="ชื่อระดับทักษะ" />
        </Form.Item>

        <Form.Item
          label="Score"
          name="score"
          rules={[
            {
              required: true,
              message: "กรุณากรอกคะแนน",
            },
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea
            rows={4}
            placeholder="รายละเอียดเพิ่มเติม..."
          />
        </Form.Item>

        <Form.Item
          label="Sort Order"
          name="sort_order"
        >
          <InputNumber
            min={0}
            max={9999}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
        >
          <Select
            options={statusOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}