import { Employee, EmployeeStatus } from '../types';
import Link from "next/link";

type StatusBadgeProps = {
  status: EmployeeStatus;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap";
  const statusClasses: Record<EmployeeStatus, string> = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-gray-100 text-gray-800',
    'On Leave': 'bg-yellow-100 text-yellow-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

type EmployeeTableProps = {
  employees: Employee[];
};

export default function EmployeeTable({ employees }: EmployeeTableProps) {
  // 🌟 ฟังก์ชันแกะอักษรย่อจากชื่อพนักงาน (รองรับทั้งภาษาไทยและอังกฤษอย่างปลอดภัย)
  const getAvatarText = (name: string) => {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    if (words.length > 1) {
      // ภาษาอังกฤษสองพยางค์ เช่น "System Admin" -> "SA"
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    // ภาษาไทยหรือคำเดี่ยว ดึงอักษร 2 ตัวแรก เช่น "เมเนเจอร์" -> "เม", "Admin" -> "AD"
    return name.substring(0, 2).toUpperCase();
  };

  return (
    // ครอบตารางด้วยการ์ดขอบมนและเงาจางๆ เพิ่มความหรูหรา
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-collapse">
          <thead>
            {/* 🌟 ปรับหัวตารางให้เป็นสีเทาอ่อน มีมิติ และเข้าพวกกับข้อมูลด้านล่าง */}
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3.5 px-5 text-xs uppercase tracking-wider font-semibold w-[25%]">Employee</th>
              <th className="py-3.5 px-5 text-xs uppercase tracking-wider font-semibold w-[25%]">ID</th>
              <th className="py-3.5 px-5 text-xs uppercase tracking-wider font-semibold w-[20%]">Department</th>
              <th className="py-3.5 px-5 text-xs uppercase tracking-wider font-semibold w-[15%]">Role</th>
              <th className="py-3.5 px-5 text-xs uppercase tracking-wider font-semibold text-center w-[15%]">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50/40 transition-colors duration-150">
                {/* 1. คอลัมน์พนักงานและวงกลม Avatar */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center">
                    {/* เปลี่ยนมาใช้ฟังก์ชัน getAvatarText เพื่อดึงตัวหนังสือย่อแบบ Real-time */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shadow-sm tracking-wide">
                      {getAvatarText(employee.name)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-slate-800 whitespace-nowrap text-sm">{employee.name}</p>
                    </div>
                  </div>
                </td>
                
                {/* 2. คอลัมน์ ID พนักงาน */}
                <td className="py-3.5 px-5 text-xs font-mono text-slate-500 select-all">{employee.employeeCode}</td>
                
                {/* 3. คอลัมน์แผนก */}
                <td className="py-3.5 px-5 text-sm text-slate-600">{employee.department}</td>
                
                {/* 4. คอลัมน์ตำแหน่งงาน */}
                <td className="py-3.5 px-5 text-sm text-slate-600">{employee.role}</td>
                
                {/* 5. คอลัมน์ปุ่มจัดการกดประเมิน */}
                <td className="py-3.5 px-5 text-center">
                  <Link
                    href={`/roadmap/evaluate/${employee.id}`}
                    className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold py-2 px-3.5 rounded-xl whitespace-nowrap shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition-all duration-200 active:scale-95"
                  >
                    ประเมินพนักงาน
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
