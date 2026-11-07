"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { SwapOutlined, BankOutlined, DollarOutlined, PlusOutlined, RiseOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";

const { Title, Text } = Typography;
const TYPES = [
  { value: "ORG_TRANSFER", label: "ย้ายสังกัด", color: "blue", icon: <BankOutlined /> },
  { value: "POSITION_TRANSFER", label: "ย้ายตำแหน่ง", color: "purple", icon: <SwapOutlined /> },
  { value: "PROMOTION", label: "เลื่อนตำแหน่ง", color: "green", icon: <RiseOutlined /> },
  { value: "DEMOTION", label: "ลดตำแหน่ง", color: "orange", icon: <RiseOutlined rotate={180} /> },
  { value: "SALARY_ADJUSTMENT", label: "ปรับเงินเดือน", color: "cyan", icon: <DollarOutlined /> },
];
const ORG_FIELDS = [
  ["company_id", "บริษัท", "companies", "company_name_th"],
  ["branch_group_id", "กรุ๊ปสังกัด", "branch_groups", "group_name"],
  ["branch_id", "สังกัด/สาขา", "branches", "branch_name"],
  ["department_id", "แผนก", "departments", "department_name"],
  ["division_id", "ฝ่าย", "divisions", "division_name"],
  ["unit_id", "หน่วยงาน", "units", "unit_name"],
];
const JOB_FIELDS = [
  ["position_id", "ตำแหน่ง", "positions", "position_name"],
  ["position_level_id", "ระดับ P", "levels", "level_code"],
];
const opts = (arr, label) => (arr || []).map(x => ({ value: x.id, label: x[label] || x.id }));
async function request(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) throw new Error(json.error || `HTTP ${response.status}`);
  return json;
}
export default function EmployeeChangesPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  // Use the same permission helper and redirect convention as employee-statuses.
  const canView = hasPermission(user, "ems.employee_changes.view");
  const canCreate = hasPermission(user, "ems.employee_changes.create");
  const [data, setData] = useState({ employees: [], history: [], masters: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("ORG_TRANSFER");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form] = Form.useForm();
  const employeeId = Form.useWatch("employee_id", form);
  const selected = useMemo(() => data.employees.find(e => e.id === employeeId), [data.employees, employeeId]);
  const load = useCallback(async () => {
    if (loadingUser || !user || !canView) return;
    setLoading(true);
    try { setData(await request("/api/admin/employee-changes")); }
    catch (e) { message.error(e.message) } finally { setLoading(false) }
  }, [loadingUser, user, canView]);
  useEffect(() => {
    if (loadingUser) return;
    if (!user) { router.replace("/login"); return; }
    if (!canView) router.replace("/admin");
  }, [loadingUser, user, canView, router]);
  useEffect(() => { if (!loadingUser && user && canView) void load(); }, [load, loadingUser, user, canView]);
  const filtered = useMemo(() => data.history.filter(r => {
    const person = data.employees.find(e => e.id === r.employee_id);
    const text = `${person?.employee_code || ""} ${person?.first_name_th || ""} ${person?.last_name_th || ""}`.toLowerCase();
    return (filter === "ALL" || r.change_type === filter) && text.includes(search.toLowerCase());
  }), [data, filter, search]);
  const counts = useMemo(() => Object.fromEntries(TYPES.map(t => [t.value, data.history.filter(r => r.change_type === t.value).length])), [data.history]);
  function start(type = "ORG_TRANSFER") {
    if (!canCreate) { message.error("คุณไม่มีสิทธิ์บันทึกการเปลี่ยนแปลงพนักงาน"); return; }
    setKind(type); form.resetFields(); form.setFieldsValue({ change_type: type, effective_date: dayjs() }); setOpen(true);
  }
  async function submit(values) {
    if (!canCreate) { message.error("คุณไม่มีสิทธิ์บันทึกการเปลี่ยนแปลงพนักงาน"); return; }
    setSaving(true);
    try {
      const keys = kind === "ORG_TRANSFER" ? ORG_FIELDS : JOB_FIELDS;
      const changes = {}; for (const [field] of keys) if (values[field] !== undefined) changes[field] = values[field];
      const body = {
        employee_id: values.employee_id, change_type: kind, effective_date: values.effective_date.format("YYYY-MM-DD"), reason: values.reason,
        ...(kind === "SALARY_ADJUSTMENT" ? { new_salary: values.new_salary } : { changes })
      };
      const response = await request("/api/admin/employee-changes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      message.success(response.message); setOpen(false); form.resetFields(); await load();
    } catch (e) { message.error(e.message) } finally { setSaving(false) }
  }
  const masterFields = kind === "ORG_TRANSFER" ? ORG_FIELDS : JOB_FIELDS;
  const masterName = (type, id) => {
    const field = [...ORG_FIELDS, ...JOB_FIELDS].find(x => x[0] === type);
    if (!field) return String(id || "—");
    const hit = (data.masters[field[2]] || []).find(x => x.id === id);
    return hit?.[field[3]] || "—";
  };
  const columns = [
    { title: "บันทึกเมื่อ", dataIndex: "created_at", width: 145, render: v => dayjs(v).format("DD/MM/YYYY HH:mm") },
    { title: "พนักงาน", dataIndex: "employee_id", render: id => { const e = data.employees.find(x => x.id === id); return e ? <><strong>{e.employee_code}</strong><div>{e.first_name_th} {e.last_name_th}</div></> : id } },
    { title: "ประเภท", dataIndex: "change_type", render: v => <Tag color={TYPES.find(x => x.value === v)?.color}>{TYPES.find(x => x.value === v)?.label || v}</Tag> },
    { title: "วันที่มีผล", dataIndex: "effective_date", render: v => dayjs(v).format("DD/MM/YYYY") },
    { title: "การเปลี่ยนแปลง", render: (_, r) => r.change_type === "SALARY_ADJUSTMENT" ? `เสนอเงินเดือนใหม่ ${Number(r.new_snapshot?.proposed_salary || 0).toLocaleString("th-TH")} บาท` : Object.entries(r.new_snapshot || {}).map(([key, next]) => `${[...ORG_FIELDS, ...JOB_FIELDS].find(x => x[0] === key)?.[1] || key}: ${masterName(key, r.old_snapshot?.[key])} → ${masterName(key, next)}`).join(" • ") },
    { title: "เหตุผล", dataIndex: "reason", ellipsis: true },
    { title: "สถานะ", dataIndex: "status", render: () => <Tag color="gold">บันทึกคำขอแล้ว</Tag> },
  ];
  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  return <div style={{ padding: 20 }}>
    <Space align="start" style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} wrap>
      <div><Text type="secondary">EMPLOYEE MANAGEMENT</Text><Title level={3} style={{ margin: "4px 0" }}>บริหารการเปลี่ยนแปลงพนักงาน (Phase 1)</Title>
        <Text type="secondary">ย้ายสังกัด · ย้ายตำแหน่ง · เลื่อน/ลดระดับ P · ปรับเงินเดือน</Text></div>
      <Space><Button icon={<ReloadOutlined />} onClick={load}>รีเฟรช</Button>{canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => start()}>บันทึกการเปลี่ยนแปลง</Button>}</Space>
    </Space>
    <Alert style={{ marginBottom: 16 }} showIcon type="info" title="Phase 1 — บันทึกคำขอและประวัติภายใน Scope" description="การบันทึกหน้านี้ยังไม่เปลี่ยนข้อมูลพนักงานหรือเงินเดือนพนักงานจริง เพื่อป้องกันการแก้ข้อมูลการจ้างงาน โดยไม่มีขั้นอนุมัติ" />
    <Alert style={{ marginBottom: 16 }} showIcon type="info" title="Phase 2 — บันทึกขั้นตอน  `อนุมัติ`" description="จะมีการบันทึกเปลี่ยนข้อมูลพนักงานหรือเงินเดือนพนักงานจริง" />
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>{[
      { label: "ย้ายสังกัด", type: "ORG_TRANSFER", icon: <BankOutlined /> },
      { label: "ย้ายตำแหน่ง", type: "POSITION_TRANSFER", icon: <SwapOutlined /> },
      { label: "เลื่อน / ลดตำแหน่ง", type: "PROMOTION", icon: <RiseOutlined /> },
      { label: "ปรับเงินเดือน", type: "SALARY_ADJUSTMENT", icon: <DollarOutlined /> },
    ].map(k => <Col key={k.type} xs={12} md={6}><Card hoverable={canCreate} onClick={canCreate ? () => start(k.type) : undefined}><Statistic title={k.label} value={k.type === "PROMOTION" ? (counts.PROMOTION || 0) + (counts.DEMOTION || 0) : counts[k.type] || 0} prefix={k.icon} suffix="รายการ" /></Card></Col>)}</Row>
    <Card title="ประวัติการเปลี่ยนแปลง" extra={<Space wrap><Input.Search allowClear placeholder="ค้นหาชื่อ / รหัสพนักงาน" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} /><Select value={filter} onChange={setFilter} style={{ minWidth: 180 }} options={[{ label: "ทุกประเภท", value: "ALL" }, ...TYPES.map(x => ({ value: x.value, label: x.label }))]} /></Space>}>
      <Table rowKey="id" size="middle" columns={columns} dataSource={filtered} loading={loading} scroll={{ x: 1200 }} pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }} />
    </Card>
    <Modal title="บันทึกคำขอเปลี่ยนแปลงพนักงาน" open={canCreate && open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} okText="บันทึกคำขอ" width={850} destroyOnHidden>
      <Form layout="vertical" form={form} onFinish={submit}>
        <Row gutter={16}><Col xs={24} md={14}><Form.Item label="พนักงาน" name="employee_id" rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}><Select showSearch optionFilterProp="label" placeholder="ค้นหาชื่อ / รหัสพนักงาน" options={data.employees.map(x => ({ value: x.id, label: `${x.employee_code} · ${x.first_name_th || ""} ${x.last_name_th || ""}` }))} /></Form.Item></Col>
          <Col xs={24} md={10}><Form.Item label="ประเภทการเปลี่ยนแปลง"><Select value={kind} onChange={v => { setKind(v); form.resetFields(["company_id", "branch_group_id", "branch_id", "department_id", "division_id", "unit_id", "position_id", "position_level_id", "new_salary"]); }} options={TYPES.map(x => ({ label: x.label, value: x.value }))} /></Form.Item></Col></Row>
        {selected && <Alert style={{ marginBottom: 12 }} type="info" showIcon title={`ข้อมูลปัจจุบัน: ${selected.employee_code}`} description={`สังกัด: ${masterName("branch_id", selected.branch_id)} | ตำแหน่ง: ${masterName("position_id", selected.position_id)} | ระดับ: ${masterName("position_level_id", selected.position_level_id)}`} />}
        {kind === "SALARY_ADJUSTMENT" ? <Form.Item label="เสนอเงินเดือนใหม่ (บาท)" name="new_salary" rules={[{ required: true, message: "กรุณาระบุเงินเดือนใหม่" }]}><InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="จำนวนเงินเดือนใหม่" /></Form.Item> : <Row gutter={16}>{masterFields.map(([field, label, master, name]) => <Col xs={24} md={12} key={field}><Form.Item name={field} label={`${label}ใหม่`}><Select allowClear showSearch optionFilterProp="label" placeholder={selected ? `เดิม: ${masterName(field, selected[field])}` : "เลือกพนักงานก่อน"} options={opts(data.masters[master], name)} /></Form.Item></Col>)}</Row>}
        <Row gutter={16}><Col span={12}><Form.Item label="วันที่มีผล" name="effective_date" rules={[{ required: true, message: "กรุณาระบุวันที่มีผล" }]}><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item></Col></Row>
        <Form.Item label="เหตุผล / บันทึกสำหรับ HR" name="reason" rules={[{ required: true, min: 5, message: "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร" }]}><Input.TextArea rows={3} maxLength={1000} showCount /></Form.Item>
      </Form>
    </Modal>
  </div>;
}