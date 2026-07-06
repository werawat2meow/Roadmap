import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  MASTER_ADMIN: "/dashboard",
  ADMIN:        "/dashboard",
  SUPER_ADMIN:  "/dashboard",
  HR_ADMIN:     "/dashboard",
  HR_USER:      "/dashboard",
  MANAGER:      "/approvals",
  USER:         "/requests",
  LEAVE:        "/requests",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rawRole =
    (session as any)?.role ??
    (session as any)?.role_code ??
    (session as any)?.user?.role ??
    (session as any)?.user?.role_code;
  const role = typeof rawRole === "string" ? rawRole.toUpperCase() : undefined;

  redirect(ROLE_HOME[role ?? ""] ?? "/dashboard");
}
