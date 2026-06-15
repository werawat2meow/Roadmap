import { ArrowUp } from 'lucide-react';
import React from 'react';

type StatCardProps = {
    title: string;
    value: string;
    percentage: number;
    icon: React.ReactNode;
    color: string;
};

export default function StatCard({ title, value, percentage, icon, color }: StatCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center`}
                    style={{ backgroundColor: `${color}20`, color: color }}
                >
                    {icon}
                </div>
                <div className="flex items-center text-sm font-semibold text-green-500">
                    <ArrowUp className="h-4 w-4" />
                    <span>+{percentage}%</span>
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-800 mt-4">{value}</p>
                <p className="text-sm text-gray-500 uppercase">{title}</p>
            </div>
        </div>
    );
};