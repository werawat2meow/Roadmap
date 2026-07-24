"use client";

export default function PositionTable({
  loading,
  positions,
  page,
  pageSize,
  canEdit,
  canDelete,
  deletingId,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">

          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">
                #
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Position Code
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Position Name
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Family
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Group
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Allowed Levels
              </th>

              <th className="px-6 py-4 text-left font-semibold">
                Status
              </th>

              <th className="px-6 py-4 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              [...Array(pageSize)].map((_, i) => (
                <tr
                  key={i}
                  className="border-t"
                >
                  {[...Array(8)].map((__, j) => (
                    <td
                      key={j}
                      className="px-6 py-4"
                    >
                      <div className="h-4 animate-pulse rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))

            ) : positions.length === 0 ? (

              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-slate-400"
                >
                  ไม่พบข้อมูลตำแหน่ง
                </td>
              </tr>

            ) : (

              positions.map((position, index) => (

                <tr
                  key={position.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="px-6 py-4">
                    {(page - 1) * pageSize + index + 1}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {position.code}
                  </td>

                  <td className="px-6 py-4">
                    {position.name}
                  </td>

                  <td className="px-6 py-4">
                    {position.family_name || "-"}
                  </td>

                  <td className="px-6 py-4">
                    {position.group || "-"}
                  </td>

                  <td className="px-6 py-4">

                    <div className="flex flex-wrap gap-2">

                      {(position.position_levels || []).length > 0 ? (

                        position.position_levels.map((level) => (

                          <span
                            key={level.id}
                            className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                          >
                            {level.level_code}
                          </span>

                        ))

                      ) : (

                        <span className="text-slate-400">
                          -
                        </span>

                      )}

                    </div>

                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
                      ${
                        position.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {position.status}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <div className="flex justify-end gap-2">

                      {canEdit && (

                        <button
                          onClick={() => onEdit(position)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs hover:bg-slate-100"
                        >
                          Edit
                        </button>

                      )}

                      {canDelete && (

                        <button
                          disabled={deletingId === position.id}
                          onClick={() => onDelete(position)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          {deletingId === position.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      )}

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}