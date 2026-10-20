const fs = require('fs');
const root = 'C:/Users/ADMIN/leave-employee-pwa';
for (const [staged, relative] of [
 ['leave-policy.ts', 'src/lib/leave-policy.ts'],
 ['leave-policy-calendar.ts', 'src/lib/leave-policy-calendar.ts'],
 ['leaves-id.ts', 'src/app/api/leaves/[id]/route.ts'],
]) fs.writeFileSync(root + '/' + relative, fs.readFileSync(__dirname + '/' + staged, 'utf8'), 'utf8');
console.log('Synchronized shared policy and approval route.');
