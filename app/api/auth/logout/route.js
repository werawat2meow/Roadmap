import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout success",
  });

  response.cookies.set("employee_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}