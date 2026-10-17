"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Mounted once within the existing authenticated Admin Layout.
export default function AdminActivityPageTracker() {
  const pathname = usePathname();
  const { user, loadingUser } = useAuth();
  const recorded = useRef("");

  useEffect(() => {
    if (loadingUser || !user || !pathname?.startsWith("/admin")) {
      recorded.current = "";
      return;
    }
    if (recorded.current === pathname) return;
    recorded.current = pathname;

    // Fire for each route navigation, never send identity/IP from the browser.
    // API verifies signed session and writes into the existing activity_logs table.
    fetch("/api/admin/activity-logs/page-view", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname }),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) recorded.current = "";
    }).catch(() => {
      recorded.current = "";
    });
  }, [pathname, user, loadingUser]);

  return null;
}
