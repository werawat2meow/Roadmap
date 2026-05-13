"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Tag,
  message,
} from "antd";

import {
  PlusOutlined,
  GiftOutlined,
} from "@ant-design/icons";

const initialForm = {
  category_id: null,
  benefit_code: "",
  benefit_name: "",
  description: "",
  benefit_type: "general",
  active_period: "",
  sort_order: 0,
  is_active: true,
};

export default function BenefitMastersPage() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);

      const [benefitsRes, categoriesRes] =
        await Promise.all([
          fetch("/api/benefits/masters", {
            cache: "no-store",
          }),

          fetch(
            "/api/benefits/categories",
            {
              cache: "no-store",
            }
          ),
        ]);

      const benefitsJson =
        await benefitsRes.json();

      const categoriesJson =
        await categoriesRes.json();

      if (!benefitsRes.ok) {
        throw new Error(
          benefitsJson?.error ||
            "โหลดรายการสวัสดิการไม่สำเร็จ"
        );
      }

      if (!categoriesRes.ok) {
        throw new Error(
          categoriesJson?.error ||
            "โหลดหมวดหมู่ไม่สำเร็จ"
        );
      }

      setRows(benefitsJson.data || []);

      setCategories(
        categoriesJson.data || []
      );
    } catch (error) {
      console.error(error);

      message.error(
        error?.message ||
          "เกิดข้อผิดพลาด"
      );
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

    form.setFieldsValue({
      category_id:
        record.category_id,
      benefit_code:
        record.benefit_code,
      benefit_name:
        record.benefit_name,
      description:
        record.description,
      benefit_type:
        record.benefit_type,
      active_period:
        record.active_period,
      sort_order:
        record.sort_order,
      is_active:
        record.is_active,
    });

    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values =
        await form.validateFields();

      setSaving(true);

      const url = editing
        ? `/api/benefits/masters/${editing.id}`
        : "/api/benefits/masters";

      const method = editing
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "บันทึกข้อมูลไม่สำเร็จ"
        );
      }

      message.success(
        data?.message ||
          "บันทึกข้อมูลเรียบร้อยแล้ว"
      );

      setOpen(false);

      await loadData();
    } catch (error) {
      if (error?.errorFields)
        return;

      console.error(error);

      message.error(
        error?.message ||
          "เกิดข้อผิดพลาด"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    record
  ) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ "${record.benefit_name}" ใช่หรือไม่?`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: {
        danger: true,
      },

      async onOk() {
        try {
          const res = await fetch(
            `/api/benefits/masters/${record.id}`,
            {
              method: "DELETE",
            }
          );

          const data =
            await res.json();

          if (!res.ok) {
            throw new Error(
              data?.error ||
                "ลบข้อมูลไม่สำเร็จ"
            );
          }

          message.success(
            data?.message ||
              "ลบข้อมูลเรียบร้อยแล้ว"
          );

          await loadData();
        } catch (error) {
          console.error(error);

          message.error(
            error?.message ||
              "เกิดข้อผิดพลาด"
          );
        }
      },
    });
  };

  const columns = [
    {
      title: "Benefit Code",
      dataIndex: "benefit_code",
      key: "benefit_code",

      render: (value) => (
        <div className="font-semibold text-slate-800">
          {value}
        </div>
      ),
    },

    {
      title: "Benefit Name",
      dataIndex: "benefit_name",
      key: "benefit_name",
    },

    {
      title: "Category",
      key: "category",

      render: (_, record) => (
        <Tag className="rounded-full border-0 bg-emerald-100 text-emerald-700">
          {record
            ?.benefit_categories
            ?.category_name || "-"}
        </Tag>
      ),
    },

    {
      title: "Type",
      dataIndex: "benefit_type",
      key: "benefit_type",

      render: (value) => (
        <Tag className="rounded-full border-0 bg-sky-100 text-sky-700">
          {value || "-"}
        </Tag>
      ),
    },

    {
      title: "Period",
      dataIndex: "active_period",
      key: "active_period",

      render: (value) =>
        value || "-",
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 80,
    },

    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",

      render: (value) => (
        <Tag
          className={`rounded-full border-0 ${
            value
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {value
            ? "Active"
            : "Inactive"}
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
          <Button
            onClick={() =>
              openEdit(record)
            }
          >
            Edit
          </Button>

          <Button
            danger
            onClick={() =>
              handleDelete(record)
            }
          >
            Delete
          </Button>
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
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                <GiftOutlined />
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                Benefit Masters
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                จัดการรายการสวัสดิการทั้งหมดขององค์กร
              </p>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className="!h-11 !rounded-xl !bg-slate-900"
            >
              เพิ่มสวัสดิการ
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{
              pageSize: 10,
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </div>

      <Modal
        title={
          editing
            ? "แก้ไขสวัสดิการ"
            : "เพิ่มสวัสดิการ"
        }
        open={open}
        onCancel={() =>
          setOpen(false)
        }
        onOk={handleSave}
        confirmLoading={saving}
        okText={
          editing
            ? "Update"
            : "Save"
        }
        cancelText="Cancel"
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label="Category"
            name="category_id"
          >
            <Select
              allowClear
              placeholder="เลือกหมวดหมู่"
              options={categories.map(
                (item) => ({
                  value: item.id,
                  label:
                    item.category_name,
                })
              )}
            />
          </Form.Item>

          <Form.Item
            label="Benefit Code"
            name="benefit_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอก Benefit Code",
              },
            ]}
          >
            <Input placeholder="เช่น STAFF_LOAN" />
          </Form.Item>

          <Form.Item
            label="Benefit Name"
            name="benefit_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอก Benefit Name",
              },
            ]}
          >
            <Input placeholder="ชื่อสวัสดิการ" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea
              rows={4}
              placeholder="รายละเอียดสวัสดิการ"
            />
          </Form.Item>

          <Form.Item
            label="Benefit Type"
            name="benefit_type"
          >
            <Select
              options={[
                {
                  value: "general",
                  label: "General",
                },

                {
                  value: "loan",
                  label: "Loan",
                },

                {
                  value: "discount",
                  label: "Discount",
                },

                {
                  value: "medical",
                  label: "Medical",
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Active Period"
            name="active_period"
          >
            <Input placeholder="เช่น Monthly / Yearly" />
          </Form.Item>

          <Form.Item
            label="Sort Order"
            name="sort_order"
          >
            <InputNumber
              min={0}
              className="!w-full"
            />
          </Form.Item>

          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}