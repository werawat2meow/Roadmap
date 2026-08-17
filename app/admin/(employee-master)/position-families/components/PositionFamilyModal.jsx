"use client";

import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";

const { TextArea } = Input;

export default function PositionFamilyModal({
  open,
  saving,
  editingFamily,
  form,
  setForm,
  onClose,
  onSave,
}) {
  return (
    <Modal
      open={open}
      destroyOnHidden
      mask={{
        closable: false,
      }}
      confirmLoading={saving}
      title={
        editingFamily
          ? "Edit Position Family"
          : "Add Position Family"
      }
      okText="Save"
      cancelText="Cancel"
      onCancel={onClose}
      onOk={onSave}
      width={650}
    >

      <Form layout="vertical">

        <Form.Item
          label="Family Code"
          required
        >
          <Input
            value={form.family_code}
            onChange={(e) =>
              setForm({
                ...form,
                family_code:
                  e.target.value.toUpperCase(),
              })
            }
          />
        </Form.Item>

        <Form.Item
          label="Family Name"
          required
        >
          <Input
            value={form.family_name}
            onChange={(e) =>
              setForm({
                ...form,
                family_name:
                  e.target.value,
              })
            }
          />
        </Form.Item>

        <Form.Item label="Description">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
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
                sort_order:
                  value ?? 0,
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