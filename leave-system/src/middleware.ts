import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// URL ของหน้า Portal หลัก เอาไว้เด้งไปหน้า Login เท่านั้น
const PORTAL_LOGIN_URL = (process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000") + "/login";

// แก้ไขตรงนี้: ไม่ต้องใส่ ${BASE} ข้างหน้า เพราะ Next.js จะเติม /leave ให้เองจาก basePath
const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/dashboard",
  HR_ADMIN:    "/dashboard",
  HR_USER:     "/dashboard",
  MANAGER:     "/approvals",
  USER:        "/requests",
  LEAVE:       "/requests",
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get("employee_token")?.value;
  let role: string | undefined;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      role = ((payload as any).role ?? (payload as any).role_code) as string;
    } catch (e) {
      console.error("JWT Verify Error", e);
    }
  }

  // 1. ถ้าพยายามเข้าหน้าแรกของระบบลา (/leave) หรือหน้าล็อกอินของระบบลา
  // หมายเหตุ: Next.js จะมองเห็น /leave เป็น "/" เมื่อใช้ basePath
  if (pathname === "/" || pathname === "/login") {
    if (role) {
      // ถ้าล็อกอินแล้ว ให้ไปหน้า Dashboard ของตัวเอง (ใช้ relative path เพื่อป้องกัน Loop)
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/dashboard", req.url));
    }
    // ถ้ายังไม่ล็อกอิน ให้ดีดไปหน้า Login ของ Portal หลัก
    return NextResponse.redirect(PORTAL_LOGIN_URL);
  }

  // 2. ตรวจสอบสิทธิ์ (ถ้าไม่มี Role ให้ดีดกลับ Portal)
  if (!role && !pathname.startsWith("/api/")) {
     return NextResponse.redirect(PORTAL_LOGIN_URL);
  }

  return NextResponse.next();
}

export const config = {
  // ให้ทำงานทุกหน้าภายใต้ /leave
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};