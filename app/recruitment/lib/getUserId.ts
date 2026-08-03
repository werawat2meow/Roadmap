import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getUserIdFromRequest(): Promise<number | string | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    ) as jwt.JwtPayload;

    return decoded?.user_id ?? null;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      return null;
    }

    return jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    ) as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
}