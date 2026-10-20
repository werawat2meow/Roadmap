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
  { title: "กิจกรรม", dataIndex: "action", width: 180, render: (value) => <Tag>{show(value)}</Tag> },
  { title: "สถานะ", dataIndex: "status", width: 130, render: (value) => <Tag color={colors[value]}>{show(value)}</Tag> },
  { title: "หน้าใช้งาน", dataIndex: "page_path", width: 300, render: show },
  // { title: "ประเภทข้อมูล", dataIndex: "resource_type", width: 170, render: show },
  // { title: "รหัสข้อมูล", dataIndex: "resource_id", width: 280, render: show },
  { title: "IP Address", dataIndex: "ip_address", width: 180, render: show },
];

export default function ActivityLogsReport() {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState({ ...emptyFilters, page: 1, pageSize: 20 });
  const [result, setResult] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [exporting, setExporting] = useState(false);
  const change = (key, value) => setDraft((previous) => ({ ...previous, [key]: value || "" }));

  async function exportExcel() {
    if (exporting) return;
    setExporting(true);
    setError("");
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== "" && key !== "page" && key !== "pageSize") params.set(key, String(value));
      }
      const response = await fetch(`/recruitment/api/report/activity_logs/export?${params}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "ไม่สามารถส่งออก Excel ได้");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "recruitment-activity-logs.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError(failure.message || "ไม่สามารถส่งออก Excel ได้"); }
    finally { setExporting(false); }
  }

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
    <main className="min-w-0 space-y-5">
      <RecruitmentBreadcrumb items={[{ label: "รายงาน", href: "/recruitment/report/index" }, { label: "Activity logs" }]} />
      <header className="rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">รายงานกิจกรรมการใช้งาน</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          ตรวจสอบประวัติการใช้งาน ผู้ดำเนินการ สถานะ และหน้าที่เกี่ยวข้อง
        </p>
        <p className="mt-3 text-xs font-medium text-slate-400">วันเวลาและช่วงวันที่อ้างอิง Asia/Bangkok (UTC+07:00)</p>
      </header>

      <Card className="w-full overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]" styles={{ body: { padding: 0 } }}>
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <Typography.Title level={2} style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>ตัวกรองรายงาน</Typography.Title>
          <Typography.Text type="secondary" className="mt-1 block">ระบุช่วงเวลา กิจกรรม สถานะ หรือผู้ใช้งานที่ต้องการตรวจสอบ</Typography.Text>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, page: 1, pageSize: filters.pageSize }); }}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">วันที่เริ่มต้น<Input className="mt-2" aria-label="วันที่เริ่มต้น" type="date" value={draft.date_from} onChange={(event) => change("date_from", event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">วันที่สิ้นสุด<Input className="mt-2" aria-label="วันที่สิ้นสุด" type="date" value={draft.date_to} onChange={(event) => change("date_to", event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">กิจกรรม<Select aria-label="กิจกรรม" className="mt-2 w-full" allowClear placeholder="ทุกกิจกรรม" value={draft.action || undefined} options={actions.map((value) => ({ label: value, value }))} onChange={(value) => change("action", value)} /></label>
            <label className="text-sm font-medium text-slate-700">สถานะ<Select aria-label="สถานะ" className="mt-2 w-full" allowClear placeholder="ทุกสถานะ" value={draft.status || undefined} options={activityStatuses.map((value) => ({ label: value, value }))} onChange={(value) => change("status", value)} /></label>
            <label className="text-sm font-medium text-slate-700">ผู้ใช้งาน<Input className="mt-2" aria-label="ค้นหาผู้ใช้งาน" allowClear maxLength={100} value={draft.user_search} onChange={(event) => change("user_search", event.target.value)} placeholder="Username, ชื่อไทย หรือชื่ออังกฤษ" /></label>
            <label className="text-sm font-medium text-slate-700">หน้าใช้งาน (ตรงตามเส้นทาง)<Input className="mt-2" aria-label="หน้าใช้งาน" allowClear value={draft.page_path} onChange={(event) => change("page_path", event.target.value)} placeholder="/recruitment/candidate" /></label>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
            <Space wrap size={[8, 8]}>
            <Button type="primary" htmlType="submit">ค้นหา</Button>
            <Button onClick={() => { setDraft(emptyFilters); setFilters({ ...emptyFilters, page: 1, pageSize: filters.pageSize }); }}>ล้างตัวกรอง</Button>
            <Button onClick={() => setRevision((value) => value + 1)} loading={loading}>รีเฟรช</Button>
            <Button onClick={exportExcel} loading={exporting} disabled={loading} title="ส่งออกทุกรายการตามตัวกรองที่กดค้นหาล่าสุด (สูงสุด 50,000 รายการ)">ส่งออก Excel</Button>
            </Space>
          </div>
        </form>
      </Card>

      {error && <Alert type="error" showIcon title={error} action={<Button loading={loading} onClick={() => setRevision((value) => value + 1)}>ลองอีกครั้ง</Button>} />}

      <Card className="w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]" styles={{ body: { padding: 0 } }}>
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
          <Typography.Title level={2} style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>ประวัติกิจกรรม</Typography.Title>
          <Typography.Text type="secondary" className="mt-1 block">
            {loading ? "กำลังโหลดข้อมูล..." : `พบ ${result.total.toLocaleString("th-TH")} รายการตามตัวกรองล่าสุด`}
          </Typography.Text>
        </div>
        <div className="p-4 sm:p-6">
          <Table rowKey="id" columns={columns} dataSource={result.data} loading={loading} scroll={{ x: 1650 }} locale={{ emptyText: "ไม่พบกิจกรรมตามเงื่อนไขที่เลือก" }}
            pagination={{ current: filters.page, pageSize: filters.pageSize, total: result.total, responsive: true, showLessItems: true, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total) => `ทั้งหมด ${total.toLocaleString("th-TH")} รายการ`, onChange: (page, pageSize) => setFilters((previous) => ({ ...previous, page: pageSize !== previous.pageSize ? 1 : page, pageSize })) }} />
        </div>
      </Card>
    </main>
  );
}
