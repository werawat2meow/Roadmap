'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import CategoryTable from './CategoryTable';

type Item = {
  id: string;
  topic: string;
  weight: number;
  saved: boolean;
};

type Category = {
  id: string;
  title: string;
  type: string;
  level: string;
  items: Item[];
};

type Props = {
  category: Category;
  onUpdate: (category: Category) => void;
  onDelete: () => void;
};

export default function CategoryCard({ category, onUpdate, onDelete }: Props) {
  const [items, setItems] = useState<Item[]>(category.items);

  const totalWeight = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    [items]
  );

  const handleChangeItem = (id: string, field: 'topic' | 'weight', value: string | number) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, [field]: value, saved: false } : item
    );
    setItems(next);
    onUpdate({ ...category, items: next });
  };

  const handleAddItem = () => {
    const next = [
      ...items,
      { id: `${category.id}-item-${items.length + 1}-${Date.now()}`, topic: '', weight: 0, saved: false },
    ];
    setItems(next);
    onUpdate({ ...category, items: next });
  };

  const handleRemoveItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    onUpdate({ ...category, items: next });
  };

  return (
     <div className="rounded-[32px] overflow-hidden border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-blue-600 p-5 text-white md:flex-row md:items-center md:justify-between rounded-t-[32px]">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-blue-100">หมวดหมู่</p>
          <p className="mt-1 text-sm text-blue-100">{category.type}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white">
            Level {category.level}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-[0_4px_12px_rgba(220,38,38,0.2)] transition-all duration-200 active:scale-95 cursor-pointer"
            >
            <Trash2 size={16} className="mr-2" />
            ลบหมวดหมู่
            </button>
        </div>
      </div>

      <div className="p-6">
        <CategoryTable
          items={items}
          onChangeItem={handleChangeItem}
          onRemoveItem={handleRemoveItem}
          onAddItem={handleAddItem}
        />
        <div className="mt-4 flex justify-end text-sm text-slate-500">
          คะแนนรวมทั้งหมด: <span className="ml-2 font-semibold text-slate-900">{totalWeight}</span>
        </div>
      </div>
    </div>
  );
}