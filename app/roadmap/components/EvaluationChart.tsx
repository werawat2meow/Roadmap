'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// เพิ่มการประกาศ Interface สำหรับรับ Props
interface EvaluationChartProps {
    data?: any[];
}

// ค่าจำลองเอาไว้ใช้กรณีที่ยังโหลดข้อมูลไม่เสร็จ
const defaultData = [
    { name: 'Jan', Total: 0, Completed: 0 },
    { name: 'Feb', Total: 0, Completed: 0 },
    { name: 'Mar', Total: 0, Completed: 0 },
    { name: 'Apr', Total: 0, Completed: 0 },
    { name: 'May', Total: 0, Completed: 0 },
    { name: 'Jun', Total: 0, Completed: 0 },
];

export default function EvaluationChart({ data }: EvaluationChartProps) {
    // ใช้ข้อมูลที่ส่งมา ถ้าไม่มีให้ใช้ defaultData
    const chartData = data && data.length > 0 ? data : defaultData;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm h-[350px]">
            <h3 className="font-semibold text-gray-800 mb-4">Evaluation Overview</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                        wrapperClassName="rounded-lg shadow-lg" 
                        cursor={{ fill: '#f3f4f6' }}
                        labelStyle={{ color: '#4B5563', fontWeight: 'bold' }}
                        itemStyle={{ fontWeight: 'medium' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ top: 0, right: 0 }} />
                    <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}