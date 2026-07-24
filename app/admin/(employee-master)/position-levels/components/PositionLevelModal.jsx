"use client";

import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";

export default function PositionLevelModal({
  open,
  saving,
  editingLevel,
  form,
  setForm,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={saving}
      title={
        editingLevel
          ? "Edit Position Level"
          : "Add Position Level"
      }
      okText="Save"
      cancelText="Cancel"
      onCancel={onClose}
      onOk={onSave}
      width={650}
    >
      <Form layout="vertical">

        <Form.Item
          label="Level Code"
          required
        >
          <Input
            value={form.level_code}
            onChange={(e) =>
              setForm({
                ...form,
                level_code: e.target.value.toUpperCase(),
              })
            }
          />
        </Form.Item>

        <Form.Item
          label="Level Name"
          required
        >
          <Input
            value={form.level_name}
            onChange={(e) =>
              setForm({
                ...form,
                level_name: e.target.value,
              })
            }
          />
        </Form.Item>

        <Form.Item
          label="Sort Order"
        >
          <InputNumber
            min={0}
            className="w-full"
            value={form.sort_order}
            onChange={(value) =>
              setForm({
                ...form,
                sort_order: value ?? 0,
              })
            }
          />
        </Form.Item>

        <Form.Item
          label="Status"
        >
          <Select
            value={form.status}
            onChange={(value) =>
              setForm({
                ...form,
                status: value,
              })
            }
            options={[
              {
                label: "Active",
                value: "active",
              },
              {
                label: "Inactive",
                value: "inactive",
              },
            ]}
          />
        </Form.Item>

      </Form>
    </Modal>
  );
}