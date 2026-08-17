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

const statusOptions = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

export default function CompetencyModal({
  open,
  item,
  onCancel,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [saving, setSaving] = useState(false);
  const [competencyTypes, setCompetencyTypes] = useState([]);
  const editing = !!item;


  const loadCompetencyTypes = async () => {
    try {
      const res = await fetch(
        "/api/admin/competency-types?all=true&status=active",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "โหลด Competency Types ไม่สำเร็จ"
        );
      }

      setCompetencyTypes(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (open) {
      loadCompetencyTypes();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      form.setFieldsValue({
        competency_code:
          item.competency_code,

        competency_name:
          item.competency_name,

        competency_type_id: item.competency_type_id,

        description:
          item.description,

        status:
          item.status,

        sort_order:
          item.sort_order,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      competency_type_id: undefined,
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
        competency_code: values.competency_code?.trim(),
        competency_name: values.competency_name?.trim(),
        competency_type_id: values.competency_type_id,
        description:
          values.description?.trim() || null,
        status: values.status,
        sort_order:
          values.sort_order ?? 0,
      };

      const res = await fetch(
        editing
          ? `/api/admin/competencies/${item.id}`
          : "/api/admin/competencies",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            "บันทึกข้อมูลไม่สำเร็จ"
        );
      }

      message.success(
        editing
          ? "แก้ไข Competency สำเร็จ"
          : "เพิ่ม Competency สำเร็จ"
      );

      form.resetFields();

      onSuccess?.();

    } catch (err) {
      console.error(err);

      message.error(
        err.message ||
          "บันทึกข้อมูลไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        editing
          ? "แก้ไข Competency"
          : "เพิ่ม Competency ทักษะเฉพาะ"
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
          label="รหัส Competency"
          name="competency_code"
          rules={[
            {
              required: true,
              message:
                "กรุณากรอกรหัส Competency",
            },
          ]}
        >
          <Input
            placeholder="เช่น CORE001"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          label="ชื่อ Competency"
          name="competency_name"
          rules={[
            {
              required: true,
              message:
                "กรุณากรอกชื่อ Competency",
            },
          ]}
        >
          <Input
            placeholder="ชื่อ Competency"
            maxLength={255}
          />
        </Form.Item>

        <Form.Item
          label="ประเภท Competency"
          name="competency_type_id"
          rules={[
            {
              required: true,
              message: "กรุณาเลือกประเภท",
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="เลือกประเภท Competency"
            options={(competencyTypes || []).map((item) => ({
              label: item.type_name,
              value: item.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="รายละเอียด"
          name="description"
        >
          <Input.TextArea
            rows={4}
            placeholder="รายละเอียดเพิ่มเติม..."
          />
        </Form.Item>

        <Form.Item
          label="สถานะ"
          name="status"
          rules={[
            {
              required: true,
              message:
                "กรุณาเลือกสถานะ",
            },
          ]}
        >
          <Select
            placeholder="เลือกสถานะ"
            options={statusOptions}
          />
        </Form.Item>

        <Form.Item
          label="ลำดับการแสดงผล"
          name="sort_order"
        >
          <InputNumber
            className="w-full"
            min={0}
            placeholder="0"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}