import { Plus } from 'lucide-react';

export default function AddRoadmapButton() {
  return (
    <button className="flex items-center gap-2 px-5 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors">
      <Plus className="h-5 w-5" />
      <span>Add Roadmap</span>
    </button>
  );
}