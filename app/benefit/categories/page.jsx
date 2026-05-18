"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Form,Input,Modal,Space,Switch,Table,Tag,message,} from "antd";
import {TagsOutlined,PlusOutlined,EditOutlined,DeleteOutlined,ReloadOutlined,} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitCategoriesPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const canView = hasPermission(user, "benefit.category.view") || hasPermission(user, "benefit.category.manage");
  const canCreate = hasPermission(user, "benefit.category.create") || hasPermission(user, "benefit.category.manage");
  const canUpdate = hasPermission(user, "benefit.category.update") || hasPermission(user, "benefit.category.manage");
  const canDelete = hasPermission(user, "benefit.category.delete") || hasPermission(user, "benefit.category.manage");

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/categories", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(json.data || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_CATEGORIES_ERROR:", error);
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: 0,
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      category_code: record.category_code,
      category_name: record.category_name,
      description: record.description,
      sort_order: record.sort_order,
      is_active: record.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/benefits/categories", {
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

      message.success(editing ? "แก้ไขหมวดหมู่สำเร็จ" : "เพิ่มหมวดหมู่สำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;

      console.error("SAVE_BENEFIT_CATEGORY_ERROR:", error);
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบหมวดหมู่",
      content: `ต้องการลบ "${record.category_name}" ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/categories?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบข้อมูลไม่สำเร็จ");
          }

          message.success("ลบหมวดหมู่สำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_BENEFIT_CATEGORY_ERROR:", error);
          message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "category_code",
        width: 160,
      },
      {
        title: "ชื่อหมวดหมู่",
        dataIndex: "category_name",
        width: 240,
      },
      {
        title: "รายละเอียด",
        dataIndex: "description",
        width: 320,
        render: (value) => value || "-",
      },
      {
        title: "ลำดับ",
        dataIndex: "sort_order",
        width: 100,
      },
      {
        title: "สถานะ",
        dataIndex: "is_active",
        width: 120,
        render: (value) =>
          value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
      },
      {
        title: "จัดการ",
        width: 180,
        render: (_, record) => (
          <Space>
            {canUpdate && (
              <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
                แก้ไข
              </Button>
            )}

            {canDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                ลบ
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canUpdate, canDelete]
  );

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดูข้อมูลหมวดหมู่สวัสดิการ</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        variant="borderless"
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <TagsOutlined className="text-emerald-600" />
            <span className="text-lg font-bold text-slate-800">
              จัดการหมวดหมู่สวัสดิการ
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
                เพิ่มหมวดหมู่
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
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title={editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={680}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Category Code"
            name="category_code"
            rules={[{ required: true, message: "กรุณากรอก Category Code" }]}
          >
            <Input placeholder="เช่น LEAVE, MEAL, ALLOWANCE" />
          </Form.Item>

          <Form.Item
            label="ชื่อหมวดหมู่"
            name="category_name"
            rules={[{ required: true, message: "กรุณากรอกชื่อหมวดหมู่" }]}
          >
            <Input placeholder="เช่น วันลา, อาหาร, ค่าเบี้ยเลี้ยง" />
          </Form.Item>

          <Form.Item label="รายละเอียด" name="description">
            <Input.TextArea rows={4} placeholder="รายละเอียดหมวดหมู่" />
          </Form.Item>

          <Form.Item label="ลำดับการแสดงผล" name="sort_order">
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}