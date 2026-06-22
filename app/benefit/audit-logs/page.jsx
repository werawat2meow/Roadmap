"use client";

import { useEffect, useState } from "react";
import {Card,Table,Tag,Button,Space,Input,Select,DatePicker,Drawer,Descriptions,Typography,message,} from "antd";
import {ReloadOutlined,EyeOutlined,AuditOutlined,} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;

const ACTION_OPTIONS = [
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Generate", value: "generate" },
  { label: "Approve", value: "approve" },
  { label: "Reject", value: "reject" },
  { label: "Reverse", value: "reverse" },
  { label: "Export", value: "export" },
];

const MODULE_OPTIONS = [
  { label: "Benefit", value: "benefit" },
  { label: "Category", value: "category" },
  { label: "Rule", value: "rule" },
  { label: "Policy", value: "policy" },
  { label: "Entitlement", value: "entitlement" },
  { label: "Request", value: "request" },
  { label: "Approval", value: "approval" },
  { label: "Usage", value: "usage" },
  { label: "Report", value: "report" },
];

export default function BenefitAuditLogsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [actionType, setActionType] = useState("");
  const [dateRange, setDateRange] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [selectedRow, setSelectedRow] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canView =
    hasPermission(user, "benefit.audit.view") ||
    hasPermission(user, "benefit.audit.manage");

  const buildParams = ({
    nextPage = page,
    nextPageSize = pageSize,
    nextSearch = search,
    nextModuleName = moduleName,
    nextActionType = actionType,
    nextDateRange = dateRange,
  } = {}) => {
    const params = new URLSearchParams();

    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));

    if (nextSearch) params.set("search", nextSearch);
    if (nextModuleName) params.set("module_name", nextModuleName);
    if (nextActionType) params.set("action_type", nextActionType);

    if (nextDateRange?.[0]) {
      params.set("dateFrom", nextDateRange[0].format("YYYY-MM-DD"));
    }

    if (nextDateRange?.[1]) {
      params.set("dateTo", nextDateRange[1].format("YYYY-MM-DD"));
    }

    return params;
  };

  const loadData = async (options = {}) => {
    try {
      setLoading(true);

      const params = buildParams(options);

      const res = await fetch(`/api/benefits/audit-logs?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลด Audit Logs ไม่สำเร็จ");
      }

      setRows(json.data || []);
      setPage(json.page || 1);
      setPageSize(json.pageSize || 20);
      setTotal(json.total || 0);
    } catch (error) {
      console.error("LOAD_AUDIT_LOGS_ERROR:", error);
      message.error(error?.message || "โหลด Audit Logs ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadData({
        nextPage: 1,
        nextPageSize: 20,
      });
    }
  }, [canView]);

  const getActionColor = (action) => {
    switch (action) {
      case "create":
        return "green";
      case "update":
        return "blue";
      case "delete":
        return "red";
      case "approve":
        return "green";
      case "reject":
        return "red";
      case "reverse":
        return "purple";
      case "generate":
        return "gold";
      case "export":
        return "cyan";
      default:
        return "default";
    }
  };

  const formatJson = (value) => {
    if (!value) return "-";

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const columns = [
    {
      title: "Date / Time",
      dataIndex: "created_at",
      width: 180,
      fixed: "left",
      render: (value) =>
        value ? new Date(value).toLocaleString("th-TH") : "-",
    },
    {
      title: "Module",
      dataIndex: "module_name",
      width: 140,
      render: (value) => <Tag>{value || "-"}</Tag>,
    },
    {
      title: "Action",
      dataIndex: "action_type",
      width: 130,
      render: (value) => (
        <Tag color={getActionColor(value)}>{value || "-"}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      width: 360,
      render: (value) => value || "-",
    },
    {
      title: "User",
      dataIndex: "created_by_name",
      width: 180,
      render: (value) => value || "-",
    },
    {
      title: "Reference",
      width: 220,
      render: (_, record) => (
        <div>
          <div>{record.ref_table || "-"}</div>
          <Text type="secondary" className="text-xs">
            {record.ref_id || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "IP",
      dataIndex: "ip_address",
      width: 150,
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRow(record);
            setDetailOpen(true);
          }}
        >
          ดู
        </Button>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์ดู Audit Logs
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2 text-lg font-bold">
            <AuditOutlined className="text-emerald-600" />
            Benefit Audit Logs
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() =>
              loadData({
                nextPage: page,
                nextPageSize: pageSize,
              })
            }
          >
            Refresh
          </Button>
        }
      >
        <Space className="mb-4" wrap>
          <Input.Search
            placeholder="ค้นหา Module, Action, Description, User"
            allowClear
            style={{ width: 320 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={(value) => {
              setSearch(value || "");
              setPage(1);
              loadData({
                nextPage: 1,
                nextSearch: value || "",
              });
            }}
          />

          <Select
            allowClear
            placeholder="Module"
            style={{ width: 180 }}
            value={moduleName || undefined}
            onChange={(value) => {
              const nextValue = value || "";
              setModuleName(nextValue);
              setPage(1);
              loadData({
                nextPage: 1,
                nextModuleName: nextValue,
              });
            }}
            options={MODULE_OPTIONS}
          />

          <Select
            allowClear
            placeholder="Action"
            style={{ width: 180 }}
            value={actionType || undefined}
            onChange={(value) => {
              const nextValue = value || "";
              setActionType(nextValue);
              setPage(1);
              loadData({
                nextPage: 1,
                nextActionType: nextValue,
              });
            }}
            options={ACTION_OPTIONS}
          />

          <RangePicker
            value={dateRange}
            onChange={(value) => {
              setDateRange(value);
              setPage(1);
              loadData({
                nextPage: 1,
                nextDateRange: value,
              });
            }}
          />
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
            showTotal: (value) => `ทั้งหมด ${value.toLocaleString()} รายการ`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
              loadData({
                nextPage,
                nextPageSize,
              });
            },
          }}
        />
      </Card>

      <Drawer
        title="Audit Log Detail"
        open={detailOpen}
        styles={{ wrapper: { width: 780 } }}
        onClose={() => setDetailOpen(false)}
        destroyOnHidden
      >
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Date">
            {selectedRow?.created_at
              ? new Date(selectedRow.created_at).toLocaleString("th-TH")
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Module">
            {selectedRow?.module_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Action">
            <Tag color={getActionColor(selectedRow?.action_type)}>
              {selectedRow?.action_type || "-"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Description">
            {selectedRow?.description || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="User">
            {selectedRow?.created_by_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Reference">
            {selectedRow?.ref_table || "-"} / {selectedRow?.ref_id || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="IP Address">
            {selectedRow?.ip_address || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="User Agent">
            <Paragraph copyable className="m-0">
              {selectedRow?.user_agent || "-"}
            </Paragraph>
          </Descriptions.Item>

          <Descriptions.Item label="Old Data">
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-white">
              {formatJson(selectedRow?.old_data)}
            </pre>
          </Descriptions.Item>

          <Descriptions.Item label="New Data">
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-white">
              {formatJson(selectedRow?.new_data)}
            </pre>
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </div>
  );
}