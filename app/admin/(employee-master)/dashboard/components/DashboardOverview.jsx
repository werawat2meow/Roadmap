"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Col, Empty, Progress, Row, Skeleton, Space, Statistic, Tag, Tooltip, Typography } from "antd";
import { ApartmentOutlined, ArrowRightOutlined, CheckCircleOutlined, ClockCircleOutlined, DatabaseOutlined, TeamOutlined, UserAddOutlined, UserDeleteOutlined, WarningOutlined } from "@ant-design/icons";
import { hasPermission } from "@/lib/permissions";
import { WorkforceDonutChart, WorkforceBarChart, LifecycleComparisonChart, WorkforceTrendChart } from "./DashboardCharts";

const { Text, Title } = Typography;
const format = (n) => Number(n || 0).toLocaleString("th-TH");
const panel = { borderRadius: 18, height: "100%", border: "1px solid #e8edf5", boxShadow: "0 6px 24px rgba(15,23,42,.035)" };

function Heading({ title, caption, action }) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:12,marginBottom:20}}>
    <div><Title level={5} style={{margin:0,fontWeight:650}}>{title}</Title><Text type="secondary" style={{fontSize:12}}>{caption}</Text></div>{action}
  </div>;
}

function Kpi({ label, value, icon, color, hint, subtitle }) {
  return <Tooltip title={hint || label} placement="top"><Card hoverable style={panel} styles={{body:{padding:20}}}>
    <div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:8}}>
      <Text type="secondary" style={{fontSize:13}}>{label}</Text>
      <span style={{width:38,height:38,display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:12,color,background:`${color}14`,fontSize:19}}>{icon}</span>
    </div>
    <Statistic value={Number(value || 0)} valueStyle={{fontSize:29,fontWeight:720,color:"#172b4d",marginTop:6}} suffix={<span style={{fontSize:12,color:"#94a3b8",fontWeight:400}}>คน</span>} />
    <Text type="secondary" style={{fontSize:12}}>{subtitle}</Text>
  </Card></Tooltip>;
}

export default function DashboardOverview({dashboard, user, loading, canViewEmployees}) {
  const router = useRouter();
  const kpi = dashboard?.kpi || {};
  const dist = dashboard?.distributions || {};
  const attention = dashboard?.attention || {};
  const ready = dashboard?.readiness || {};
  const monthly = dashboard?.trends?.monthly || dashboard?.workforce_trend?.monthly || dashboard?.monthly_trends || [];
  const canOpenEmployees = canViewEmployees && hasPermission(user,"ems.employees.view");
  const canOpenOrg = hasPermission(user,"ems.org_chart.view");
  const canOpenReport = hasPermission(user,"ems.employee_reports.view");
  const problems = useMemo(()=>[
    {key:"missing_organization",label:"โครงสร้างองค์กรไม่ครบ",href:"/admin/employees",permission:"ems.employees.view"},
    {key:"missing_job_architecture",label:"ตำแหน่ง / สายงานไม่ครบ",href:"/admin/employees",permission:"ems.employees.view"},
    {key:"missing_payroll",label:"ข้อมูล Payroll ไม่ครบ",href:"/admin/employee-compensations",permission:"ems.employee_compensations.view"},
    {key:"missing_contact",label:"ข้อมูลติดต่อไม่ครบ",href:"/admin/employees",permission:"ems.employees.view"},
    {key:"missing_user_account",label:"พนักงานยังไม่มีบัญชีผู้ใช้",href:"/admin/user-accounts",permission:"access.user_accounts.view"}
  ].map(p=>({...p,count:Number(attention[p.key] || 0)})).filter(p=>p.count>0 && hasPermission(user,p.permission)).sort((a,b)=>b.count-a.count),[attention,user]);
  if (!canViewEmployees) return <Alert type="info" showIcon message="ไม่มีสิทธิ์ดูข้อมูลภาพรวมพนักงาน" description="Dashboard ใช้ข้อมูลที่ API จำกัดตาม Permission และ Scope ของบัญชีนี้" />;
  if (loading && !dashboard?.generated_at) return <Skeleton active paragraph={{rows:9}} />;
  const scoreItems=["organization","job_architecture","payroll","contact"];
  const validScores=scoreItems.map(k=>ready[k]).filter(x=>x && Number(x.total)>0 && Number.isFinite(Number(x.percent)));
  const score=validScores.length ? Math.round(validScores.reduce((s,x)=>s+Number(x.percent),0)/validScores.length) : null;
  return <Space direction="vertical" size={18} style={{width:"100%"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div><Title level={4} style={{margin:0}}>Workforce Overview</Title><Text type="secondary">ตัวชี้วัดสำคัญสำหรับการบริหารพนักงาน Phase 1</Text></div>
      <Tag color="blue">{dashboard?.scope_mode==="scoped"?"ข้อมูลตาม Scope":dashboard?.scope_mode==="all"?"ข้อมูลทั้งหมดตามสิทธิ์":"ข้อมูลตาม Permission"}</Tag>
    </div>
    <Row gutter={[16,16]}>
      <Col xs={24} sm={12} xl={6}><Kpi label="พนักงานทั้งหมด" value={kpi.employees_total} icon={<TeamOutlined/>} color="#2563eb" subtitle="ภายในขอบเขตที่ได้รับ" hint="จำนวนพนักงานทั้งหมดตามขอบเขตข้อมูลจาก API"/></Col>
      <Col xs={24} sm={12} xl={6}><Kpi label="กำลังทำงาน" value={kpi.working} icon={<CheckCircleOutlined/>} color="#10b981" subtitle="สถานะกำลังทำงาน" hint="พนักงานสถานะกำลังทำงานตามข้อมูล API"/></Col>
      <Col xs={24} sm={12} xl={6}><Kpi label="ทดลองงาน" value={kpi.probation} icon={<ClockCircleOutlined/>} color="#8b5cf6" subtitle="ควรติดตามการประเมิน" hint="จำนวนพนักงานที่มีสถานะทดลองงาน"/></Col>
      <Col xs={24} sm={12} xl={6}><Kpi label="เข้าใหม่เดือนนี้" value={kpi.new_this_month} icon={<UserAddOutlined/>} color="#0891b2" subtitle={`ลาออกเดือนนี้ ${format(kpi.resigned_this_month)} คน`} hint="จำนวนพนักงานเริ่มงานเดือนนี้ และลาออกเดือนนี้"/></Col>
    </Row>
    <Row gutter={[16,16]} align="stretch">
      <Col xs={24} xl={12}><Card style={panel} styles={{body:{padding:22}}}>
        <Heading title="สถานะพนักงาน" caption="Employee Status · ชี้ที่แต่ละส่วนเพื่อดูจำนวนและสัดส่วน" action={<Tag color="green">Live data</Tag>}/>
        <WorkforceDonutChart rows={dist.statuses || []} title="สถานะพนักงาน" />
      </Card></Col>
      <Col xs={24} xl={12}><Card style={panel} styles={{body:{padding:22}}}>
        <Heading title="แนวโน้มกำลังคน" caption="เข้าใหม่เทียบกับลาออก · เปรียบเทียบตามช่วงเวลา" />
        {Array.isArray(monthly) && monthly.length>=2 ? <WorkforceTrendChart rows={monthly}/> : <LifecycleComparisonChart kpi={kpi}/>} 
      </Card></Col>
    </Row>
    <Row gutter={[16,16]} align="stretch">
      <Col xs={24} xl={14}><Card style={panel} styles={{body:{padding:22}}}>
        <Heading title="โครงสร้างกำลังคน" caption="Workforce by Company · สูงสุด 6 บริษัท" action={canOpenOrg?<Button type="link" onClick={()=>router.push("/admin/org-chart")}>ผังองค์กร <ArrowRightOutlined/></Button>:null}/>
        <WorkforceBarChart rows={dist.companies || []} limit={6} title="พนักงานตามบริษัท"/>
      </Card></Col>
      <Col xs={24} xl={10}><Card style={panel} styles={{body:{padding:22}}}>
        <Heading title="สิ่งที่ต้องดำเนินการ" caption="Action Center · ประเด็นข้อมูลที่ต้องตรวจสอบ" />
        {problems.length?<div style={{display:"grid",gap:9}}>{problems.slice(0,4).map(p=><Tooltip key={p.key} title={`พบ ${format(p.count)} รายการในขอบเขตของคุณ`}><div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",border:"1px solid #edf0f5",borderRadius:11}}><WarningOutlined style={{color:"#e59a1f"}}/><Text style={{flex:1,fontSize:13}}>{p.label}</Text><Tag color="warning">{format(p.count)}</Tag><Button size="small" type="text" icon={<ArrowRightOutlined/>} onClick={()=>router.push(p.href)} aria-label={`เปิดหน้า ${p.label}`}/></div></Tooltip>)}</div>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบประเด็นข้อมูลไม่ครบจาก API"/>}
        <div style={{borderTop:"1px solid #edf0f5",marginTop:18,paddingTop:16,display:"flex",alignItems:"center",gap:16}}>
          <Tooltip title="ค่าเฉลี่ยความครบถ้วนของข้อมูลองค์กร ตำแหน่ง เงินเดือน และข้อมูลติดต่อ (เฉพาะรายการที่มีข้อมูลจริง)"><Progress type="circle" size={74} percent={score ?? 0} format={()=>score===null?"—":`${score}%`} strokeColor="#2563eb"/></Tooltip>
          <div><Text strong>ความพร้อมข้อมูล HRMS</Text><div><Text type="secondary" style={{fontSize:12}}>{score===null?"ยังไม่มีข้อมูลสำหรับคำนวณ":"เฉลี่ยจากรายการที่ API ตรวจสอบแล้ว"}</Text></div></div>
        </div>
      </Card></Col>
    </Row>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,padding:"3px 2px"}}>
      <Text type="secondary" style={{fontSize:12}}>ตัวเลขทั้งหมดอ้างอิงข้อมูลจาก API และ Scope ที่บัญชีมีสิทธิ์เข้าถึง</Text>
      <Space wrap>
        {canOpenEmployees?<Button icon={<TeamOutlined/>} onClick={()=>router.push("/admin/employees")}>ทะเบียนพนักงาน</Button>:null}
        {canOpenReport?<Button icon={<ArrowRightOutlined/>} onClick={()=>router.push("/admin/employee-reports")}>รายงาน HR</Button>:null}
      </Space>
    </div>
  </Space>;
}
