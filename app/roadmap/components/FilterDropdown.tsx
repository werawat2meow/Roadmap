import React from "react";
import { RotateCcw, Filter, ChevronDown } from "lucide-react";

type FilterDropdownProps = {
  selectedFilters?: {
    branch: string;
    department: string;
    division: string;
    unit: string;
    level: string;
    status: string;
  };
  branches: string[];
  statuses: string[];
  items: {
    branch: string;
    department: string;
    division: string;
    unit: string;
    level: string;
  }[];
  onApplyFilters: (filters: {
    branch: string;
    department: string;
    division: string;
    unit: string;
    level: string;
    status: string;
  }) => void;
};

const defaultFilters = {
  branch: "",
  department: "",
  division: "",
  unit: "",
  level: "",
  status: "",
};

export default function FilterDropdown({
  selectedFilters = defaultFilters,
  branches,
  statuses,
  items,
  onApplyFilters,
}: FilterDropdownProps) {
  const [filters, setFilters] = React.useState(selectedFilters);

  // --- Logic เดิม (คงไว้เพื่อให้ทำงานได้เหมือนเดิม) ---
  const availableDepartments = React.useMemo(() => {
    if (!filters.branch) return [];
    return [...new Set(items.filter((item) => item.branch === filters.branch).map((item) => item.department).filter(Boolean))];
  }, [items, filters.branch]);

  const availableDivisions = React.useMemo(() => {
    if (!filters.branch || !filters.department) return [];
    return [...new Set(items.filter((item) => item.branch === filters.branch && item.department === filters.department).map((item) => item.division).filter(Boolean))];
  }, [items, filters.branch, filters.department]);

  const availableUnits = React.useMemo(() => {
    if (!filters.branch || !filters.department || !filters.division) return [];
    return [...new Set(items.filter((item) => item.branch === filters.branch && item.department === filters.department && item.division === filters.division).map((item) => item.unit).filter(Boolean))];
  }, [items, filters.branch, filters.department, filters.division]);

  const availableLevels = React.useMemo(() => {
    if (!filters.branch || !filters.department || !filters.division || !filters.unit) return [];
    return [...new Set(items.filter((item) => item.branch === filters.branch && item.department === filters.department && item.division === filters.division && item.unit === filters.unit).map((item) => item.level).filter(Boolean))];
  }, [items, filters.branch, filters.department, filters.division, filters.unit]);

  const updateFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const handleReset = () => {
    updateFilters(defaultFilters);
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-slate-700">ตัวกรองข้อมูล</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          ล้างทั้งหมด
        </button>
      </div>

      {/* Form Content */}
      <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">
        <FilterField
          label="สังกัด / สาขา"
          value={filters.branch}
          onChange={(v) => updateFilters({ ...filters, branch: v, department: "", division: "", unit: "", level: "" })}
          options={branches}
          placeholder="All Branches"
        />

        <FilterField
          label="แผนก"
          value={filters.department}
          onChange={(v) => updateFilters({ ...filters, department: v, division: "", unit: "", level: "" })}
          options={availableDepartments}
          placeholder="All Departments"
          disabled={!filters.branch}
        />

        <FilterField
          label="ฝ่าย"
          value={filters.division}
          onChange={(v) => updateFilters({ ...filters, division: v, unit: "", level: "" })}
          options={availableDivisions}
          placeholder="All Divisions"
          disabled={!filters.branch || !filters.department}
        />

        <FilterField
          label="หน่วยงาน"
          value={filters.unit}
          onChange={(v) => updateFilters({ ...filters, unit: v, level: "" })}
          options={availableUnits}
          placeholder="All Units"
          disabled={!filters.branch || !filters.department || !filters.division}
        />

        <FilterField
          label="ระดับพนักงาน (Level P)"
          value={filters.level}
          onChange={(v) => updateFilters({ ...filters, level: v })}
          options={availableLevels}
          placeholder="All Levels"
          disabled={!filters.branch || !filters.department || !filters.division || !filters.unit}
        />
      </div>
      
      {/* Footer Decoration */}
      <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10" />
    </div>
  );
}

// --- Component ย่อยสำหรับ Select Field เพื่อความสวยงามและลดโค้ดซ้ำ ---
function FilterField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className={`space-y-1.5 transition-opacity duration-200 ${disabled ? "opacity-40" : "opacity-100"}`}>
      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.05em] ml-1">
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:cursor-not-allowed font-medium"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}