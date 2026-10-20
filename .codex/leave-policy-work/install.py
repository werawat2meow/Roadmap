from pathlib import Path
import shutil, hashlib, json

root = Path(r'C:\Users\ADMIN\leave-employee-pwa')
stage = Path(__file__).parent
source = (root / 'src/app/api/leaves/route.ts').read_text(encoding='utf-8-sig')
get_body = source[source.index('export async function GET('):source.index('export async function POST(')]
imports = '''import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getTokenPayload } from "@/lib/authToken";
import { getEmployeeByUuid } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/prisma";
import { normalizeSession } from "@/lib/leave-utils";
import { civilDate, dateKey } from "@/lib/leave-policy-calendar";
import { checkLeave, LeavePolicyError, policyResponse, withEmployeeLock } from "@/lib/leave-policy";
import { sendPushNotification } from "@/lib/pushService";
import { PATCH as patchLeave } from "./[id]/route";

'''
# GET only lists the signed-in employee. A query parameter must not remove authorization.
get_body = get_body.replace('let whereCondition: any = {};\n    if (!department) {\n      whereCondition.employeeId = token.employee_id;\n    }',
                            'const whereCondition = { employeeId: token.employee_id };')
outputs = {
 'src/lib/leave-policy-calendar.ts': (stage / 'leave-policy-calendar.ts').read_text(encoding='utf-8'),
 'src/lib/leave-policy.ts': (stage / 'leave-policy.ts').read_text(encoding='utf-8'),
 'src/app/api/leaves/route.ts': imports + get_body + (stage / 'leaves-post.ts').read_text(encoding='utf-8'),
 'src/app/api/leaves/[id]/route.ts': (stage / 'leaves-id.ts').read_text(encoding='utf-8'),
}
backup = stage / 'before'
backup.mkdir(exist_ok=True)
manifest = {}
for relative, content in outputs.items():
 target = root / relative
 if target.exists():
  saved = backup / relative
  saved.parent.mkdir(parents=True, exist_ok=True)
  if not saved.exists(): shutil.copy2(target, saved)
  manifest[relative] = hashlib.sha256(target.read_bytes()).hexdigest()
 target.parent.mkdir(parents=True, exist_ok=True)
 target.write_text(content, encoding='utf-8')
(stage / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('Updated ' + ', '.join(outputs))
