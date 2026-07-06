import { Building, Users, Target } from "lucide-react";
import EvaluationSection from "./EvaluationSection";
import EvaluationSummaryPanel from "./EvaluationSummaryPanel";
import DisciplineSummaryPanel from "./DisciplineSummaryPanel";
import { useState } from "react";

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

type EvaluationFormProps = {
  formType: 'Probation' | 'Performance' | 'Promote' | 'Progression';
  companyGround?: CategoryData[];
  departmentGround?: CategoryData[];
  employeeLevel?: string;
};

type ScoredItem = {
  id: number;
  topic: string;
  weight: number;
  score: number;
  enabled: boolean;
};

type RowState = {
  rowId: string;
  itemId: string;
  maxScore: number;
  score: number;
  note: string;
};

export default function EvaluationForm({
  formType,
  companyGround = [],
  departmentGround = [],
  employeeLevel,
}: EvaluationFormProps) {
  const selectedLevel =
    employeeLevel ||
    companyGround[0]?.level ||
    departmentGround[0]?.level ||
    "P4";

  const [companyRows, setCompanyRows] = useState<RowState[]>([
    { rowId: "company-1", itemId: "", maxScore: 0, score: 0, note: "" },
  ]);

  const [departmentRows, setDepartmentRows] = useState<RowState[]>([
    { rowId: "department-1", itemId: "", maxScore: 0, score: 0, note: "" },
  ]);
  

  const removeCompanyRow = (rowId: string) => {
    setCompanyRows((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const removeDepartmentRow = (rowId: string) => {
    setDepartmentRows((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const companyOptions = companyGround[0]?.items ?? [];
  const departmentOptions = departmentGround[0]?.items ?? [];

  const updateCompanyRow = (rowId: string, next: Partial<RowState>) => {
    setCompanyRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...next } : row)),
    );
  };

  const addCompanyRow = () => {
    setCompanyRows((prev) => [
      ...prev,
      { rowId: `${Date.now()}`, itemId: "", maxScore: 0, score: 0, note: "" },
    ]);
  };

  const [expectationRows, setExpectationRows] = useState<RowState[]>([
  { rowId: 'expectation-1', itemId: '', maxScore: 0, score: 0, note: '' },
]);

const updateExpectationRow = (rowId: string, next: Partial<RowState>) => {
  setExpectationRows((prev) =>
    prev.map((row) => (row.rowId === rowId ? { ...row, ...next } : row))
  );
};

const addExpectationRow = () => {
  setExpectationRows((prev) => [
    ...prev,
    { rowId: `${Date.now()}`, itemId: '', maxScore: 0, score: 0, note: '' },
  ]);
};

const removeExpectationRow = (rowId: string) => {
  setExpectationRows((prev) => prev.filter((row) => row.rowId !== rowId));
};

  const companyItems: ScoredItem[] = companyGround.flatMap(
    (category, categoryIndex) =>
      category.items.map((item, itemIndex) => ({
        id: Number(item.id) || itemIndex + 1 + categoryIndex * 100,
        topic: item.topic,
        weight: item.weight,
        score: 0,
        enabled: true,
      })),
  );

  const departmentItems: ScoredItem[] = departmentGround.flatMap(
    (category, categoryIndex) =>
      category.items.map((item, itemIndex) => ({
        id: Number(item.id) || itemIndex + 1 + categoryIndex * 100,
        topic: item.topic,
        weight: item.weight,
        score: 0,
        enabled: true,
      })),
  );

  const totalScore = (items: ScoredItem[]) =>
    items.reduce((sum, item) => sum + (item.enabled ? item.score : 0), 0);

  const companyScore = totalScore(companyItems);
  const departmentScore = totalScore(departmentItems);
  const expectationItems: ScoredItem[] = [];
  const expectationScore = totalScore(expectationItems);

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
        onChangeRow={(rowId, next) => {
          setDepartmentRows((prev) =>
            prev.map((row) =>
              row.rowId === rowId ? { ...row, ...next } : row,
            ),
          );
        }}
        onAddRow={() =>
          setDepartmentRows((prev)  => [
            ...prev,
            {
              rowId: `${Date.now()}`,
              itemId: "",
              maxScore: 0,
              score: 0,
              note: "",
            },
          ])
        }
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

      <EvaluationSummaryPanel />
      <DisciplineSummaryPanel />
    </div>
  );
}
