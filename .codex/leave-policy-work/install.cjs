const fs = require('fs');
const path = require('path');
const root = 'C:/Users/ADMIN/leave-employee-pwa';
const stage = __dirname;
const original = fs.readFileSync(path.join(root, 'src/app/api/leaves/route.ts'), 'utf8');
let get = original.slice(original.indexOf('export async function GET('), original.indexOf('export async function POST('));
get = get.replace(/let whereCondition: any = \{\};\s*if \(!department\) \{\s*whereCondition.employeeId = token.employee_id;\s*\}/, 'const whereCondition = { employeeId: token.employee_id };');
const imports = `import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getTokenPayload } from "@/lib/authToken";
import { getEmployeeByUuid } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/prisma";
import { normalizeSession } from "@/lib/leave-utils";
import { civilDate, dateKey } from "@/lib/leave-policy-calendar";
import { checkLeave, LeavePolicyError, policyResponse, withEmployeeLock } from "@/lib/leave-policy";
import { sendPushNotification } from "@/lib/pushService";
import { PATCH as patchLeave } from "./[id]/route";

`;
const outputs = {
 'src/lib/leave-policy-calendar.ts': fs.readFileSync(path.join(stage, 'leave-policy-calendar.ts'), 'utf8'),
 'src/lib/leave-policy.ts': fs.readFileSync(path.join(stage, 'leave-policy.ts'), 'utf8'),
 'src/app/api/leaves/route.ts': imports + get + fs.readFileSync(path.join(stage, 'leaves-post.ts'), 'utf8'),
 'src/app/api/leaves/[id]/route.ts': fs.readFileSync(path.join(stage, 'leaves-id.ts'), 'utf8'),
};
for (const [relative, text] of Object.entries(outputs)) {
 const target = path.join(root, relative);
 const backup = path.join(stage, 'before', relative);
 if (fs.existsSync(target) && !fs.existsSync(backup)) { fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(target, backup); }
 fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text, 'utf8');
}
console.log('Updated ' + Object.keys(outputs).join(', '));
