import ScoreChart from './ScoreChart';

const SalaryInput = ({ label, value }: { label: string, value: string }) => (
    <div className="mb-4">
        <label className="text-sm text-gray-600 block mb-2">{label}</label>
        <div className="flex items-center gap-4">
            {/* Range Slider */}
            <input 
                type="range" 
                min="10000" 
                max="50000" 
                defaultValue={value.replace(',', '')} 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500" 
            />
            {/* Text Input */}
            <input 
                type="text" 
                defaultValue={value} 
                className="border rounded-md p-2 text-sm w-28 text-right" 
            />
        </div>
    </div>
);

export default function SummarySidebar() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
      <h3 className="font-bold text-lg mb-6 text-gray-700">Summary</h3>
      
      <div className="flex justify-between items-center mb-8">
        {/* Left side: Scores */}
        <div className="text-sm space-y-2 text-gray-600">
            <p>Company Score</p>
            <p className="font-bold text-xl text-gray-800">85</p>
            <p className="mt-2">Department Score</p>
            <p className="font-bold text-xl text-gray-800">90</p>
            <p className="mt-2">Expectation Score</p>
            <p className="font-bold text-xl text-gray-800">65</p>
            <hr className="my-4"/>
            <p className="font-bold text-gray-800 text-md">Total Score</p>
        </div>
        
        {/* Right side: Chart and Grade */}
        <div className="flex flex-col items-center">
            <ScoreChart score={85} />
            {/* This part is now handled inside ScoreChart, but we add the Grade below it */}
            <p className="text-3xl font-bold text-gray-800 mt-5">
                <span className="text-green-500">A</span>
            </p>
        </div>
      </div>

      {/* Salary Section */}
      <div className="space-y-4 my-8 text-gray-700">
        <SalaryInput label="Current Salary" value="15,000" />
        <SalaryInput label="New Salary" value="18,000" />
      </div>

      {/* Designation Section */}
      <div className="mb-6 text-gray-700">
        <label className="text-sm text-gray-600 block mb-1">Designation</label>
        <div className="flex gap-2">
            <select className="border rounded-md p-2 text-sm w-full bg-white">
                <option>Supervisor</option>
            </select>
            <select className="border rounded-md p-2 text-sm w-28 bg-white">
                <option>P4</option>
            </select>
        </div>
      </div>

      {/* Manager Comment */}
      <div className="my-6 text-gray-700">
        <label className="text-sm text-gray-600 block mb-1">Manager Comment:</label>
        <textarea rows={3} className="w-full border rounded-md p-2 text-sm mt-1"></textarea>
      </div>

      {/* Checkboxes and Radios */}
      <div className="text-sm space-y-3 my-6 text-gray-700">
        <div>
            <input type="checkbox" id="confirm" defaultChecked className="form-checkbox h-4 w-4 rounded text-blue-600 mr-2 focus:ring-blue-500" />
            <label htmlFor="confirm">Employee รับรู้และตกลง</label>
        </div>
        <div>
            <input type="radio" id="radio1" name="radio" className="form-radio h-4 w-4 mr-2 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="radio1">ฉันได้อ่านและยอมรับข้อตกลงการเลื่อนตำแหน่งนี้</label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 mt-8">
      {/* 1. ปุ่ม Save Draft (โทนเหลืองอำพัน-ส้มอบอุ่น) */}
      <button className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-all duration-200 active:scale-95 text-center leading-tight cursor-pointer select-none">
        <span>Save</span>
        <span>Draft</span>
      </button>

      {/* 2. ปุ่ม Submit (โทนฟ้าไพลิน-น้ำเงินอินดิโก้ เหมือน Change Employee ก่อนหน้า) */}
      <button className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-200 active:scale-95 cursor-pointer select-none">
        Submit
      </button>

      {/* 3. ปุ่ม Approve (โทนเขียวมรกตสดใส ไล่เฉดมีมิติ) */}
      <button className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-200 active:scale-95 cursor-pointer select-none">
        Approve
      </button>
    </div>
    </div>
  );
}