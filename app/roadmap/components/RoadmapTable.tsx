import { Roadmap, RoadmapStatus } from '../types';

type StatusBadgeProps = {
  status: RoadmapStatus;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
  const statusClasses: Record<RoadmapStatus, string> = {
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Planned': 'bg-yellow-100 text-yellow-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

type RoadmapTableProps = {
  roadmaps: Roadmap[];
};

export default function RoadmapTable({ roadmaps }: RoadmapTableProps) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Roadmap Name</th>
          <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">ID</th>
          <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Quarter</th>
          <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Owner</th>
          <th className="py-3 px-4 text-xs text-gray-500 font-medium uppercase">Status</th>
        </tr>
      </thead>
      <tbody>
        {roadmaps.map((roadmap) => (
          <tr key={roadmap.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-4 px-4 font-medium text-gray-800">{roadmap.name}</td>
            <td className="py-4 px-4 text-gray-600">{roadmap.id}</td>
            <td className="py-4 px-4 text-gray-600">{roadmap.quarter}</td>
            <td className="py-4 px-4 text-gray-600">{roadmap.owner}</td>
            <td className="py-4 px-4">
              <StatusBadge status={roadmap.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}