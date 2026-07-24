"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from "antd";

export default function SkillCategoryModal({
  open,
  item,
  onCancel,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const isEdit = !!item;

  useEffect(() => {
    if (!open) return;

    if (item) {
      form.setFieldsValue({
        category_code: item.category_code,
        category_name: item.category_name,
        description: item.description,
        sort_order: item.sort_order,
        status: item.status,
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        sort_order: 0,
        status: "active",
      });
    }
  }, [open, item, form]);

  /* ===========================================
   * Save
   * =========================================== */

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      const res = await fetch(
        isEdit
          ? `/api/admin/skill-categories/${item.id}`
          : "/api/admin/skill-categories",
        {
          method: isEdit ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(values),
        }
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      message.success(
        isEdit
          ? "แก้ไขข้อมูลสำเร็จ"
          : "เพิ่มข้อมูลสำเร็จ"
      );

      onSuccess?.();

    } catch (err) {
      console.error(err);

      message.error(
        err.message || "เกิดข้อผิดพลาด"
      );

    } finally {
      setLoading(false);
    }
  };
    return (
    <Modal
      open={open}
      title={
        isEdit
          ? "แก้ไขหมวดหมู่ทักษะ"
          : "เพิ่มหมวดหมู่ทักษะ"
      }
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={isEdit ? "บันทึก" : "เพิ่ม"}
      cancelText="ยกเลิก"
      confirmLoading={loading}
      destroyOnHidden
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="รหัสหมวดหมู่"
          name="category_code"
          rules={[
            {
              required: true,
              message: "กรุณากรอกรหัสหมวดหมู่",
            },
          ]}
        >
          <Input
            maxLength={30}
            placeholder="เช่น PROGRAMMING"
          />
        </Form.Item>

        <Form.Item
          label="ชื่อหมวดหมู่"
          name="category_name"
          rules={[
            {
              required: true,
              message: "กรุณากรอกชื่อหมวดหมู่",
            },
          ]}
        >
          <Input
            maxLength={150}
            placeholder="Programming"
          />
        </Form.Item>

        <Form.Item
          label="รายละเอียด"
          name="description"
        >
          <Input.TextArea
            rows={4}
            placeholder="รายละเอียดเพิ่มเติม"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="ลำดับการแสดง"
          name="sort_order"
        >
          <InputNumber
            min={0}
            style={{
              width: "100%",
            }}
          />
        </Form.Item>
                <Form.Item
          label="สถานะ"
          name="status"
          rules={[
            {
              required: true,
              message: "กรุณาเลือกสถานะ",
            },
          ]}
        >
          <Select
            options={[
              {
                value: "active",
                label: "Active",
              },
              {
                value: "inactive",
                label: "Inactive",
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}