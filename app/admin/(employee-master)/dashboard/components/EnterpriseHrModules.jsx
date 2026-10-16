"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Badge, Button, Card, Col, Empty, List, Progress, Row, Space,
  Statistic, Tag, Timeline, Typography,
} from "antd";
import {
  AlertOutlined, ApartmentOutlined, AuditOutlined, CalendarOutlined,
  CheckCircleOutlined, ClockCircleOutlined, DollarOutlined,
  FileProtectOutlined, GiftOutlined, LineChartOutlined,
  RiseOutlined, SafetyCertificateOutlined, TeamOutlined,
  UserOutlined, WarningOutlined, ArrowRightOutlined,
} from "@ant-design/icons";
import { hasPermission } from "@/lib/permissions";
import { WorkforceBarChart, WorkforceDonutChart } from "./DashboardCharts";

const { Text, Title } = Typography;
const frame = { borderRadius: 16, height: "100%", borderColor: "#e9eef6", boxShadow: "0 4px 18px rgba(15,23,42,0.035)" };
const integer = value => Number(value).toLocaleString("th-TH");
const valid = value => value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
const safeRows = value => Array.isArray(value) ? value : [];

function Header({ icon, title, subtitle, extra }) {
  return <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
    <Space align="start" size={11}>
      <span style={{ background: "#eff6ff", color: "#2563eb", borderRadius: 12, width: 38, height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{icon}</span>
      <div><Title level={5} style={{ margin: 0, color: "#12233d" }}>{title}</Title><Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text></div>
    </Space>{extra}
  </div>;
}
function NoData({ label = "ยังไม่มีข้อมูลสรุปจาก API ของโมดูลนี้" }) {
  return <div style={{ minHeight: 118, display: "grid", placeItems: "center", padding: 14, border: "1px dashed #dae3f0", borderRadius: 12, background: "#fbfcff" }}>
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>} />
  </div>;
}
function Metric({ label, value, suffix = "", note }) {
  return <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, height: "100%" }}>
    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
    {valid(value) ? <Statistic value={Number(value)} suffix={suffix} valueStyle={{ fontSize: 23, fontWeight: 700, color: "#172e50" }} /> : <div style={{ color: "#94a3b8", fontSize: 21, fontWeight: 600, margin: "7px 0" }}>—</div>}
    {note && <Text type="secondary" style={{ fontSize: 11 }}>{note}</Text>}
  </div>;
}
function Go({ href, label, enabled }) {
  const router = useRouter();
  return enabled && href ? <Button size="small" type="link" icon={<ArrowRightOutlined />} iconPlacement="end" onClick={() => router.push(href)}>{label || "เปิดโมดูล"}</Button> : null;
}
function Block({ title, subtitle, icon, children, href, canOpen, label }) {
  return <Card style={frame} styles={{ body: { padding: 20 } }}>
    <Header icon={icon} title={title} subtitle={subtitle} extra={<Go href={href} enabled={canOpen} label={label} />} />
    {children}
  </Card>;
}
function Section({ title, subtitle, icon, children }) {
  return <section style={{ marginTop: 6 }}>
    <Header icon={icon} title={title} subtitle={subtitle} />
    {children}
  </section>;
}
function MiniGrid({ data }) {
  return <Row gutter={[10,10]}>{data.map(row => <Col xs={12} md={6} key={row.label}><Metric {...row} /></Col>)}</Row>;
}
function PermissionHint() {
  return <Text type="secondary" style={{ fontSize: 11 }}>Widget จะแสดงเฉพาะข้อมูลที่ API ส่งคืนตาม Permission และ Scope; ไม่มีการใช้ข้อมูลตัวอย่าง</Text>;
}

// Optional future module summaries. Never fetch from undocumented endpoints or infer missing data as zero.
// Example dashboard response additions: attendance: {today:{present,leave,absent,late},weekly:[]},
// approvals: {pending_total,leave,ot,benefits,documents,items:[]},
// payroll: {period_label,status,cost_total,trend:[],cost_by_department:[]},
// benefits: {requests,used_budget,total_budget,utilization_percent},
// workforce: {plan,actual,vacancies,gender:[],age:[],tenure:[],nationalities:[]},
// ehs: {incidents,open_incidents}, action_center: {items:[],expiring_contracts,...}
export default function EnterpriseHrModules({ dashboard = {}, user }) {
  const router = useRouter();
  const can = permission => hasPermission(user, permission);
  const attendance = dashboard.attendance || dashboard.time_attendance || {};
  const approvals = dashboard.approvals || {};
  const headcount = dashboard.workforce || dashboard.headcount_summary || {};
  const payroll = dashboard.payroll || {};
  const benefits = dashboard.benefits || {};
  const ehs = dashboard.ehs || {};
  const actions = dashboard.action_center || {};
  const dist = dashboard.distributions || {};
  const kpi = dashboard.kpi || {};
  const hasWorkforce = can("ems.employees.view");
  const hasAttendance = can("ems.attendance_records.view") || can("ems.leave_requests.view");
  const hasPayroll = can("ems.payroll_runs.view") || can("ems.employee_compensations.view") || can("ems.payroll_periods.view");
  const hasBenefits = can("benefits.entitlements.view") || can("benefits.approvals.view");
  const hasEhs = can("ehs.incidents.view");
  const hasApprovals = can("workflow.approval_history.view") || can("ems.leave_requests.view") || can("benefits.approvals.view");
  const hasActivity = can("access.activity_logs.view");
  const hasHiring = can("ems.applicants.view") || can("ems.manpower_requisitions.view");
  const hasOrg = can("ems.org_structure.view") || can("ems.org_chart.view");
  const hasStatutory = can("ems.employee_statutory_profiles.view");

  const statGrid = useMemo(() => [
    { label: "เข้างานวันนี้", value: attendance.today?.present, suffix: "คน" },
    { label: "ลาวันนี้", value: attendance.today?.leave, suffix: "คน" },
    { label: "ขาดงานวันนี้", value: attendance.today?.absent, suffix: "คน" },
    { label: "มาสายวันนี้", value: attendance.today?.late, suffix: "คน" },
  ], [attendance]);
  const showAttendanceStats = statGrid.some(item => valid(item.value));
  const topActions = safeRows(actions.items).filter(item => item && typeof item.label === "string" && typeof item.href === "string");
  const approvalItems = safeRows(approvals.items).filter(item => item && typeof item.label === "string" && typeof item.href === "string");
  const safeClick = href => { if (typeof href === "string" && href.startsWith("/") && !href.startsWith("//")) router.push(href); };
  const leaveRows = safeRows(attendance.leave_by_type);
  const headcountKnown = valid(headcount.plan) && valid(headcount.actual);
  const plan = headcountKnown ? Number(headcount.plan) : 0;
  const actual = headcountKnown ? Number(headcount.actual) : 0;
  const percent = headcountKnown && plan > 0 ? Math.min(100, Math.round(100 * actual / plan)) : 0;
  const turnover = dashboard.turnover || {};
  const laborCost = valid(payroll.cost_total) ? Number(payroll.cost_total).toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }) : "—";

  return <div style={{ display: "grid", gap: 20 }}>
    <Section title="Executive KPI Snapshot" subtitle="ภาพรวมการทำงาน การอนุมัติ อัตรากำลัง และต้นทุน" icon={<RiseOutlined />}>
      <Row gutter={[12,12]}>
        {[
          { label: "รออนุมัติ", value: approvals.pending_total, suffix: "รายการ", allowed: hasApprovals },
          { label: "ตำแหน่งว่าง", value: headcount.vacancies, suffix: "อัตรา", allowed: hasOrg },
          { label: "กำลังสรรหา", value: dashboard.recruitment?.in_progress, suffix: "ตำแหน่ง", allowed: hasHiring },
          { label: "Turnover เดือนนี้", value: turnover.month_percent, suffix: "%", allowed: hasWorkforce },
          { label: "Turnover YTD", value: turnover.ytd_percent, suffix: "%", allowed: hasWorkforce },
          { label: "เงินเดือนงวดล่าสุด", value: payroll.last_period_cost, suffix: "฿", allowed: hasPayroll },
        ].filter(item => item.allowed).map(item => <Col xs={12} sm={8} lg={4} key={item.label}><Metric {...item} note="เฉพาะข้อมูลจาก API" /></Col>)}
      </Row>
    </Section>

    {hasWorkforce && <Section title="Workforce Intelligence" subtitle="โครงสร้างประชากรพนักงานและอัตรากำลังจริงเทียบแผน" icon={<TeamOutlined />}>
      <Row gutter={[16,16]}>
        <Col xs={24} xl={12}><Block title="Organization Distribution" subtitle="มุมมองตามสังกัด แผนก และฝ่าย" icon={<ApartmentOutlined />} href="/admin/org-chart" canOpen={can("ems.org_chart.view")}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div><Text strong>พนักงานตามสังกัด</Text><div style={{ marginTop: 12 }}><WorkforceBarChart rows={dist.branches || []} title="พนักงานตามสังกัด" limit={6} /></div></div>
            <div><Text strong>พนักงานตามแผนก</Text><div style={{ marginTop: 12 }}><WorkforceBarChart rows={dist.departments || []} title="พนักงานตามแผนก" limit={6} /></div></div>
          </Space>
        </Block></Col>
        <Col xs={24} xl={12}><Block title="Headcount Plan vs Actual" subtitle="อัตรากำลังอนุมัติเทียบกับจำนวนพนักงานจริง" icon={<AuditOutlined />} href="/admin/org-position-slots" canOpen={can("ems.org_structure.view")}>
          <Row gutter={[12,12]}><Col span={12}><Metric label="อัตรากำลังตามแผน" value={headcount.plan} suffix="อัตรา" /></Col><Col span={12}><Metric label="จำนวนจริง" value={headcount.actual} suffix="คน" /></Col></Row>
          {headcountKnown && plan > 0 ? <div style={{ padding: "16px 0" }}><Progress percent={percent} strokeColor="#2563eb" format={v => `${v}% ของแผน`} /><Text type="secondary">ส่วนต่าง {integer(plan-actual)} อัตรา</Text></div> : <div style={{ marginTop: 14 }}><NoData label="รอ API กรอบอัตรากำลังตามแผนและจำนวนจริง" /></div>}
          <div style={{ marginTop: 18 }}><Text strong>อายุงาน / อายุ / เพศ / สัญชาติ</Text>
            <Row gutter={[10,10]} style={{ marginTop: 12 }}>
              {[["เพศ",headcount.gender],["ช่วงอายุ",headcount.age],["อายุงาน",headcount.tenure],["สัญชาติ",headcount.nationalities]].map(([name,rows]) => <Col xs={24} sm={12} key={name}><div style={{ padding: 10, borderRadius: 12, border: "1px solid #e8eef7" }}><Text strong style={{ fontSize: 12 }}>{name}</Text><div style={{ marginTop: 8 }}><WorkforceBarChart rows={rows || []} title={name} limit={4} /></div></div></Col>)}
            </Row>
          </div>
        </Block></Col>
      </Row>
    </Section>}

    {(hasAttendance || hasEhs) && <Section title="Time, Attendance & Safety" subtitle="การเข้างาน การลา OT และเหตุการณ์ความปลอดภัย" icon={<ClockCircleOutlined />}>
      <Row gutter={[16,16]}>
        {hasAttendance && <Col xs={24} xl={16}><Block title="Attendance Today" subtitle="สรุปการมาทำงานวันนี้ตาม Scope" icon={<CalendarOutlined />} href="/admin/attendance-records" canOpen={can("ems.attendance_records.view")}>
          <MiniGrid data={statGrid} />
          {showAttendanceStats ? null : <div style={{ marginTop: 14 }}><NoData label="รอ API สรุปการเข้างานวันนี้" /></div>}
          <Row gutter={[12,12]} style={{ marginTop: 18 }}><Col xs={24} lg={12}><Text strong>สถิติการลาแยกตามประเภท</Text><div style={{ marginTop: 10 }}><WorkforceDonutChart rows={leaveRows} title="ประเภทการลา" /></div></Col><Col xs={24} lg={12}><Text strong>OT / กะที่ขาดคน</Text><div style={{ marginTop: 10 }}><MiniGrid data={[{label:"OT รวม",value:attendance.ot_hours,suffix:"ชั่วโมง"},{label:"กะขาดคน",value:attendance.understaffed_shifts,suffix:"กะ"}]} /></div><div style={{marginTop:12}}><NoData label="แนวโน้มรายวัน/สัปดาห์ต้องใช้ข้อมูลแบบอนุกรมเวลาจาก API" /></div></Col></Row>
        </Block></Col>}
        {hasEhs && <Col xs={24} xl={hasAttendance ? 8 : 24}><Block title="EHS / Safety Monitor" subtitle="เหตุการณ์ความปลอดภัยและรายการที่ยังเปิดอยู่" icon={<SafetyCertificateOutlined />} href="/admin/incident-records" canOpen={can("ehs.incidents.view")}>
          <Row gutter={[12,12]}><Col span={12}><Metric label="เหตุการณ์ทั้งหมด" value={ehs.incidents} /></Col><Col span={12}><Metric label="ยังไม่ปิด" value={ehs.open_incidents} /></Col></Row>
          <div style={{ marginTop: 14 }}><NoData label="รายละเอียดเหตุการณ์สำคัญจะแสดงเมื่อ API ส่งข้อมูลเหตุการณ์" /></div>
        </Block></Col>}
      </Row>
    </Section>}

    {(hasPayroll || hasBenefits || hasStatutory) && <Section title="Payroll, Benefits & Compliance" subtitle="การจ่ายเงินเดือน ต้นทุนสวัสดิการ และข้อมูลภาษี/ประกันสังคม" icon={<DollarOutlined />}>
      <Row gutter={[16,16]}>
        {hasPayroll && <Col xs={24} xl={12}><Block title="Payroll Command" subtitle="สถานะรอบเงินเดือนและต้นทุนบุคลากร" icon={<DollarOutlined />} href="/admin/payroll-runs" canOpen={can("ems.payroll_runs.view")}>
          <Space wrap><Tag color="geekblue">{payroll.period_label || "ยังไม่ระบุงวด"}</Tag><Tag color={payroll.status === "paid" ? "success" : "default"}>{payroll.status || "รอข้อมูลสถานะ"}</Tag></Space>
          <div style={{ marginTop: 14 }}><Text type="secondary">ต้นทุนงวดปัจจุบัน</Text><Title level={3} style={{ margin: "4px 0 18px" }}>{laborCost}</Title></div>
          <div style={{ marginBottom: 18 }}><Text strong>สถานะ Payroll</Text><div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{["Draft","Calculated","Approved","Paid"].map(s => <Tag key={s} color={String(payroll.status||"").toLowerCase() === s.toLowerCase() ? "processing" : undefined}>{s}</Tag>)}</div></div>
          <Text strong>ต้นทุนแยกแผนก / บริษัท</Text><div style={{ marginTop: 12 }}><WorkforceBarChart rows={payroll.cost_by_department || []} title="ต้นทุนตามแผนก" /></div>
          <Text type="secondary" style={{ fontSize: 11 }}>แนวโน้ม 6–12 เดือนจะแสดงเมื่อมี API ข้อมูลย้อนหลัง โดยไม่ประมาณยอดจากเดือนล่าสุด</Text>
        </Block></Col>}
        {hasBenefits && <Col xs={24} xl={12}><Block title="Benefits Utilization" subtitle="คำขอเบิกสวัสดิการและการใช้งบประมาณ" icon={<GiftOutlined />} href="/admin/benefit-approvals" canOpen={can("benefits.approvals.view")}>
          <Row gutter={[12,12]}><Col span={12}><Metric label="คำขอทั้งหมด" value={benefits.requests} suffix="รายการ" /></Col><Col span={12}><Metric label="ใช้งบไป" value={benefits.used_budget} suffix="บาท" /></Col></Row>
          <div style={{ marginTop: 16 }}><Text strong>Budget Utilization</Text>{valid(benefits.utilization_percent) ? <Progress percent={Math.min(100, Math.max(0, Number(benefits.utilization_percent)))} strokeColor="#0d9488" /> : <NoData label="รอ API สรุปงบสวัสดิการ" />}</div>
          <div style={{ marginTop: 14 }}><Metric label="งบที่จัดสรร" value={benefits.total_budget} suffix="บาท" /></div>
        </Block></Col>}
        {hasStatutory && <Col xs={24} xl={12}><Block title="Statutory Readiness" subtitle="ภาษีและประกันสังคมพนักงาน" icon={<FileProtectOutlined />} href="/admin/employee-statutory-profiles" canOpen={can("ems.employee_statutory_profiles.view")}>
          <NoData label="รอ API สรุป Tax/SSO เฉพาะข้อมูลที่มีสิทธิ์เข้าถึง" />
        </Block></Col>}
      </Row>
    </Section>}

    {(hasApprovals || hasWorkforce || hasActivity) && <Section title="Action Center" subtitle="เรื่องสำคัญที่ต้องติดตาม พร้อมทางเข้าหน้าทำงาน" icon={<AlertOutlined />}>
      <Row gutter={[16,16]}>
        {hasApprovals && <Col xs={24} xl={12}><Block title="My Approvals" subtitle="งานอนุมัติที่มอบหมายให้คุณ" icon={<CheckCircleOutlined />} href="/admin/approval-history" canOpen={can("workflow.approval_history.view")}>
          <Row gutter={[10,10]}>{[["ลา",approvals.leave],["OT",approvals.ot],["สวัสดิการ",approvals.benefits],["เอกสาร",approvals.documents]].map(([label,value]) => <Col xs={12} key={label}><Metric label={label} value={value} suffix="รายการ" /></Col>)}</Row>
          <div style={{ marginTop: 12 }}>{approvalItems.length ? <List size="small" dataSource={approvalItems} renderItem={item => <List.Item actions={[<Button key="go" type="link" size="small" onClick={() => safeClick(item.href)}>เปิด</Button>]}><Text>{item.label}</Text></List.Item>} /> : <NoData label="ยังไม่มีรายการอนุมัติรายบุคคลจาก API" />}</div>
        </Block></Col>}
        {(hasWorkforce || hasActivity) && <Col xs={24} xl={12}><Block title="People Alerts & Activity" subtitle="สัญญา ทดลองงาน ใบรับรอง วันสำคัญ และประวัติการใช้งาน" icon={<WarningOutlined />} href="/admin/activity-logs" canOpen={hasActivity}>
          <Row gutter={[10,10]}>{[
            ["สัญญาใกล้หมด",actions.expiring_contracts], ["ทดลองงานใกล้ครบ",actions.probation_due],
            ["ใบรับรองใกล้หมด",actions.expiring_certificates], ["วันเกิด/ครบรอบ",actions.celebrations],
          ].map(([label,value]) => <Col xs={12} key={label}><Metric label={label} value={value} suffix="รายการ" /></Col>)}</Row>
          <div style={{ marginTop: 12 }}>{topActions.length ? <List size="small" dataSource={topActions} renderItem={item => <List.Item actions={[<Button key="go" type="link" size="small" onClick={() => safeClick(item.href)}>เปิด</Button>]}><Text>{item.label}</Text></List.Item>} /> : <NoData label="รายการแจ้งเตือนและ Activity ล่าสุดรอข้อมูลจาก API" />}</div>
        </Block></Col>}
      </Row>
    </Section>}
    <PermissionHint />
  </div>;
}
