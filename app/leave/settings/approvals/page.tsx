export default function LeaveSettingsApprovalsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Employee Approval Management</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">จัดการสิทธิ์การอนุมัติของพนักงาน</h2>
            <p className="mt-1 text-sm text-slate-600">
              กำหนดพนักงานที่สามารถอนุมัติการลาได้
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Employee</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Department</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Level</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-600">Approval Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {[
                { name: 'Somchai Jaidee', dept: 'Engineering', level: 'Senior Staff', approved: true },
                { name: 'Suda Wongsa', dept: 'HR', level: 'Manager', approved: true },
                { name: 'Anan Pongchai', dept: 'Engineering', level: 'Junior Staff', approved: false },
                { name: 'Naree Suwan', dept: 'Finance', level: 'Mid Level', approved: false },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        {row.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{row.name}</div>
                        <div className="text-xs text-slate-500">example@company.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{row.dept}</td>
                  <td className="px-6 py-4 text-slate-600">{row.level}</td>
                  <td className="px-6 py-4 text-center">
                    <input type="checkbox" checked={row.approved} readOnly className="h-4 w-4 accent-emerald-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}