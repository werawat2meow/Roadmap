import jwt from "jsonwebtoken";

// Resolve actor only from a server-verified signed cookie. Never trust client body fields.
export function getVerifiedAuditActor(req) {
  try {
    const token = req.cookies?.get("employee_token")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key", {
      algorithms: ["HS256"],
    });
    if (!payload || typeof payload !== "object" || !payload.user_id) return null;
    return {
      user_account_id: String(payload.user_id),
      employee_id: payload.employee_id || null,
      username: payload.username || null,
    };
  } catch { return null; }
}
