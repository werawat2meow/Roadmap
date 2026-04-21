import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("employee_token")?.value;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*"],
};