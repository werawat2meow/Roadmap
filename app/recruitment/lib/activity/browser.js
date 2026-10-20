"use client";

import { isActivityExcluded } from "./policy";

export async function sendBrowserActivity(action, pagePath = window.location.pathname, eventId = crypto.randomUUID()) {
  if (isActivityExcluded(pagePath)) return;
  const body = JSON.stringify({ action, page_path: pagePath, event_id: eventId });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("/recruitment/api/activity", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json" }, body,
      });
      if (response.ok || response.status < 500) return;
    } catch { /* Retry the same event, never a new event ID. */ }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
  }
}

export function createPageVisitTracker(send = sendBrowserActivity) {
  let previous = null;
  return (pathname, navigationKey, restored = false) => {
    if (!restored && previous === navigationKey) return;
    previous = navigationKey;
    if (isActivityExcluded(pathname)) return;
    return send("PAGE_VIEW", pathname, crypto.randomUUID());
  };
}
