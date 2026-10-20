"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography } from "antd";
import RecruitmentBreadcrumb from "../../components/RecruitmentBreadcrumb";
import { actions } from "../../lib/activity/policy";
import { activityStatuses } from "../../lib/activity/report";

const emptyFilters = { date_from: "", date_to: "", action: "", status: "", user_search: "", page_path: "" };
const colors = { SUCCESS: "green", FAILED: "red", OBSERVED: "blue", REQUESTED: "gold" };
const show = (value) => value || "-";
const columns = [
  { title: "วันเวลา (Bangkok)", dataIndex: "created_at_bangkok", width: 190 },
  { title: "ผู้ใช้งาน", width: 220, render: (_, row) => <><div>{show(row.username)}</div>{row.employee_name && <Typography.Text type="secondary" style={{ fontSize: 12, overflowWrap: "anywhere" }}>{row.employee_name}</Typography.Text>}</> },
  { title: "กิจกรรม", dataIndex: "action", width: 180 },
  { title: "สถานะ", dataIndex: "status", width: 130, render: (value) => <Tag color={colors[value]}>{show(value)}</Tag> },
  { title: "หน้าใช้งาน", dataIndex: "page_path", width: 300, render: show },
  { title: "ประเภทข้อมูล", dataIndex: "resource_type", width: 170, render: show },
  { title: "รหัสข้อมูล", dataIndex: "resource_id", width: 280, render: show },
  { title: "IP Address", dataIndex: "ip_address", width: 180, render: show },
];

export default function ActivityLogsReport() {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState({ ...emptyFilters, page: 1, pageSize: 20 });
  const [result, setResult] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const change = (key, value) => setDraft((previous) => ({ ...previous, [key]: value || "" }));

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) if (value !== "") params.set(key, String(value));
        const response = await fetch(`/recruitment/api/report/activity_logs?${params}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message || "ไม่สามารถโหลดรายงานได้");
        if (!controller.signal.aborted) setResult(body);
      } catch (failure) {
        if (!controller.signal.aborted) { setResult({ data: [], total: 0 }); setError(failure.message || "ไม่สามารถโหลดรายงานได้"); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [filters, revision]);

  return (
    <div className="space-y-5">
      <RecruitmentBreadcrumb items={[{ label: "รายงาน", href: "/recruitment/report/index" }, { label: "Activity logs" }]} />
      <div>
        <Typography.Title level={2}>รายงานกิจกรรมการใช้งาน</Typography.Title>
        <Typography.Text type="secondary">วันเวลาและช่วงวันที่ใช้ Asia/Bangkok (UTC+07:00)</Typography.Text>
      </div>
      <Card>
        <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, page: 1, pageSize: filters.pageSize }); }}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label>วันที่เริ่มต้น<Input aria-label="วันที่เริ่มต้น" type="date" value={draft.date_from} onChange={(event) => change("date_from", event.target.value)} /></label>
            <label>วันที่สิ้นสุด<Input aria-label="วันที่สิ้นสุด" type="date" value={draft.date_to} onChange={(event) => change("date_to", event.target.value)} /></label>
            <label>กิจกรรม<Select aria-label="กิจกรรม" className="w-full" allowClear placeholder="ทุกกิจกรรม" value={draft.action || undefined} options={actions.map((value) => ({ label: value, value }))} onChange={(value) => change("action", value)} /></label>
            <label>สถานะ<Select aria-label="สถานะ" className="w-full" allowClear placeholder="ทุกสถานะ" value={draft.status || undefined} options={activityStatuses.map((value) => ({ label: value, value }))} onChange={(value) => change("status", value)} /></label>
            <label>ผู้ใช้งาน<Input aria-label="ค้นหาผู้ใช้งาน" allowClear maxLength={100} value={draft.user_search} onChange={(event) => change("user_search", event.target.value)} placeholder="Username, ชื่อไทย หรือชื่ออังกฤษ" /></label>
            <label>หน้าใช้งาน (ตรงตามเส้นทาง)<Input aria-label="หน้าใช้งาน" allowClear value={draft.page_path} onChange={(event) => change("page_path", event.target.value)} placeholder="/recruitment/candidate" /></label>
          </div>
          <Space className="mt-4" wrap>
            <Button type="primary" htmlType="submit">ค้นหา</Button>
            <Button onClick={() => { setDraft(emptyFilters); setFilters({ ...emptyFilters, page: 1, pageSize: filters.pageSize }); }}>ล้างตัวกรอง</Button>
            <Button onClick={() => setRevision((value) => value + 1)} loading={loading}>รีเฟรช</Button>
          </Space>
        </form>
      </Card>
      {error && <Alert type="error" showIcon title={error} />}
      <Card>
        <Table rowKey="id" columns={columns} dataSource={result.data} loading={loading} scroll={{ x: 1650 }} locale={{ emptyText: "ไม่พบกิจกรรมตามเงื่อนไขที่เลือก" }}
          pagination={{ current: filters.page, pageSize: filters.pageSize, total: result.total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total) => `ทั้งหมด ${total.toLocaleString("th-TH")} รายการ`, onChange: (page, pageSize) => setFilters((previous) => ({ ...previous, page: pageSize !== previous.pageSize ? 1 : page, pageSize })) }} />
      </Card>
    </div>
  );
}
