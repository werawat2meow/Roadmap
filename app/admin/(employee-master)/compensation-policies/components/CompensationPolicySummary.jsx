"use client";

import {
  DocumentTextIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

export default function CompensationPolicySummary({
  loading = false,

  summary = {
    total: 0,
    active: 0,
    draft: 0,
    review: 0,
    approved: 0,
    expired: 0,
    archived: 0,
    effective_this_month: 0,
  },
}) {
  const cards = [
    {
      title: "Total Policies",
      value: summary.total,
      icon: DocumentTextIcon,
      bg: "bg-slate-50",
      iconBg: "bg-slate-800",
      text: "text-slate-800",
    },

    {
      title: "Active",
      value: summary.active,
      icon: CheckCircleIcon,
      bg: "bg-green-50",
      iconBg: "bg-green-600",
      text: "text-green-700",
    },

    {
      title: "Draft",
      value: summary.draft,
      icon: PencilSquareIcon,
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-500",
      text: "text-yellow-700",
    },

    {
      title: "Review",
      value: summary.review,
      icon: ClockIcon,
      bg: "bg-blue-50",
      iconBg: "bg-blue-600",
      text: "text-blue-700",
    },

    {
      title: "Approved",
      value: summary.approved,
      icon: ShieldCheckIcon,
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-600",
      text: "text-emerald-700",
    },

    {
      title: "Expired",
      value: summary.expired,
      icon: ExclamationTriangleIcon,
      bg: "bg-red-50",
      iconBg: "bg-red-600",
      text: "text-red-700",
    },

    {
      title: "Archived",
      value: summary.archived,
      icon: ArchiveBoxIcon,
      bg: "bg-slate-100",
      iconBg: "bg-slate-500",
      text: "text-slate-700",
    },

    {
      title: "Effective This Month",
      value: summary.effective_this_month,
      icon: CalendarDaysIcon,
      bg: "bg-purple-50",
      iconBg: "bg-purple-600",
      text: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`rounded-3xl border border-slate-200 ${card.bg} p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.title}
                </p>

                {loading ? (
                  <div className="mt-3 h-10 w-20 animate-pulse rounded bg-slate-200" />
                ) : (
                  <h2
                    className={`mt-3 text-4xl font-bold ${card.text}`}
                  >
                    {card.value}
                  </h2>
                )}

              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg} text-white`}
              >
                <Icon className="h-7 w-7" />
              </div>

            </div>
          </div>
        );
      })}

    </div>
  );
}