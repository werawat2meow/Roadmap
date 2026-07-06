import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const BASE = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: `${BASE}/leave/dashboard`,
  HR_ADMIN:    `${BASE}/leave/dashboard`,
  HR_USER:     `${BASE}/leave/dashboard`,
  MANAGER:     `${BASE}/leave/approvals`,
  USER:        `${BASE}/leave/requests`,
  LEAVE:       `${BASE}/leave/requests`,
};

function pathAllowed(path: string, role?: string): boolean {
  if (path.startsWith("/_next") || path.startsWith("/favicon") || path.startsWith("/api/")) return true;
  if (!role) return false;
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN" || role === "HR_USER") return true;
  if (role === "MANAGER") return path.startsWith("/leave/approvals") || path.startsWith("/leave/requests");
  if (role === "USER" || role === "LEAVE") return path.startsWith("/leave/requests");
  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get("employee_token")?.value;
  let role: string | undefined;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      role = ((payload as any).role ?? (payload as any).role_code) as string;
    } catch {}
  }

  if (pathname === "/" || pathname === "/leave" || pathname === "/leave/" || pathname === "/leave/login") {
    if (role) return NextResponse.redirect(ROLE_HOME[role] ?? `${BASE}/leave/dashboard`);
    return NextResponse.redirect(`${BASE}/login`);
  }

  const allowed = pathAllowed(pathname, role);
  if (!allowed) {
    if (!role) return NextResponse.redirect(`${BASE}/login`);
    return NextResponse.redirect(ROLE_HOME[role] ?? `${BASE}/leave/dashboard`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/leave", "/leave/:path*"],
};