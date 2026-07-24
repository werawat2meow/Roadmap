"use client";

import TierRow from "./TierRow";

export default function TierBuilder({
  tiers = [],
  tierErrors = [],

  addTier,
  updateTier,
  removeTier,
  duplicateTier,
  moveTier,
}) {
  return (
    <>
      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-slate-200">

          {/* Header */}

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

            <div>

              <h4 className="font-bold">
                Tier Rules
              </h4>

              <p className="text-sm text-slate-500">
                กำหนดช่วงการคำนวณ
              </p>

            </div>

            <button
              type="button"
              onClick={addTier}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Add Tier
            </button>

          </div>

          {/* Body */}

          <div className="divide-y">

            {tiers.length === 0 && (

              <div className="p-8 text-center text-slate-500">
                ยังไม่มี Tier
              </div>

            )}

            {tiers.map((tier, index) => (

              <TierRow
                key={tier.id}
                tier={tier}
                index={index}

                updateTier={updateTier}
                removeTier={removeTier}
                duplicateTier={duplicateTier}
                moveTier={moveTier}
              />

            ))}

          </div>

        </div>
      </div>

      {/* Validation */}

      {tierErrors.length > 0 && (

        <div className="lg:col-span-2">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

            <h4 className="font-bold text-red-700">
              Tier Validation
            </h4>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-red-700">

              {tierErrors.map((error, index) => (

                <li key={index}>
                  {error}
                </li>

              ))}

            </ul>

          </div>

        </div>

      )}

      {/* Success */}

      {tierErrors.length === 0 &&
        tiers.length > 0 && (

        <div className="lg:col-span-2">

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

            <div className="font-semibold text-green-700">
              ✓ Tier Configuration Valid
            </div>

            <p className="mt-2 text-sm text-green-600">
              ทุกช่วงการคำนวณถูกต้อง
            </p>

          </div>

        </div>

      )}

    </>
  );
}