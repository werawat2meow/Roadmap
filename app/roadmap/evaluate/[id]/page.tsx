"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, X } from "lucide-react";
import EvaluationTabs from "@/app/roadmap/evaluate/components/EvaluationTabs";
import EmployeeInfoCard from "@/app/roadmap/evaluate/components/EmployeeInfoCard";
import SummarySidebar from "@/app/roadmap/evaluate/components/SummarySidebar";
import EvaluationForm, {
  EvaluationFormData,
  RowState,
  defaultSummaryData,
  defaultDisciplineData,
} from "@/app/roadmap/evaluate/components/EvaluationForm";
import EvaluationHistoryModal from "@/app/roadmap/evaluate/components/EvaluationHistoryModal";
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

type ManagerUser = {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  menus: string[];
};

type HistoryRecord = {
  id: string;
  status: string;
  created_at: string;
  totalScore: number | null;
  companyScore: number | null;
  departmentScore: number | null;
  expectationScore: number | null;
  examScore: number | null;
  examMaxScore: number | null;
  maxScore: number | null;
  managerComment: string | null;
  evaluationType?: string | null;
  extra_data?: any;
  rm_evaluation_reviewers?: { manager_id: string }[];
};

export default function EvaluateEmployeePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const evaluatorId = user?.employee_id || user?.id;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settingsCategories, setSettingsCategories] = useState<
    SettingsCategory[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [activeTab, setActiveTab] = useState<
    "Probation" | "Performance" | "Promote" | "Progression"
  >("Probation");
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState<EvaluationFormData>({
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
    examMaxScore: 100,
    maxScore: 100,
    evaluationType: activeTab,
    summaryData: defaultSummaryData,
    disciplineData: defaultDisciplineData,
    evaluationPeriod: "",
    evaluationPeriodContinued: "",
    newDesignation: "",
    newLevel: "",
    specialCompensation: 0,
  });

  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [evaluationHistory, setEvaluationHistory] = useState<HistoryRecord[]>(
    [],
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(
    null,
  );

  const fetchEvaluationHistory = useCallback(async () => {
    if (!id) return;

    const employeeId =
      typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

    if (!employeeId) return;

    const response = await fetch(
      `/roadmap/api/evaluations?employeeId=${encodeURIComponent(employeeId)}`,
    );
    const data = await response.json();

    if (!response.ok || !data?.success) {
      console.error("Failed to load evaluation history", data);
      return;
    }

    setEvaluationHistory(data.data || []);
  }, [id]);

  const handleHistoryEdit = useCallback(
    (record: HistoryRecord) => {
      setIsHistoryOpen(false);
      setEditingEvaluationId(record.id);

      const reviewerIds =
        (record as any).rm_evaluation_reviewers?.map(
          (rev: any) => rev.manager_id,
        ) ?? [];
      setSelectedManagerIds(reviewerIds);

      const extraData = record.extra_data ?? {};
      const scores: Array<any> = (record as any).rm_evaluation_scores ?? [];

      const scoreMap = new Map<string, any>();
      scores.forEach((s) => {
        if (s?.category_item_id) scoreMap.set(s.category_item_id, s);
      });

      type ItemMeta = { topic: string; maxScore: number };

      const findItemMeta = (itemId: string): ItemMeta | null => {
        for (const cat of settingsCategories) {
          for (const it of cat.items || []) {
            if (it.id === itemId) {
              return { topic: it.topic ?? "", maxScore: it.weight ?? 0 };
            }
          }
        }
        return null;
      };

      setFormData((prev) => {
        const companySource = extraData.companyRows ?? prev.companyRows;
        const departmentSource =
          extraData.departmentRows ?? prev.departmentRows;

        const companyRows = companySource.map((row: any, idx: number) => {
          // matched by saved itemId
          if (row.itemId && scoreMap.has(row.itemId)) {
            const s = scoreMap.get(row.itemId);
            const meta = findItemMeta(row.itemId) ?? { topic: "", maxScore: 0 };
            return {
              ...row,
              itemId: row.itemId,
              topic: (row as any).topic ?? meta.topic ?? "",
              maxScore: (row as any).maxScore ?? meta.maxScore ?? 0,
              score:
                typeof s?.score === "number"
                  ? s.score
                  : ((row as any).score ?? 0),
              note: s?.remark ?? (row as any).note ?? "",
            };
          }

          // fallback by index if no itemId
          const fallback = scores[idx];
          if (!row.itemId && fallback) {
            const meta = findItemMeta(fallback.category_item_id) ?? {
              topic: "",
              maxScore: 0,
            };
            return {
              ...row,
              itemId: fallback.category_item_id,
              topic: (row as any).topic ?? meta.topic ?? "",
              maxScore: (row as any).maxScore ?? meta.maxScore ?? 0,
              score:
                typeof fallback?.score === "number"
                  ? fallback.score
                  : ((row as any).score ?? 0),
              note: fallback?.remark ?? (row as any).note ?? "",
            };
          }

          return row;
        });

        const departmentRows = departmentSource.map((row: any, idx: number) => {
          if (row.itemId && scoreMap.has(row.itemId)) {
            const s = scoreMap.get(row.itemId);
            const meta = findItemMeta(row.itemId) ?? { topic: "", maxScore: 0 };
            return {
              ...row,
              itemId: row.itemId,
              topic: (row as any).topic ?? meta.topic ?? "",
              maxScore: (row as any).maxScore ?? meta.maxScore ?? 0,
              score:
                typeof s?.score === "number"
                  ? s.score
                  : ((row as any).score ?? 0),
              note: s?.remark ?? (row as any).note ?? "",
            };
          }

          const fallback = scores[idx + companyRows.length];
          if (!row.itemId && fallback) {
            const meta = findItemMeta(fallback.category_item_id) ?? {
              topic: "",
              maxScore: 0,
            };
            return {
              ...row,
              itemId: fallback.category_item_id,
              topic: (row as any).topic ?? meta.topic ?? "",
              maxScore: (row as any).maxScore ?? meta.maxScore ?? 0,
              score:
                typeof fallback?.score === "number"
                  ? fallback.score
                  : ((row as any).score ?? 0),
              note: fallback?.remark ?? (row as any).note ?? "",
            };
          }

          return row;
        });

        return {
          ...prev,
          companyRows,
          departmentRows,
          expectationRows: extraData.expectationRows ?? prev.expectationRows,
          summaryData: extraData.summaryData ?? prev.summaryData,
          disciplineData: extraData.disciplineData ?? prev.disciplineData,
          companyScore: record.companyScore ?? prev.companyScore,
          departmentScore: record.departmentScore ?? prev.departmentScore,
          expectationScore: record.expectationScore ?? prev.expectationScore,
          totalScore: record.totalScore ?? prev.totalScore,
          managerComment: record.managerComment ?? prev.managerComment,
          examScore: record.examScore ?? prev.examScore,
          examMaxScore: record.examMaxScore ?? prev.examMaxScore,
          maxScore: record.maxScore ?? prev.maxScore,
        };
      });

      if (record.evaluationType) {
        const validTabs = [
          "Probation",
          "Performance",
          "Promote",
          "Progression",
        ];
        if (validTabs.includes(record.evaluationType)) {
          setActiveTab(record.evaluationType as typeof activeTab);
        }
      }
    },
    [settingsCategories],
  );

  const handleOpenHistory = async () => {
    await fetchEvaluationHistory();
    setIsHistoryOpen(true);
  };

  useEffect(() => {
    if (!id) return;

    let canceled = false;

    async function loadHistory() {
      const employeeId =
        typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
      if (!employeeId) return;

      const response = await fetch(
        `/roadmap/api/evaluations?employeeId=${encodeURIComponent(employeeId)}`,
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        console.error("Failed to load evaluation history", data);
        return;
      }

      if (!canceled) {
        setEvaluationHistory(data.data || []);
      }
    }

    loadHistory();

    return () => {
      canceled = true;
    };
  }, [id]);

  const handleFormChange = useCallback((next: Partial<EvaluationFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...next };
      const same = JSON.stringify(prev) === JSON.stringify(updated);

      return same ? prev : updated;
    });
  }, []);

  const isUuid = (value: string) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      value,
    );

  const buildScoreRows = (rows: RowState[]) =>
    rows
      .filter(
        (row) => row.itemId && isUuid(row.itemId) && Number.isFinite(row.score),
      )
      .map((row) => ({
        categoryItemId: row.itemId,
        score: row.score,
        remark: row.note || null,
        isIncluded: true,
      }));

  const createScoresPayload = () => [
    ...buildScoreRows(formData.companyRows),
    ...buildScoreRows(formData.departmentRows),
    // Expectations are free-text (no UUID), saved via extra_data instead
  ];

  const sendEvaluationPayload = async (status: "Draft" | "Submitted") => {
    if (!evaluatorId) {
      console.error("Missing evaluatorId for save draft");
      window.alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setIsSaving(true);
    const evaluationId = editingEvaluationId?.trim() || undefined;
    const isUpdate = Boolean(evaluationId);

    const payload = {
      evaluationId,
      employeeId: id,
      evaluatorId,
      evaluationType: activeTab,
      status,
      ...formData,
      managerIds: selectedManagerIds,
      scores: createScoresPayload(),
      extra_data: {
        companyRows: formData.companyRows,
        departmentRows: formData.departmentRows,
        expectationRows: formData.expectationRows,
        summaryData: formData.summaryData,
        disciplineData: formData.disciplineData,
      },
    };

    const response = await fetch("/roadmap/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsSaving(false);

    if (!response.ok || !data?.success) {
      console.error("Save evaluation failed", response.status, data);
      window.alert(data?.error || "SaveDraft failed");
      return;
    }

    setSaveNotification(
      status === "Draft"
        ? isUpdate
          ? "Update Draft เรียบร้อยแล้ว"
          : "Save Draft เรียบร้อยแล้ว"
        : "Submit เรียบร้อยแล้ว",
    );
    window.setTimeout(() => setSaveNotification(null), 2500);

    if (!editingEvaluationId && data.data?.id) {
      setEditingEvaluationId(data.data.id);
    }
    await fetchEvaluationHistory();
  };

  const handleSaveDraft = async () => {
    await sendEvaluationPayload("Draft");
  };

  const handleSubmit = async () => {
    await sendEvaluationPayload("Submitted");
  };

  useEffect(() => {
    const expiryTime = localStorage.getItem("hideEvaluationPopupUntil");
    if (!expiryTime || new Date().getTime() > parseInt(expiryTime)) {
      const timer = setTimeout(() => setShowPopup(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePopup = () => {
    if (dontShowToday) {
      const tomorrow = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem("hideEvaluationPopupUntil", tomorrow.toString());
    }
    setShowPopup(false);
  };

  const handleDeleteHistory = async (record: HistoryRecord) => {
    const confirmed = window.confirm("ต้องการลบประวัตินี้หรือไม่?");
    if (!confirmed) return;

    const response = await fetch(`/roadmap/api/evaluations?id=${record.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok || !data?.success) {
      window.alert(data?.error || "ลบไม่สำเร็จ");
      return;
    }

    if (editingEvaluationId === record.id) {
      setEditingEvaluationId(null);
    }

    await fetchEvaluationHistory();
  };
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [employeeRes, settingsRes, userAccessRes] = await Promise.all([
          fetch(`/roadmap/api/employees/${id}`),
          fetch("/roadmap/api/settings"),
          fetch("/roadmap/api/user-access"),
        ]);

        const employeeJson = await employeeRes.json();
        const settingsJson = await settingsRes.json();
        const userAccessJson = await userAccessRes.json();

        if (!employeeJson.success) {
          throw new Error(employeeJson.error || "ไม่พบข้อมูลพนักงาน");
        }

        if (!settingsJson.success) {
          throw new Error(settingsJson.error || "ไม่พบข้อมูลการตั้งค่า");
        }

        if (!userAccessJson.success) {
          throw new Error(userAccessJson.error || "ไม่พบข้อมูล Manager");
        }

        setEmployee(employeeJson.data);
        setSettingsCategories(settingsJson.data || []);
        setManagers(
          (userAccessJson.data || []).filter(
            (user: any) => user.role === "Manager",
          ),
        );
      } catch (err: any) {
        console.error(err);
        setError(err.message || "เกิดข้อผิดพลาดขณะโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

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

      if (cat.unit_id && employee.unitId) {
        return cat.unit_id === employee.unitId;
      }
      if (cat.division_id && employee.divisionId) {
        return cat.division_id === employee.divisionId;
      }
      if (cat.department_id && employee.departmentId) {
        return cat.department_id === employee.departmentId;
      }

      return false;
    });
  }, [employee, settingsCategories]);

  const renderFormContent = () => (
    <EvaluationForm
      formType={activeTab}
      employeeLevel={employee.level}
      companyGround={companyGround}
      departmentGround={departmentGround}
      managers={managers}
      formData={formData}
      onFormChange={handleFormChange}
    />
  );

  if (loading) {
    return <p className="p-6 text-slate-600">กำลังโหลดข้อมูลพนักงาน...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  if (!employee) {
    return <p className="p-6 text-slate-600">ไม่พบข้อมูลพนักงาน</p>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      {saveNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-5 text-center text-white shadow-xl">
            <p className="text-base font-semibold">{saveNotification}</p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Evaluate HR</h1>
          <p className="text-gray-500 mt-1">
            ติดตามและจัดการผลการประเมินพนักงาน
          </p>
        </div>
      </div>
      {showPopup && (
        <div className="relative mx-4 my-3 md:absolute md:top-45 md:left-64 md:mx-0 md:my-0 z-50 animate-bounce-slow max-w-sm w-[calc(100%-32px)] md:w-auto">
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 p-4 rounded-2xl border-b-8 border-amber-600 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4),0_8px_16px_-6px_rgba(0,0,0,0.2)] relative">
            {/* 📐 ซ่อนสามเหลี่ยมชี้ด้านบนตอนอยู่บนจอมือถือ เพราะป๊อปอัพจะลงไปต่อท้ายใต้เมนูพอดี ค่อยโชว์บนจอคอม */}
            <div className="hidden md:block absolute -top-3 left-12 w-6 h-6 bg-amber-400 rotate-45 border-l border-t border-amber-300 shadow-[-4px_-4px_6px_rgba(0,0,0,0.05)]" />

            <div className="flex items-start space-x-3">
              <AlertCircle
                size={20}
                className="mt-0.5 text-amber-950 shrink-0"
              />
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-amber-950">
                  คำแนะนำการประเมิน
                </h4>
                <p className="text-xs font-semibold text-amber-900 mt-1 leading-relaxed">
                  อย่าลืมเลือกหัวข้อการประเมินกลุ่ม{" "}
                  <span className="underline decoration-2 font-black">4 P</span>{" "}
                  ด้านบนนี้ให้ถูกต้องก่อนทำการบันทึกข้อมูลคะแนนพนักงานนะคะ
                </p>
              </div>
              <button
                onClick={handleClosePopup}
                className="text-amber-950 hover:bg-amber-300/40 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-600/20 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-[11px] font-bold text-amber-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-amber-600/30 border-none text-amber-950 focus:ring-0 cursor-pointer"
                />
                <span>ไม่ต้องแสดงอีกในวันนี้</span>
              </label>
              <button
                onClick={handleClosePopup}
                className="bg-amber-950 text-white text-[11px] font-extrabold py-1 px-3 rounded-lg border-b-2 border-black hover:bg-amber-900 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6">
        <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <EmployeeInfoCard
        employee={employee}
        evaluationType={activeTab}
        historyCount={evaluationHistory.length}
        onHistoryClick={handleOpenHistory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">{renderFormContent()}</div>
        <div>
          <SummarySidebar
            allFormData={formData}
            evaluationType={activeTab}
            managers={managers}
            selectedManagerIds={selectedManagerIds}
            isEditing={Boolean(editingEvaluationId)}
            isSaving={isSaving}
            onManagerToggle={(id) => {
              setSelectedManagerIds((prev) =>
                prev.includes(id)
                  ? prev.filter((item) => item !== id)
                  : [...prev, id].slice(-2),
              );
            }}
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
            onExamMaxScoreChange={(value) =>
              handleFormChange({ examMaxScore: value })
            }
            onMaxScoreChange={(value) => handleFormChange({ maxScore: value })}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
      <EvaluationHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={evaluationHistory}
        onEdit={handleHistoryEdit}
        onDelete={handleDeleteHistory}
      />
    </div>
  );
}
