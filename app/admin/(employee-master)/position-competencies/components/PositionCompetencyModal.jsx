"use client";

import { useEffect } from "react";

import {
  Form,
  InputNumber,
  Modal,
  Select,
} from "antd";

export default function PositionCompetencyModal({
  open,
  onCancel,
  onSave,
  saving,
  editingItem,

  positions,
  competencies,
  competencyLevels,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      form.setFieldsValue({
        position_id: editingItem.position_id,
        competency_id: editingItem.competency_id,
        required_level_id:
          editingItem.required_level_id,
        importance_level:
          editingItem.importance_level,
        status: editingItem.status,
        sort_order:
          editingItem.sort_order,
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        importance_level: "medium",
        status: "active",
        sort_order: 0,
      });
    }
  }, [open, editingItem, form]);

  const handleFinish = (values) => {
    onSave(values);
  };

  return (
    <Modal
      title={
        editingItem
          ? "แก้ไข Position Competency"
          : "เพิ่ม Position Competency"
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={saving}
      destroyOnHidden
      mask={{
        closable: false,
      }}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        {/* =========================
              Position
        ========================= */}

        <Form.Item
          label="ตำแหน่ง"
          name="position_id"
          rules={[
            {
              required: true,
              message:
                "กรุณาเลือกตำแหน่ง",
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={positions.map(
              (item) => ({
                value: item.id,
                label: `${item.position_code} - ${item.position_name}`,
              })
            )}
          />
        </Form.Item>

        {/* =========================
              Competency
        ========================= */}

        <Form.Item
          label="Competency"
          name="competency_id"
          rules={[
            {
              required: true,
              message:
                "กรุณาเลือก Competency",
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={competencies.map(
              (item) => ({
                value: item.id,
                label: `${item.competency_code} - ${item.competency_name}`,
              })
            )}
          />
        </Form.Item>

        {/* =========================
              Required Level
        ========================= */}

        <Form.Item
          label="Required Level"
          name="required_level_id"
          rules={[
            {
              required: true,
              message:
                "กรุณาเลือกระดับ Competency",
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={competencyLevels.map(
              (item) => ({
                value: item.id,
                label: `${item.level_code} - ${item.level_name}`,
              })
            )}
          />
        </Form.Item>

        {/* =========================
              Importance
        ========================= */}

        <Form.Item
          label="Importance"
          name="importance_level"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              {
                value: "low",
                label: "Low",
              },
              {
                value: "medium",
                label: "Medium",
              },
              {
                value: "high",
                label: "High",
              },
              {
                value: "critical",
                label: "Critical",
              },
            ]}
          />
        </Form.Item>

        {/* =========================
              Status
        ========================= */}

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

        {/* =========================
              Sort Order
        ========================= */}

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