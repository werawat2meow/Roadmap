"use client";

import { useEffect, useState } from "react";
import {Button,Card,Form,Input,InputNumber,Modal,Select,Space,Switch,Table,Tag,message,} from "antd";
import {PlusOutlined,ReloadOutlined,EditOutlined,DeleteOutlined,} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitRunningNumbersPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const canView = hasPermission(user, "benefit.running.view") || hasPermission(user, "benefit.running.manage");
  const canCreate = hasPermission(user, "benefit.running.create") || hasPermission(user, "benefit.running.manage");
  const canEdit = hasPermission(user, "benefit.running.edit") || hasPermission(user, "benefit.running.manage");
  const canDelete = hasPermission(user, "benefit.running.delete") || hasPermission(user, "benefit.running.manage");

  const loadData = async ({ nextPage = page, nextPageSize = pageSize } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(nextPageSize));

      const res = await fetch(`/api/benefits/running-numbers?${params}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "โหลดเลขรันไม่สำเร็จ");

      setRows(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || nextPage);
      setPageSize(json.pageSize || nextPageSize);
    } catch (error) {
      message.error(error.message || "โหลดเลขรันไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData({ nextPage: 1, nextPageSize: 10 });
  }, [canView]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      module_code: "BENEFIT",
      document_type: "REQUEST",
      prefix: `BEN-${new Date().getFullYear()}-`,
      current_number: 0,
      padding_length: 6,
      running_year: new Date().getFullYear(),
      running_month: 0,
      reset_every_year: true,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        module_code: values.module_code,
        document_type: values.document_type,
        prefix: values.prefix,
        current_number: Number(values.current_number || 0),
        padding_length: Number(values.padding_length || 6),
        running_year: Number(values.running_year),
        running_month: Number(values.running_month || 0),
        reset_every_year: values.reset_every_year !== false,
        is_active: values.is_active !== false,
      };

      const url = editing
        ? `/api/benefits/running-numbers/${editing.id}`
        : "/api/benefits/running-numbers";

      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "บันทึกเลขรันไม่สำเร็จ");

      message.success("บันทึกเลขรันสำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.message || "บันทึกเลขรันไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบเลขรัน",
      content: `ต้องการลบ ${record.module_code}-${record.document_type} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(
            `/api/benefits/running-numbers/${record.id}`,
            { method: "DELETE" }
          );

          const json = await res.json();

          if (!res.ok) throw new Error(json?.error || "ลบเลขรันไม่สำเร็จ");

          message.success("ลบเลขรันสำเร็จ");
          loadData();
        } catch (error) {
          message.error(error.message || "ลบเลขรันไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
    {
      title: "Module",
      dataIndex: "module_code",
      width: 140,
    },
    {
      title: "Document Type",
      dataIndex: "document_type",
      width: 160,
    },
    {
      title: "Prefix",
      dataIndex: "prefix",
      width: 180,
    },
    {
      title: "Current Number",
      dataIndex: "current_number",
      width: 160,
      render: (value) => Number(value || 0).toLocaleString(),
    },
    {
      title: "Next No",
      width: 220,
      render: (_, record) =>
        `${record.prefix || ""}${String(
          Number(record.current_number || 0) + 1
        ).padStart(record.padding_length || 6, "0")}`,
    },
    {
      title: "Year/Month",
      width: 140,
      render: (_, record) => `${record.running_year}/${record.running_month}`,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 120,
      render: (value) =>
        value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: "Actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Edit
            </Button>
          )}

          {canDelete && (
            <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดูเลขรันเอกสาร</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={<div className="text-lg font-bold">Benefit Running Numbers</div>}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
              Refresh
            </Button>

            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Add Running No
              </Button>
            )}
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (value) => `ทั้งหมด ${value.toLocaleString()} รายการ`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
              loadData({ nextPage, nextPageSize });
            },
          }}
        />
      </Card>

      <Modal
        title={editing ? "Edit Running Number" : "Add Running Number"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Module Code"
            name="module_code"
            rules={[{ required: true, message: "กรุณากรอก Module Code" }]}
          >
            <Input placeholder="BENEFIT" />
          </Form.Item>

          <Form.Item
            label="Document Type"
            name="document_type"
            rules={[{ required: true, message: "กรุณากรอก Document Type" }]}
          >
            <Input placeholder="REQUEST" />
          </Form.Item>

          <Form.Item
            label="Prefix"
            name="prefix"
            rules={[{ required: true, message: "กรุณากรอก Prefix" }]}
          >
            <Input placeholder="BEN-2026-" />
          </Form.Item>

          <Form.Item label="Current Number" name="current_number">
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Padding Length" name="padding_length">
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Running Year"
            name="running_year"
            rules={[{ required: true, message: "กรุณากรอกปี" }]}
          >
            <InputNumber min={2000} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Running Month" name="running_month">
            <InputNumber min={0} max={12} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Reset Every Year"
            name="reset_every_year"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end">
            <Space>
              <Button
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>

              <Button type="primary" htmlType="submit" loading={saving}>
                Save
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}