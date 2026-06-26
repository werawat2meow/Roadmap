import { Building, Users, Target, ChevronDown } from 'lucide-react';

type Item = {
  id: number;
  topic: string;
  weight: number;
  score: number;
};

type EvaluationSectionProps = {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  level: string;
  totalWeight: number;
  totalScore: number;
};

const ScoreDropdown = ({ score }: { score: number }) => (
  <select defaultValue={score} className="border border-gray-300 rounded-md p-1.5 text-sm w-20 text-center bg-white text-black">
    {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
      <option key={n} value={n}>{n}</option>
    ))}
  </select>
);

export default function EvaluationSection({ title, icon, items, level, totalWeight, totalScore }: EvaluationSectionProps) {
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
            <ChevronDown size={16} />
        </div>
      </div>

      <div className="mt-4">
        <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 0.5rem' }}>
            <thead>
                <tr className="text-left text-gray-500">
                    <th className="pb-2 font-medium w-1/2">ตัวชี้วัด</th>
                    <th className="pb-2 font-medium text-center px-2">คะแนนเต็ม</th>
                    <th className="pb-2 font-medium text-center px-2">Score</th>
                    <th className="pb-2 font-medium text-center w-1/3">หมายเหตุ</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id}>
                        <td className="py-2 flex items-center">
                            <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 rounded text-blue-600 mr-3 focus:ring-blue-500" />
                            <span className="text-gray-700">{item.id}. {item.topic}</span>
                        </td>
                        <td className="py-2 text-center text-gray-600 px-2">{item.weight}</td>
                        <td className="py-2 text-center px-2">
                            <ScoreDropdown score={item.score} />
                        </td>
                        <td className="py-2 px-2">
                            <input type="text" className="border border-gray-300 rounded-md w-full p-1.5 text-black" />
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr className="border-t-2 font-bold text-gray-800">
                    <td className="pt-3">รวม</td>
                    <td className="pt-3 text-center px-2">{totalWeight}</td>
                    <td className="pt-3 text-center px-2">{totalScore}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
      </div>
    </div>
  );
}