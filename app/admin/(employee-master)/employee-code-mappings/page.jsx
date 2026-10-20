"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography,Flex } from "antd";
import { DownloadOutlined, ReloadOutlined, SearchOutlined , ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const PAGE_SIZE = 20;
const fmtDate = value => value ? new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "-";

export default function EmployeeCodeMappingsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "data.import.view");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => { const t = setTimeout(() => { setKeyword(search.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
  const params = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), status });
    if (keyword) p.set("search", keyword);
    return p;
  }, [page, status, keyword]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    (async () => {
      try {
        const r = await fetch(`/api/admin/employee-code-mappings?${params()}`, { cache: "no-store", signal: controller.signal });
        const json = await r.json();
        if (!r.ok || !json.success) throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
        if (!controller.signal.aborted) { setRows(json.data || []); setTotal(json.pagination?.total || 0); }
      } catch (e) { if (!controller.signal.aborted) { setError(e.message); setRows([]); setTotal(0); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [user, canView, loadingUser, params, refresh]);

  async function exportCsv() {
    setExporting(true); setError("");
    try {
      const p = params(); p.set("format", "csv");
      const r = await fetch(`/api/admin/employee-code-mappings?${p}`, { cache: "no-store" });
      if (!r.ok) throw new Error("ส่งออกข้อมูลไม่สำเร็จ");
      const blob = await r.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "employee-code-mappings.csv";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); } finally { setExporting(false); }
  }

  const columns = [
    { title: "รหัสพนักงานเก่า", dataIndex: "old_employee_code", width: 160, render: v => <Text strong>{v || "-"}</Text> },
    { title: "รหัสพนักงานใหม่ (HRMS)", dataIndex: "new_employee_code", width: 205, render: v => v ? <Text strong copyable={{ text: v }}>{v}</Text> : <Text type="secondary">รอสร้างรหัส</Text> },
    { title: "ชื่อ–นามสกุล", dataIndex: "employee_name", width: 210 },
    { title: "สถานะ", dataIndex: "status", width: 135, render: v => <Tag color={v === "imported" ? "green" : v === "failed" || v === "invalid" ? "red" : "blue"}>{v || "-"}</Tag> },
    { title: "ไฟล์นำเข้า", dataIndex: "file_name", ellipsis: true, width: 220 },
    { title: "วันที่บันทึก", dataIndex: "imported_at", width: 190, render: fmtDate },
  ];

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return <Alert type="warning" title="ไม่มีสิทธิ์เข้าถึงข้อมูลเทียบรหัสพนักงาน" showIcon />;
  return <div style={{ padding: 20 }}>
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Flex
        justify="space-between"
        align="center"
        gap={16}
        wrap="wrap"
      >
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            เปรียบเทียบรหัสพนักงานเก่า - ใหม่
          </Title>

          <Text type="secondary">
            Employee Code Mapping •
            ตรวจสอบรหัสพนักงานเดิมและรหัสใหม่ในระบบ HRMS
            (อ่านอย่างเดียว)
          </Text>
        </div>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/admin/data-import")}
        >
          กลับไปหน้าการนำเข้าข้อมูลพนักงาน
        </Button>
      </Flex>
      
      
      
      <Card>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input style={{ width: 300 }} allowClear prefix={<SearchOutlined />} placeholder="ค้นหารหัสเก่า / ใหม่ / ชื่อ / ไฟล์" value={search} onChange={e => setSearch(e.target.value)} />
            <Select style={{ width: 165 }} value={status} onChange={v => { setStatus(v); setPage(1); }} options={[{ value: "all", label: "ทุกสถานะ" }, { value: "imported", label: "นำเข้าสำเร็จ" }, { value: "pending", label: "รอดำเนินการ" }]} />
          </Space>
          <Space><Button icon={<ReloadOutlined />} onClick={() => setRefresh(n => n + 1)}>รีเฟรช</Button><Button type="primary" icon={<DownloadOutlined />} loading={exporting} onClick={exportCsv}>Export Excel (CSV)</Button></Space>
        </Space>
      </Card>
      {error && <Alert type="error" title={error} showIcon />}
      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} scroll={{ x: 1150 }} pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: setPage, showTotal: n => `ทั้งหมด ${n.toLocaleString("th-TH")} รายการ` }} />
      </Card>
    </Space>
  </div>;
}
