"use client";

import { useMemo, useState } from "react";
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import CategoryTable from "./CategoryTable";

const LEVELS = ["P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];
const LEVEL_TITLE_MAP: Record<string, string> = {
  P2: "Trainee",
  P3: "Junior",
  P4: "Officer",
  P5: "Supervisor",
  P6: "Assistant Manager",
  P7: "Manager",
  P8: "Chief",
  P9: "Director",
};

const getTitleFromLevel = (level: string) => LEVEL_TITLE_MAP[level] ?? "";

type Department = { id: string; department_name: string };
type Division = { id: string; division_name: string; department_id: string };
type Unit = { id: string; unit_name: string; division_id: string };

type Item = { id: string; topic: string; weight: number; saved?: boolean };
type Category = {
  id: string;
  title: string;
  type: string;
  level: string;
  department_id?: string;
  division_id?: string;
  unit_id?: string;
  items: Item[];
};

type Props = {
  category: Category;
  departments: Department[];
  divisions: Division[];
  units: Unit[];
  onUpdate: (
    categoryId: string,
    title: string,
    level: string,
    department_id?: string,
    division_id?: string,
    unit_id?: string,
  ) => void;
  onDelete: () => void;
  onAddItem: (categoryId: string) => void;
  onChangeItem: (
    categoryId: string,
    itemId: string,
    field: "topic" | "weight",
    value: string | number,
  ) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
};

const getBadgeClass = (type: string) => {
  switch (type) {
    case "Company Common Ground":
      return "text-amber-950 bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm font-bold";
    case "Department Common Ground":
      return "text-green-950 bg-gradient-to-r from-yellow-400 to-lime-500 shadow-sm font-bold";
    default:
      return "text-orange-800 bg-orange-100 border border-orange-200";
  }
};

export default function CategoryCard({
  category,
  departments,
  divisions,
  units,
  onUpdate,
  onDelete,
  onAddItem,
  onChangeItem,
  onRemoveItem,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(getTitleFromLevel(category.level));
  const [editLevel, setEditLevel] = useState(category.level);
  const [editDepartmentId, setEditDepartmentId] = useState(
    category.department_id ?? "",
  );
  const [editDivisionId, setEditDivisionId] = useState(
    category.division_id ?? "",
  );
  const [editUnitId, setEditUnitId] = useState(category.unit_id ?? "");


  const filteredDivisions = useMemo(
    () => divisions.filter((item) => item.department_id === editDepartmentId),
    [divisions, editDepartmentId],
  );

  const filteredUnits = useMemo(
    () => units.filter((item) => item.division_id === editDivisionId),
    [units, editDivisionId],
  );

  const departmentName = departments.find(
    (item) => item.id === category.department_id,
  )?.department_name;
  const divisionName = divisions.find(
    (item) => item.id === category.division_id,
  )?.division_name;
  const unitName = units.find(
    (item) => item.id === category.unit_id,
  )?.unit_name;

  const totalWeight = useMemo(
    () =>
      category.items.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    [category.items],
  );

  const saveChanges = () => {
    onUpdate(
      category.id,
      editTitle,
      editLevel,
      editDepartmentId || undefined,
      editDivisionId || undefined,
      editUnitId || undefined,
    );
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(category.title);
    setEditLevel(category.level);
    setEditDepartmentId(category.department_id ?? "");
    setEditDivisionId(category.division_id ?? "");
    setEditUnitId(category.unit_id ?? "");
    setIsEditing(false);
  };

  return (
    <div className="rounded-[32px] overflow-hidden border border-slate-200 bg-white shadow-sm mb-5 transition-all duration-300">
      <div
        className="flex flex-col gap-4 bg-blue-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between px-6 py-5 cursor-pointer"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        {/* Left Side: Info */}
        <div className="flex-grow space-y-3">
          {isEditing ? (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  value={editTitle}
                  readOnly
                  className="h-[40px] rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-blue-200 focus:outline-none w-full max-w-xs"
                />
                <select
                  value={editLevel}
                  onChange={(e) => {
                    const nextLevel = e.target.value;
                    setEditLevel(nextLevel);
                    setEditTitle(getTitleFromLevel(nextLevel));
                  }}
                  className="h-[40px] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none cursor-pointer"
                >
                  {LEVELS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {category.type === "Department Common Ground" && (
                <div className="grid gap-3 sm:grid-cols-3 bg-white/5 p-4 rounded-3xl border border-white/10">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Department
                    </label>
                    <select
                      value={editDepartmentId}
                      onChange={(e) => {
                        setEditDepartmentId(e.target.value);
                        setEditDivisionId("");
                        setEditUnitId("");
                      }}
                      className="w-full h-10 rounded-xl border-none bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">เลือก Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Division
                    </label>
                    <select
                      value={editDivisionId}
                      onChange={(e) => {
                        setEditDivisionId(e.target.value);
                        setEditUnitId("");
                      }}
                      disabled={!editDepartmentId}
                      className="w-full h-10 rounded-xl border-none bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
                    >
                      <option value="">เลือก Division</option>
                      {filteredDivisions.map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.division_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Unit
                    </label>
                    <select
                      value={editUnitId}
                      onChange={(e) => setEditUnitId(e.target.value)}
                      disabled={!editDivisionId}
                      className="w-full h-10 rounded-xl border-none bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
                    >
                      <option value="">เลือก Unit</option>
                      {filteredUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unit_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center flex-wrap gap-3">
                <h2 className="text-2xl font-bold tracking-tight">
                  {category.title}
                </h2>
                {/* 🌟 ตัวแสดงผล Level ที่เพิ่มกลับมา */}
                <div className="text-[12px] font-bold bg-white/20 text-white px-3 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                  Level {category.level}
                </div>
                <div
                  className={`text-[10px] uppercase px-2.5 py-1 rounded-lg ${getBadgeClass(category.type)}`}
                >
                  {category.type}
                </div>
              </div>
              {category.type === "Department Common Ground" && (
                <div className="flex flex-wrap gap-2 text-[11px] font-medium text-blue-50">
                  {departmentName && (
                    <span className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm border border-white/10">
                      แผนก: {departmentName}
                    </span>
                  )}
                  {divisionName && (
                    <span className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm border border-white/10">
                      ฝ่าย: {divisionName}
                    </span>
                  )}
                  {unitName && (
                    <span className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm border border-white/10">
                      หน่วย: {unitName}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Actions Group */}
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveChanges}
                className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-900/20"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition shadow-lg shadow-rose-900/20"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setIsExpanded(true);
                }}
                className="cursor-pointer flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F59E0B] to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-900/20 hover:scale-105 active:scale-95 transition duration-200"
              >
                <Pencil size={14} />
                แก้ไข
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-900/20 hover:bg-rose-700 hover:scale-105 active:scale-95 transition duration-200"
              >
                <Trash2 size={14} />
                ลบ
              </button>
            </>
          )}

          <div className="w-px h-8 bg-white/20 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition text-white"
          >
            {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <CategoryTable
            items={category.items}
            onChangeItem={(itemId, field, value) =>
              onChangeItem(category.id, itemId, field, value)
            }
            onRemoveItem={(itemId) => onRemoveItem(category.id, itemId)}
            onAddItem={() => onAddItem(category.id)}
          />
          <div className="mt-6 flex justify-end">
            <div className="text-sm font-medium text-slate-500 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center">
              คะแนนรวมทั้งหมด:
              <span className="ml-3 font-black text-blue-600 text-lg">
                {totalWeight}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
