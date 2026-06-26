'use client';

import React, { useState, useMemo } from 'react';
import SearchBar from '../components/SearchBar'; // <-- เปลี่ยนมาใช้ SearchBar ตัวกลาง
import EmployeeTable from '../components/EmployeeTable';
import { Employee } from '../types';
import { ChevronRight } from 'lucide-react';

const allEmployees: Employee[] = [
  { id: '#50096', name: 'Krisxandra Capitle', avatar: 'KC', department: 'Restaurant Operation', role: 'Hostess', status: 'Active' },
  { id: '#50102', name: 'Marcus Chen', avatar: 'MC', department: 'Marketing', role: 'Sr. Designer', status: 'Active' },
  { id: '#50115', name: 'Sarah Williams', avatar: 'SW', department: 'Engineering', role: 'Tech Lead', status: 'On Leave' },
  { id: '#50089', name: 'David Park', avatar: 'DP', department: 'Finance', role: 'Analyst', status: 'Active' },
  { id: '#50121', name: 'Anna Rivera', avatar: 'AR', department: 'HR', role: 'Coordinator', status: 'Active' },
  { id: '#50134', name: 'James Lee', avatar: 'JL', department: 'Operations', role: 'Manager', status: 'Active' },
];

const departments = ['Restaurant Operation', 'Marketing', 'Engineering', 'Finance', 'HR', 'Operations'];
const statuses = ['Active', 'On Leave'];

export default function EmployeePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ department: '', status: '' });

  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filters.department ? employee.department === filters.department : true;
      const matchesStatus = filters.status ? employee.status === filters.status : true;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [searchTerm, filters]);

  return (
    <div className="p-4 md:p-8">
      {/* ... (Breadcrumbs and Header) ... */}
      <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900">Employee</h1>
          <p className="mt-2 text-sm text-slate-700">รายชื่อพนักงานที่ต้องการประเมิน</p>
      </div>

      <div className="mb-6 mt-2 text-gray-500">
        {/* เรียกใช้ SearchBar พร้อมส่ง props ที่ถูกต้อง */}
        <SearchBar
          placeholder="Search employees..."
          onSearch={setSearchTerm}
          onFilter={setFilters}
          filterOptions={{ departments, statuses }}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 overflow-x-auto">
        <EmployeeTable employees={filteredEmployees} />
      </div>
    </div>
  );
}