'use client';

import { useState } from 'react';
import ReportsHeader from './components/ReportsHeader';
import ReportsTabs from './components/ReportsTabs';
import ReportPanel from './components/ReportPanel';

const tabs = [
  { id: 'probation', label: 'Probation' },
  { id: 'performance', label: 'Performance' },
  { id: 'promote', label: 'Promote' },
  { id: 'progression', label: 'Progression' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('probation');
  const [quarter, setQuarter] = useState('Level 2');
  const [scope, setScope] = useState('ทุกแผนก');

  return (
    <div className="p-4 md:p-8">
      <ReportsHeader
        quarter={quarter}
        scope={scope}
        onQuarterChange={setQuarter}
        onScopeChange={setScope}
      />

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <ReportsTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-6">
        <ReportPanel activeTab={activeTab} quarter={quarter} scope={scope} />
      </div>
    </div>
  );
};