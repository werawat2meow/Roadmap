'use client';

import { useMemo, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (category: {
    id: string;
    title: string;
    type: string;
    level: string;
    items: { id: string; topic: string; weight: number; saved: boolean }[];
  }) => void;
};

const TYPES = ['Company Common Ground', 'Department Common Ground', 'Expectations'];

export default function AddCategoryModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [level, setLevel] = useState('P4');

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      id: `category-${Date.now()}`,
      title,
      type,
      level,
      items: [{ id: `item-${Date.now()}-1`, topic: '', weight: 0, saved: false }],
    });
    setTitle('');
    setType(TYPES[0]);
    setLevel('P4');
  };

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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Company Common Ground"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">ประเภท</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                <option value="P4">P4</option>
                <option value="P3">P3</option>
                <option value="P2">P2</option>
                <option value="P1">P1</option>
              </select>
            </div>
          </div>
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