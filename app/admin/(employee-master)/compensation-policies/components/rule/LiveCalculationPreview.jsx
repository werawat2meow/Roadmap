"use client";

export default function LiveCalculationPreview({
  testAmount,
  setTestAmount,
  calculatePreview,
}) {
  return (
    <div className="lg:col-span-2">

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50">

        {/* Header */}

        <div className="border-b border-emerald-200 px-6 py-4">

          <h4 className="font-bold text-emerald-700">
            Live Calculation Preview
          </h4>

          <p className="mt-1 text-sm text-emerald-600">
            ทดลองคำนวณ Rule นี้ด้วยค่าตัวอย่าง
          </p>

        </div>

        {/* Body */}

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

          {/* Test Amount */}

          <div>

            <label className="mb-2 block text-sm font-semibold">
              Test Amount
            </label>

            <input
              type="number"
              value={testAmount}
              onChange={(e) =>
                setTestAmount(e.target.value)
              }
              placeholder="35000"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />

          </div>

          {/* Result */}

          <div>

            <label className="mb-2 block text-sm font-semibold">
              Result
            </label>

            <div className="rounded-2xl border border-emerald-300 bg-white px-4 py-3">

              <div className="text-3xl font-bold text-emerald-700">

                {Number(
                  calculatePreview?.() || 0
                ).toLocaleString()}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}