"use client";

import { Tag } from "antd";

const statusMap = {
  draft: {
    color:
      "bg-slate-100 text-slate-700",
    label: "Draft",
  },

  pending: {
    color:
      "bg-amber-100 text-amber-700",
    label: "Pending",
  },

  in_review: {
    color:
      "bg-blue-100 text-blue-700",
    label: "In Review",
  },

  approved: {
    color:
      "bg-emerald-100 text-emerald-700",
    label: "Approved",
  },

  rejected: {
    color:
      "bg-red-100 text-red-700",
    label: "Rejected",
  },

  cancelled: {
    color:
      "bg-slate-200 text-slate-700",
    label: "Cancelled",
  },

  paid: {
    color:
      "bg-violet-100 text-violet-700",
    label: "Paid",
  },
};

export default function RequestStatusTag({
  status,
}) {
  const config =
    statusMap[status] ||
    statusMap.pending;

  return (
    <Tag
      className={`m-0 rounded-full border-0 ${config.color}`}
    >
      {config.label}
    </Tag>
  );
}