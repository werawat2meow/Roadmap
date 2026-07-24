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

const departments = [
  "Restaurant Operation",
  "Marketing",
  "Engineering",
  "Finance",
  "HR",
  "Operations",
];

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
      `/roadmap/api/reports/evaluation-preview?id=${encodeURIComponent(record.id)}`,
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            ประวัติการประเมิน {evaluationType}
          </h2>
          <p className="text-sm text-slate-500">แสดงพนักงานที่ถูกประเมินแล้ว</p>
        </div>

        <SearchBar
          placeholder="ค้นหาชื่อพนักงาน..."
          onSearch={setSearchTerm}
          onFilter={setFilters}
          filterOptions={{
            departments,
            statuses: ["Active", "On Leave"],
          }}
        />
      </div>

      <ReportTable
        columns={[
          { header: "พนักงาน", key: "name", align: "center" },
          { header: "สังกัด", key: "department", align: "center" },
          { header: "แผนก", key: "division", align: "center" },
          { header: "หน่วย", key: "unit", align: "center" },
          { header: "Level", key: "level", align: "center" },
          { header: "คะแนน", key: "scorePercent", align: "center" },
          { header: "สถานะ", key: "status", align: "center" },
          { header: "Actions", key: "actions", align: "center" },
        ]}
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