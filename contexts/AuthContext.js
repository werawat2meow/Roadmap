"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  const hasFetchedOnce =
    useRef(false);

  /* =========================================================
     Local Storage
  ========================================================= */

  const readUserFromStorage = () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    const raw =
      localStorage.getItem(
        "employee_user"
      );

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(
        "employee_user"
      );

      return null;
    }
  };

  /* =========================================================
     Refresh User
  ========================================================= */

  const refreshUser = async ({
    silent = false,
  } = {}) => {
    try {
      const res = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data?.success
      ) {
        localStorage.removeItem(
          "employee_user"
        );

        localStorage.removeItem(
          "employee_user_cached_at"
        );

        localStorage.removeItem(
          "employee_token"
        );

        setUser(null);

        return null;
      }

      // =====================================================
      // Backend คือ Source of Truth
      // =====================================================

      localStorage.setItem(
        "employee_user",
        JSON.stringify(
          data.user
        )
      );

      setUser(data.user);

      return data.user;
    } catch (error) {
      console.error(
        "REFRESH_USER_ERROR:",
        error
      );

      if (!silent) {
        localStorage.removeItem(
          "employee_user"
        );

        setUser(null);
      }

      return null;
    }
  };

  /* =========================================================
     Initial Authentication
  ========================================================= */

  useEffect(() => {
    if (
      hasFetchedOnce.current
    ) {
      return;
    }

    hasFetchedOnce.current =
      true;

    const cachedUser =
      readUserFromStorage();

    if (cachedUser) {
      // =====================================================
      // Render cache ก่อน
      // เพื่อไม่ให้หน้ากระพริบ / รอ API
      // =====================================================

      setUser(cachedUser);
      setLoadingUser(false);

      // =====================================================
      // แต่ต้อง sync backend ทุกครั้ง
      //
      // Permission / Role / Scope
      // อาจถูก Admin เปลี่ยนแล้ว
      // =====================================================

      refreshUser({
        silent: true,
      });

      return;
    }

    // =======================================================
    // ไม่มี Cache
    // =======================================================

    refreshUser().finally(
      () => {
        setLoadingUser(false);
      }
    );
  }, []);

  /* =========================================================
     Provider
  ========================================================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        loadingUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx =
    useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}