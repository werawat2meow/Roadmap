'use client';

import React, { useState, useMemo, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import EmployeeTable from '../components/EmployeeTable';
import { Employee } from '../types';

const departments = ['Restaurant Operation', 'Marketing', 'Engineering', 'Finance', 'HR', 'Operations'];
const statuses = ['Active', 'On Leave'];

export default function EmployeePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ department: '', status: '' });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch('/roadmap/api/employees');
        const json = await res.json();
        if (json.success) {
          setEmployees(json.data || []);
        } else {
          console.error('Employee fetch failed', json.error);
        }
      } catch (error) {
        console.error('Employee fetch error', error);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filters.department ? employee.department === filters.department : true;
      const matchesStatus = filters.status ? employee.status === filters.status : true;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [searchTerm, filters, employees]);

  return (
    <div className="p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900">Employee</h1>
        <p className="mt-2 text-sm text-slate-700">รายชื่อพนักงานที่ต้องการประเมิน</p>
      </div>

      <div>
        <SearchBar 
          placeholder="Search Employees..."
          onSearch={setSearchTerm}
          onFilter={setFilters}
          filterOptions={{ departments, statuses }}
        />
      </div>

      <div>
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <EmployeeTable employees={filteredEmployees} />
        )}
      </div>
    </div>
  );
}