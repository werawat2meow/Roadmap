"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  PoweroffOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

export default function ApiClientsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // #region Auth & Permissions
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "api_clients.view");
  const canCreate = hasPermission(user, "api_clients.create");
  const canEdit = hasPermission(user, "api_clients.edit");
  const canDelete = hasPermission(user, "api_clients.delete");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [loadingUser, user, canView, router]);
  // #endregion

  const fetchClients = async (nextPage = page, nextPageSize = pageSize) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const res = await fetch(`/api/admin/api-clients?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "โหลดข้อมูลไม่สำเร็จ");
      }

      setData(json.data || []);
      setTotal(json.pagination?.total || 0);
      setPage(json.pagination?.page || nextPage);
      setPageSize(json.pagination?.pageSize || nextPageSize);
    } catch (err) {
      message.error(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser) return;
    if (!user) return;
    if (!canView) return;

    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser, canView]);

  useEffect(() => {
    if (!openModal) return;

    if (editing) {
      form.setFieldsValue({
        client_code: editing.client_code,
        client_name: editing.client_name,
        description: editing.description,
        contact_name: editing.contact_name,
        contact_email: editing.contact_email,
        is_active: editing.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
  }, [openModal, editing, form]);

  const handleOpenCreate = () => {
    if (!canCreate) {
      message.error("คุณไม่มีสิทธิ์สร้าง API Client");
      return;
    }

    setEditing(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditing(null);
    form.resetFields();
  };

  const handleEdit = (record) => {
    if (!canEdit) {
      message.error("คุณไม่มีสิทธิ์แก้ไข API Client");
      return;
    }

    setEditing(record);
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isEdit = !!editing;

      if (isEdit && !canEdit) {
        message.error("คุณไม่มีสิทธิ์แก้ไข API Client");
        return;
      }

      if (!isEdit && !canCreate) {
        message.error("คุณไม่มีสิทธิ์สร้าง API Client");
        return;
      }

      const url = isEdit
        ? `/api/admin/api-clients/${editing.id}`
        : "/api/admin/api-clients";

      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        client_code: values.client_code?.trim(),
        client_name: values.client_name?.trim(),
        description: values.description?.trim() || null,
        contact_name: values.contact_name?.trim() || null,
        contact_email: values.contact_email?.trim() || null,
        is_active: !!values.is_active,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "บันทึกไม่สำเร็จ");
      }

      message.success(isEdit ? "อัปเดตสำเร็จ" : "สร้างสำเร็จ");
      handleCloseModal();
      fetchClients();
    } catch (err) {
      message.error(err.message || "บันทึกไม่สำเร็จ");
    }
  };

  const handleToggle = async (record) => {
    if (!canEdit) {
      message.error("คุณไม่มีสิทธิ์แก้ไขสถานะ API Client");
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-clients/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !record.is_active,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "อัปเดตสถานะไม่สำเร็จ");
      }

      message.success(
        record.is_active ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ"
      );
      fetchClients();
    } catch (err) {
      message.error(err.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete) {
      message.error("คุณไม่มีสิทธิ์ลบ API Client");
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-clients/${record.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "ลบไม่สำเร็จ");
      }

      message.success("ลบสำเร็จ");
      fetchClients();
    } catch (err) {
      message.error(err.message || "ลบไม่สำเร็จ");
    }
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "client_code",
      width: 130,
      render: (value) => (
        <span className="font-semibold text-slate-700">{value}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "client_name",
      width: 180,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (value) => value || "-",
    },
    {
      title: "Contact",
      width: 220,
      render: (_, r) => (
        <div>
          <div>{r.contact_name || "-"}</div>
          <div className="text-xs text-slate-500">{r.contact_email || ""}</div>
        </div>
      ),
    },
    {
      title: "Status",
      width: 120,
      align: "center",
      render: (_, r) =>
        r.is_active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Action",
      width: 280,
      align: "center",
      render: (_, r) => (
        <Space size="small" wrap>
          {canEdit && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
              className="rounded-xl shadow-sm"
            >
              Edit
            </Button>
          )}

          {canEdit && (
            <Button
              size="small"
              danger={r.is_active}
              icon={<PoweroffOutlined />}
              onClick={() => handleToggle(r)}
              className="rounded-xl shadow-sm"
            >
              {r.is_active ? "Disable" : "Enable"}
            </Button>
          )}

          {canDelete && (
            <Popconfirm
              title="ยืนยันการลบ Client"
              description="เมื่อลบแล้ว Token ของ Client นี้อาจได้รับผลกระทบ"
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(r)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                className="rounded-xl shadow-sm"
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">API Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการระบบที่สามารถเรียก API ได้
          </p>
        </div>

        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            className="rounded-2xl px-5 shadow-sm"
          >
            เพิ่ม Client
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          showTotal: (totalRows) => `ทั้งหมด ${totalRows} รายการ`,
          onChange: (nextPage, nextPageSize) => {
            fetchClients(nextPage, nextPageSize);
          },
        }}
      />

      {mounted && (canCreate || canEdit) && (
        <Modal
          title={editing ? "แก้ไข Client" : "สร้าง Client"}
          open={openModal}
          onCancel={handleCloseModal}
          onOk={handleSubmit}
          okText="บันทึก"
          cancelText="ยกเลิก"
          destroyOnHidden
          forceRender
          mask={{ closable: false }}
          styles={{
            mask: {
              backgroundColor: "rgba(15, 23, 42, 0.35)",
            },
          }}
        >
          <Form layout="vertical" form={form}>
            <Form.Item
              name="client_code"
              label="Client Code"
              rules={[{ required: true, message: "กรุณากรอก code" }]}
            >
              <Input placeholder="HRM / PAYROLL" disabled={!!editing} />
            </Form.Item>

            <Form.Item
              name="client_name"
              label="Client Name"
              rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
            >
              <Input placeholder="HRM System" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item name="contact_name" label="Contact Name">
              <Input />
            </Form.Item>

            <Form.Item name="contact_email" label="Contact Email">
              <Input />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
}