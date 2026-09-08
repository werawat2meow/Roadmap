import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";


export async function GET() {
  const session = await getServerSession(authOptions);
  console.log("[GET /api/user] session ->", session);
  const role = (session as any)?.role as Role | undefined;
  if (!role) return NextResponse.json({ error: "Unauthhorized" }, { status: 401 });

  // Master/admin เห็นทั้งหมด manager เห็นเฉพาะ USER, user เห็นตัวเอง
  if (role === "MASTER_ADMIN" || role === "ADMIN") {
    const users = await prisma.user.findMany({
      select: { id:true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  }

  return NextResponse.json([
    await prisma.user.findUnique({
      where: { email: (session as any).user?.email as string },
      select: { id: true, email: true, name:true, role: true, createdAt: true },
    }),
  ]);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
    console.log("[POST /api/users] session →", session);
  const meRole = (session as any)?.role as Role | undefined;
  if (!meRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  //อนุญาตเฉพาะ MASTER_ADMIN/ADMIN
  if (meRole !== "MASTER_ADMIN" && meRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name, password, role } = await req.json();
  console.log("[POST /api/users] payload →", { email, name, role });

  //กัน Admin สร้าง Admin ด้วยกันเอง (เอาเฉพาะ MASTER เท่านั้น)
  if (meRole === "ADMIN" && role === "ADMIN") {
    return NextResponse.json({ error: "Admin cannot create Admin" }, {status: 403 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
