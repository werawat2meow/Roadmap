"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Col, DatePicker, Descriptions, Drawer, Empty, Input, Row, Select, Space, Table, Tag, Typography } from "antd";
import { AuditOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";

const { Title, Text } = Typography;
const PAGE_SIZE = 20;
const DATE_FORMAT = "YYYY-MM-DD";

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function displayJson(value) {
  if (value == null) return "-";
  try { return JSON.stringify(value, null, 2); } catch { return "-"; }
}

async function getJson(response) {
  const body = await response.text();
  const result = body ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : {};
  if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`);
  return result;
}

function formatIpAddress(value) {
  if (!value) return "-";

  const ip = String(value).trim();

  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }

  if (ip === "::1") {
    return "Localhost";
  }

  return ip;
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "access.activity_logs.view");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(undefined);
  const [actionFilter, setActionFilter] = useState(undefined);
  const [systemFilter, setSystemFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [systems, setSystems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [dates, setDates] = useState(null);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loadingUser && !user) router.replace("/login");
    else if (!loadingUser && user && !canView) router.replace("/admin");
  }, [loadingUser, user, canView, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    const controller = new AbortController();
    setOptionsLoading(true);
    setOptionsError("");
    getJsonResult();
    async function getJsonResult() {
      try {
        const response = await fetch("/api/admin/activity-logs/options", { cache: "no-store", signal: controller.signal });
        const json = await getJson(response);
        if (!controller.signal.aborted) {
          setModules(Array.isArray(json?.data?.modules) ? json.data.modules : []);
          setActions(Array.isArray(json?.data?.actions) ? json.data.actions : []);
          setSystems(Array.isArray(json?.data?.systems) ? json.data.systems : []);
          setStatuses(Array.isArray(json?.data?.statuses) ? json.data.statuses : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) setOptionsError(err.message || "โหลดตัวกรองไม่สำเร็จ");
      } finally {
        if (!controller.signal.aborted) setOptionsLoading(false);
      }
    }
    return () => controller.abort();
  }, [loadingUser, user, canView, refreshKey]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (moduleFilter) params.set("module_name", moduleFilter);
    if (actionFilter) params.set("action_type", actionFilter);
    if (systemFilter) params.set("system_code", systemFilter);
    if (statusFilter) params.set("event_status", statusFilter);
    if (dates?.[0]) params.set("date_from", dates[0].format(DATE_FORMAT));
    if (dates?.[1]) params.set("date_to", dates[1].format(DATE_FORMAT));
    setLoading(true);
    setError("");
    (async () => {
      try {
        const response = await fetch(`/api/admin/activity-logs?${params}`, { cache: "no-store", signal: controller.signal });
        const json = await getJson(response);
        if (!controller.signal.aborted) {
          setLogs(Array.isArray(json.data) ? json.data : []);
          setTotal(Number(json.pagination?.total) || 0);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "โหลด Activity Logs ไม่สำเร็จ");
          setLogs([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [loadingUser, user, canView, page, debouncedSearch, moduleFilter, actionFilter, systemFilter, statusFilter, dates, refreshKey]);

  const resetPage = useCallback(() => setPage(1), []);
  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (moduleFilter) params.set("module_name", moduleFilter);
    if (actionFilter) params.set("action_type", actionFilter);
    if (systemFilter) params.set("system_code", systemFilter);
    if (statusFilter) params.set("event_status", statusFilter);
    if (dates?.[0]) params.set("date_from", dates[0].format(DATE_FORMAT));
    if (dates?.[1]) params.set("date_to", dates[1].format(DATE_FORMAT));
    setExporting(true);
    try {
      const response = await fetch(`/api/admin/activity-logs/export?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await getJson(response)).error || "Export ล้มเหลว");
      const blob = await response.blob();
      const href = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = href;
      a.download = `hrms-audit-${dayjs().format("YYYY-MM-DD")}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(href);
      setRefreshKey(key => key + 1);
    } catch (err) { setError(err.message || "Export ไม่สำเร็จ"); } finally { setExporting(false); }
  };
  const columns = useMemo(() => [
    { title: "วันที่ / เวลา", dataIndex: "created_at", key: "created_at", width: 185, render: formatTime },
    { title: "ผู้ใช้งาน", dataIndex: "username", width: 160, render: v => v || "-" },
    { title: "System", dataIndex: "system_code", width: 130, render: v => v || "-" },
    { title: "Status", dataIndex: "event_status", width: 130, render: v => <Tag color={v === "SUCCESS" ? "green" : v === "DENIED" || v === "FAILED" ? "red" : "default"}>{v || "-"}</Tag> },
    { title: "Module", dataIndex: "module_name", key: "module_name", width: 170, render: value => <Text strong>{value || "-"}</Text> },
    { title: "Action", dataIndex: "action_type", key: "action_type", width: 140, render: value => <Tag color={value === "delete" ? "red" : value === "create" ? "green" : value === "update" ? "gold" : "default"}>{value || "-"}</Tag> },
    { title: "IP Address", dataIndex: "ip_address", key: "ip_address", width: 165, render: formatIpAddress,},
    { title: "รายละเอียด", dataIndex: "description", key: "description",width: 400, ellipsis: true, render: value => value || "-" },
    { title: "ตารางอ้างอิง", dataIndex: "reference_table", key: "reference_table", width: 155, render: value => value || "-" },
    { title: "ตรวจสอบ", key: "details", width: 110, fixed: "right", render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedLog(row)}>ดูข้อมูล</Button> },
  ], []);

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  return (
    <div style={{ padding: "20px 20px 44px", maxWidth: 1600, margin: "0 auto" }}>
      <Space orientation="vertical" size={18} style={{ width: "100%" }}>
        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col><Title level={3} style={{ marginBottom: 4 }}><AuditOutlined /> Activity Logs</Title><Text type="secondary">ตรวจสอบการทำรายการในระบบตามสิทธิ์ที่ได้รับ</Text></Col>
          <Col><Space><Button onClick={() => router.push("/admin")}>กลับหน้า Admin</Button><Button icon={<ReloadOutlined />} onClick={() => setRefreshKey(key => key + 1)} loading={loading}>รีเฟรช</Button><Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={exportCsv}>Export CSV</Button></Space></Col>
        </Row>
        <Card style={{ borderRadius: 16 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}><Input allowClear prefix={<SearchOutlined />} placeholder="ค้นหา Module / Action / รายละเอียด" value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} /></Col>
            <Col xs={24} sm={12} md={5}><Select showSearch optionFilterProp="label" allowClear placeholder="ทุก Module" loading={optionsLoading} options={modules} value={moduleFilter} onChange={value => { setModuleFilter(value); resetPage(); }} style={{ width: "100%" }} /></Col>
            <Col xs={24} sm={12} md={5}><Select showSearch optionFilterProp="label" allowClear placeholder="ทุก Action" loading={optionsLoading} options={actions} value={actionFilter} onChange={value => { setActionFilter(value); resetPage(); }} style={{ width: "100%" }} /></Col>
            <Col xs={24} sm={12} md={4}><Select allowClear showSearch optionFilterProp="label" placeholder="ทุกระบบ" options={systems} value={systemFilter} onChange={v => { setSystemFilter(v); resetPage(); }} style={{ width: "100%" }} /></Col>
            <Col xs={24} sm={12} md={4}><Select allowClear showSearch optionFilterProp="label" placeholder="ทุกสถานะ" options={statuses} value={statusFilter} onChange={v => { setStatusFilter(v); resetPage(); }} style={{ width: "100%" }} /></Col>
            <Col xs={24} md={6}><DatePicker.RangePicker value={dates} onChange={value => { setDates(value); resetPage(); }} style={{ width: "100%" }} format={DATE_FORMAT} /></Col>
          </Row>
          {optionsError && (
            <Alert
              showIcon
              type="warning"
              title={optionsError}
            />
          )}

          {error && (
            <Alert
              showIcon
              type="error"
              title={error}
            />
          )}
        </Card>
        {error && <Alert showIcon type="error" message={error} />}
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
          <Table rowKey="id" columns={columns} dataSource={logs} loading={loading} scroll={{ x: 1420 }} locale={{ emptyText: <Empty description="ไม่พบข้อมูล Log" /> }} pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: count => `ทั้งหมด ${count.toLocaleString("th-TH")} รายการ`, onChange: setPage }} />
        </Card>
      </Space>
      <Drawer title="รายละเอียด Activity Log" open={!!selectedLog} size={680} onClose={() => setSelectedLog(null)} destroyOnHidden>
        {selectedLog && <Space orientation="vertical" size={18} style={{ width: "100%" }}>
          <Descriptions bordered column={1} size="small" items={[
            { key: "date", label: "วันที่", children: formatTime(selectedLog.created_at) },
            { key: "module", label: "Module", children: selectedLog.module_name || "-" },
            { key: "action", label: "Action", children: selectedLog.action_type || "-" },
            { key: "user", label: "User", children: selectedLog.username || selectedLog.user_id || "-" },
            { key: "system", label: "System", children: selectedLog.system_code || "-" },
            { key: "status", label: "Status", children: selectedLog.event_status || "-" },
            { key: "role", label: "Role", children: selectedLog.role_code || "-" },
            { key: "ip", label: "IP", children: formatIpAddress(selectedLog.ip_address), },
            { key: "request", label: "Request ID", children: selectedLog.request_id || "-" },
            { key: "ref", label: "Reference", children: `${selectedLog.reference_table || "-"} / ${selectedLog.reference_id || "-"}` },
            { key: "description", label: "รายละเอียด", children: selectedLog.description || "-" },
          ]} />
          <Card size="small" title="ข้อมูลเดิม (Old Data)"><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 300, overflow: "auto" }}>{displayJson(selectedLog.old_data)}</pre></Card>
          <Card size="small" title="ข้อมูลใหม่ (New Data)"><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 300, overflow: "auto" }}>{displayJson(selectedLog.new_data)}</pre></Card>
        </Space>}
      </Drawer>
    </div>
  );
}
