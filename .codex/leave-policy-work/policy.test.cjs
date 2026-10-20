const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const root = 'C:/Users/ADMIN/leave-employee-pwa';
const ts = require(root + '/node_modules/typescript');
const client = require(root + '/node_modules/@prisma/client');
function load(file, dependencies) {
 const source = fs.readFileSync(file, 'utf8');
 const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 const module = { exports: {} };
 vm.runInNewContext(js, { module, exports: module.exports, require: (name) => {
  if (name in dependencies) return dependencies[name]; throw Error('Unexpected dependency ' + name);
 }, Date, Intl, Map, Set, Error, Number, Object, Array, Math, console }, { filename: file });
 return module.exports;
}
const calendar = load(root + '/src/lib/leave-policy-calendar.ts', {});
let employee, rows, requests, holidays, writes;
const template = { annualLeaveDays: 9, vacationLeaveDays: 9, holidayLeaveDays: 15,
 sickLeaveDays: 30, businessLeaveDays: 3, birthdayLeaveDays: 1, ordainLeaveDays: 7, maternityLeaveDays: 120, unpaidLeaveDays: 365 };
const base = (year) => ({ id: year, employeeId: 'e', year, annualLeave: 9, vacationLeave: 9,
 holidayLeave: 15, carryForwardAnnual: 0, carryForwardAnnualExpiry: null,
 carryForwardHoliday: 0, carryForwardHolidayExpiry: null,
 sickLeave: 30, businessLeave: 3, birthdayLeave: 1, ordainLeave: 7, maternityLeave: 120, unpaidLeave: 365 });
function reset() {
 employee = { id: 'e', start_work_date: '2025-06-15', birth_date: '1990-08-10' };
 rows = [base(2025), base(2026), base(2027)]; requests = []; holidays = []; writes = 0;
}
function matches(r, where) {
 return (!where.kind || r.kind === where.kind) && (!where.id?.not || r.id !== where.id.not)
   && (!where.status || (typeof where.status === 'string' ? r.status === where.status : where.status.in.includes(r.status)));
}
const tx = {
 leaveCarryForwardBucket: {findMany:async()=>[]},
 leaveRightsTemplate: { findFirst: async () => template },
 leaveRights: {
  upsert: async ({where, create}) => { writes++; let r = rows.find(r => r.year === where.employeeId_year.year); if(!r) {r={...base(create.year),...create}; rows.push(r);} return r; },
  findMany: async () => rows,
  findUniqueOrThrow: async ({where}) => rows.find(r => r.year === where.employeeId_year.year),
  update: async ({where, data}) => { writes++; const r=rows.find(r=>r.id===where.id); Object.assign(r,data); return r; },
 },
 leaveRequest: { findMany: async ({where}) => requests.filter(r => matches(r,where)).sort((a,b)=>+a.startDate-+b.startDate),
  findFirst: async ({where}) => requests.find(r=>matches(r,where)) || null },
 leaveHoliday: { findMany: async () => holidays.map(date => ({ date: calendar.civilDate(date) })) },
};
const policy = load(root + '/src/lib/leave-policy.ts', {
 '@prisma/client': client, '@/lib/prisma': {prisma:{}},
 '@/lib/supabaseAdmin': { getEmployeeByUuid: async()=>employee, getEmployeeLevelCode:()=> 'P' },
 '@/lib/leave-blackout': {findLeaveBlackoutConflict: async()=>null}, '@/lib/leave-policy-calendar': calendar,
});
let passed=0;
async function test(name, fn) { reset(); await fn(); passed++; console.log('PASS ' + name); }
const now = (date) => new Date(date+'T12:00:00+07:00');
const draft = (kind, start, end=start, session='FULL', extra={})=>({employeeId:'e',kind,startDate:start,endDate:end,session,...extra});
const request = (id, kind, start, end=start, status='APPROVED', session='FULL', reservation=null) => ({
 id,employeeId:'e',approverId:1,kind,startDate:calendar.civilDate(start),endDate:calendar.civilDate(end),status,session,
 requestedDays:calendar.leaveDays(start,end,session).reduce((n,p)=>n+p.days,0),reservation,
});
(async()=>{
 await test('9 days / 12 months: ceil 1 month=1, 2 months=2; 7 days is independent', async()=>{
  assert.equal(calendar.earnedAnnual(9,'2025-06-15',2026,'2026-07-15'),1);
  assert.equal(calendar.earnedAnnual(9,'2025-06-15',2026,'2026-08-15'),2);
  assert.equal(calendar.earnedAnnual(7,'2025-06-15',2026,'2026-12-15'),4);
 });
 await test('29 February first anniversary is clamped consistently', async()=>{
  assert.equal(calendar.completedMonths('2024-02-29','2025-02-28'),12);
  assert.equal(calendar.earnedAnnual(9,'2024-02-29',2024,'2025-02-28'),9);
  assert.equal(calendar.earnedAnnual(9,'2024-02-29',2025,'2025-03-28'),0);
  assert.equal(calendar.earnedAnnual(9,'2024-02-29',2025,'2025-03-29'),1);
 });
 await test('No annual before 1 year; first anniversary automatically unlocks 9', async()=>{
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL','2026-06-14'),now('2026-06-14')));
  const r=await policy.checkLeave(tx,draft('ANNUAL','2026-06-15','2026-06-23'),now('2026-06-15'));
  assert.equal(r.requestedDays,9); assert.equal(r.balance.total,9);
 });
 await test('First full allocation + earned 2 days; excess rejected', async()=>{
  const r=await policy.checkLeave(tx,draft('ANNUAL','2026-08-15','2026-08-25'),now('2026-08-15'));
  assert.equal(r.balance.total,11); assert.equal(r.reservation.allocations.reduce((n,a)=>n+a.days,0),11);
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL','2026-08-15','2026-08-26'),now('2026-08-15')));
 });
 await test('Previously used accrued entitlement is not restored at anniversary', async()=>{
  requests=[request(1,'ANNUAL','2026-08-15','2026-08-25','APPROVED','FULL',{version:3,allocations:[{source:'annual:2025',year:2025,days:9},{source:'annual:2026',year:2026,days:2}]})];
  const r=await policy.checkLeave(tx,draft('ANNUAL','2027-06-15','2027-06-15','FULL',{preview:true}),now('2027-06-15'));
  assert.equal(r.balance.remaining,7);
 });
 await test('Pending annual reserves capacity and edit excludes its own request', async()=>{
  requests=[request(1,'ANNUAL','2026-08-01','2026-08-09','PENDING')];
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL','2026-08-15','2026-08-17'),now('2026-08-15')));
  const r=await policy.checkLeave(tx,draft('ANNUAL','2026-08-01','2026-08-09','FULL',{excludeLeaveId:1}),now('2026-08-15'));
  assert.equal(r.requestedDays,9);
 });
 await test('Half days stay 0.5; AM and PM may coexist, identical session blocked', async()=>{
  requests=[request(1,'SICK','2026-08-15','2026-08-15','PENDING','AM')];
  const r=await policy.checkLeave(tx,draft('SICK','2026-08-15','2026-08-15','PM'),now('2026-08-15'));
  assert.equal(r.requestedDays,.5);
  await assert.rejects(()=>policy.checkLeave(tx,draft('SICK','2026-08-15','2026-08-15','AM'),now('2026-08-15')));
 });
 await test('Only passed declared holidays accrue, duplicate titles count once; leave date can be another day', async()=>{
  holidays=['2026-01-01','2026-01-01','2026-12-31'];
  const r=await policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2026-08-15'),now('2026-08-15'));
  assert.equal(r.balance.total,1);
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2026-08-15','2026-08-16'),now('2026-08-15')));
 });
 await test('30 September carry remains valid; 1 October part cannot consume expired carry', async()=>{
  rows.find(r=>r.year===2026).carryForwardHoliday=1.5;
  const r=await policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2026-09-30','2026-09-30','AM'),now('2026-09-30'));
  assert.equal(r.requestedDays,.5);
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2026-09-30','2026-10-01'),now('2026-09-30')));
  holidays=['2026-01-01'];
  const cross=await policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2026-09-30','2026-10-01'),now('2026-09-30'));
  assert.equal(cross.reservation.allocations.find(a=>a.source==='holidayCarry:2026').days,1);
  assert.equal(cross.reservation.allocations.find(a=>a.source==='holiday:2026').days,1);
 });
 await test('Ordination checks lifetime, including prior years and pending; own edit is allowed', async()=>{
  requests=[request(1,'ORDAIN','2025-08-15')];
  await assert.rejects(()=>policy.checkLeave(tx,draft('ORDAIN','2026-08-15'),now('2026-08-15')));
  requests=[request(1,'ORDAIN','2026-08-15','2026-08-15','PENDING')];
  const r=await policy.checkLeave(tx,draft('ORDAIN','2026-08-16','2026-08-16','FULL',{excludeLeaveId:1}),now('2026-08-15'));
  assert.equal(r.requestedDays,1);
 });
 await test('Annual quota reset, leap-year and year boundary; half-day other quotas preserve actual remaining', async()=>{
  rows.find(r=>r.year===2026).sickLeave=29.5;
  requests=[request(1,'SICK','2026-08-01','2026-08-01','APPROVED','AM')];
  const r=await policy.checkLeave(tx,draft('SICK','2026-08-15','2026-08-15','FULL',{preview:true}),now('2026-08-15'));
  assert.equal(r.balance.total,30); assert.equal(r.balance.remaining,29.5);
  const next=await policy.checkLeave(tx,draft('SICK','2027-01-01','2027-01-01','FULL',{preview:true}),now('2027-01-01'));
  assert.equal(next.balance.remaining,30);
 });
 await test('Balance reads do not write or reset, including missing-year rows', async()=>{
  rows=[];
  const b=await policy.getPolicyBalances(tx,'e',now('2026-08-15'));
  assert.equal(b.remaining.vacation,11); assert.equal(writes,0);
 });
 await test('Legacy requested-days mismatch fails closed instead of guessing boundary allocation', async()=>{
  requests=[{...request(1,'ANNUAL','2026-07-01'), requestedDays:.5}];
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL','2026-08-15'),now('2026-08-15')), /ใบลาเก่า/);
 });
 await test('New calendar year carries only unused current holidays, not expired prior carry', async()=>{
  rows=rows.filter(r=>r.year!==2027);
  holidays=['2026-01-01','2026-04-13','2026-12-31','2027-01-01'];
  requests=[request(1,'ANNUAL_HOLIDAY','2026-08-01','2026-08-01','APPROVED','FULL',
   {version:3,allocations:[{source:'holiday:2026',year:2026,days:1}]})];
  rows.find(r=>r.year===2026).holidayLeave=14;
  rows.find(r=>r.year===2026).carryForwardHoliday=5;
  const r=await policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2027-01-01','2027-01-01','FULL',{preview:true}),now('2027-01-01'));
  assert.equal(r.balance.total,3); // 2 unused 2026 current + Jan 1 entitlement
  assert.equal(r.balance.carry,2); assert.equal(writes,0);
 });
 await test('HR manual annual carry is additional; first full entitlement is automatic, not HR-entered', async()=>{
  rows.find(r=>r.year===2026).carryForwardAnnual=2.5;
  rows.find(r=>r.year===2026).carryForwardAnnualExpiry=calendar.civilDate('2026-12-31');
  const r=await policy.checkLeave(tx,draft('ANNUAL','2026-08-15','2026-08-15','FULL',{preview:true}),now('2026-08-15'));
  assert.equal(r.balance.total,13.5); assert.equal(r.balance.carry,2.5);
 });
 await test('Ambiguous legacy carry is blocked instead of silently counted twice', async()=>{
  holidays=['2026-01-01'];
  requests=[request(1,'ANNUAL_HOLIDAY','2026-08-01','2026-08-01','APPROVED','FULL',{'2026':{cf:1,current:0}})];
  await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL_HOLIDAY','2026-08-15'),now('2026-08-15')),/ยอดตั้งต้น/);
  requests=[];rows.find(r=>r.year===2026).carryForwardAnnual=2;
  rows.find(r=>r.year===2026).carryForwardAnnualExpiry=calendar.civilDate('2026-12-31');
  const original=tx.leaveCarryForwardBucket.findMany;
  tx.leaveCarryForwardBucket.findMany=async()=>[{originYear:2025}];
  try {await assert.rejects(()=>policy.checkLeave(tx,draft('ANNUAL','2026-08-15'),now('2026-08-15')),/bucket/);}
  finally {tx.leaveCarryForwardBucket.findMany=original;}
 });
 await test('Ordinary future-year requests are not charged to this year; validation does not reset existing balances', async()=>{
  rows.find(r=>r.year===2026).businessLeave=1;
  const r=await policy.checkLeave(tx,draft('BUSINESS','2027-01-01','2027-01-03'),now('2026-08-15'));
  assert.equal(r.requestedDays,3); assert.equal(rows.find(r=>r.year===2026).businessLeave,1);
 });

 // Route tests use the real handler and central policy, with an in-memory transaction.
 const next=require(root+'/node_modules/next/server');
 let actor='approver', commits=0, admin=false;
 tx.leaveRequest.findUnique=async({where})=>requests.find(r=>r.id===where.id)||null;
 tx.leaveRequest.findUniqueOrThrow=async(args)=>{const r=await tx.leaveRequest.findUnique(args);if(!r)throw Error('not found');return r;};
 tx.leaveRequest.update=async({where,data})=>{commits++;const r=requests.find(r=>r.id===where.id);Object.assign(r,data);return {...r};};
 tx.leaveApprover={findUnique:async({where})=>({id:where.id,employeeId:'approver'}),findFirst:async()=>actor==='approver'?{id:1,employeeId:'approver'}:null};
 const route=load(root+'/src/app/api/leaves/[id]/route.ts',{
  'next/server':next,'@prisma/client':client,
  '@/lib/authToken':{getTokenPayload:async()=>({employee_id:actor,user_id:actor})},
  '@/lib/prisma':{prisma:tx}, '@/lib/leave-utils':{normalizeSession:(s)=>s==='AM'||s==='Morning (Half)'?'AM':s==='PM'?'PM':'FULL'},
  '@/lib/supabaseAdmin':{supabaseAdmin:{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{roles:{role_code:admin?'SUPER_ADMIN':'EMPLOYEE'}},error:null})})})})}},
  '@/lib/leave-policy-calendar':calendar,
  '@/lib/leave-policy':{...policy,withEmployeeLock:async(id,work)=>work(tx)},
  '@/lib/leaveApprovalFlow':{getPendingApprovalStep:async()=>1,getNextApprovalStep:async()=>1,recordApprovalStep:async()=>{}},
  '@/lib/pushService':{sendPushNotification:async()=>{}},
 });
 const patch=(body)=>route.PATCH(new next.NextRequest('http://localhost/api/leaves/1',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{params:{id:'1'}});
 await test('Final approval deducts 0.5 once; repeat click cannot deduct twice', async()=>{
  actor='approver';admin=false;commits=0;
  const today=calendar.dateKey(new Date());
  requests=[request(1,'SICK',today,today,'PENDING','AM')];
  assert.equal((await patch({status:'APPROVED'})).status,200);
  assert.equal(rows.find(r=>r.year===Number(today.slice(0,4))).sickLeave,29.5);
  const once=commits;
  assert.equal((await patch({status:'APPROVED'})).status,200);
  assert.equal(commits,once);
  assert.equal(rows.find(r=>r.year===Number(today.slice(0,4))).sickLeave,29.5);
 });
 await test('Reject, cancel and forward do not deduct quota', async()=>{
  const today=calendar.dateKey(new Date());
  actor='approver';admin=false;
  requests=[request(1,'SICK',today,today,'PENDING')];
  assert.equal((await patch({status:'REJECTED'})).status,200);
  assert.equal(rows.find(r=>r.year===Number(today.slice(0,4))).sickLeave,30);
  requests=[request(1,'SICK',today,today,'PENDING')];actor='e';
  assert.equal((await patch({status:'CANCELLED'})).status,200);
  assert.equal(rows.find(r=>r.year===Number(today.slice(0,4))).sickLeave,30);
  requests=[request(1,'SICK',today,today,'PENDING')];actor='approver';
  assert.equal((await patch({status:'APPROVED',forwardToApproverId:2})).status,200);
  assert.equal(requests[0].status,'PENDING');assert.equal(requests[0].approverId,2);
  assert.equal(rows.find(r=>r.year===Number(today.slice(0,4))).sickLeave,30);
 });
 await test('Only assigned approver or server-verified admin can finalize', async()=>{
  const today=calendar.dateKey(new Date());requests=[request(1,'SICK',today,today,'PENDING')];
  actor='stranger';admin=false;
  assert.equal((await patch({status:'APPROVED'})).status,403);
  assert.equal(requests[0].status,'PENDING');
  admin=true;
  assert.equal((await patch({status:'APPROVED'})).status,200);
  admin=false;
 });
 console.log(`${passed} policy scenarios passed (mock database; no production writes).`);
})().catch(e=>{console.error(e);process.exitCode=1});
