"use client";

import {
  CrownOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import ScopeTypeSelect from "./ScopeTypeSelect";
import ScopeTargetSelect from "./ScopeTargetSelect";

export default function ScopeCard({
  scope,
  index,
  totalScopes,
  scopeOptions,
  loadingOptions = false,
  disabled = false,
  onUpdate,
  onRemove,
  onSetPrimary,
}) {
  const isPrimary =
    Boolean(scope?.is_primary);

  const canRemove =
    totalScopes > 1 &&
    !disabled;

  return (
    <div
      className={[
        "relative rounded-3xl border p-5 transition",
        isPrimary
          ? "border-amber-300 bg-amber-50/50 shadow-sm"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      {/* Header */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
            {index + 1}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-slate-800">
                Scope ลำดับที่ {index + 1}
              </h4>

              {isPrimary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  <CrownOutlined />

                  Scope หลัก
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              กำหนดประเภทและพื้นที่ที่ผู้บริหารรับผิดชอบ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPrimary && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSetPrimary(index)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CrownOutlined />

              ตั้งเป็นหลัก
            </button>
          )}

          <button
            type="button"
            disabled={!canRemove}
            onClick={() => onRemove(index)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DeleteOutlined />

            ลบ
          </button>
        </div>
      </div>

      {/* Form */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ScopeTypeSelect
          value={scope?.scope_type}
          disabled={disabled}
          onChange={(nextScopeType) => {
            onUpdate(
              index,
              "scope_type",
              nextScopeType
            );
          }}
        />

        <ScopeTargetSelect
          scope={scope}
          options={scopeOptions}
          loading={loadingOptions}
          disabled={disabled}
          onChange={(field, value) => {
            onUpdate(
              index,
              field,
              value
            );
          }}
        />
      </div>

      {/* Sort order */}

      <div className="mt-5 max-w-xs">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          ลำดับการแสดงผล
        </label>

        <input
          type="number"
          min="0"
          disabled={disabled}
          value={scope?.sort_order ?? index}
          onChange={(event) => {
            onUpdate(
              index,
              "sort_order",
              event.target.value
            );
          }}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
    </div>
  );
}