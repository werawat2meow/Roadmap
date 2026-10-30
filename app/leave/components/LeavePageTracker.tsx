"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { getLeaveAuditPage } from "@/lib/leave-audit-pages";

type PageEvent = {
  eventId: string;
  pagePath: string;
};

async function sendPageEvent(event: PageEvent, attempt = 0): Promise<void> {
  try {
    const response = await fetch("/leave/api/audit/page-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify(event),
    });

    if (response.ok) return;

    // ข้อมูลผิดหรือไม่มีสิทธิ์ ไม่ส่งซ้ำ
    if (response.status < 500 && response.status !== 429) {
      console.warn(
        "Leave page log was rejected:",
        response.status,
        event.pagePath,
      );
      return;
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    // ลองใหม่รวมไม่เกิน 3 ครั้ง โดยใช้ eventId เดิม
    if (attempt < 2) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, (attempt + 1) * 1000);
      });

      return sendPageEvent(event, attempt + 1);
    }

    console.error("Leave page log failed after retries:", {
      pagePath: event.pagePath,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default function LeavePageTracker() {
  const pathname = usePathname();

  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const page = getLeaveAuditPage(pathname);

    if (!page) return;

    // กัน effect ซ้ำใน React Strict Mode
    if (lastPathRef.current === page.pagePath) return;

    lastPathRef.current = page.pagePath;

    const event: PageEvent = {
      eventId: window.crypto.randomUUID(),
      pagePath: page.pagePath,
    };

    void sendPageEvent(event);
  }, [pathname]);

  return null;
}