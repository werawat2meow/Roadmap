"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Input,Modal,Select,Space,Table,Tag,message,} from "antd";
import {CheckCircleOutlined,CloseCircleOutlined,ReloadOutlined,EyeOutlined,EditOutlined,DeleteOutlined,PlusOutlined,} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState();
  const [search, setSearch] = useState("");

  const canView = hasPermission(user, "benefit.request.view") || hasPermission(user, "benefit.request.approve");
  const canCreate = hasPermission(user, "benefit.request.create");
  const canApprove = hasPermission(user, "benefit.request.approve");
  const canReject = hasPermission(user, "benefit.request.reject");
  const canEdit = hasPermission(user, "benefit.request.edit");
  const canDelete = hasPermission(user, "benefit.request.delete");

  const loadData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/benefits/approvals?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(json.data || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_APPROVALS_ERROR:", error);
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const updateStatus = (record, status) => {
    const actionText = status === "approved" ? "อนุมัติ" : "ปฏิเสธ";

    Modal.confirm({
      title: `ยืนยันการ${actionText}`,
      content: `ต้องการ${actionText}คำขอ ${record.request_no || "-"} ใช่หรือไม่?`,
      okText: actionText,
      cancelText: "ยกเลิก",
      okButtonProps: {
        danger: status === "rejected",
      },
      async onOk() {
        try {
          const res = await fetch("/api/benefits/approvals", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              request_id: record.id,
              status,
            }),
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "อัปเดตสถานะไม่สำเร็จ");
          }

          message.success("อัปเดตสถานะสำเร็จ");
          loadData();
        } catch (error) {
          console.error("UPDATE_APPROVAL_STATUS_ERROR:", error);
          message.error(error.message || "อัปเดตสถานะไม่สำเร็จ");
        }
      },
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบคำขอ",
      content: `ต้องการลบคำขอ ${record.request_no || "-"} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/approvals?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบข้อมูลไม่สำเร็จ");
          }

          message.success("ลบคำขอสำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_BENEFIT_REQUEST_ERROR:", error);
          message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "pending":
        return "gold";
      case "cancelled":
        return "default";
      default:
        return "blue";
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Request No",
        dataIndex: "request_no",
        width: 180,
        fixed: "left",
        render: (value) => value || "-",
      },
      {
        title: "Employee",
        width: 260,
        render: (_, record) => {
          const emp = record.employees;

          return (
            <div>
              <div className="font-semibold">
                {`${emp?.first_name_th || ""} ${emp?.last_name_th || ""}`.trim() ||
                  "-"}
              </div>
              <div className="text-xs text-slate-400">
                {emp?.employee_code || "-"}
              </div>
            </div>
          );
        },
      },
      {
        title: "Benefit",
        width: 240,
        render: (_, record) => record?.benefits?.benefit_name || "-",
      },
      {
        title: "Amount",
        dataIndex: "requested_amount",
        width: 160,
        render: (value) => (value ? Number(value).toLocaleString() : "-"),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 140,
        render: (value) => <Tag color={getStatusColor(value)}>{value || "-"}</Tag>,
      },
      {
        title: "Remark",
        dataIndex: "remark",
        width: 260,
        render: (value) => value || "-",
      },
      {
        title: "Created",
        dataIndex: "created_at",
        width: 180,
        render: (value) =>
          value ? new Date(value).toLocaleString("th-TH") : "-",
      },
      {
        title: "Actions",
        width: 440,
        fixed: "right",
        render: (_, record) => (
          <Space wrap>
            {canView && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => router.push(`/benefit/requests/${record.id}`)}
              >
                View
              </Button>
            )}

            {canEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => router.push(`/benefit/requests/${record.id}/edit`)}
              >
                Edit
              </Button>
            )}

            {canApprove && record.status === "pending" && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => updateStatus(record, "approved")}
              >
                Approve
              </Button>
            )}

            {canReject && record.status === "pending" && (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => updateStatus(record, "rejected")}
              >
                Reject
              </Button>
            )}

            {canDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                Delete
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canView, canEdit, canApprove, canReject, canDelete]
  );

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดูรายการอนุมัติ</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        variant="borderless"
        className="rounded-[24px] shadow-sm"
        title={<div className="text-lg font-bold">Benefit Approvals</div>}
        extra={
          <Space wrap>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/benefit/requests/create")}
              >
                Create Request
              </Button>
            )}

            <Input.Search
              placeholder="ค้นหา..."
              allowClear
              onSearch={(value) => {
                setSearch(value);
                setTimeout(loadData, 100);
              }}
            />

            <Select
              allowClear
              placeholder="Status"
              style={{ width: 160 }}
              onChange={(value) => {
                setStatusFilter(value);
                setTimeout(loadData, 100);
              }}
              options={[
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />

            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1900 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>
    </div>
  );
}