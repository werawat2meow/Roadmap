import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("employee_token")?.value;

  // 1. ปล่อยผ่านไฟล์ระบบ (ห้ามยุ่ง)
  if (pathname.startsWith("/_next") || pathname.includes(".") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. ถ้าไม่มีคุกกี้ -> แสดงข้อความบอกตรงๆ (ไม่เด้งหนี)
  if (!token) {
    return new NextResponse("🛑 [DEBUG] ไม่พบคุกกี้ 'employee_token' ในเบราว์เซอร์ของคุณ กรุณาล็อกอินที่หน้าหลักก่อน", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // ดึงสิทธิ์ (Role)
    const role = ((payload as any).role ?? (payload as any).role_code) as string;

    // 3. ตรวจสอบสิทธิ์ (Permission) รายหน้า
    // ถ้าพยายามเข้าหน้าอนุมัติ แต่ไม่ใช่ MANAGER หรือ ADMIN -> บล็อกไว้ตรงนี้
    if (pathname.startsWith("/approvals") && !(role === "MANAGER" || role === "SUPER_ADMIN" || role === "HR_ADMIN")) {
      return new NextResponse(`🚫 [DEBUG] คุณมีสิทธิ์เป็น '${role}' ซึ่งไม่ได้รับอนุญาตให้เข้าหน้า Approvals`, { status: 403 });
    }

    // ✅ ถ้าผ่านทุกอย่าง ให้ "ปล่อยผ่าน" ไปหน้าเว็บจริง
    // การใช้ next() จะทำให้หน้าเว็บโหลดได้โดยไม่เกิดการ Redirect วนลูปครับ
    return NextResponse.next();

  } catch (error: any) {
    // 4. ถ้ากุญแจไม่ตรง (JWT_SECRET) จะเห็นข้อความนี้
    return new NextResponse(`❌ [DEBUG] รหัสลับ JWT_SECRET ไม่ตรงกัน หรือ Token หมดอายุ (Error: ${error.message})`, { status: 403 });
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};