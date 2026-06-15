import { Employee, EmployeeStatus } from '../types';
import Link from "next/link";

// ... (StatusBadge component remains the same)
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
  return (
    // 1. เพิ่ม div ครอบตาราง และใส่ overflow-x-auto ที่ div นี้
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Employee</th>
            <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">ID</th>
            <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Department</th>
            <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Role</th>
            <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">management</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                    {employee.avatar}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-800 whitespace-nowrap">{employee.name}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-gray-600">{employee.id}</td>
              <td className="py-4 px-4 text-gray-600">{employee.department}</td>
              <td className="py-4 px-4 text-gray-600">{employee.role}</td>
              <td className="py-4 px-4">
                <Link
                  href={`/roadmap/evaluate/${employee.id}`} // 1. เปลี่ยน href ให้เป็น dynamic
                  className="relative inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl whitespace-nowrap shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_0_rgba(37,99,235,0.4)] transition-all duration-200 active:scale-95"
                >
                  ประเมินพนักงาน
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}