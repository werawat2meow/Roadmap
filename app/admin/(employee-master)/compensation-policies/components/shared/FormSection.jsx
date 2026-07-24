"use client";

export default function FormSection({
  title,
  description,
  icon,
  iconClassName = "bg-slate-900",
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white">

      <div className="border-b border-slate-200 px-6 py-5">

        <div className="flex items-center gap-3">

          {icon && (
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${iconClassName}`}
            >
              {icon}
            </div>
          )}

          <div>

            <h3 className="text-lg font-bold text-slate-800">
              {title}
            </h3>

            {description && (
              <p className="text-sm text-slate-500">
                {description}
              </p>
            )}

          </div>

        </div>

      </div>

      <div className="p-6">

        {children}

      </div>

    </section>
  );
}