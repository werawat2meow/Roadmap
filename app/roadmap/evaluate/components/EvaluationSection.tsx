import { Building, Users, Target, ChevronDown } from "lucide-react";

type Item = {
  id: number;
  topic: string;
  weight: number;
  score: number;
};

type RowState = {
  rowId: string;
  itemId: string;  // UUID for Company/Department dropdown
  topic: string;   // free text for Expectations
  maxScore: number;
  score: number;
  note: string;
};

type CategoryItem = {
  id: string;
  topic: string;
  weight: number;
};

type EvaluationSectionProps = {
  title: string;
  icon: React.ReactNode;
  level: string;
  rows: RowState[];
  options: CategoryItem[];
  onChangeRow: (rowId: string, next: Partial<RowState>) => void;
  onAddRow: () => void;
  onRemoveRow?: (rowId: string) => void;
};

const ScoreDropdown = ({ score }: { score: number }) => (
  <select
    defaultValue={score}
    className="border border-gray-300 rounded-md p-1.5 text-sm w-20 text-center bg-white text-black"
  >
    {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
      <option key={n} value={n}>
        {n}
      </option>
    ))}
  </select>
);

export default function EvaluationSection({
  title,
  icon,
  level,
  rows,
  options,
  onChangeRow,
  onAddRow,
  onRemoveRow,
}: EvaluationSectionProps) {
  const totalMaxScore = rows.reduce((sum, row) => sum + row.maxScore, 0);
  const totalScore = rows.reduce((sum, row) => sum + row.score, 0);
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-center bg-blue-600 text-white -m-4 mb-0 p-3 rounded-t-lg">
        <div className="flex items-center">
          {icon}
          <h3 className="font-bold ml-2">{title}</h3>
        </div>
        <div className="flex items-center bg-white text-gray-700 px-3 py-1 rounded-md cursor-pointer">
          <span className="text-xs mr-2">Level</span>
          <span className="font-bold text-xs mr-2">{level}</span>
        </div>
      </div>

      <div className="mt-4">
        <table
          className="w-full text-sm border-separate table-fixed"
          style={{ borderSpacing: "0 0.5rem" }}
        >
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2 font-medium w-1/2">ตัวชี้วัด</th>
              {/* 📐 ปรับความกว้างจาก w-24 เป็น w-28 เพื่อรองรับอินพุตขนาดปรกติ */}
              <th className="pb-2 font-medium text-center px-2 w-28">
                น้ำหนัก
              </th>
              <th className="pb-2 font-medium text-center px-2 w-28">
                ผลการประเมิน
              </th>
              <th className="pb-2 font-medium text-center w-1/3">หมายเหตุ</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selectedIds = rows
                .filter((r) => r.itemId && r.rowId !== row.rowId)
                .map((r) => r.itemId);

              const availableOptions = options.filter(
                (opt) => opt.id === row.itemId || !selectedIds.includes(opt.id),
              );
              return (
                <tr key={row.rowId}>
                  <td className="py-2">
                    {options.length > 0 ? (
                      <select
                        value={row.itemId}
                        onChange={(e) =>
                          onChangeRow(row.rowId, { itemId: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md p-2 pr-10 bg-white text-black truncate appearance-none"
                      >
                        <option value="">เลือกตัวชี้วัด</option>
                        {availableOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.topic}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={row.topic ?? ""}
                        onChange={(e) =>
                          onChangeRow(row.rowId, { topic: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"
                        placeholder="กรอกตัวชี้วัด"
                      />
                    )}
                  </td>
                  <td className="py-2 text-center px-2">
                    <input
                      type="number"
                      value={row.maxScore}
                      onChange={(e) =>
                        onChangeRow(row.rowId, {
                          maxScore: Number(e.target.value),
                        })
                      }
                      /* 🛠️ เปลี่ยนจาก px-2 py-1 เป็น p-2 ความสูงจะเท่ากับช่องหมายเหตุเป๊ะ */
                      className="w-full min-w-[80px] border border-gray-300 rounded-md p-2 bg-white text-black text-center"
                      min={0}
                    />
                  </td>
                  <td className="py-2 text-center px-2">
                    <input
                      type="number"
                      value={row.score}
                      onChange={(e) =>
                        onChangeRow(row.rowId, {
                          score: Number(e.target.value),
                        })
                      }
                      /* 🛠️ เปลี่ยนจาก px-2 py-1 เป็น p-2 ความสูงจะเท่ากับช่องหมายเหตุเป๊ะ */
                      className="w-full min-w-[80px] border border-gray-300 rounded-md p-2 bg-white text-black text-center"
                      min={0}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) =>
                          onChangeRow(row.rowId, { note: e.target.value })
                        }
                        className="w-full border text-black border-gray-300 rounded-md p-2"
                        placeholder="หมายเหตุ"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onAddRow}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          +
                        </button>

                        {rows.length > 1 && onRemoveRow ? (
                          <button
                            type="button"
                            onClick={() => onRemoveRow(row.rowId)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
                          >
                            -
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-slate-800">
              <td className="pt-3">รวม</td>
              <td className="pt-3 text-center px-2">{totalMaxScore}</td>
              <td className="pt-3 text-center px-2">{totalScore}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
