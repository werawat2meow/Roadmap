"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Form,Input,Modal,Select,Space,Switch,Table,Tag,message,} from "antd";
import {FileDoneOutlined,PlusOutlined,EditOutlined,DeleteOutlined,ReloadOutlined,} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitMasterPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const canCreate = hasPermission(user, "benefit.master.create") || hasPermission(user, "benefit.master.manage");
  const canUpdate = hasPermission(user, "benefit.master.update") || hasPermission(user, "benefit.master.manage");
  const canDelete = hasPermission(user, "benefit.master.delete") || hasPermission(user, "benefit.master.manage");

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/master", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(json.data || []);
      setCategories(json.categories || []);
    } catch (error) {
      console.error("LOAD_BENEFITS_MASTER_ERROR:", error);
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      benefit_type: "amount",
      active_period: "yearly",
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      benefit_code: record.benefit_code,
      benefit_name: record.benefit_name,
      description: record.description,
      benefit_type: record.benefit_type,
      active_period: record.active_period,
      category_id: record.category_id,
      is_active: record.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const res = await fetch("/api/benefits/master", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editing?.id,
          ...values,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      message.success(editing ? "แก้ไขสวัสดิการสำเร็จ" : "เพิ่มสวัสดิการสำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;

      console.error("SAVE_BENEFIT_MASTER_ERROR:", error);
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "ยืนยันการลบสวัสดิการ",
      content: `ต้องการลบ "${record.benefit_name}" ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/master?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบข้อมูลไม่สำเร็จ");
          }

          message.success("ลบสวัสดิการสำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_BENEFIT_MASTER_ERROR:", error);
          message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "benefit_code",
        width: 140,
        fixed: "left",
      },
      {
        title: "ชื่อสวัสดิการ",
        dataIndex: "benefit_name",
        width: 240,
      },
      {
        title: "หมวดหมู่",
        width: 180,
        render: (_, record) =>
          record?.benefit_categories?.category_name || "-",
      },
      {
        title: "ประเภท",
        dataIndex: "benefit_type",
        width: 140,
        render: (value) => <Tag color="blue">{value || "-"}</Tag>,
      },
      {
        title: "รอบสิทธิ์",
        dataIndex: "active_period",
        width: 140,
      },
      {
        title: "สถานะ",
        dataIndex: "is_active",
        width: 120,
        render: (value) =>
          value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
      },
      {
        title: "รายละเอียด",
        dataIndex: "description",
        width: 320,
        render: (value) => value || "-",
      },
      {
        title: "จัดการ",
        width: 180,
        fixed: "right",
        render: (_, record) => (
          <Space>
            {canUpdate && (
              <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
                แก้ไข
              </Button>
            )}

            {canDelete && (
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                ลบ
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canUpdate, canDelete]
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        variant="borderless"
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <FileDoneOutlined className="text-emerald-600" />
            <span className="text-lg font-bold text-slate-800">
              จัดการสวัสดิการ
            </span>
          </div>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>

            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                เพิ่มสวัสดิการ
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
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title={editing ? "แก้ไขสวัสดิการ" : "เพิ่มสวัสดิการ"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Benefit Code"
            name="benefit_code"
            rules={[{ required: true, message: "กรุณากรอก Benefit Code" }]}
          >
            <Input placeholder="เช่น MEAL, PHONE, MEDICAL" />
          </Form.Item>

          <Form.Item
            label="ชื่อสวัสดิการ"
            name="benefit_name"
            rules={[{ required: true, message: "กรุณากรอกชื่อสวัสดิการ" }]}
          >
            <Input placeholder="เช่น ค่าอาหารกลางวัน" />
          </Form.Item>

          <Form.Item label="หมวดหมู่" name="category_id">
            <Select
              allowClear
              placeholder="เลือกหมวดหมู่"
              options={categories.map((item) => ({
                label: item.category_name,
                value: item.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="ประเภทสวัสดิการ" name="benefit_type">
            <Select
              options={[
                { label: "Amount", value: "amount" },
                { label: "Discount", value: "discount" },
                { label: "Quota", value: "quota" },
                { label: "Service", value: "service" },
              ]}
            />
          </Form.Item>

          <Form.Item label="รอบสิทธิ์" name="active_period">
            <Select
              options={[
                { label: "Yearly", value: "yearly" },
                { label: "Monthly", value: "monthly" },
                { label: "Daily", value: "daily" },
                { label: "Once", value: "once" },
              ]}
            />
          </Form.Item>

          <Form.Item label="รายละเอียด" name="description">
            <Input.TextArea rows={4} placeholder="รายละเอียดสวัสดิการ" />
          </Form.Item>

          <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}