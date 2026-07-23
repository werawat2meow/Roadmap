"use client";

type EvaluationPreviewModalProps = {
  open: boolean;
  data: any | null;
  onClose: () => void;
};

export default function EvaluationPreviewModal({
  open,
  data,
  onClose,
}: EvaluationPreviewModalProps) {
  if (!open || !data) return null;

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const headerRows = [
      ["Evaluation Preview"],
      [],
      ["Employee ID", data.employeeId],
      ["Name", data.employeeName],
      ["Department", data.department],
      ["Division", data.division],
      ["Unit", data.unit],
      ["Level", data.level],
      ["Evaluation Type", data.evaluationType],
      ["Status", data.status],
      ["Created At", data.createdAt],
      [],
      ["Category", "Score", "Remark", "Included"],
    ];

    const scoreRows = (data.scoreRows || []).map((row: any) => [
      row.category_item_id,
      row.score,
      row.remark || "",
      row.is_included ? "Yes" : "No",
    ]);

    const sheetData = [...headerRows, ...scoreRows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Preview");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const blob = new Blob([buffer], {
      type: "application/octet-stream",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `evaluation-preview-${data.employeeId}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Preview Evaluation Report</h3>
            <p className="text-sm text-slate-500">
              {data.employeeName} - {data.evaluationType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Print / Save PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Export Excel
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6 overflow-y-auto max-h-[80vh]">
          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">ID</p>
                <p>{data.employeeId}</p>
              </div>
              <div>
                <p className="font-semibold">Name</p>
                <p>{data.employeeName}</p>
              </div>
              <div>
                <p className="font-semibold">Department</p>
                <p>{data.department}</p>
              </div>
              <div>
                <p className="font-semibold">Division</p>
                <p>{data.division}</p>
              </div>
              <div>
                <p className="font-semibold">Unit</p>
                <p>{data.unit}</p>
              </div>
              <div>
                <p className="font-semibold">Level</p>
                <p>{data.level}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <h4 className="mb-4 text-sm font-semibold text-slate-700">
              Scores
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Remark</th>
                    <th className="px-3 py-2">Included</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.scoreRows || []).map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-3 py-2">{row.category_item_id}</td>
                      <td className="px-3 py-2">{row.score}</td>
                      <td className="px-3 py-2">{row.remark || "-"}</td>
                      <td className="px-3 py-2">
                        {row.is_included ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
              <p className="text-sm text-slate-500">Company Score</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {data.companyScore ?? "-"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
              <p className="text-sm text-slate-500">Department Score</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {data.departmentScore ?? "-"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <p className="text-sm text-slate-500">Manager Comment</p>
            <p className="mt-2 text-slate-900">{data.managerComment || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}