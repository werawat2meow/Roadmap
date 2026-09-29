"use client";

import { useEffect, useRef } from "react";

export function useRoadmapPageLog(page: string) {
  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (!page) return;
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    fetch("/roadmap/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page,
        action: "page_view",
        description: `เปิดหน้า ${page}`,
      }),
    }).catch((error) => {
      console.error("Roadmap page log failed:", error);
    });
  }, [page]);
}