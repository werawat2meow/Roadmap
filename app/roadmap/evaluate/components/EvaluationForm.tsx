import { Building, Users, Target } from "lucide-react";
import EvaluationSection from "./EvaluationSection";
import EvaluationSummaryPanel, {
  SummaryPanelData,
  defaultSummaryData,
} from "./EvaluationSummaryPanel";
import DisciplineSummaryPanel, {
  DisciplinePanelData,
  defaultDisciplineData,
} from "./DisciplineSummaryPanel";

export type { SummaryPanelData, DisciplinePanelData };
export { defaultSummaryData, defaultDisciplineData };

type CategoryItem = {
  id: string;
  topic: string;
  weight: number;
};

type CategoryData = {
  id: string;
  title: string;
  type: string;
  level: string;
  items: CategoryItem[];
};

type ManagerUser = {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  menus: string[];
};

export type RowState = {
  rowId: string;
  itemId: string; // UUID for Company/Department dropdown
  topic: string; // free text for Expectations
  maxScore: number;
  score: number;
  note: string;
};

export type EvaluationFormData = {
  companyRows: RowState[];
  departmentRows: RowState[];
  expectationRows: RowState[];
  companyScore: number;
  departmentScore: number;
  expectationScore: number;
  totalScore: number;
  currentSalary: number;
  newSalary: number;
  managerComment: string;
  examScore: number;
  maxScore: number;
  summaryData: SummaryPanelData;
  disciplineData: DisciplinePanelData;
};

type EvaluationFormProps = {
  formType: "Probation" | "Performance" | "Promote" | "Progression";
  companyGround?: CategoryData[];
  departmentGround?: CategoryData[];
  employeeLevel?: string;
  managers?: ManagerUser[];
  formData?: EvaluationFormData;
  onFormChange?: (next: Partial<EvaluationFormData>) => void;
};

const makeRow = (prefix: string): RowState => ({
  rowId: `${prefix}-1`,
  itemId: "",
  topic: "",
  maxScore: 0,
  score: 0,
  note: "",
});

const calcScore = (rows: RowState[]) =>
  rows.reduce(
    (sum, row) => sum + (Number.isFinite(row.score) ? row.score : 0),
    0,
  );
const calcMaxScore = (rows: RowState[]) =>
  rows.reduce(
    (sum, row) => sum + (Number.isFinite(row.maxScore) ? row.maxScore : 0),
    0,
  );

export default function EvaluationForm({
  formType,
  companyGround = [],
  departmentGround = [],
  employeeLevel,
  formData,
  onFormChange,
}: EvaluationFormProps) {
  const selectedLevel =
    employeeLevel ||
    companyGround[0]?.level ||
    departmentGround[0]?.level ||
    "P4";

  const companyOptions = companyGround[0]?.items ?? [];
  const departmentOptions = departmentGround[0]?.items ?? [];

  // Fall back to a single empty row when parent hasn't initialized yet
  const companyRows =
    formData?.companyRows?.length > 0
      ? formData.companyRows
      : [makeRow("company")];
  const departmentRows =
    formData?.departmentRows?.length > 0
      ? formData.departmentRows
      : [makeRow("department")];
  const expectationRows =
    formData?.expectationRows?.length > 0
      ? formData.expectationRows
      : [makeRow("expectation")];
  const summaryData = formData?.summaryData ?? defaultSummaryData;
  const disciplineData = formData?.disciplineData ?? defaultDisciplineData;

  // Single notify helper — always recomputes scores from the latest rows
  const notify = (updates: Partial<EvaluationFormData>) => {
    const nextCompany = updates.companyRows ?? companyRows;
    const nextDept = updates.departmentRows ?? departmentRows;
    const nextExp = updates.expectationRows ?? expectationRows;
    const cs = calcScore(nextCompany);
    const ds = calcScore(nextDept);
    const es = calcScore(nextExp);
    const max =
      calcMaxScore(nextCompany) +
      calcMaxScore(nextDept) +
      calcMaxScore(nextExp);

    onFormChange?.({
      ...updates,
      companyScore: cs,
      departmentScore: ds,
      expectationScore: es,
      totalScore: cs + ds + es,
      maxScore: max,
    });
  };

  // ─── Company row handlers ───────────────────────────────────────────────
  const updateCompanyRow = (rowId: string, next: Partial<RowState>) =>
    notify({
      companyRows: companyRows.map((r) =>
        r.rowId === rowId ? { ...r, ...next } : r,
      ),
    });
  const addCompanyRow = () =>
    notify({
      companyRows: [
        ...companyRows,
        {
          rowId: `${Date.now()}`,
          itemId: "",
          topic: "",
          maxScore: 0,
          score: 0,
          note: "",
        },
      ],
    });
  const removeCompanyRow = (rowId: string) =>
    notify({ companyRows: companyRows.filter((r) => r.rowId !== rowId) });

  // ─── Department row handlers ────────────────────────────────────────────
  const updateDepartmentRow = (rowId: string, next: Partial<RowState>) =>
    notify({
      departmentRows: departmentRows.map((r) =>
        r.rowId === rowId ? { ...r, ...next } : r,
      ),
    });
  const addDepartmentRow = () =>
    notify({
      departmentRows: [
        ...departmentRows,
        {
          rowId: `${Date.now()}`,
          itemId: "",
          topic: "",
          maxScore: 0,
          score: 0,
          note: "",
        },
      ],
    });
  const removeDepartmentRow = (rowId: string) =>
    notify({ departmentRows: departmentRows.filter((r) => r.rowId !== rowId) });

  // ─── Expectation row handlers ───────────────────────────────────────────
  const updateExpectationRow = (rowId: string, next: Partial<RowState>) =>
    notify({
      expectationRows: expectationRows.map((r) =>
        r.rowId === rowId ? { ...r, ...next } : r,
      ),
    });
  const addExpectationRow = () =>
    notify({
      expectationRows: [
        ...expectationRows,
        {
          rowId: `${Date.now()}`,
          itemId: "",
          topic: "",
          maxScore: 0,
          score: 0,
          note: "",
        },
      ],
    });
  const removeExpectationRow = (rowId: string) =>
    notify({
      expectationRows: expectationRows.filter((r) => r.rowId !== rowId),
    });

  return (
    <div className="space-y-6">
      <EvaluationSection
        title="Company Common Ground"
        icon={<Building size={20} />}
        level={selectedLevel}
        rows={companyRows}
        options={companyOptions}
        onChangeRow={updateCompanyRow}
        onAddRow={addCompanyRow}
        onRemoveRow={removeCompanyRow}
      />

      <EvaluationSection
        title="Department Common Ground"
        icon={<Users size={20} />}
        level={selectedLevel}
        rows={departmentRows}
        options={departmentOptions}
        onChangeRow={updateDepartmentRow}
        onAddRow={addDepartmentRow}
        onRemoveRow={removeDepartmentRow}
      />

      <EvaluationSection
        title="Expectations"
        icon={<Target size={20} />}
        level={selectedLevel}
        rows={expectationRows}
        options={[]}
        onChangeRow={updateExpectationRow}
        onAddRow={addExpectationRow}
        onRemoveRow={removeExpectationRow}
      />

      <EvaluationSummaryPanel
        totalScore={formData?.totalScore ?? 0}
        maxScore={formData?.maxScore ?? 100}
        summaryData={summaryData}
        onSummaryChange={(updates) =>
          onFormChange?.({ summaryData: { ...summaryData, ...updates } })
        }
      />

      <DisciplineSummaryPanel
        disciplineData={disciplineData}
        onDisciplineChange={(updates) =>
          onFormChange?.({ disciplineData: { ...disciplineData, ...updates } })
        }
      />
    </div>
  );
}
