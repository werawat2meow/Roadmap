import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// URL ของหน้า Portal หลัก (ที่มีหน้า Login) 
// ต้องตั้งค่า NEXT_PUBLIC_MAIN_APP_URL ใน Vercel เป็น https://roadmap-sigma-two.vercel.app
const PORTAL_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/dashboard",
  HR_ADMIN:    "/dashboard",
  HR_USER:     "/dashboard",
  MANAGER:     "/approvals",
  USER:        "/requests",
  LEAVE:       "/requests",
};

function pathAllowed(path: string, role?: string): boolean {
  // อนุญาตไฟล์ระบบและ API เสมอ
  if (path.startsWith("/_next") || path.startsWith("/favicon") || path.startsWith("/api/")) return true;
  
  if (!role) return false;
  
  // Admin เข้าได้ทุกหน้า
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN" || role === "HR_USER") return true;
  
  // Manager และ User จำกัดหน้าตามสิทธิ์ (ตัด /leave ออกแล้ว)
  if (role === "MANAGER") return path.startsWith("/approvals") || path.startsWith("/requests");
  if (role === "USER" || role === "LEAVE") return path.startsWith("/requests");
  
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const token = req.cookies.get("employee_token")?.value;
  let role: string | undefined;

  // ตรวจสอบ JWT Token
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      // รองรับทั้ง payload.role หรือ payload.role_code
      role = ((payload as any).role ?? (payload as any).role_code) as string;
    } catch (err) {
      console.error("JWT Verification failed", err);
    }
  }

  // กรณีเข้าหน้าแรกของเว็บลางาน (/) หรือเข้าหน้า /login ตรงๆ
  if (pathname === "/" || pathname === "/login") {
    if (role) {
      const destination = ROLE_HOME[role] ?? "/dashboard";
      return NextResponse.redirect(new URL(destination, origin));
    }
    // ถ้ายังไม่ได้ Login ให้เด้งกลับไปหน้า Login ของ Portal หลัก
    return NextResponse.redirect(`${PORTAL_URL}/login`);
  }

  // ตรวจสอบสิทธิ์การเข้าถึงหน้าต่างๆ
  const allowed = pathAllowed(pathname, role);
  if (!allowed) {
    if (!role) {
      // ถ้าไม่มี Token ให้กลับไป Login ที่ Portal
      return NextResponse.redirect(`${PORTAL_URL}/login`);
    }
    // ถ้ามี Token แต่เข้าหน้านั้นไม่ได้ ให้ส่งไปหน้าแรกตามสิทธิ์ของตัวเอง
    const destination = ROLE_HOME[role] ?? "/dashboard";
    return NextResponse.redirect(new URL(destination, origin));
  }

  return NextResponse.next();
}

// ปรับปรุง Matcher ให้ครอบคลุมทุกหน้ายกเว้นไฟล์ระบบ
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};