Roadmap ถัดไป
ผมแนะนำว่า อย่าเพิ่งไป Payroll Calculation
ให้ทำ Job Management ให้เสร็จก่อน
เพราะตอนนี้ Job ยังเป็นแค่
Job
แต่จริง ๆ Job ควรเป็นศูนย์กลางของ ERP ทั้งระบบ
เช่น
Job
│
├── General
├── Organization
├── Payroll
├── Accounting
├── Approval
├── Permission
├── Scope
├── Workflow
└── Dashboard
ตอนนี้ Employee ยังขาดอะไร

ตอนนี้ Employee มี
Employee
  Company
  Branch
  Department
  Division
  Unit
  Position
  Job
  Business Unit
  Cost Center
  Profit Center
  Payroll Company
  Payroll Type

แต่ยังไม่มี
Reporting To
เช่น

CEO

  │

HR Director

  │

HR Manager

  │

HR Supervisor

  │

Officer

อันนี้สำคัญมาก

เพราะใช้กับ

Approval
Leave
Benefit
OT
Expense
Performance
Recruitment
ทั้งหมด


อีกอันที่ยังไม่มี
Employee ยังไม่มี
Employment Information
เช่น
Start Date
Probation End
Confirm Date
Contract End
Retirement Date
อีกอัน
Working Information
เช่น
Shift
Work Calendar
Holiday Group
Payroll Group
Cost Allocation
แต่...
ผมคิดว่า ก่อนทำ Employee เพิ่ม
เราควรกลับไปทำ
Job 2.0
เพราะ Job จะเป็นตัวกำหนด
Scope
Permission
Approval
Organization
Payroll
Dashboard

ทั้งหมด
เมื่อ Job เสร็จ
Employee จะเหลือแค่
เลือก Job
ระบบจะ Auto ทั้งหมด
เช่น
Job
↓
Management Level
↓
Approval Level
↓
Scope
↓
Business Unit
↓
Cost Center
↓
Payroll
↓
Permission

Employee ไม่ต้องกรอกเองทีละช่องอีกต่อไป
ดังนั้น Roadmap ตอนนี้จะเป็น
✅ Company
✅ Branch
✅ Department
✅ Division
✅ Unit
✅ Position
✅ Job
✅ Business Unit
✅ Cost Center
✅ Profit Center
✅ Payroll Type
✅ Payroll Company
✅ Employee Payroll
======================
⬜ Job 2.0 ⭐⭐⭐⭐⭐
⬜ Employee Reporting Line
⬜ Approval Matrix
⬜ Scope Engine
⬜ Payroll Engine
ผมแนะนำให้เริ่ม Job 2.0 เป็นลำดับถัดไปเลยครับ เพราะมันจะเป็นแกนหลักของ Employee Master และทุกโมดูล HR/ERP ที่จะตามมา ไม่ว่าจะเป็น Payroll, Benefit, Leave, Performance หรือ Workflow ก็จะใช้โครงสร้างนี้ร่วมกันครับ 🚀