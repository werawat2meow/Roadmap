'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import CategoryTable from './CategoryTable';

const LEVELS = ['P2','P3','P4','P5','P6','P7','P8','P9'];
const LEVEL_TITLE_MAP: Record<string, string> = {
  P2: 'Trainee',
  P3: 'Junior',
  P4: 'Officer',
  P5: 'Supervisor',
  P6: 'Assistant Manager',
  P7: 'Manager',
  P8: 'Chief',
  P9: 'Director',
};

const getTitleFromLevel = (level: string) => LEVEL_TITLE_MAP[level] ?? '';

type Department = { id: string; department_name: string };
type Division = { id: string; division_name: string; department_id: string };
type Unit = { id: string; unit_name: string; division_id: string };

type Item = { id: string; topic: string; weight: number; saved?: boolean; };
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
    onUpdate: (
    categoryId: string,
    title: string,
    level: string,
    department_id?: string,
    division_id?: string,
    unit_id?: string
  ) => void;
  onDelete: () => void;
  onAddItem: (categoryId: string) => void;
  onChangeItem: (categoryId: string, itemId: string, field: 'topic' | 'weight', value: string | number) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
};

const getBadgeClass = (type: string) => {
  switch (type) {
    case 'Company Common Ground':
      return 'text-amber-950 bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm font-bold';
      case 'Department Common Ground':
        return 'text-green-950 bg-gradient-to-r from-yellow-400 to-lime-500 shadow-sm font-bold';
        default:
          return 'text-orange-800 bg-orange-100 border border-orange-200';
  }
};

export default function CategoryCard({
  category,
  onUpdate,
  onDelete,
  onAddItem,
  onChangeItem,
  onRemoveItem,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 🌟 สถานะสำหรับย่อ-ขยาย (เริ่มต้นคือ ย่ออยู่)
  const [editTitle, setEditTitle] = useState(getTitleFromLevel(category.level));
  const [editLevel, setEditLevel] = useState(category.level);
  const [editDepartmentId, setEditDepartmentId] = useState(category.department_id ?? '');
  const [editDivisionId, setEditDivisionId] = useState(category.division_id ?? '');
  const [editUnitId, setEditUnitId] = useState(category.unit_id ?? '');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (!isEditing || category.type !== 'Department Common Ground') return;

    async function loadOptions() {
      try {
        const [deptRes, divRes, unitRes] = await Promise.all([
          fetch('/api/admin/departments?all=true'),
          fetch('/api/admin/divisions?all=true'),
          fetch('/api/admin/units?all=true'),
        ]);

        const [deptJson, divJson, unitJson] = await Promise.all([
          deptRes.json(),
          divRes.json(),
          unitRes.json(),
        ]);

        if (deptRes.ok && deptJson.success) setDepartments(deptJson.data);
        if (divRes.ok && divJson.success) setDivisions(divJson.data);
        if (unitRes.ok && unitJson.success) setUnits(unitJson.data);
      } catch (error) {
        console.error('Load department/division/unit options failed', error);
      }
    }

    loadOptions();
  }, [isEditing, category.type]);

  useEffect(() => {
    setEditTitle(getTitleFromLevel(editLevel));
  }, [editLevel]);

  const filteredDivisions = useMemo(
    () => divisions.filter((item) => item.department_id === editDepartmentId),
    [divisions, editDepartmentId]
  );

  const filteredUnits = useMemo(
    () => units.filter((item) => item.division_id === editDivisionId),
    [units, editDivisionId]
  );

  const totalWeight = useMemo(
    () => category.items.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    [category.items]
  );

  const saveChanges = () => {
  onUpdate(
    category.id,
    editTitle,
    editLevel,
    editDepartmentId || undefined,
    editDivisionId || undefined,
    editUnitId || undefined
  );
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(category.title);
    setEditLevel(category.level);
    setEditDepartmentId(category.department_id ?? '');
    setEditDivisionId(category.division_id ?? '');
    setEditUnitId(category.unit_id ?? '');
    setIsEditing(false);
  };

  return (
    <div className="rounded-[32px] overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300">
      <div 
        className="flex flex-col gap-4 bg-blue-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between px-6 py-4 cursor-pointer"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)} // 🌟 กด Header เพื่อย่อ/ขยายได้ (ถ้าไม่ได้อยู่ในโหมดแก้ไข)
      >
        <div className="space-y-2 flex-grow">
          {isEditing ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <input
                  value={editTitle}
                  readOnly
                  autoFocus
                  /* เพิ่ม h-[40px] เพื่อคุมความสูงให้เท่ากันทั้ง input และ select */
                  className="h-[40px] rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 w-full max-w-xs"
                />
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value)}
                  /* เพิ่ม h-[40px] และปรับการแสดงผลให้ตรงกัน */
                  className="h-[40px] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {LEVELS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {category.type === 'Department Common Ground' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/80">Department</label>
                    <select
                      value={editDepartmentId}
                      onChange={(e) => {
                        setEditDepartmentId(e.target.value);
                        setEditDivisionId('');
                        setEditUnitId('');
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-white/50"
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
                    <label className="block text-xs font-semibold text-white/80">Division</label>
                    <select
                      value={editDivisionId}
                      onChange={(e) => {
                        setEditDivisionId(e.target.value);
                        setEditUnitId('');
                      }}
                      disabled={!editDepartmentId}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    <label className="block text-xs font-semibold text-white/80">Unit</label>
                    <select
                      value={editUnitId}
                      onChange={(e) => setEditUnitId(e.target.value)}
                      disabled={!editDivisionId}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:bg-slate-100"
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
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{category.title}</h2>
                <div className={`text-xs uppercase tracking-[0.12em] px-2 py-1 rounded ${getBadgeClass(category.type)}`}>
                  {category.type}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white font-medium">
            Level {category.level}
          </div>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={saveChanges}
                className="cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Check size={16} className="inline-block" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="cursor-pointer rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                <X size={16} className="inline-block" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setIsExpanded(true); // 🌟 เปิดการ์ดอัตโนมัติเมื่อกดแก้ไข
              }}
              /* 🎨 ปรับเฉดสีจากซ้ายไปขวา (จาก amber-500 ที่เป็น #F59E0B ไปหา amber-600) */
              className="cursor-pointer rounded-full bg-gradient-to-r from-[#F59E0B] to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-amber-600 hover:to-amber-700 transition duration-200"
            >
              <Pencil size={16} className="inline-block mr-1" />
              แก้ไข
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Trash2 size={16} className="inline-block mr-1" />
            ลบ
          </button>
          
          {/* 🌟 ปุ่มลูกศรสำหรับย่อ/ขยาย */}
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer ml-2 p-1.5 rounded-full hover:bg-white/20 transition text-white"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* 🌟 แสดงส่วนเนื้อหาเฉพาะเมื่อ isExpanded เป็น true */}
      {isExpanded && (
        <div className="p-6 border-t border-slate-200 bg-slate-50/50">
          <CategoryTable
            items={category.items}
            onChangeItem={(itemId, field, value) => onChangeItem(category.id, itemId, field, value)}
            onRemoveItem={(itemId) => onRemoveItem(category.id, itemId)}
            onAddItem={() => onAddItem(category.id)}
          />
          <div className="mt-4 flexjustify-end text-sm text-slate-500 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm w-max ml-auto">
            คะแนนรวมทั้งหมด: <span className="ml-2 font-black text-blue-600 text-base">{totalWeight}</span>
          </div>
        </div>
      )}
    </div>
  );
}