const fs = require('fs');
const path = require('path');
const root = 'C:/Users/ADMIN/leave-employee-pwa';
const stage = __dirname;
function save(relative, content) {
 const target = path.join(root, relative), backup = path.join(stage, 'before', relative);
 if (fs.existsSync(target) && !fs.existsSync(backup)) { fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(target, backup); }
 fs.writeFileSync(target, content, 'utf8');
}
save('src/lib/leave-policy.ts', fs.readFileSync(path.join(stage, 'leave-policy.ts'), 'utf8'));
let me = fs.readFileSync(path.join(root, 'src/app/api/employees/me/route.ts'), 'utf8');
me = me.replace('import { ensureLeaveRightsForYear } from "@/lib/leave-rights-rollover";', 'import { getPolicyBalances, withEmployeeLock } from "@/lib/leave-policy";');
me = me.replace('import { getActiveAnnualCarryForwardBuckets } from "@/lib/annual-carry-forward-store";', '');
me = me.replace('email, hire_date,', 'email, hire_date, start_work_date,');
const start = me.indexOf('    // ตรวจสอบและสร้างสิทธิ์วันลาประจำปี');
const end = me.indexOf('    // ผู้อนุมัติที่ผูกกับพนักงาน', start);
if (start < 0 || end < 0) throw new Error('Cannot find balance block; refusing to overwrite employee endpoint');
me = me.slice(0, start) + `    // Read-only balance calculation: no resets, transfers, or deductions on page load.
    const balances = await withEmployeeLock(employeeId, (tx) => getPolicyBalances(tx, employeeId));

` + me.slice(end);
me = me.replace('startDate: emp.hire_date ?? null,', 'startDate: emp.start_work_date ?? null,');
const rightsStart = me.indexOf('      rights: {');
const rightsEnd = me.indexOf('        levelFrom: levelP || null,', rightsStart);
if (rightsStart < 0 || rightsEnd < 0) throw new Error('Cannot find rights response');
me = me.slice(0, rightsStart) + '      rights: {\n        ...balances,\n' + me.slice(rightsEnd);
save('src/app/api/employees/me/route.ts', me);
// Old helper remains callable by other code: it may create a missing row, never re-seed carry buckets on reads.
let rollover = fs.readFileSync(path.join(root, 'src/lib/leave-rights-rollover.ts'), 'utf8');
const blockStart = rollover.indexOf('  // NOTE: Even if the LeaveRights row already exists');
const blockEnd = rollover.indexOf('\n  const { startDate, levelP } = await fetchEmpForRights(employeeId);', blockStart);
if (blockStart >= 0 && blockEnd >= 0) rollover = rollover.slice(0, blockStart) + '  if (existing) return existing;\n' + rollover.slice(blockEnd);
save('src/lib/leave-rights-rollover.ts', rollover);
console.log('Updated shared policy, balance endpoint, and existing-rights guard.');
