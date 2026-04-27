"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Typography,
  Popconfirm,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const { Text, Paragraph } = Typography;

export default function ApiTokensPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [clients, setClients] = useState([]);

  const [search, setSearch] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createdTokenModal, setCreatedTokenModal] = useState(false);
  const [plainToken, setPlainToken] = useState("");
  const [pendingPlainToken, setPendingPlainToken] = useState("");
  const [form] = Form.useForm();

  // #region Auth & Permissions
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "api_tokens.view");
  const canCreate = hasPermission(user, "api_tokens.create");
  const canRevoke = hasPermission(user, "api_tokens.revoke");

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

  const fetchClients = async () => {
    try {
      setClientsLoading(true);

      const res = await fetch("/api/admin/api-clients");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "โหลด API Clients ไม่สำเร็จ");
      }

      setClients(json.data || []);
    } catch (error) {
      message.error(error.message || "โหลด API Clients ไม่สำเร็จ");
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/api-tokens");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "โหลด API Tokens ไม่สำเร็จ");
      }

      setTokens(json.data || []);
    } catch (error) {
      message.error(error.message || "โหลด API Tokens ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser) return;
    if (!user) return;
    if (!canView) return;

    fetchClients();
    fetchTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser, canView]);

  const filteredTokens = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return tokens;

    return tokens.filter((item) => {
      const clientName = item.client?.client_name?.toLowerCase() || "";
      const clientCode = item.client?.client_code?.toLowerCase() || "";
      const tokenName = item.token_name?.toLowerCase() || "";
      const tokenPrefix = item.token_prefix?.toLowerCase() || "";

      return (
        clientName.includes(keyword) ||
        clientCode.includes(keyword) ||
        tokenName.includes(keyword) ||
        tokenPrefix.includes(keyword)
      );
    });
  }, [tokens, search]);

  const handleOpenCreate = () => {
    if (!canCreate) {
      message.error("คุณไม่มีสิทธิ์สร้าง API Token");
      return;
    }

    form.resetFields();
    setOpenCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    form.resetFields();
  };

  const handleAfterCreateModalOpenChange = (open) => {
    if (!open && pendingPlainToken) {
      setPlainToken(pendingPlainToken);
      setPendingPlainToken("");
      setCreatedTokenModal(true);
    }
  };

  const handleCloseCreatedTokenModal = () => {
    setCreatedTokenModal(false);
    setPlainToken("");
  };

  const handleCreateToken = async () => {
    try {
      if (!canCreate) {
        message.error("คุณไม่มีสิทธิ์สร้าง API Token");
        return;
      }

      const values = await form.validateFields();

      const payload = {
        client_id: values.client_id,
        token_name: values.token_name?.trim(),
        expires_at: values.expires_at
          ? dayjs(values.expires_at).toISOString()
          : null,
      };

      const res = await fetch("/api/admin/api-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "สร้าง Token ไม่สำเร็จ");
      }

      setPendingPlainToken(json.data?.plain_token || "");
      setOpenCreateModal(false);
      form.resetFields();

      message.success("สร้าง Token สำเร็จ");
      fetchTokens();
    } catch (error) {
      message.error(error.message || "สร้าง Token ไม่สำเร็จ");
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(plainToken);
      message.success("คัดลอก Token แล้ว");
    } catch {
      message.error("คัดลอก Token ไม่สำเร็จ");
    }
  };

  const handleRevokeToken = async (record) => {
    if (!canRevoke) {
      message.error("คุณไม่มีสิทธิ์ Revoke API Token");
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-tokens/${record.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: false,
          revoked_at: new Date().toISOString(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Revoke Token ไม่สำเร็จ");
      }

      message.success("Revoke Token สำเร็จ");
      fetchTokens();
    } catch (error) {
      message.error(error.message || "Revoke Token ไม่สำเร็จ");
    }
  };

  const columns = [
    {
      title: "Token Name",
      dataIndex: "token_name",
      key: "token_name",
      render: (value) => (
        <span className="font-medium text-slate-700">{value}</span>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-700">
            {record.client?.client_name || "-"}
          </div>
          <div className="text-xs text-slate-500">
            {record.client?.client_code || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Prefix",
      dataIndex: "token_prefix",
      key: "token_prefix",
      render: (value) => (
        <Text code className="text-xs">
          {value}
        </Text>
      ),
    },
    {
      title: "Last Used",
      dataIndex: "last_used_at",
      key: "last_used_at",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Expires At",
      dataIndex: "expires_at",
      key: "expires_at",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "ไม่กำหนด",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isExpired =
          record.expires_at && dayjs(record.expires_at).isBefore(dayjs());

        if (!record.is_active) {
          return <Tag color="red">Revoked</Tag>;
        }

        if (isExpired) {
          return <Tag color="orange">Expired</Tag>;
        }

        return <Tag color="green">Active</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const disabled = !record.is_active;

        return (
          <Space>
            <Popconfirm
              title="ยืนยันการ Revoke Token"
              description="เมื่อ revoke แล้ว token นี้จะใช้งานไม่ได้อีก"
              okText="Revoke"
              cancelText="ยกเลิก"
              onConfirm={() => handleRevokeToken(record)}
              disabled={disabled || !canRevoke}
            >
              <Button danger size="small" disabled={disabled || !canRevoke}>
                Revoke
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">API Tokens</h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการ Token สำหรับระบบที่เชื่อมต่อ API ของ Employee Master
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            allowClear
            placeholder="ค้นหา Token / Client / Prefix"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[280px]"
          />

          {canCreate && (
            <Button type="primary" onClick={handleOpenCreate}>
              + Generate Token
            </Button>
          )}
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredTokens}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
        }}
        scroll={{ x: 900 }}
      />

      {mounted && canCreate && (
        <>
          <Modal
            title="Generate API Token"
            open={openCreateModal}
            onCancel={handleCloseCreateModal}
            onOk={handleCreateToken}
            afterOpenChange={handleAfterCreateModalOpenChange}
            okText="Generate"
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
            <Form form={form} layout="vertical">
              <Form.Item
                name="client_id"
                label="API Client"
                rules={[{ required: true, message: "กรุณาเลือก API Client" }]}
              >
                <Select
                  loading={clientsLoading}
                  placeholder="เลือก Client"
                  options={clients
                    .filter((item) => item.is_active)
                    .map((item) => ({
                      label: `${item.client_name} (${item.client_code})`,
                      value: item.id,
                    }))}
                />
              </Form.Item>

              <Form.Item
                name="token_name"
                label="Token Name"
                rules={[{ required: true, message: "กรุณากรอกชื่อ Token" }]}
              >
                <Input placeholder="เช่น HRM Production / Payroll Server" />
              </Form.Item>

              <Form.Item name="expires_at" label="Expires At">
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                  placeholder="ไม่กำหนดวันหมดอายุ"
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Token ถูกสร้างเรียบร้อยแล้ว"
            open={createdTokenModal}
            onCancel={handleCloseCreatedTokenModal}
            destroyOnHidden
            mask={{ closable: false }}
            styles={{
              mask: {
                backgroundColor: "rgba(15, 23, 42, 0.35)",
              },
            }}
            footer={[
              <Button key="close" onClick={handleCloseCreatedTokenModal}>
                ปิด
              </Button>,
              <Button key="copy" type="primary" onClick={handleCopyToken}>
                Copy Token
              </Button>,
            ]}
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                กรุณาคัดลอก Token นี้เก็บไว้ทันที เพราะระบบจะแสดงให้เห็นเพียงครั้งเดียว
              </div>

              <Paragraph
                copyable={{ text: plainToken }}
                className="!mb-0 rounded-2xl bg-slate-900 p-4 !text-slate-100"
              >
                <span className="break-all font-mono text-sm">
                  {plainToken}
                </span>
              </Paragraph>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}