"use client";

import { useEffect, useState } from "react";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const readUserFromStorage = () => {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem("employee_user");
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("READ_AUTH_ERROR:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Refresh user failed");
      }

      localStorage.setItem("employee_user", JSON.stringify(data.user));
      setUser(data.user);

      return data.user;
    } catch (error) {
      console.error("REFRESH_USER_ERROR:", error);
      localStorage.removeItem("employee_user");
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const currentUser = readUserFromStorage();

    if (currentUser) {
      setUser(currentUser);
    }

    refreshUser().finally(() => {
      setLoadingUser(false);
    });
  }, []);

  return {
    user,
    setUser,
    refreshUser,
    loadingUser,
  };
}