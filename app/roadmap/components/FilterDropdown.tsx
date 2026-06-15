import React from 'react';

type FilterDropdownProps = {
  departments: string[]; // <-- รับค่าจาก props
  statuses: string[];    // <-- รับค่าจาก props
  onApplyFilters: (filters: { department: string; status: string }) => void;
  onClose: () => void;
};

export default function FilterDropdown({ departments, statuses, onApplyFilters, onClose }: FilterDropdownProps) {
  const [selectedDepartment, setSelectedDepartment] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');

  const handleApply = () => {
    onApplyFilters({ department: selectedDepartment, status: selectedStatus });
    onClose();
  };

  const handleClear = () => {
    setSelectedDepartment('');
    setSelectedStatus('');
    onApplyFilters({ department: '', status: '' });
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            id="department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {/* ใช้ departments จาก props */}
            {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            {/* ใช้ statuses จาก props */}
            {statuses.map(stat => <option key={stat} value={stat}>{stat}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
        <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Clear
        </button>
        <button onClick={handleApply} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">
          Apply
        </button>
      </div>
    </div>
  );
}