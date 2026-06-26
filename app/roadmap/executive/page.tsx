'use client';

import { useMemo, useState } from 'react';
import { Search, Award, Users, TrendingUp, Star } from 'lucide-react';
import ExecutiveStatCard from './components/ExecutiveStatCard';
import ExecutiveEmployeeCard from './components/ExecutiveEmployeeCard';
import ExecutiveSlideOver from './components/ExecutiveSlideOver';

type Employee = {
  initials: string;
  name: string;
  title: string;
  quarter: string;
  score: number;
  scoreClass: string;
  avatarClass: string;
  tags: { label: string; className: string }[];
};

const stats = [
  {
    title: 'ประเมินเสร็จสิ้น',
    value: 6,
    subtitle: '',
    accentClass: 'text-emerald-600',
    iconBgClass: 'bg-emerald-50',
    icon: <Award className="h-5 w-5 text-emerald-600" />,
  },
  {
    title: 'จากทั้งหมด',
    value: '6 แผนก',
    subtitle: '',
    accentClass: 'text-blue-600',
    iconBgClass: 'bg-blue-50',
    icon: <Users className="h-5 w-5 text-blue-600" />,
  },
  {
    title: 'คะแนนเฉลี่ย',
    value: '84%',
    subtitle: '',
    accentClass: 'text-violet-600',
    iconBgClass: 'bg-violet-50',
    icon: <TrendingUp className="h-5 w-5 text-violet-600" />,
  },
  {
    title: 'Top Performer',
    value: 'Marcus Chen',
    subtitle: '',
    accentClass: 'text-amber-600',
    iconBgClass: 'bg-amber-50',
    icon: <Star className="h-5 w-5 text-amber-600" />,
  },
];

const employees: Employee[] = [
  {
    initials: 'AR',
    name: 'Anna Rivera',
    title: 'Coordinator',
    quarter: 'Level P4',
    score: 75,
    scoreClass: 'text-amber-600',
    avatarClass: 'bg-pink-50 text-pink-700',
    tags: [
      { label: 'HR', className: 'bg-pink-50 text-pink-700' },
      { label: 'Probation', className: 'bg-sky-50 text-sky-700' },
      { label: 'P2', className: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    initials: 'LT',
    name: 'Lisa Tanaka',
    title: 'Frontend Dev',
    quarter: 'Level P4',
    score: 78,
    scoreClass: 'text-amber-600',
    avatarClass: 'bg-blue-50 text-blue-700',
    tags: [
      { label: 'Engineering', className: 'bg-blue-50 text-blue-700' },
      { label: 'Progression', className: 'bg-emerald-50 text-emerald-700' },
      { label: 'P4', className: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    initials: 'DP',
    name: 'David Park',
    title: 'Analyst',
    quarter: 'Level P4',
    score: 87,
    scoreClass: 'text-emerald-600',
    avatarClass: 'bg-emerald-50 text-emerald-700',
    tags: [
      { label: 'Finance', className: 'bg-emerald-50 text-emerald-700' },
      { label: 'Performance', className: 'bg-violet-50 text-violet-700' },
      { label: 'P3', className: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    initials: 'MC',
    name: 'Marcus Chen',
    title: 'Sr. Designer',
    quarter: 'Level P4',
    score: 92,
    scoreClass: 'text-emerald-600',
    avatarClass: 'bg-fuchsia-50 text-fuchsia-700',
    tags: [
      { label: 'Marketing', className: 'bg-fuchsia-50 text-fuchsia-700' },
      { label: 'Performance', className: 'bg-violet-50 text-violet-700' },
      { label: 'P4', className: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    initials: 'KC',
    name: 'Krisxandra Capitle',
    title: 'Hostess',
    quarter: 'Level P4',
    score: 80,
    scoreClass: 'text-amber-600',
    avatarClass: 'bg-orange-50 text-orange-700',
    tags: [
      { label: 'Restaurant Operation', className: 'bg-orange-50 text-orange-700' },
      { label: 'Probation', className: 'bg-sky-50 text-sky-700' },
      { label: 'P3', className: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    initials: 'KS',
    name: 'Kevin Somporn',
    title: 'Manager',
    quarter: 'Level P4',
    score: 91,
    scoreClass: 'text-emerald-600',
    avatarClass: 'bg-yellow-50 text-yellow-700',
    tags: [
      { label: 'Operations', className: 'bg-yellow-50 text-yellow-700' },
      { label: 'Performance', className: 'bg-violet-50 text-violet-700' },
      { label: 'P5', className: 'bg-slate-100 text-slate-600' },
    ],
  },
];

const planOptions = ['ทุกแผน', 'HR', 'Engineering', 'Finance', 'Marketing'];
const typeOptions = ['ทุกประเภท', 'Performance', 'Probation', 'Progression'];

export default function ExecutivePage() {
  const [keyword, setKeyword] = useState('');
  const [plan, setPlan] = useState(planOptions[0]);
  const [type, setType] = useState(typeOptions[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const textMatch =
        employee.name.toLowerCase().includes(keyword.toLowerCase()) ||
        employee.title.toLowerCase().includes(keyword.toLowerCase());

      const planMatch =
        plan === planOptions[0] ||
        employee.tags.some((tag) => tag.label.toLowerCase() === plan.toLowerCase());

      const typeMatch =
        type === typeOptions[0] ||
        employee.tags.some((tag) => tag.label.toLowerCase() === type.toLowerCase());

      return textMatch && planMatch && typeMatch;
    });
  }, [keyword, plan, type]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900">Executive</h1>
        <p className="mt-2 text-sm text-slate-700">ภาพรวมผลการประเมินพนักงานที่ดำเนินการเสร็จสิ้นแล้ว</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <ExecutiveStatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.75fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาพนักงาน..."
              className="w-full rounded-[28px] border border-gray-200 bg-gray-50 px-12 py-3 text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="rounded-[28px] border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            {planOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-[28px] border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-6 text-sm text-gray-500">แสดง {filteredEmployees.length} รายการ</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <ExecutiveEmployeeCard
              key={employee.name}
              {...employee}
              onViewDetail={() => setSelectedEmployee(employee)}
            />
          ))}
        </div>
      </div>

      <ExecutiveSlideOver
        open={Boolean(selectedEmployee)}
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onApprove={() => {
    // ทำการอนุมัติ
          setSelectedEmployee(null);
        }}
        onReject={() => {
          // ทำการปฏิเสธ
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
}