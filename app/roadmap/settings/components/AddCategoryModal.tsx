'use client';

import { useEffect, useMemo, useState } from 'react';

type Department = { id: string; department_name: string };
type Division = { id: string; division_name: string; department_id: string };
type Unit = { id: string; unit_name: string; division_id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (category: {
    title: string;
    type: string;
    level: string;
    department_id?: string;
    division_id?: string;
    unit_id?: string;
  }) => void;
};

  const TYPES = ['Company Common Ground', 'Department Common Ground'];
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

export default function AddCategoryModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [level, setLevel] = useState(LEVELS[0]);

  const [departmentId, setDepartmentId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [unitId, setUnitId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  const filteredDivisions = useMemo(
    () => divisions.filter((item) => item.department_id === departmentId),
    [divisions, departmentId]
  );

  const filteredUnits = useMemo(
    () => units.filter((item) => item.division_id === divisionId),
    [units, divisionId]
  );

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    return Boolean(level);
  }, [title, level]);

  const handleSubmit = () => {
    if (!canSubmit) return;

  onCreate({
    title: title.trim(),
    type,
    level,
    department_id: departmentId || undefined,
    division_id: divisionId || undefined,
    unit_id: unitId || undefined,
  });

    setTitle('');
    setType(TYPES[0]);
    setLevel(LEVELS[0]);
    setDepartmentId('');
    setDivisionId('');
    setUnitId('');
  };

  useEffect(() => {
    setTitle(getTitleFromLevel(level));
  }, [level]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900">เพิ่มหมวดหมู่ใหม่</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700">ชื่อหมวดหมู่</label>
            <input
              value={title}
              readOnly
              placeholder="เช่น Mountain"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">ประเภท</label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  if (newType === 'Company Common Ground') {
                    setDepartmentId('');
                    setDivisionId('');
                    setUnitId('');
                  }
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {type === 'Department Common Ground' && (
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setDivisionId('');
                    setUnitId('');
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                <label className="block text-sm font-semibold text-slate-700">Division</label>
                <select
                  value={divisionId}
                  onChange={(e) => {
                    setDivisionId(e.target.value);
                    setUnitId('');
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={!departmentId}
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
                <label className="block text-sm font-semibold text-slate-700">Unit</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={!divisionId}
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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-amber-600 sm:w-auto"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="cursor-pointer w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
}