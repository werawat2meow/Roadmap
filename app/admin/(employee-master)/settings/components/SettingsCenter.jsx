"use client";

import { useMemo, useState , useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Breadcrumb, Button, Card, Col, Empty, Input, Row, Segmented,
  Space, Tag, Typography,
} from "antd";
import * as AntIcons from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import catalog from "../data/settingsCatalog.json";

const { Title, Text, Paragraph } = Typography;
const { SearchOutlined, SettingOutlined, ArrowLeftOutlined } = AntIcons;

function Icon({ name, style }) {
  const Component = AntIcons[name] || SettingOutlined;
  return <Component style={style} />;
}

function normalizedPermissions(user, auth) {
  const sources = [user?.permissions, auth?.permissions, user?.role?.permissions];
  const result = new Set();
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const item of source) {
      const code = typeof item === "string" ? item :
        item?.permission_code ?? item?.permission?.permission_code ??
        item?.permission?.code ?? item?.code ?? item?.name;
      if (typeof code === "string" && code.trim()) result.add(code.trim());
    }
  }
  return result;
}

function isSuperAdmin(user) {
  // Role comes from the authenticated user, never from a URL or client input.
  const values = [user?.role_code, user?.role?.role_code, user?.role?.code];
  return values.some((value) => String(value ?? "").trim().toUpperCase() === "SUPER_ADMIN");
}

function activeAssignment(assignment) {
  if (String(assignment?.status ?? "active").toLowerCase() !== "active") return false;
  const now = Date.now();
  const start = assignment?.effective_from && Date.parse(assignment.effective_from);
  const end = assignment?.effective_to && Date.parse(assignment.effective_to);
  return (!start || start <= now) && (!end || end >= now);
}

function scopeSummary(auth, user) {
  const assignments = auth?.access_assignments ?? user?.access_assignments;
  if (!Array.isArray(assignments)) return { known: false, active: [], scopes: [] };
  const active = assignments.filter(activeAssignment);
  return {
    known: true,
    active,
    scopes: active.flatMap((a) => (a.scopes || []).filter((s) => String(s.status ?? "active").toLowerCase() === "active")),
  };
}

export default function SettingsCenter() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loadingUser } = auth;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("การ์ด");

  const superAdmin = isSuperAdmin(user);
  const permissions = useMemo(() => normalizedPermissions(user, auth), [user, auth]);
  const scope = useMemo(() => scopeSummary(auth, user), [auth, user]);

  // Sidebar visibility is permission-based. Scope applies to records returned
  // by the destination API; a missing assignment must not hide all settings.
  const allowedGroups = useMemo(() => catalog.map((group) => ({
    ...group,
    items: group.items.filter((item) => superAdmin ||
      (typeof item.permission === "string" && permissions.has(item.permission))),
  })).filter((group) => group.items.length > 0), [permissions, superAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return allowedGroups.map((group) => ({
      ...group,
      items: q ? group.items.filter((item) => `${item.label} ${item.href} ${item.permission}`.toLocaleLowerCase().includes(q)) : group.items,
    })).filter((group) => !q || group.label.toLocaleLowerCase().includes(q) || group.description.toLocaleLowerCase().includes(q) || group.items.length);
  }, [allowedGroups, search]);

  const chosen = filtered.find((group) => group.key === selected);
  const visibleItems = chosen ? chosen.items : filtered.flatMap((group) => group.items.map((item) => ({ ...item, groupLabel: group.label })));

  const columns = [
    { title: "การตั้งค่า", dataIndex: "label", key: "label", render: (label, row) => <Space><Icon name={row.icon} /><Text strong>{label}</Text></Space> },
    { title: "หมวด", dataIndex: "groupLabel", key: "groupLabel", responsive: ["md"] },
    { title: "ดำเนินการ", key: "action", width: 125, render: (_, row) => <Button type="link" onClick={() => router.push(row.href)}>เปิดหน้า</Button> },
  ];

  if (loadingUser) return <Card loading style={{ minHeight: 200 }} />;
  if (!user) return <Alert type="warning" showIcon message="กรุณาเข้าสู่ระบบก่อนใช้งาน" />;

  return (
    <div style={{ padding: "16px 0 40px", maxWidth: 1440, margin: "0 auto" }}>
      <Space orientation="vertical" size={20} style={{ width: "100%" }}>
        <Breadcrumb items={[{ title: "หน้าหลัก", onClick: () => router.push("/admin") }, { title: "ตั้งค่าระบบ" }]} />
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col>
            <Title level={3} style={{ margin: 0 }}><SettingOutlined /> ศูนย์การตั้งค่าระบบ</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>ค้นหาและจัดการข้อมูลพื้นฐานของ HRMS ตามสิทธิ์ที่ได้รับ</Paragraph>
          </Col>
          <Col><Segmented value={view} onChange={setView} options={["การ์ด", "รายการ"]} /></Col>
        </Row>
        <Card styles={{ body: { padding: 16 } }}>
          <Space orientation="vertical" size={12} style={{ width: "100%" }}>
            <Input size="large" allowClear value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }} prefix={<SearchOutlined />} placeholder="ค้นหาประเทศ, ตำแหน่ง, เงินเดือน, Permission หรือ URL..." />
            <Space wrap>
              <Tag>{allowedGroups.length} หมวดที่เข้าถึงได้</Tag>
              <Tag>{allowedGroups.reduce((total, g) => total + g.items.length, 0)} เมนู</Tag>
              {scope.known && <Tag color={scope.active.length ? "blue" : "warning"}>Access Scope: {scope.active.length} ชุดสิทธิ์ใช้งาน (ตรวจใน API)</Tag>}
              {!scope.known && <Tag>Scope ตรวจสอบต่อใน API ปลายทาง</Tag>}
            </Space>
          </Space>
        </Card>
        {selected && <Button icon={<ArrowLeftOutlined />} onClick={() => setSelected(null)} style={{ width: "fit-content" }}>กลับทุกหมวด</Button>}
        {!filtered.length ? <Card><Empty description={search ? "ไม่พบเมนูตรงกับคำค้นหา" : "ไม่พบ Permission สำหรับเมนูตั้งค่าในข้อมูลเข้าสู่ระบบ กรุณาตรวจสอบ /api/auth/me"} /></Card> : view === "รายการ" ? (
          <MasterTable rowKey="key" title="รายการตั้งค่าที่เข้าถึงได้" columns={columns} dataSource={visibleItems} pagination={false} scroll={{ x: 650 }} />
        ) : chosen ? (
          <>
            <Title level={4}>{chosen.label}</Title>
            <Row gutter={[16, 16]}>
              {chosen.items.map((item) => <Col xs={24} sm={12} lg={8} xl={6} key={item.key}>
                <Card hoverable onClick={() => router.push(item.href)} style={{ height: "100%", cursor: "pointer" }}>
                  <Space align="start"><Icon name={item.icon} style={{ fontSize: 24, color: "#1677ff" }} /> <div><Text strong>{item.label}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{item.href}</Text></div></div></Space>
                </Card>
              </Col>)}
            </Row>
          </>
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((group) => <Col xs={24} sm={12} lg={8} key={group.key}>
              <Card hoverable style={{ height: "100%", cursor: "pointer" }} onClick={() => setSelected(group.key)}>
                <Space align="start" size={14}>
                  <Icon name={group.icon} style={{ fontSize: 27, color: "#1677ff" }} />
                  <div><Title level={5} style={{ margin: 0 }}>{group.label}</Title><Paragraph type="secondary" style={{ margin: "7px 0" }}>{group.description}</Paragraph><Tag>{group.items.length} รายการ</Tag></div>
                </Space>
              </Card>
            </Col>)}
          </Row>
        )}
      </Space>
    </div>
  );
}
