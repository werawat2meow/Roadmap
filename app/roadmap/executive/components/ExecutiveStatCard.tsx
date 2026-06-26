import React from 'react';

type ExecutiveStatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  accentClass: string;
  iconBgClass: string;
  icon: React.ReactNode;
};

export default function ExecutiveStatCard({
  title,
  value,
  subtitle,
  accentClass,
  iconBgClass,
  icon,
}: ExecutiveStatCardProps) {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className={`rounded-2xl p-3 ${iconBgClass}`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${accentClass}`}>{subtitle}</span>
      </div>
      <div className="mt-6">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        <p className="mt-2 text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}