"use client";

export default function ValidationSummary({
  errors = [],
}) {
  if (!errors.length) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">

        ✓ Validation Passed

      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

      <div className="font-semibold text-red-700">

        กรุณาตรวจสอบข้อมูล

      </div>

      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-red-700">

        {errors.map((error,index)=>(
          <li key={index}>
            {error}
          </li>
        ))}

      </ul>

    </div>
  );
}