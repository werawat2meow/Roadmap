"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { ArrowRightOutlined, ApartmentOutlined, CheckCircleOutlined, ClockCircleOutlined, DatabaseOutlined, ReloadOutlined, TeamOutlined, UserAddOutlined, UserDeleteOutlined, WarningOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;
const nf = (v) => Number(v || 0).toLocaleString("th-TH");
const num = (v) => Math.max(0, Number(v) || 0);
const COLORS = ["#1677ff", "#15b79e", "#8b5cf6", "#f59e0b", "#fb7185", "#64748b", "#06b6d4", "#a3e635"];
function statusColor(label, index) {
  const text = String(label || "").toUpperCase();
  if (/PROBATION|ทดลองงาน/.test(text)) return "#8b5cf6";
  if (/RESIGNED|TERMINATED|ลาออก|พ้นสภาพ/.test(text)) return "#ef6469";
  if (/RETIRED|เกษียณ/.test(text)) return "#f59e0b";
  if (/SUSPENDED|พักงาน/.test(text)) return "#64748b";
  if (/ACTIVE|WORKING|ทำงาน|ปฏิบัติงาน/.test(text)) return "#12b886";
  return COLORS[index % COLORS.length];
}
const cardStyle = { borderRadius: 18, border: "1px solid #e8eef6", boxShadow: "0 6px 26px rgba(21,46,91,.035)" };
const panelBody = { padding: "22px 24px" };

function normalizedRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row, i) => ({
    name: String(row?.name_th ?? row?.name ?? row?.label ?? row?.status_name ?? row?.company_name ?? row?.employment_type_name ?? row?.title ?? `รายการ ${i + 1}`),
    value: num(row?.count ?? row?.total ?? row?.value ?? row?.employee_count ?? row?.employees_count),
    key: String(row?.id ?? i),
  })).filter(row => row.value > 0).sort((a, b) => b.value - a.value);
}

function Head({ icon, title, description, extra }) {
  return <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:11}}>
      <span style={{width:39,height:39,borderRadius:12,background:"#eff5ff",display:"grid",placeItems:"center",color:"#1677ff",fontSize:19}}>{icon}</span>
      <div><Text strong style={{fontSize:16,color:"#16243b"}}>{title}</Text><div><Text type="secondary" style={{fontSize:12}}>{description}</Text></div></div>
    </div>{extra}
  </div>;
}

function Metric({ label, value, icon, color, tint, description, suffix="คน" }) {
  return <Tooltip title={description} mouseEnterDelay={0.12}>
    <Card hoverable style={{...cardStyle,height:"100%", background:`linear-gradient(130deg, #fff 40%, ${tint} 125%)`}} styles={{body:{padding:"20px 21px"}}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:15}}><Text style={{color:"#68778e",fontSize:13}}>{label}</Text><span style={{display:"grid",placeItems:"center",width:42,height:42,borderRadius:13,background:tint,color,fontSize:20,boxShadow:`0 5px 14px ${tint}`}}>{icon}</span></div>
      <Statistic value={num(value)} formatter={nf} suffix={<Text type="secondary" style={{fontSize:13,fontWeight:400,marginLeft:4}}>{suffix}</Text>} styles={{content:{fontSize:30,fontWeight:750,color:"#192b45",letterSpacing:"-.6px"}}} />
      <div style={{marginTop:10,fontSize:12,color:"#8491a5"}}> <span style={{display:"inline-block",width:6,height:6,borderRadius:6,background:color,marginRight:6}}/>{description}</div>
    </Card>
  </Tooltip>;
}

function Donut({ rows, title, emptyText="ยังไม่มีข้อมูลสัดส่วนจาก API", useStatusColors=false }) {
  const [hover, setHover] = useState(-1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const circumference = 2 * Math.PI * 72;
  let offset = 0;
  const arcs = rows.map((r, i) => { const len = (r.value / (total || 1)) * circumference; const out = {...r, i, len, offset}; offset += len; return out; });
  if (!total) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} style={{padding:"46px 0"}} />;
  const active = arcs[hover] ?? null;
  return <Row gutter={[24,12]} align="middle">
    <Col xs={24} md={12}>
      <div style={{maxWidth:305,margin:"auto",position:"relative"}}>
        <svg viewBox="0 0 240 240" style={{width:"100%",display:"block",overflow:"visible"}} role="img" aria-label={title}>
          <circle cx="120" cy="120" r="72" fill="none" stroke="#edf2f8" strokeWidth="29"/>
          {arcs.map(a => <Tooltip key={a.key} title={`${a.name}: ${nf(a.value)} คน (${(a.value / total * 100).toFixed(1)}%)`}><circle onMouseEnter={()=>setHover(a.i)} onMouseLeave={()=>setHover(-1)} cx="120" cy="120" r="72" fill="none" stroke={useStatusColors ? statusColor(a.name, a.i) : COLORS[a.i % COLORS.length]} strokeWidth={hover === a.i ? 35 : 28} strokeDasharray={`${Math.max(0,a.len-3)} ${circumference}`} strokeDashoffset={-a.offset} transform="rotate(-90 120 120)" style={{cursor:"pointer",transition:"stroke-width .2s ease,opacity .2s ease",opacity:hover !== -1 && hover !== a.i ? .55 : 1}} /></Tooltip>)}
          <text x="120" y="106" textAnchor="middle" fill="#8a98ab" fontSize="12">{active ? active.name : "พนักงานทั้งหมด"}</text>
          <text x="120" y="137" textAnchor="middle" fill="#17243a" fontSize="27" fontWeight="750">{nf(active ? active.value : total)}</text>
          <text x="120" y="157" textAnchor="middle" fill="#8a98ab" fontSize="12">{active ? `${(active.value/total*100).toFixed(1)}%` : "คน"}</text>
        </svg>
      </div>
    </Col>
    <Col xs={24} md={12}>
      <div style={{display:"grid",gap:10}}>{arcs.slice(0,8).map(a => <Tooltip title={`${nf(a.value)} คน คิดเป็น ${(a.value/total*100).toFixed(1)}%`} key={a.key}><div onMouseEnter={()=>setHover(a.i)} onMouseLeave={()=>setHover(-1)} style={{padding:"8px 11px",borderRadius:10,background:hover===a.i?"#f1f6ff":"#fafbfd",display:"flex",alignItems:"center",gap:9,cursor:"default",transition:"background .2s"}}><span style={{width:9,height:9,borderRadius:"50%",background:useStatusColors ? statusColor(a.name,a.i) : COLORS[a.i%COLORS.length],flexShrink:0}}/><Text ellipsis style={{flex:1,fontSize:12}}>{a.name}</Text><Text strong style={{fontSize:12}}>{nf(a.value)}</Text><Text type="secondary" style={{fontSize:12,minWidth:47,textAlign:"right"}}>{(a.value/total*100).toFixed(1)}%</Text></div></Tooltip>)}</div>
    </Col>
  </Row>;
}

function Trend({ kpi, monthly }) {
  const [mode,setMode] = useState("6 เดือน");
  const rows = Array.isArray(monthly) ? monthly.map((r,i)=>({name:r.month_label ?? r.month ?? r.label ?? String(i+1), join:num(r.new_count ?? r.joiners ?? r.new_employees ?? r.joined ?? r.new), leave:num(r.resigned_count ?? r.leavers ?? r.resigned ?? r.left)})) : [];
  const validRows = rows.length>=2 ? rows.slice(-12) : [];
  const displayed = mode === "สรุป" ? [ {name:"เดือนนี้",join:num(kpi.new_this_month),leave:num(kpi.resigned_this_month)}, {name:"ปีนี้ (YTD)",join:num(kpi.new_this_year),leave:num(kpi.resigned_this_year)} ] : validRows.slice(mode === "6 เดือน" ? -6 : -12);
  const max = Math.max(1,...displayed.map(r=>Math.max(r.join,r.leave)));
  const pts = (key)=>displayed.map((r,i)=>`${48+(i/(displayed.length-1 || 1))*610},${205-r[key]/max*155}`).join(" ");
  return <>
    <Head title="แนวโน้มกำลังคน" description="เปรียบเทียบพนักงานเข้าใหม่และลาออก" icon={<UserAddOutlined/>} extra={<Segmented size="small" options={["6 เดือน","12 เดือน","สรุป"]} value={mode} onChange={setMode}/>}/>
    {mode!=="สรุป"&&!validRows.length?<div style={{minHeight:238,display:"grid",placeItems:"center"}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีข้อมูลรายเดือนย้อนหลังจาก API"/><Text type="secondary" style={{fontSize:12}}>เลือก “สรุป” เพื่อดูข้อมูลเดือนนี้และปีนี้</Text></div> : <>
      <div style={{display:"flex",gap:18,marginBottom:12}}><Text style={{fontSize:12,color:"#1677ff"}}>● เข้าใหม่</Text><Text style={{fontSize:12,color:"#f59e0b"}}>● ลาออก</Text></div>
      <svg viewBox="0 0 700 245" preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"auto",maxHeight:290,overflow:"visible"}} aria-label="แนวโน้มพนักงานเข้าใหม่และลาออก">
        {[0,1,2,3,4].map(i=><g key={i}><line x1="48" x2="660" y1={205-i*39} y2={205-i*39} stroke="#e8edf5" strokeDasharray="4 5"/><text x="38" y={209-i*39} textAnchor="end" fill="#96a1b1" fontSize="11">{Math.round(max*i/4)}</text></g>)}
        {displayed.length>=2&&<><polyline fill="none" stroke="#1677ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={pts("join")}/><polyline fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={pts("leave")}/></>}
        {displayed.map((r,i)=>{const x=48+i/(displayed.length-1||1)*610;return <g key={i}><Tooltip title={`${r.name} · เข้าใหม่ ${nf(r.join)} คน`}><circle cx={x} cy={205-r.join/max*155} r="6" fill="#1677ff" stroke="white" strokeWidth="2" style={{cursor:"pointer"}}/></Tooltip><Tooltip title={`${r.name} · ลาออก ${nf(r.leave)} คน`}><circle cx={x} cy={205-r.leave/max*155} r="6" fill="#f59e0b" stroke="white" strokeWidth="2" style={{cursor:"pointer"}}/></Tooltip><text x={x} y="233" textAnchor="middle" fill="#7d8aa1" fontSize="11">{r.name}</text></g>})}
      </svg>
    </>}
  </>;
}

function Distribution({ rows }) {
  const top=rows.slice(0,6);const max=Math.max(1,...top.map(r=>r.value));
  if(!top.length)return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีข้อมูลบริษัทจาก API" style={{padding:"42px 0"}}/>;
  return <div style={{display:"grid",gap:20,paddingTop:10}}>{top.map((r,i)=><Tooltip key={r.key} title={`${r.name}: ${nf(r.value)} คน`}><div style={{cursor:"default"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7,gap:12}}><Text ellipsis style={{maxWidth:"77%",fontSize:13}}>{r.name}</Text><Text strong style={{fontSize:13}}>{nf(r.value)} <Text type="secondary" style={{fontSize:11}}>คน</Text></Text></div><div style={{height:11,background:"#f0f4f9",borderRadius:7,overflow:"hidden"}}><div style={{height:"100%",width:`${r.value/max*100}%`,borderRadius:7,background:`linear-gradient(90deg, ${COLORS[i%COLORS.length]}, ${COLORS[i%COLORS.length]}a8)`,transition:"width .35s"}}/></div></div></Tooltip>)}</div>;
}


function DashboardLoadingSkeleton() {
  return (
    <div style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((item) => (
          <Col xs={24} sm={12} xl={6} key={item}>
            <Card
              style={{
                borderRadius: 18,
                minHeight: 155,
              }}
            >
              <Skeleton
                active
                title={{ width: "45%" }}
                paragraph={{
                  rows: 2,
                  width: ["65%", "90%"],
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row
        gutter={[16, 16]}
        style={{ marginTop: 16 }}
      >
        {[1, 2].map((item) => (
          <Col xs={24} xl={12} key={item}>
            <Card
              style={{
                borderRadius: 18,
                minHeight: 350,
              }}
            >
              <Skeleton
                active
                title={{ width: "50%" }}
                paragraph={{
                  rows: 5,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default function EnterpriseOverview({ dashboard, loading , initialLoading = false, onRefresh, canViewEmployees = false, }) {
  const router=useRouter();const k=dashboard?.kpi ?? {};const distributions=dashboard?.distributions ?? {};
  const statuses=useMemo(()=>normalizedRows(distributions.statuses),[distributions.statuses]);
  const types=useMemo(()=>normalizedRows(distributions.employment_types),[distributions.employment_types]);
  const companies=useMemo(()=>normalizedRows(distributions.companies),[distributions.companies]);
  const attention=dashboard?.attention ?? {};
  const alerts=[
    {label:"ข้อมูลโครงสร้างองค์กรไม่ครบ",value:attention.missing_organization,href:"/admin/employees"},
    {label:"ข้อมูลตำแหน่งงานไม่ครบ",value:attention.missing_job_architecture,href:"/admin/employees"},
    {label:"ข้อมูลติดต่อไม่ครบ",value:attention.missing_contact,href:"/admin/employees"},
    {label:"ยังไม่มีบัญชีผู้ใช้งาน",value:attention.missing_user_account,href:"/admin/user-accounts"},
  ].filter(a=>num(a.value)>0);
  const ready=dashboard?.readiness ?? {};
  const quality=[{label:"โครงสร้างองค์กร",value:ready.organization?.percent},{label:"โครงสร้างตำแหน่ง",value:ready.job_architecture?.percent},{label:"ข้อมูลติดต่อ",value:ready.contact?.percent},{label:"บัญชีผู้ใช้งาน",value:ready.user_account?.percent}];
  if (initialLoading) {
    return <DashboardLoadingSkeleton />;
  }
  return <div className="hrms-phase1-overview" style={{maxWidth:1660,margin:"auto",padding:"16px 12px 52px"}}>
    <style>{`
      .hrms-phase1-overview .ant-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
      .hrms-phase1-overview .ant-card:hover { box-shadow: 0 12px 34px rgba(23,59,115,.10) !important; border-color: #d6e7ff !important; }
      .hrms-phase1-overview .ant-card-hoverable:hover { transform: translateY(-3px); }
      .hrms-phase1-overview .ant-card .ant-statistic-content { font-variant-numeric: tabular-nums; }
      @media (prefers-reduced-motion: reduce) {
        .hrms-phase1-overview .ant-card, .hrms-phase1-overview svg circle { transition: none !important; }
      }
    `}</style>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:21,flexWrap:"wrap"}}><div><div style={{color:"#1677ff",fontSize:11,fontWeight:700,letterSpacing:2}}>HRMS · PEOPLE ANALYTICS</div><Title level={3} style={{margin:"3px 0 2px",color:"#17243a"}}>ภาพรวมบุคลากร</Title><Text type="secondary" style={{fontSize:12}}>ข้อมูลภาพรวมภายในขอบเขตสิทธิ์ของผู้ใช้งาน</Text></div><Tooltip title="โหลดข้อมูลล่าสุดจากระบบ"><Button icon={<ReloadOutlined/>} loading={loading} onClick={onRefresh}>รีเฟรชข้อมูล</Button></Tooltip></div>
    <Row gutter={[16,16]} style={{marginBottom:20}}>
      <Col xs={24} sm={12} lg={6}><Metric label="พนักงานทั้งหมด" value={k.employees_total} icon={<TeamOutlined/>} color="#1677ff" tint="#e8f2ff" description="พนักงานในขอบเขตที่ได้รับสิทธิ์"/></Col>
      <Col xs={24} sm={12} lg={6}><Metric label="กำลังทำงาน" value={k.working} icon={<CheckCircleOutlined/>} color="#0da98a" tint="#dcf8ef" description="สถานะกำลังทำงานตาม API"/></Col>
      <Col xs={24} sm={12} lg={6}><Metric label="ทดลองงาน" value={k.probation} icon={<ClockCircleOutlined/>} color="#8956df" tint="#eee5ff" description="พนักงานอยู่ในช่วงทดลองงาน"/></Col>
      <Col xs={24} sm={12} lg={6}><Metric label="เข้าใหม่เดือนนี้" value={k.new_this_month} icon={<UserAddOutlined/>} color="#f28a20" tint="#fff0db" description="พนักงานที่เริ่มงานภายในเดือนปัจจุบัน"/></Col>
    </Row>
    <Row gutter={[18,18]} style={{marginBottom:18}}>
      <Col xs={24} xl={12}><Card style={{...cardStyle,height:"100%"}} styles={{body:panelBody}}><Head title="สถานะพนักงาน" description="แสดงจำนวนและสัดส่วนตามสถานะจริง" icon={<TeamOutlined/>}/><Donut title="สถานะพนักงาน" rows={statuses} useStatusColors/></Card></Col>
      <Col xs={24} xl={12}><Card style={{...cardStyle,height:"100%"}} styles={{body:panelBody}}><Trend kpi={k} monthly={dashboard?.workforce_trend ?? dashboard?.monthly_trend ?? dashboard?.trends?.workforce}/></Card></Col>
    </Row>
    <Row gutter={[18,18]} style={{marginBottom:18}}>
      <Col xs={24} xl={12}><Card style={{...cardStyle,height:"100%"}} styles={{body:panelBody}}><Head title="พนักงานตามบริษัท" description="จำนวนพนักงานแยกตามบริษัท · สูงสุด 6 รายการ" icon={<ApartmentOutlined/>}/><Distribution rows={companies}/></Card></Col>
      <Col xs={24} xl={12}><Card style={{...cardStyle,height:"100%"}} styles={{body:panelBody}}><Head title="ประเภทการจ้างงาน" description="สัดส่วนพนักงานตามประเภทการจ้าง" icon={<DatabaseOutlined/>}/><Donut title="ประเภทการจ้างงาน" rows={types}/></Card></Col>
    </Row>
    <Row gutter={[18,18]}>
      <Col xs={24} lg={12}><Card style={{...cardStyle,height:"100%"}} styles={{body:panelBody}}><Head title="สิ่งที่ควรตรวจสอบ" description="รายการข้อมูลสำคัญที่ต้องดำเนินการ" icon={<WarningOutlined/>} extra={canViewEmployees?<Button type="link" onClick={()=>router.push("/admin/employees")}>พนักงาน <ArrowRightOutlined/></Button>:null}/>{alerts.length ? <div style={{display:"grid",gap:11}}>{alerts.map(a=><div key={a.label} style={{padding:"12px 14px",borderRadius:11,background:"#f9fbfe",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><Text style={{fontSize:13}}>{a.label}</Text><Space><Tag color="orange">{nf(a.value)} รายการ</Tag>{canViewEmployees&&<Button size="small" type="text" icon={<ArrowRightOutlined/>} onClick={()=>router.push(a.href)}/>}</Space></div>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีรายการข้อมูลขาดที่ต้องติดตาม"/>}</Card></Col>
      <Col xs={24} lg={12}><Card style={{...cardStyle,height:"100%"}} styles={{body:panelBody}}><Head title="ความพร้อมของข้อมูล" description="คุณภาพข้อมูล Employee Master" icon={<DatabaseOutlined/>}/><div style={{display:"grid",gap:15}}>{quality.map(q=><Tooltip key={q.label} title={`${q.label}: ${q.value == null ? "ยังไม่มีข้อมูล" : `${Math.min(100,Math.max(0,num(q.value))).toFixed(1)}%`}`}><div><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><Text style={{fontSize:12}}>{q.label}</Text><Text strong style={{fontSize:12}}>{q.value==null?"—":`${num(q.value).toFixed(0)}%`}</Text></div><Progress percent={Math.min(100,num(q.value))} showInfo={false} strokeColor="#1677ff" railColor="#edf2f8" size={{height:9}}/></div></Tooltip>)}</div></Card></Col>
    </Row>
  </div>;
}