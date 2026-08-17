import { Employee } from '../types'; // สมมติว่าเรามี type นี้อยู่

const evaluations = [
  { name: 'Krisxandra Capitle', role: 'Restaurant Operation - Hostess', score: 80, status: 'In Progress' },
  { name: 'Marcus Chen', role: 'Marketing - Sr. Designer', score: 92, status: 'Completed' },
  { name: 'Sarah Williams', role: 'Engineering - Tech Lead', score: null, status: 'Pending' },
  { name: 'David Park', role: 'Finance - Analyst', score: 87, status: 'Completed' },
  { name: 'Anna Rivera', role: 'HR - Coordinator', score: 75, status: 'In Progress' },
];

const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses: Record<string, string> = {
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-green-100 text-green-800',
        'Pending': 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusClasses[status]}`}>{status}</span>;
};

export default function RecentEvaluations() {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Recent Evaluations</h3>
                <a href="#" className="text-sm font-semibold text-red-600 hover:text-red-700" >VIEW ALL</a>
            </div>
            <ul className="space-y-4">
                {evaluations.map((evalItem, index) => (
                    <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
                                {evalItem.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="ml-3">
                                <p className="font-medium text-gray-800">{evalItem.name}</p>
                                <p className="text-sm text-gray-500">{evalItem.role}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {evalItem.score ? <p className="font-semibold text-gray-800">{evalItem.score}%</p> : <p className="font-semibold text-gray-500">-</p>}
                            <StatusBadge status={evalItem.status} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};