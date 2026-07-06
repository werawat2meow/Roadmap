'use client';

import { useMemo, useState } from 'react';
import PayrollHeader from './components/PayrollHeader';
import PayrollSummaryCards from './components/PayrollSummaryCards';
import PayrollToolbar from './components/PayrollToolbar';
import PayrollTable from './components/PayrollTable';
import { payrollRows, PayrollRow } from './data';
import PayrollAuthModal from './components/PayrollAuthModal';

const statusOptions = ['ทั้งหมด', 'ครบถ้วนแล้ว', 'รอข้อมูลบัญชี', 'ส่งบัญชีแล้ว'] as const;
const VALID_PAYROLL_CODE = '9199218';
type PayrollStatusOption = typeof statusOptions[number];

export default function PayrollPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayrollStatusOption>('ทั้งหมด');
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleConfirmCode = () => {
  if (authCode.trim() === VALID_PAYROLL_CODE) {
    setIsAuthorized(true);
    setAuthError('');
  } else {
    setAuthError('รหัสไม่ถูกต้อง กรุณาลองใหม่');
  }
};

  const approvedRows = useMemo(
    () => payrollRows.filter((row) => row.approved),
    []
  );

  const filteredRows = useMemo(() => {
    return approvedRows.filter((row) => {
      const keyword = search.toLowerCase().trim();
      const matchesSearch =
        row.name.toLowerCase().includes(keyword) ||
        row.employeeId.includes(keyword) ||
        row.accountNumber.includes(keyword) ||
        row.bank.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'ทั้งหมด' || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [approvedRows, search, statusFilter]);

  const summaryCards = useMemo(() => {
    const total = approvedRows.length;
    const done = approvedRows.filter((row) => row.status === 'ครบถ้วนแล้ว').length;
    const waiting = approvedRows.filter((row) => row.status === 'รอข้อมูลบัญชี').length;
    const sent = approvedRows.filter((row) => row.status === 'ส่งบัญชีแล้ว').length;

    return [
      { title: 'พนักงานทั้งหมด', value: total, color: 'bg-slate-100', textColor: 'text-slate-900' },
      { title: 'ครบถ้วนแล้ว', value: done, color: 'bg-sky-50', textColor: 'text-sky-700' },
      { title: 'รอข้อมูลบัญชี', value: waiting, color: 'bg-yellow-50', textColor: 'text-yellow-700' },
      { title: 'ส่งบัญชีแล้ว', value: sent, color: 'bg-emerald-50', textColor: 'text-emerald-700' },
    ];
  }, [approvedRows]);

  return (
    <div className="relative">
      <div className={`transition duration-300 ${!isAuthorized ? 'pointer-events-none select-none blur-sm opacity-70' : ''}`}>
        <div className="p-6 lg:p-10 space-y-8">
          <PayrollHeader />
          <PayrollSummaryCards cards={summaryCards} />
          <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm">
            <PayrollToolbar
              search={search}
              onSearchChange={setSearch}
              status={statusFilter}
              statusOptions={statusOptions}
              onStatusChange={setStatusFilter}
            />
            <div className="mt-6 text-sm text-gray-500">
              แสดง {filteredRows.length} จาก {approvedRows.length} รายการ
            </div>
            <div className="mt-6 overflow-x-auto">
              <PayrollTable rows={filteredRows} />
            </div>
          </div>
        </div>
      </div>

      <PayrollAuthModal
        open={!isAuthorized}
        code={authCode}
        onCodeChange={setAuthCode}
        onConfirm={handleConfirmCode}
        error={authError}
      />
    </div>
  );
}