import { useState } from 'react';
import EvaluationSection from './EvaluationSection';
import EvaluationSummaryPanel from './EvaluationSummaryPanel';
import DisciplineSummaryPanel from './DisciplineSummaryPanel';
// import SummarySidebar from './SummarySidebar';
import { Building, Users, Target } from 'lucide-react';

export default function EvaluationForm() {
  // 1. แปลงข้อมูลพนักงานให้เป็น State (เพื่อให้พิมพ์กรอกแล้วอัปเดตแบบ Real-time)
  const [employeeInfo, setEmployeeInfo] = useState({
    id: "78903001",
    employeeName: "นายสันติ รักดี",
    nickname: "สัน",
    position: "Junior Luge Park",
    department: "Mountain Exclusion",
    division: "Luge",
    level: "P3",
    startDate: "11/3/2026",
  });

  // 2. แปลงกลุ่มตารางคะแนนต่าง ๆ ให้เป็น State
  const [companyGround, setCompanyGround] = useState({
    items: [
      { id: 1, topic: 'Company Policy', weight: 25, score: 4 },
      { id: 2, topic: 'Department Policy', weight: 25, score: 4 },
      { id: 3, topic: 'Primary - Secondary Product และครูผู้ต้องเรียนรู้', weight: 25, score: 4 },
      { id: 4, topic: 'Proper Equipment Usage', weight: 25, score: 4 },
    ],
    totalWeight: 100,
    totalScore: 85,
    grade: 'A',
    level: 'P4'
  });

  const [departmentGround, setDepartmentGround] = useState({
    items: [
      { id: 1, topic: 'Answer Walk-in reservation inquiries correctly', weight: 20, score: 5 },
      { id: 2, topic: 'Use walkie-talkie properly', weight: 20, score: 5 },
      { id: 3, topic: 'Manage walk-in queues', weight: 20, score: 5 },
      { id: 4, topic: 'Verify RSVN system advance bookings', weight: 20, score: 4 },
      { id: 5, topic: 'Provide menu and promo information accuratly', weight: 20, score: 5 }, // แก้ไขจาก promo เป็น topic เพื่อความถูกต้อง
    ],
    totalWeight: 100,
    totalScore: 24,
    level: 'P4' // 🌟 เพิ่มบรรทัดนี้เข้าไปเพื่อให้หายแดง
  });

  const [expectations, setExpectations] = useState({
    items: [
      { id: 1, topic: 'Problem Solving & Coordination', weight: 20, score: 4 },
      { id: 2, topic: 'Multi-task / Replace Staff', weight: 20, score: 4 },
      { id: 3, topic: 'Responsibility & Decision Making', weight: 20, score: 5 },
    ],
    totalWeight: 60,
    totalScore: 13,
    level: 'P4' // 🌟 เพิ่มบรรทัดนี้เข้าไปเพื่อให้หายแดงเช่นกัน
  });

  // 3. มัดรวมข้อมูลทั้งหมดส่งไปให้ Preview
  const allFormData = {
    ...employeeInfo,
    companyScore: companyGround.totalScore,
    departmentScore: departmentGround.totalScore,
    expectationScore: expectations.totalScore,
    grade: companyGround.grade,
    // ส่งรายการไปลูปแสดงในตารางหน้า Preview
    companyItems: companyGround.items,
    departmentItems: departmentGround.items,
    expectationItems: expectations.items,
  };

  return (
    // จัด Layout แบ่งฝั่งซ้ายแบบฟอร์ม ฝั่งขวา Sidebar
    <div className="space-y-6">
      <EvaluationSection title="Company Common Ground" icon={<Building size={20} />} {...companyGround} />
      <EvaluationSection title="Department Common Ground" icon={<Users size={20} />} {...departmentGround} />
      <EvaluationSection title="Expectations" icon={<Target size={20} />} {...expectations} />
      <EvaluationSummaryPanel />
      <DisciplineSummaryPanel />
    </div>
  );
}
