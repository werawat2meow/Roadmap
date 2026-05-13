"use client";

import { useEffect, useState } from "react";
import { Table, Modal, Form, Input, InputNumber, Switch, Button, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const initialForm = {
  category_code: "",
  category_name: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export default function BenefitCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benefits/categories", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
      setRows(data.data || []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(initialForm);
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const url = editing
        ? `/api/benefits/categories/${editing.id}`
        : "/api/benefits/categories";

      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "บันทึกไม่สำเร็จ");

      message.success(data?.message || "บันทึกเรียบร้อยแล้ว");
      setOpen(false);
      await loadData();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบหมวดหมู่ "${record.category_name}" ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        const res = await fetch(`/api/benefits/categories/${record.id}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!res.ok) {
          message.error(data?.error || "ลบไม่สำเร็จ");
          return;
        }

        message.success(data?.message || "ลบเรียบร้อยแล้ว");
        await loadData();
      },
    });
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "category_code",
      key: "category_code",
      render: (v) => <span className="font-semibold text-slate-800">{v}</span>,
    },
    {
      title: "Name",
      dataIndex: "category_name",
      key: "category_name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (v) => v || "-",
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 90,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (v) => (
        <Tag className={`rounded-full border-0 ${v ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {v ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      width: 180,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => openEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Benefit Categories
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                จัดการหมวดหมู่สวัสดิการ เช่น Primary, Secondary, Loan, Discount
              </p>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className="!rounded-xl !bg-slate-900"
            >
              เพิ่ม Category
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        </div>
      </div>

      <Modal
        title={editing ? "แก้ไข Benefit Category" : "เพิ่ม Benefit Category"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editing ? "Update" : "Save"}
        cancelText="Cancel"
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Category Code"
            name="category_code"
            rules={[{ required: true, message: "กรุณากรอก Category Code" }]}
          >
            <Input placeholder="เช่น PRIMARY" />
          </Form.Item>

          <Form.Item
            label="Category Name"
            name="category_name"
            rules={[{ required: true, message: "กรุณากรอก Category Name" }]}
          >
            <Input placeholder="เช่น Primary Benefit" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="รายละเอียด" />
          </Form.Item>

          <Form.Item label="Sort Order" name="sort_order">
            <InputNumber className="!w-full" min={0} />
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}