import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createAccessToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN || "15m")
    .sign(accessSecret);
}

export async function createRefreshToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || "7d")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload;
}

export async function verifyRefreshToken(token) {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload;
}