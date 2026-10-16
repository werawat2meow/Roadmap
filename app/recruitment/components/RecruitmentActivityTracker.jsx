"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createPageVisitTracker } from "../lib/activity/browser";

export default function RecruitmentActivityTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const track = useRef(null);
  useEffect(() => {
    if (!track.current) track.current = createPageVisitTracker();
    // Query values distinguish navigation only in memory; they never leave the browser.
    if (pathname) void track.current(pathname, `${pathname}?${search.toString()}`);
  }, [pathname, search]);
  useEffect(() => {
    const onRestore = (event) => {
      if (event.persisted) void track.current?.(window.location.pathname, `${window.location.pathname}${window.location.search || "?"}`, true);
    };
    window.addEventListener("pageshow", onRestore);
    return () => window.removeEventListener("pageshow", onRestore);
  }, []);
  return null;
}
