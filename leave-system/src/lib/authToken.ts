import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export type TokenPayload = {
  user_id: string;
  employee_id: string;
  role_id?: string;
  username?: string;
  role?: string;
  role_code?: string;
  role_name?: string;
  permissions?: string[];
  employee_code?: string;
  full_name?: string;
};

export async function getTokenPayload(): Promise<TokenPayload | null> {
  const token = (await cookies()).get("employee_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
