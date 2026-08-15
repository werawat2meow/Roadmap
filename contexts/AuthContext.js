"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 นาที

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const hasFetchedOnce = useRef(false);

  const readUserFromStorage = () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("employee_user");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  };

  const readCacheMeta = () => {
    if (typeof window === "undefined") return null;
    const ts = localStorage.getItem("employee_user_cached_at");
    return ts ? Number(ts) : null;
  };

  const refreshUser = async ({ silent = false } = {}) => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        localStorage.removeItem("employee_user");
        localStorage.removeItem("employee_user_cached_at");
        localStorage.removeItem("employee_token");
        setUser(null);
        return null;
      }

      localStorage.setItem("employee_user", JSON.stringify(data.user));
      localStorage.setItem("employee_user_cached_at", String(Date.now()));
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("REFRESH_USER_ERROR:", error);
      // silent = background refresh ล้มเหลว ไม่ต้อง kick user ออกทันที
      // (เผื่อแค่เน็ตสะดุด ไม่ใช่ token หมดอายุจริง)
      if (!silent) {
        localStorage.removeItem("employee_user");
        setUser(null);
      }
      return null;
    }
  };

  useEffect(() => {
    if (hasFetchedOnce.current) return;
    hasFetchedOnce.current = true;

    const cachedUser = readUserFromStorage();
    const cachedAt = readCacheMeta();
    const isFresh = cachedAt && Date.now() - cachedAt < CACHE_TTL_MS;

    if (cachedUser) {
      // ✅ มี cache -> render ทันที ไม่ต้องรอ backend
      setUser(cachedUser);
      setLoadingUser(false);

      if (!isFresh) {
        // cache เก่าแล้ว -> sync เงียบๆ เบื้องหลัง ไม่ block UI
        refreshUser({ silent: true });
      }
      // ถ้ายัง fresh อยู่ -> ข้าม fetch ไปเลยรอบนี้
    } else {
      // ❌ ไม่มี cache (login ครั้งแรก / เปิด browser ใหม่) -> ต้องรอจริง
      refreshUser().finally(() => setLoadingUser(false));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}