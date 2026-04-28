"use client";

import { useEffect, useState } from "react";
import {Table,Card,Input,Select,DatePicker,Button,Space,Tag,Modal,Typography,message,} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;

function prettyJson(value) {
  if (!value) return "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getStatusTag(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return <Tag color="green">{statusCode}</Tag>;
  if (statusCode >= 300 && statusCode < 400) return <Tag color="blue">{statusCode}</Tag>;
  if (statusCode >= 400 && statusCode < 500) return <Tag color="orange">{statusCode}</Tag>;
  if (statusCode >= 500) return <Tag color="red">{statusCode}</Tag>;
  return <Tag>{statusCode || "-"}</Tag>;
}

function getMethodTag(method) {
  const upper = String(method || "").toUpperCase();

  if (upper === "GET") return <Tag color="blue">GET</Tag>;
  if (upper === "POST") return <Tag color="green">POST</Tag>;
  if (upper === "PATCH") return <Tag color="orange">PATCH</Tag>;
  if (upper === "PUT") return <Tag color="gold">PUT</Tag>;
  if (upper === "DELETE") return <Tag color="red">DELETE</Tag>;

  return <Tag>{upper || "-"}</Tag>;
}

export default function ApiLogsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState();
  const [methodFilter, setMethodFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [dateRange, setDateRange] = useState(null);

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // lazy load 
  const [clientLoading, setClientLoading] = useState(false);
  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [clientKeyword, setClientKeyword] = useState("");


  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "api_logs.view");

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

  const fetchClients = async (keyword = "", page = 1, append = false) => {
    try {
      setClientLoading(true);

      const params = new URLSearchParams();
      params.set("search", keyword);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/api-clients?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "โหลด API Clients ไม่สำเร็จ");
      }

      setClients((prev) =>
        append ? [...prev, ...(json.data || [])] : json.data || []
      );

      setClientPage(json.pagination?.page || page);
      setClientTotalPages(json.pagination?.totalPages || 1);
    } catch (error) {
      message.error(error.message || "โหลด API Clients ไม่สำเร็จ");
    } finally {
      setClientLoading(false);
    }
  };

  const fetchLogs = async (nextPage = page, nextPageSize = pageSize) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      if (search.trim()) params.set("search", search.trim());
      if (clientFilter) params.set("client_id", clientFilter);
      if (methodFilter) params.set("method", methodFilter);
      if (statusFilter) params.set("status", statusFilter);

      if (dateRange?.[0]) {
        params.set("date_from", dateRange[0].startOf("day").toISOString());
      }

      if (dateRange?.[1]) {
        params.set("date_to", dateRange[1].endOf("day").toISOString());
      }

      const res = await fetch(`/api/admin/api-logs?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "โหลด API Logs ไม่สำเร็จ");
      }

      setLogs(json.data || []);
      setTotal(json.pagination?.total || 0);
      setPage(json.pagination?.page || nextPage);
      setPageSize(json.pagination?.pageSize || nextPageSize);
    } catch (error) {
      message.error(error.message || "โหลด API Logs ไม่สำเร็จ");
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
    if (loadingUser) return;
    if (!user) return;
    if (!canView) return;

    fetchLogs(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser, canView, search, clientFilter, methodFilter, statusFilter, dateRange]);

  const handleResetFilters = () => {
    setSearch("");
    setClientFilter(undefined);
    setMethodFilter(undefined);
    setStatusFilter(undefined);
    setDateRange(null);
  };

  const handleOpenDetail = (record) => {
    setSelectedLog(record);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  const handleAfterDetailOpenChange = (open) => {
    if (!open) {
      setSelectedLog(null);
    }
  };

  const columns = [
    {
      title: "เวลา",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm:ss") : "-",
    },
    {
      title: "Client",
      key: "client",
      width: 180,
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
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 100,
      render: (value) => getMethodTag(value),
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      ellipsis: true,
      render: (value) => (
        <Text className="font-mono text-xs text-slate-700">{value || "-"}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status_code",
      key: "status_code",
      width: 110,
      render: (value) => getStatusTag(value),
    },
    {
      title: "IP",
      dataIndex: "request_ip",
      key: "request_ip",
      width: 150,
      render: (value) => (
        <span className="text-xs text-slate-600">{value || "-"}</span>
      ),
    },
    {
      title: "ผลลัพธ์",
      dataIndex: "is_success",
      key: "is_success",
      width: 110,
      render: (value) =>
        value ? <Tag color="green">Success</Tag> : <Tag color="red">Error</Tag>,
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      render: (_, record) => (
        <Button size="small" onClick={() => handleOpenDetail(record)}>
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <Card
        variant="borderless"
        className="rounded-3xl border border-slate-200 shadow-sm"
      >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">API Logs</h1>
            <p className="mt-1 text-sm text-slate-500">
              ตรวจสอบการเรียกใช้งาน API จากระบบภายนอก
            </p>
          </div>

          <Button onClick={() => fetchLogs(page, pageSize)}>Refresh</Button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <Input
            allowClear
            placeholder="ค้นหา endpoint, client, ip, status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            showSearch
            allowClear
            placeholder="เลือก Client"
            value={clientFilter}
            filterOption={false}
            onSearch={(value) => {
              setClientKeyword(value);
              setClientPage(1);
              fetchClients(value, 1, false);
            }}
            onPopupScroll={(e) => {
              const target = e.target;

              const isBottom =
                target.scrollTop + target.offsetHeight >= target.scrollHeight - 20;

              if (isBottom && !clientLoading && clientPage < clientTotalPages) {
                fetchClients(clientKeyword, clientPage + 1, true);
              }
            }}
            onFocus={() => {
              if (clients.length === 0) {
                setClientKeyword("");
                setClientPage(1);
                fetchClients("", 1, false);
              }
            }}
            onChange={setClientFilter}
            notFoundContent={
              clientLoading ? "กำลังโหลด..." : "ไม่พบข้อมูล"
            }
            options={clients.map((item) => ({
              label: `${item.client_name} (${item.client_code})`,
              value: item.id,
            }))}
          />

          <Select
            allowClear
            placeholder="เลือก Method"
            value={methodFilter}
            onChange={setMethodFilter}
            options={[
              { label: "GET", value: "GET" },
              { label: "POST", value: "POST" },
              { label: "PATCH", value: "PATCH" },
              { label: "PUT", value: "PUT" },
              { label: "DELETE", value: "DELETE" },
            ]}
          />

          <Select
            allowClear
            placeholder="เลือกสถานะ"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Success", value: "success" },
              { label: "Error", value: "error" },
            ]}
          />

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            className="w-full"
          />
        </div>

        <div className="mb-4 flex justify-end">
          <Space>
            <Button onClick={handleResetFilters}>ล้างตัวกรอง</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={logs}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (totalRows) => `ทั้งหมด ${totalRows} รายการ`,
            onChange: (nextPage, nextPageSize) => {
              fetchLogs(nextPage, nextPageSize);
            },
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {mounted && (
        <Modal
          title="รายละเอียด API Log"
          open={detailOpen}
          onCancel={handleCloseDetail}
          afterOpenChange={handleAfterDetailOpenChange}
          footer={[
            <Button key="close" onClick={handleCloseDetail}>
              ปิด
            </Button>,
          ]}
          width={900}
          destroyOnHidden
          forceRender
          mask={{ closable: false }}
          styles={{
            mask: {
              backgroundColor: "rgba(15, 23, 42, 0.35)",
            },
          }}
        >
          {selectedLog && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    ข้อมูลทั่วไป
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">เวลา:</span>{" "}
                      {selectedLog.created_at
                        ? dayjs(selectedLog.created_at).format(
                            "DD/MM/YYYY HH:mm:ss"
                          )
                        : "-"}
                    </div>
                    <div>
                      <span className="font-medium">Client:</span>{" "}
                      {selectedLog.client?.client_name || "-"}{" "}
                      {selectedLog.client?.client_code
                        ? `(${selectedLog.client.client_code})`
                        : ""}
                    </div>
                    <div>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedLog.method || "-"}
                    </div>
                    <div>
                      <span className="font-medium">Endpoint:</span>{" "}
                      {selectedLog.endpoint || "-"}
                    </div>
                    <div>
                      <span className="font-medium">Status Code:</span>{" "}
                      {selectedLog.status_code || "-"}
                    </div>
                    <div>
                      <span className="font-medium">Success:</span>{" "}
                      {selectedLog.is_success ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">IP:</span>{" "}
                      {selectedLog.request_ip || "-"}
                    </div>
                    <div>
                      <span className="font-medium">User Agent:</span>{" "}
                      {selectedLog.user_agent || "-"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    Error Message
                  </div>
                  <Paragraph className="!mb-0 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">
                    {selectedLog.error_message || "-"}
                  </Paragraph>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Request Query
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                  {prettyJson(selectedLog.request_query)}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Request Body
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                  {prettyJson(selectedLog.request_body)}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Response Body
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                  {prettyJson(selectedLog.response_body)}
                </pre>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}