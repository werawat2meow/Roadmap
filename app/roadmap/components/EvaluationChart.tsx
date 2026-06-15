'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', Total: 25, Completed: 18 },
    { name: 'Feb', Total: 31, Completed: 28 },
    { name: 'Mar', Total: 22, Completed: 15 },
    { name: 'Apr', Total: 43, Completed: 35 },
    { name: 'May', Total: 35, Completed: 30 },
    { name: 'Jun', Total: 32, Completed: 22 },
];

export default function Evaluationchart() {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm h-[350px]">
            <h3 className="font-semibold text-gray-800 mb-4">Evaluation Overview</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip wrapperClassName="rounded-lg shadow-lg" cursor={{ fill: '#f3f4f6' }}
                        labelStyle={{ color: '#4B5563', fontWeight: 'bold' }}
                        itemStyle={{ fontWeight: 'medium' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ top:0, right:0 }} />
                    <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};