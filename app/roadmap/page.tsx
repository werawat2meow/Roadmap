'use client';

import React from 'react';
import { ChevronRight, Users, Target, ClipboardCheck, TrendingUp } from 'lucide-react';
import StatCard from './components/StatCard';
import EvaluationChart from './components/EvaluationChart';
import RecentEvaluations from './components/RecentEvaluations';
import { isHoliday } from '../../leave-system/src/lib/leave-utils';

// Mock data for Stat Cards
const stats = [
  { title: 'TOTAL EMPLOYEES', value: '1,284', percentage: 12, icon: <Users />, color: '#EF4444' },
  { title: 'ACTIVE KPIS', value: '156', percentage: 8, icon: <Target />, color: '#F97316' },
  { title: 'EVALUATIONS', value: '342', percentage: 23, icon: <ClipboardCheck />, color: '#8B5CF6' },
  { title: 'PROMOTIONS', value: '28', percentage: 5, icon: <TrendingUp />, color: '#10B981' },
];

export default function DashboardPage() {
  const userName = "Jennifer"; // This would come from user data

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-700">ภาพรวมผลการประเมินพนักงานที่ดำเนินการเสร็จสิ้นแล้ว</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EvaluationChart />
        </div>
        <div>
          <RecentEvaluations />
        </div>
      </div>
    </div>
  );
}