"use client";
import NeonTabs from "@/components/NeonTabs";

export type LeaveMenuKey = "Dashboard" | "Requests" | "Approvals" | "Reports";

export default function LeaveTabs({
  value,
  onChange,
  className = "",
}: {
  value: LeaveMenuKey;
  onChange: (v: LeaveMenuKey) => void;
  className?: string;
}) {
  const items: LeaveMenuKey[] = ["Dashboard", "Requests", "Approvals", "Reports"];
  return (
    <NeonTabs
      className={className}
      items={items}
      value={value}
      onChange={(v) => onChange(v as LeaveMenuKey)}
    />
  );
}
