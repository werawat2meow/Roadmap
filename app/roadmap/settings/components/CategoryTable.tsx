'use client';

type Item = {
  id: string;
  topic: string;
  weight: number;
  saved: boolean;
};

type Props = {
  items: Item[];
  onChangeItem: (id: string, field: 'topic' | 'weight', value: string | number) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
};

export default function CategoryTable({
  items,
  onChangeItem,
  onRemoveItem,
  onAddItem,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
      <table className="min-w-[680px] w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-sm text-slate-500">
            <th className="px-6 py-4">ชื่อตัวชี้วัด</th>
            <th className="px-6 py-4 text-center">คะแนนเต็ม</th>
            <th className="px-6 py-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-slate-200">
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={item.topic}
                  onChange={(e) => onChangeItem(item.id, 'topic', e.target.value)}
                  placeholder="ชื่อตัวชี้วัด..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </td>
              <td className="px-6 py-4 text-center">
                <input
                  type="number"
                  min={0}
                  value={item.weight}
                  onChange={(e) => onChangeItem(item.id, 'weight', Number(e.target.value))}
                  className="mx-auto w-24 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </td>
              <td className="px-6 py-4 text-center">
                <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 transition hover:from-red-600 hover:to-rose-600 hover:text-white"
                >
                ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
        <button
        type="button"
        onClick={onAddItem}
        className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all duration-200 active:scale-95 cursor-pointer"
        >
        <span className="mr-2 text-base font-bold">+</span>
        เพิ่มตัวชี้วัด
        </button>
        <p className="text-sm text-slate-500">
          รวม {items.length} ตัวชี้วัด
        </p>
      </div>
    </div>
  );
}