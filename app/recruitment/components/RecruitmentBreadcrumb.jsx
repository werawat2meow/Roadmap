import Link from "next/link";

const ROOT_ITEM = {
  label: "ระบบสรรหา",
  href: "/recruitment",
};

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 shrink-0 text-slate-300"
    >
      <path
        fillRule="evenodd"
        d="M7.22 14.53a.75.75 0 0 1 0-1.06L10.69 10 7.22 6.53a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function RecruitmentBreadcrumb({ items = [], className = "" }) {
  const breadcrumbItems = [ROOT_ITEM, ...items];

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-slate-500 ${className}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {breadcrumbItems.map((item, index) => {
          const isCurrent = index === breadcrumbItems.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              {index > 0 && <ChevronIcon />}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={isCurrent ? "font-semibold text-slate-700" : ""}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
