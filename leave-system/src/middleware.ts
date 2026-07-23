import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PORTAL_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://roadmap-sigma-two.vercel.app";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/dashboard",
  HR_ADMIN:    "/dashboard",
  HR_USER:     "/dashboard",
  MANAGER:     "/approvals",
  USER:        "/requests",
  LEAVE:       "/requests",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("employee_token")?.value;

  // 1. ปล่อยผ่านไฟล์ระบบและ API
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 2. ถ้าไม่มี Token -> ดีดไป Login ที่ Portal
  if (!token) {
    return NextResponse.redirect(`${PORTAL_URL}/login`);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = ((payload as any).role ?? (payload as any).role_code) as string;

    const targetPath = ROLE_HOME[role] ?? "/dashboard";

    // --- จุดแก้ Loop สำคัญตรงนี้ครับ ---
    
    // ถ้าอยู่ที่หน้าแรกของระบบลา (ซึ่งคือ "/" เมื่อใช้ basePath)
    if (pathname === "/") {
      // ให้เด้งไปหน้าตามสิทธิ์ แต่ต้องเช็คว่าหน้าที่จะไป ไม่ใช่หน้าปัจจุบัน (ป้องกัน Loop)
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // ตรวจสอบสิทธิ์รายหน้า (Permission)
    // ตัวอย่าง: ถ้าเป็น User แต่จะแอบเข้า /approvals ให้ดีดกลับไปหน้าตัวเอง
    if (role === "USER" && pathname.startsWith("/approvals")) {
        return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // ถ้าทุกอย่างถูกต้อง ให้ปล่อยผ่านไปทำงานตามปกติ
    return NextResponse.next();

  } catch (error) {
    console.error("Middleware Auth Error:", error);
    // ถ้า Token มีปัญหา (Secret ไม่ตรง) ต้องดีดออกไป Login ใหม่
    return NextResponse.redirect(`${PORTAL_URL}/login`);
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};