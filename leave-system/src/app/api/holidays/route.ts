// src/app/api/holidays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { prisma } from "@/lib/prisma";

type Role = "MASTER_ADMIN" | "ADMIN" | "MANAGER" | "USER" | "SUPER_ADMIN";

function canWrite(role?: Role) {
  return role === "MASTER_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
}

// GET /api/holidays
export async function GET() {
  const items = await prisma.leaveHoliday.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(items);
}

// POST /api/holidays
export async function POST(req: NextRequest) {
  const token = await getTokenPayload();
  const role = token?.role as Role | undefined;
  if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { title?: string; date?: string; note?: string | null };
  if (!body.title || !body.date) {
    return NextResponse.json({ error: "title/date is required" }, { status: 400 });
  }

  try {
    const saved = await prisma.leaveHoliday.create({
      data: {
        title: body.title,
        date: new Date(body.date), // รับเป็น "YYYY-MM-DD"
        note: body.note ?? null,
      },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "duplicate (date,title)" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/holidays  (bulk upsert: ใช้ตอนกดบันทึกทั้งตาราง)
export async function PUT(req: NextRequest) {
  const token = await getTokenPayload();
  const role = token?.role as Role | undefined;
  if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  type Row = { id?: number | string; title?: string; date?: string; note?: string | null };
  const body = await req.json() as Row[] | { rows: Row[]; deletedIds?: Array<number | string> };

  const rows: Row[] = Array.isArray(body) ? body : body.rows;
  const deletedIdsRaw = Array.isArray(body) ? [] : (body.deletedIds ?? []);
  const deletedIds = deletedIdsRaw
    .map(v => Number(v))
    .filter(v => Number.isFinite(v) && v > 0);

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const cleaned = rows
    .map(r => ({
      id: (r.id === 0 || r.id) ? Number(r.id) : undefined,
      title: (r.title ?? "").trim(),
      date: (r.date ?? "").trim(), // YYYY-MM-DD
      note: ((r.note ?? "") as string).trim() || null,
    }))
    .filter(r => r.title && r.date);

  const toStartOfDayUTC = (d: string) => new Date(`${d}T00:00:00Z`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.leaveHoliday.findMany();
      const existingById = new Map(existing.map(e => [e.id, e]));

      let created = 0;
      let updated = 0;
      let deleted = 0;

      // 1) update by id, create if no id
      for (const r of cleaned) {
        if (Number.isFinite(r.id) && existingById.has(r.id!)) {
          await tx.leaveHoliday.update({
            where: { id: r.id! },
            data: {
              title: r.title,
              date: toStartOfDayUTC(r.date),
              note: r.note,
            },
          });
          updated++;
        } else {
          await tx.leaveHoliday.create({
            data: {
              title: r.title,
              date: toStartOfDayUTC(r.date),
              note: r.note,
            },
          });
          created++;
        }
      }

      // 2) delete only explicit ids
      if (deletedIds.length > 0) {
        const delRes = await tx.leaveHoliday.deleteMany({
          where: { id: { in: deletedIds } },
        });
        deleted += delRes.count;
      }

      return { created, updated, deleted, totalPayload: cleaned.length };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "duplicate (date,title)" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/holidays?id=123
export async function DELETE(req: NextRequest) {
  const token = await getTokenPayload();
  const role = token?.role as Role | undefined;
  if (!canWrite(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "id is required"}, { status: 400 });
    }

    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const deleted = await prisma.leaveHoliday.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedId: deleted.id }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (e?.code === "P2003") {
      // FK constraint failed (เช่นมีตารางอื่นอ้างถึงอยู่)
      return NextResponse.json({ error: "cannot delete: record is in use" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
