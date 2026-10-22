const fs = require('fs');
const path = require('path');
const root = 'C:/Users/ADMIN/leave-employee-pwa';
for (const [from,to] of [['leave-policy.ts','src/lib/leave-policy.ts'], ['leave-policy-calendar.ts','src/lib/leave-policy-calendar.ts'], ['leaves-id.ts','src/app/api/leaves/[id]/route.ts']]) {
 fs.writeFileSync(path.join(root,to),fs.readFileSync(path.join(__dirname,from),'utf8'),'utf8');
}
fs.mkdirSync(path.join(root,'tests'),{recursive:true});
const tests=fs.readFileSync(path.join(__dirname,'policy.test.cjs'),'utf8')
 .replace("const root = 'C:/Users/ADMIN/leave-employee-pwa';", "const root = require('path').resolve(__dirname, '..');");
fs.writeFileSync(path.join(root,'tests/leave-policy.test.cjs'),tests,'utf8');
const packagePath=path.join(root,'package.json');
const packageBackup=path.join(__dirname,'before/package.json');
if(!fs.existsSync(packageBackup))fs.copyFileSync(packagePath,packageBackup);
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
pkg.scripts['test:leave-policy']='node tests/leave-policy.test.cjs';
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('Installed policy tests and npm test script.');
