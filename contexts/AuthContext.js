"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("employee_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/access/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        localStorage.removeItem("employee_user");
        localStorage.removeItem("employee_token");
        setUser(null);
        return;
      }

      localStorage.setItem("employee_user", JSON.stringify(data.data));
      setUser(data.data);
      return data.data;
    } catch (error) {
      console.error("REFRESH_USER_ERROR:", error);
      localStorage.removeItem("employee_user");
      setUser(null);
      return null;
    }
  };

useEffect(() => {
  async function initAuth() {
    try {
      await refreshUser();
    } finally {
      setLoadingUser(false);
    }
  }

  initAuth();
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