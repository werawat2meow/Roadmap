"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

export default function BenefitPoliciesPage() {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadData = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    keyword = search
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(
        `/api/admin/benefit/policies?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(data.data || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.total || 0,
      });
    } catch (error) {
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, pagination.pageSize, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, pagination.pageSize, search);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditingRow(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: 1,
      effective_from: null,
      effective_to: null,
    });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingRow(record);
    form.setFieldsValue({
      policy_code: record.policy_code,
      policy_name: record.policy_name,
      description: record.description,
      effective_from: record.effective_from ? dayjs(record.effective_from) : null,
      effective_to: record.effective_to ? dayjs(record.effective_to) : null,
      sort_order: record.sort_order,
      is_active: record.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.effective_from && values.effective_to && values.effective_to.isBefore(values.effective_from, "day")) {
        message.error("Effective To ต้องไม่น้อยกว่า Effective From");
        return;
      }

      setSaving(true);

      const payload = {
        policy_code: values.policy_code,
        policy_name: values.policy_name,
        description: values.description || "",
        effective_from: values.effective_from
          ? values.effective_from.format("YYYY-MM-DD")
          : null,
        effective_to: values.effective_to
          ? values.effective_to.format("YYYY-MM-DD")
          : null,
        sort_order: values.sort_order || 1,
        is_active: values.is_active ?? true,
      };

      const url = editingRow
        ? `/api/admin/benefit/policies/${editingRow.id}`
        : "/api/admin/benefit/policies";

      const method = editingRow ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      message.success(data.message || "บันทึกข้อมูลสำเร็จ");
      setModalOpen(false);
      setEditingRow(null);
      form.resetFields();
      loadData(pagination.current, pagination.pageSize, search);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/benefit/policies/${record.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "ลบข้อมูลไม่สำเร็จ");
      }

      message.success(data.message || "ลบข้อมูลสำเร็จ");
      loadData(1, pagination.pageSize, search);
    } catch (error) {
      message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "policy_code",
      width: 160,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Benefit Policy",
      dataIndex: "policy_name",
      width: 220,
    },
    {
      title: "Effective From",
      dataIndex: "effective_from",
      width: 150,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Effective To",
      dataIndex: "effective_to",
      width: 150,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (value) => value || "-",
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 120,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Action",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />

          <Popconfirm
            title="ยืนยันการลบ?"
            description="ต้องการลบ Benefit Policy นี้หรือไม่"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-2xl font-bold text-slate-800">
            Benefit Policies
          </div>
          <div className="text-sm text-slate-500">
            Master Setup สำหรับกำหนดนโยบายสวัสดิการ
          </div>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              loadData(pagination.current, pagination.pageSize, search)
            }
          >
            Refresh
          </Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Policy
          </Button>
        </Space>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <Input.Search
            allowClear
            placeholder="ค้นหา Code / ชื่อ / รายละเอียด"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(value) => loadData(1, pagination.pageSize, value)}
            className="max-w-md"
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            onChange: (page, pageSize) => loadData(page, pageSize, search),
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingRow ? "Edit Benefit Policy" : "Add Benefit Policy"}
        open={modalOpen}
        forceRender
        onCancel={() => {
          setModalOpen(false);
          setEditingRow(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Policy Code"
            name="policy_code"
            rules={[
              { required: true, message: "กรุณากรอก Policy Code" },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: "ใช้ได้เฉพาะตัวอักษร ตัวเลข _ และ -",
              },
            ]}
          >
            <Input placeholder="เช่น MEDICAL_POLICY, MEAL_POLICY" />
          </Form.Item>

          <Form.Item
            label="Policy Name"
            name="policy_name"
            rules={[{ required: true, message: "กรุณากรอกชื่อ Policy" }]}
          >
            <Input placeholder="เช่น นโยบายค่ารักษาพยาบาล" />
          </Form.Item>

          <Form.Item label="Effective From" name="effective_from">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Effective To"
            name="effective_to"
            dependencies={["effective_from"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const effectiveFrom = getFieldValue("effective_from");

                  if (!effectiveFrom || !value) {
                    return Promise.resolve();
                  }

                  if (value.isBefore(effectiveFrom, "day")) {
                    return Promise.reject(
                      new Error("Effective To ต้องไม่น้อยกว่า Effective From")
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="รายละเอียดนโยบาย" />
          </Form.Item>

          <Form.Item label="Sort Order" name="sort_order">
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}