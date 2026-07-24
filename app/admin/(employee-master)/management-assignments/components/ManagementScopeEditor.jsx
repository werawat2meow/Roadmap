"use client";

import {
  ApartmentOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import ScopeCard from "./ScopeCard";

export default function ManagementScopeEditor({
  scopes,
  scopeOptions,
  loadingOptions = false,
  disabled = false,
  onAdd,
  onRemove,
  onUpdate,
  onSetPrimary,
}) {
  const scopeList =
    Array.isArray(scopes)
      ? scopes
      : [];

  const hasAllScope =
    scopeList.some(
      (scope) =>
        scope.scope_type === "all"
    );

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-lg text-sky-700">
            <ApartmentOutlined />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-800">
              ขอบเขตการดูแล
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              ผู้บริหารหนึ่งคนสามารถดูแลได้หลายบริษัท สาขา หรือหน่วยงาน
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={
            disabled ||
            hasAllScope
          }
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <PlusOutlined />

          เพิ่ม Scope
        </button>
      </div>

      {hasAllScope && (
        <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
          Scope แบบทั้งองค์กรไม่สามารถเพิ่ม Scope อื่นร่วมกันได้
        </div>
      )}

      {/* Scope List */}

      <div className="mt-5 space-y-4">
        {scopeList.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
              <ApartmentOutlined />
            </div>

            <h4 className="mt-4 text-sm font-black text-slate-700">
              ยังไม่ได้กำหนด Scope
            </h4>

            <p className="mt-2 text-sm text-slate-400">
              กดปุ่มเพิ่ม Scope เพื่อกำหนดขอบเขตการดูแล
            </p>

            <button
              type="button"
              disabled={disabled}
              onClick={onAdd}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <PlusOutlined />

              เพิ่ม Scope แรก
            </button>
          </div>
        ) : (
          scopeList.map((scope, index) => (
            <ScopeCard
              key={
                scope.id ||
                `scope-${index}`
              }
              scope={scope}
              index={index}
              totalScopes={scopeList.length}
              scopeOptions={scopeOptions}
              loadingOptions={loadingOptions}
              disabled={disabled}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onSetPrimary={onSetPrimary}
            />
          ))
        )}
      </div>

      {/* Footer Summary */}

      {scopeList.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            จำนวน Scope ทั้งหมด{" "}
            <strong className="text-slate-800">
              {scopeList.length}
            </strong>{" "}
            รายการ
          </span>

          <span>
            Scope หลัก{" "}
            <strong className="text-amber-700">
              {scopeList.filter(
                (scope) =>
                  scope.is_primary
              ).length}
            </strong>{" "}
            รายการ
          </span>
        </div>
      )}
    </section>
  );
}