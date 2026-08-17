"use client";

import React from "react";
import { 
  Users, 
  Clock, 
  Calendar, 
  CalendarX 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// --- Mock Data สำหรับกราฟ ---
const data = [
  { name: "Jan", total: 18 },
  { name: "Feb", total: 22 },
  { name: "Mar", total: 15 },
  { name: "Apr", total: 28 },
  { name: "May", total: 20 },
  { name: "Jun", total: 25 },
  { name: "Jul", total: 32 },
  { name: "Aug", total: 27 },
  { name: "Sep", total: 19 },
  { name: "Oct", total: 24 },
  { name: "Nov", total: 16 },
  { name: "Dec", total: 30 },
];

export default function LeaveDashboardPage() {
  return (
    <div className="w-full p-8 space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* --- Stat Cards Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Employees" 
          value="128" 
          icon={<Users size={24} />} 
          iconBg="bg-cyan-50" 
          iconColor="text-cyan-500" 
        />
        <StatCard 
          label="Pending Approvals" 
          value="7" 
          icon={<Clock size={24} />} 
          iconBg="bg-amber-50" 
          iconColor="text-amber-500" 
        />
        <StatCard 
          label="On Leave Today" 
          value="4" 
          icon={<Calendar size={24} />} 
          iconBg="bg-blue-50" 
          iconColor="text-blue-500" 
        />
        <StatCard 
          label="Restricted Dates" 
          value="12" 
          icon={<CalendarX size={24} />} 
          iconBg="bg-rose-50" 
          iconColor="text-rose-500" 
        />
      </div>

      {/* --- Chart Section --- */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800">Leave Usage Overview</h2>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 500 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 500 }} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="total" 
                fill="#2dd4bf" // สี Emerald / Teal ตามรูป
                radius={[8, 8, 0, 0]} // มนเฉพาะด้านบน
                barSize={60} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

// --- Sub-component: Stat Card ---
function StatCard({ label, value, icon, iconBg, iconColor }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-400">{label}</p>
        <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
      </div>
      <div className={`${iconBg} ${iconColor} w-14 h-14 rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
}