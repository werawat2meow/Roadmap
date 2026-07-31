"use client";

type EvaluationPreviewModalProps = {
  open: boolean;
  data: any | null;
  onClose: () => void;
};

const formatEmpty = (value: any) => (value || value === 0 ? value : "");

const renderSectionRows = (rows: any[]) =>
  rows.map((row: any, idx: number) => (
    <tr key={idx} className="border-t border-slate-200">
      <td className="whitespace-nowrap px-3 py-2 text-slate-900">{formatEmpty(row.topic)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-center text-slate-900">
        {formatEmpty(row.maxScore)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-center text-slate-900">
        {formatEmpty(row.score)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-slate-900">{formatEmpty(row.remark)}</td>
    </tr>
  ));

const addBordersToSheet = (worksheet: any, XLSX: any) => {
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[address];
      if (!cell) continue;
      cell.s = cell.s || {};
      cell.s.border = {
        top: { style: "thin", color: { rgb: "FFBFBFBF" } },
        bottom: { style: "thin", color: { rgb: "FFBFBFBF" } },
        left: { style: "thin", color: { rgb: "FFBFBFBF" } },
        right: { style: "thin", color: { rgb: "FFBFBFBF" } },
      };
      if (!cell.s.font) cell.s.font = { name: "Arial", sz: 10 };
    }
  }
};

export default function EvaluationPreviewModal({
  open,
  data,
  onClose,
}: EvaluationPreviewModalProps) {
  if (!open || !data) return null;

  const companyRows = data.companyRows || [];
  const departmentRows = data.departmentRows || [];
  const expectationRows = data.expectationRows || [];

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const sheetData: any[][] = [
      ["แบบประเมิน ROAD MAP (หน้าที่ 1)"],
      [],
      ["ID", data.employeeId, "Name", data.employeeName],
      ["Nickname", data.nickName, "Position", data.position],
      ["Department", data.department, "Division", data.division],
      ["Unit", data.unit, "Level", data.level],
      ["Start Date", data.startDate, "Company", data.company],
      ["Evaluation Period", data.evaluationPeriod || "", "Status", data.status || ""],
      [],
      ["หัวข้อการประเมิน", "น้ำหนัก", "ผลการประเมิน", "หมายเหตุ"],
      ["Company Common Ground", "", "", ""],
      ...companyRows.map((row: any) => [
        row.topic || "",
        row.maxScore || "",
        row.score || "",
        row.remark || "",
      ]),
      ["รวมคะแนน", "", data.companyScore ?? "", ""],
      [],
      ["Department Common Ground", "", "", ""],
      ...departmentRows.map((row: any) => [
        row.topic || "",
        row.maxScore || "",
        row.score || "",
        row.remark || "",
      ]),
      ["รวมคะแนน", "", data.departmentScore ?? "", ""],
      [],
      ["Expectation", "", "", ""],
      ...expectationRows.map((row: any) => [
        row.topic || "",
        row.maxScore || "",
        row.score || "",
        row.remark || "",
      ]),
      ["รวมคะแนน", "", data.expectationScore ?? "", ""],
      [],
      ["สรุปคะแนน", "", data.totalScore ?? "", ""],
      ["เกรด", data.grade || "", "", ""],
      [],
      ["Manager Comment", data.managerComment || "", "", ""],
      [],
      ["Current Salary", data.currentSalary || "", "New Salary", data.newSalary || ""],
      [],
      ["ลงชื่อผู้ประเมิน", "", "พนักงานรับทราบ", ""],
      ["", "", "", ""],
      ["", "", "", ""],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    addBordersToSheet(worksheet, XLSX);

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 12 },
      { wch: 24 },
      { wch: 32 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluation Preview");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const blob = new Blob([buffer], {
      type: "application/octet-stream",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `evaluation-preview-${data.employeeName || data.employeeId}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Preview Evaluation Report
            </h3>
            <p className="text-sm text-slate-500">
              {data.employeeName || ""} - {data.evaluationType || ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

        <div className="space-y-6 p-6 overflow-y-auto max-h-[85vh]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ID</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.employeeId)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.employeeName)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.department)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unit</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.unit)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nickname</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.nickName)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Position</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.position)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Division</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.division)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Level</p>
                  <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.level)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Start Date</p>
                <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.startDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Company</p>
                <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.company)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Evaluation Period</p>
                <p className="mt-1 text-sm text-slate-900">
                  {formatEmpty(data.evaluationPeriod)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-1 text-sm text-slate-900">{formatEmpty(data.status)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Company Common Ground</h4>
              <span className="text-xs text-slate-500">
                รวมคะแนน {formatEmpty(data.companyScore)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="border border-slate-700 px-3 py-2 text-left">หัวข้อการประเมิน</th>
                    <th className="border border-slate-700 px-3 py-2 text-center">น้ำหนัก</th>
                    <th className="border border-slate-700 px-3 py-2 text-center">ผลการประเมิน</th>
                    <th className="border border-slate-700 px-3 py-2 text-left">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>{renderSectionRows(companyRows)}</tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Department Common Ground</h4>
              <span className="text-xs text-slate-500">
                รวมคะแนน {formatEmpty(data.departmentScore)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="border border-slate-700 px-3 py-2 text-left">หัวข้อการประเมิน</th>
                    <th className="border border-slate-700 px-3 py-2 text-center">น้ำหนัก</th>
                    <th className="border border-slate-700 px-3 py-2 text-center">ผลการประเมิน</th>
                    <th className="border border-slate-700 px-3 py-2 text-left">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>{renderSectionRows(departmentRows)}</tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-emerald-50/30 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Expectation</h4>
              <span className="text-xs text-slate-500">
                รวมคะแนน {formatEmpty(data.expectationScore)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-emerald-700 text-white">
                  <tr>
                    <th className="border border-slate-700 px-3 py-2 text-left">หัวข้อการประเมิน</th>
                    <th className="border border-slate-700 px-3 py-2 text-center">น้ำหนัก</th>
                    <th className="border border-slate-700 px-3 py-2 text-center">ผลการประเมิน</th>
                    <th className="border border-slate-700 px-3 py-2 text-left">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>{renderSectionRows(expectationRows)}</tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">คะแนนรวม</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatEmpty(data.totalScore)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">เกรด</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatEmpty(data.grade)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Manager Comment</p>
            <p className="mt-2 text-sm text-slate-900">{formatEmpty(data.managerComment)}</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Salary</p>
              <p className="mt-2 text-sm text-slate-900">
                {formatEmpty(data.currentSalary)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">New Salary</p>
              <p className="mt-2 text-sm text-slate-900">{formatEmpty(data.newSalary)}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5 text-center">
              <p className="text-sm text-slate-500">ลงชื่อผู้ประเมิน</p>
              <div className="mt-10 h-10 border-b border-slate-300" />
            </div>
            <div className="rounded-3xl border border-slate-200 p-5 text-center">
              <p className="text-sm text-slate-500">พนักงานรับทราบ</p>
              <div className="mt-10 h-10 border-b border-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}