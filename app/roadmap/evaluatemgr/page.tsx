"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EmployeeInfoCard from "@/app/roadmap/evaluate/components/EmployeeInfoCard";
import EvaluationForm, {
  EvaluationFormData,
  defaultDisciplineData,
  defaultSummaryData,
} from "@/app/roadmap/evaluate/components/EvaluationForm";
import SummarySidebar from "@/app/roadmap/evaluate/components/SummarySidebar";
import SelectionModal from "@/app/roadmap/evaluatemgr/components/SelectionModal";
import { Employee } from "@/app/roadmap/types";

type SettingsCategory = {
  id: string;
  title: string;
  type: "Company Common Graound" | "Department Common Ground" | string;
  level: string;
  department_id?: string | null;
  division_id?: string | null;
  unit_id?: string | null;
  items: { id: string; topic: string; weight: number }[];
};

type EvaluatemgrRecord = {
  id: string;
  employee_id: string;
  status: string;
  created_at: string;
  totalScore: number | null;
  companyScore: number | null;
  departmentScore: number | null;
  expectationScore: number | null;
  examScore: number | null;
  maxScore: number | null;
  managerComment: string | null;
  evaluationType?: string | null;
  extra_data?: any;
  rm_evaluation_scores?: Array<{
    category_item_id: string;
    score: number | null;
    remark: string | null;
    is_included: boolean;
  }>;
  rm_evaluation_reviewers?: { manager_id: string }[];
};

const initialFormData: EvaluationFormData = {
  companyRows: [
    {
      rowId: "company-1",
      itemId: "",
      topic: "",
      maxScore: 0,
      score: 0,
      note: "",
    },
  ],
  departmentRows: [
    {
      rowId: "department-1",
      itemId: "",
      topic: "",
      maxScore: 0,
      score: 0,
      note: "",
    },
  ],
  expectationRows: [
    {
      rowId: "expectation-1",
      itemId: "",
      topic: "",
      maxScore: 0,
      score: 0,
      note: "",
    },
  ],
  companyScore: 0,
  departmentScore: 0,
  expectationScore: 0,
  totalScore: 0,
  currentSalary: 0,
  newSalary: 0,
  managerComment: "",
  examScore: 0,
  maxScore: 100,
  summaryData: defaultSummaryData,
  disciplineData: defaultDisciplineData,
};

export default function EvaluateMgrPage() {
  const { user } = useAuth();
  const reviewerId = user?.employee_id;

  const [pendingEvaluations, setPendingEvaluations] = useState<
    EvaluatemgrRecord[]
  >([]);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<EvaluatemgrRecord | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settingsCategories, setSettingsCategories] = useState<
    SettingsCategory[]
  >([]);
  const [formData, setFormData] = useState<EvaluationFormData>(initialFormData);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const fetchPendingEvaluations = useCallback(async () => {
    if (!reviewerId) return;
    const res = await fetch(
      `/roadmap/api/evaluatemgr?reviewerId=${encodeURIComponent(
        reviewerId,
      )}&status=Draft`,
    );
    const data = await res.json();
    if (res.ok && data?.success) {
      setPendingEvaluations(data.data || []);
    } else {
      console.error("load evaluatemgr list failed", data);
    }
  }, [reviewerId]);

  const fetchEmployee = useCallback(async (employeeId: string) => {
    const res = await fetch(`/roadmap/api/employees/${employeeId}`);
    const data = await res.json();
    if (res.ok && data?.success) {
      setEmployee(data.data);
    } else {
      console.error("load employee failed", data);
      setEmployee(null);
    }
  }, []);

  const mapRecordToFormData = useCallback(
    (record: EvaluatemgrRecord): EvaluationFormData => {
      const extra = record.extra_data ?? {};
      return {
        companyRows: extra.companyRows ?? initialFormData.companyRows,
        departmentRows: extra.departmentRows ?? initialFormData.departmentRows,
        expectationRows:
          extra.expectationRows ?? initialFormData.expectationRows,
        companyScore: record.companyScore ?? 0,
        departmentScore: record.departmentScore ?? 0,
        expectationScore: record.expectationScore ?? 0,
        totalScore: record.totalScore ?? 0,
        currentSalary: extra.currentSalary ?? 0,
        newSalary: extra.newSalary ?? 0,
        managerComment: record.managerComment ?? "",
        examScore: record.examScore ?? 0,
        maxScore: record.maxScore ?? 100,
        summaryData: extra.summaryData ?? defaultSummaryData,
        disciplineData: extra.disciplineData ?? defaultDisciplineData,
      };
    },
    [],
  );

  const handleSelectEvaluation = useCallback(
    async (record: EvaluatemgrRecord) => {
      setSelectedEvaluation(record);
      setEditingEvaluationId(record.id);
      setSelectedManagerIds(
        record.rm_evaluation_reviewers?.map((rev) => rev.manager_id) ?? [],
      );
      setFormData(mapRecordToFormData(record));
      await fetchEmployee(record.employee_id);
      setIsSelectOpen(false);
    },
    [fetchEmployee, mapRecordToFormData],
  );

  useEffect(() => {
    if (!reviewerId) return;
    let canceled = false;

    async function loadPendingEvaluations() {
      const res = await fetch(
        `/roadmap/api/evaluatemgr?reviewerId=${encodeURIComponent(
          reviewerId,
        )}&status=Draft`,
      );
      const data = await res.json();
      if (canceled) return;
      if (res.ok && data?.success) {
        setPendingEvaluations(data.data || []);
      } else {
        console.error("load evaluatemgr list failed", data);
      }
    }

    loadPendingEvaluations();
    return () => {
      canceled = true;
    };
  }, [reviewerId]);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/roadmap/api/settings");
      const data = await res.json();
      if (res.ok && data?.success) {
        setSettingsCategories(data.data || []);
      }
    }
    loadSettings();
  }, []);

  const companyGround = useMemo(() => {
    if (!employee) return [];
    return settingsCategories.filter(
      (cat) =>
        cat.type === "Company Common Ground" && cat.level === employee.level,
    );
  }, [employee, settingsCategories]);

  const departmentGround = useMemo(() => {
    if (!employee) return [];
    return settingsCategories.filter((cat) => {
      if (cat.type !== "Department Common Ground") return false;
      if (cat.level !== employee.level) return false;
      if (cat.unit_id && employee.unitId)
        return cat.unit_id === employee.unitId;
      if (cat.division_id && employee.divisionId)
        return cat.division_id === employee.divisionId;
      if (cat.department_id && employee.departmentId)
        return cat.department_id === employee.departmentId;
      return false;
    });
  }, [employee, settingsCategories]);

  const handleFormChange = useCallback((next: Partial<EvaluationFormData>) => {
    setFormData((prev) => ({ ...prev, ...next }));
  }, []);

  const normalizeEvaluationType = (value?: string) =>
    value === "Performance" || value === "Promote" || value === "Progression"
      ? value
      : "Probation";

  const selectedFormType = normalizeEvaluationType(
    selectedEvaluation?.evaluationType,
  );

  const sendEvaluationPayload = async (status: "Draft" | "Submitted") => {
    if (!reviewerId || !selectedEvaluation) return;

    setIsSaving(true);
    setError(null);

    const payload = {
      evaluationId: selectedEvaluation.id,
      employeeId: selectedEvaluation.employee_id,
      evaluatorId: reviewerId,
      evaluationType: selectedFormType,
      status,
      ...formData,
      managerIds: selectedManagerIds,
      scores: [
        ...formData.companyRows.map((row) => ({
          categoryItemId: row.itemId,
          score: row.score,
          remark: row.note || null,
          isIncluded: true,
        })),
        ...formData.departmentRows.map((row) => ({
          categoryItemId: row.itemId,
          score: row.score,
          remark: row.note || null,
          isIncluded: true,
        })),
      ],
      extra_data: {
        companyRows: formData.companyRows,
        departmentRows: formData.departmentRows,
        expectationRows: formData.expectationRows,
        summaryData: formData.summaryData,
        disciplineData: formData.disciplineData,
      },
    };

    const res = await fetch("/roadmap/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setIsSaving(false);

    if (!res.ok || !data?.success) {
      setError(data?.error || "Save failed");
      return;
    }

    setSaveNotification(
      status === "Draft" ? "Save Draft เรียบร้อยแล้ว" : "Submit เรียบร้อยแล้ว",
    );
    setTimeout(() => setSaveNotification(null), 2500);
    await fetchPendingEvaluations();
  };

  const handleSaveDraft = async () => sendEvaluationPayload("Draft");
  const handleSubmit = async () => sendEvaluationPayload("Submitted");

  const renderForm = () => (
    <EvaluationForm
      formType={selectedFormType}
      employeeLevel={employee?.level}
      companyGround={companyGround}
      departmentGround={departmentGround}
      formData={formData}
      onFormChange={handleFormChange}
    />
  );

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      {saveNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-5 text-center text-white shadow-xl">
            <p className="text-base font-semibold">{saveNotification}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Evaluate MGR</h1>
          <p className="text-sm text-slate-500">
            เลือกพนักงานที่มี Draft จาก HR แล้วทำการประเมินต่อ
          </p>
        </div>
        <button
          onClick={() => setIsSelectOpen(true)}
          className="flex items-center gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          เลือกพนักงาน
        </button>
      </div>

      {isSelectOpen && (
        <SelectionModal
          records={pendingEvaluations}
          onSelect={handleSelectEvaluation}
          onClose={() => setIsSelectOpen(false)}
        />
      )}

      {selectedEvaluation ? (
        <>
          <EmployeeInfoCard
            employee={
              employee ?? {
                id: selectedEvaluation.employee_id,
                name: selectedEvaluation.employee_id,
                employeeCode: selectedEvaluation.employee_id,
                department: "",
                branch: "",
                division: "",
                unit: "",
                role: "",
                hireDate: "",
                level: "",
                avatar: "",
                status: "Active",
              }
            }
            evaluationType={selectedFormType}
            historyCount={0}
            onHistoryClick={() => setIsSelectOpen(true)}
            showChangeEmployee={false}
            showHistoryButton={false}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">{renderForm()}</div>

            <div>
              <SummarySidebar
                allFormData={formData}
                managers={[]}
                selectedManagerIds={selectedManagerIds}
                isEditing={Boolean(editingEvaluationId)}
                isSaving={isSaving}
                onManagerCommentChange={(value) =>
                  handleFormChange({ managerComment: value })
                }
                onCurrentSalaryChange={(value) =>
                  handleFormChange({ currentSalary: value })
                }
                onNewSalaryChange={(value) =>
                  handleFormChange({ newSalary: value })
                }
                onExamScoreChange={(value) =>
                  handleFormChange({ examScore: value })
                }
                onMaxScoreChange={(value) =>
                  handleFormChange({ maxScore: value })
                }
                onSubmit={handleSubmit}
                showSaveDraft={false}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          กดปุ่ม “เลือกพนักงาน” เพื่อเปิด modal
          แล้วเลือกรายชื่อพนักงานที่ต้องประเมิน
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
