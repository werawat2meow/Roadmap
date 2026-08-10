"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar from "@/app/roadmap/components/SearchBar";
import ReportTable from "./ReportTable";
import EvaluationPreviewModal from "./EvaluationPreviewModal";

type FilterState = {
  department: string;
  division: string;
  unit: string;
  level: string;
};

type EvaluationRecord = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  division: string;
  unit: string;
  level: string;
  evaluationType: string;
  latestDate: string;
  score: number | null;
  status: string;
  evaluationCount: number;
  scorePercent: string;
};

function downloadCsvFile(
  filename: string,
  columns: { header: string; key: string }[],
  rows: Record<string, any>[],
) {
  const header = columns
    .map((col) => `"${col.header.replace(/"/g, '""')}"`)
    .join(",");
  const csvRows = rows.map((row) =>
    columns
      .map((col) => `"${String(row[col.key] ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header, ...csvRows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function EvaluationHistoryPanel({
  evaluationType,
}: {
  evaluationType: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    department: "",
    division: "",
    unit: "",
    level: "",
  });
  const [rows, setRows] = useState<EvaluationRecord[]>([]);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const branches = useMemo(
    () => [...new Set(rows.map((row) => row.branch).filter(Boolean))],
    [rows],
  );
  const departments = useMemo(
    () => [...new Set(rows.map((row) => row.department).filter(Boolean))],
    [rows],
  );

  const divisions = useMemo(
    () => [...new Set(rows.map((row) => row.division).filter(Boolean))],
    [rows],
  );

  const units = useMemo(
    () => [...new Set(rows.map((row) => row.unit).filter(Boolean))],
    [rows],
  );

  const levels = useMemo(
    () => [...new Set(rows.map((row) => row.level).filter(Boolean))],
    [rows],
  );

  const items = useMemo(
    () =>
      rows.map((row) => ({
        branch: row.branch || "",
        department: row.department || "",
        division: row.division || "",
        unit: row.unit || "",
        level: row.level || "",
      })),
    [rows],
  );

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/roadmap/api/reports/evaluation-history?type=${evaluationType}`,
      );
      const json = await res.json();
      if (json.success) setRows(json.data || []);
    }
    load();
  }, [evaluationType]);

  const handlePreview = async (record: EvaluationRecord) => {
    setIsLoadingPreview(true);

    const res = await fetch(
      `/roadmap/api/reports/evaluation-preview?id=${encodeURIComponent(
        record.id,
      )}`,
    );
    const json = await res.json();

    if (json.success) {
      setPreviewData(json.data);
      setIsPreviewOpen(true);
    } else {
      console.error("Failed to load evaluation preview", json.error);
      setPreviewData(null);
    }

    setIsLoadingPreview(false);
  };

  const columns: {
    header: string;
    key: string;
    align: "left" | "center" | "right";
  }[] = [
    { header: "พนักงาน", key: "name", align: "center" },
    { header: "สังกัด", key: "branch", align: "center" },
    { header: "แผนก", key: "department", align: "center" },
    { header: "ฝ่าย", key: "division", align: "center" },
    { header: "หน่วย", key: "unit", align: "center" },
    { header: "Level", key: "level", align: "center" },
    { header: "คะแนน", key: "scorePercent", align: "center" },
    { header: "สถานะ", key: "status", align: "center" },
    { header: "Actions", key: "actions", align: "center" },
  ];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = row.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDepartment = filters.department
        ? row.department === filters.department
        : true;
      const matchesDivision = filters.division
        ? row.division === filters.division
        : true;
      const matchesUnit = filters.unit ? row.unit === filters.unit : true;
      const matchesLevel = filters.level ? row.level === filters.level : true;
      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDivision &&
        matchesUnit &&
        matchesLevel
      );
    });
  }, [rows, searchTerm, filters]);

  const handleExport = () => {
    const exportColumns = columns.filter((col) => col.key !== "actions");
    const exportRows = filteredRows.map((row) => {
      const copy: Record<string, any> = {};
      exportColumns.forEach((col) => {
        copy[col.key] = row[col.key];
      });
      return copy;
    });

    downloadCsvFile(
      `evaluation-history-${evaluationType}.csv`,
      exportColumns,
      exportRows,
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            ประวัติการประเมิน {evaluationType}
          </h2>
          <p className="text-sm text-slate-500">แสดงพนักงานที่ถูกประเมินแล้ว</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Export CSV
          </button>

          <SearchBar
            placeholder="ค้นหาชื่อพนักงาน..."
            onSearch={setSearchTerm}
            onFilter={setFilters}
            filterOptions={{
              branches,
              departments: departments,
              divisions: divisions,
              units: units,
              levels: levels,
              statuses: ["Active", "On Leave"],
              items,
            }}
          />
        </div>
      </div>

      <ReportTable
        columns={columns}
        rows={filteredRows.map((row) => ({
          ...row,
          actions: (
            <button
              className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 active:from-amber-600 active:to-yellow-600 text-amber-950 text-xs font-semibold px-4 py-2 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handlePreview(row)}
              disabled={isLoadingPreview}
            >
              Preview
            </button>
          ),
        }))}
      />

      <EvaluationPreviewModal
        open={isPreviewOpen}
        data={previewData}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
