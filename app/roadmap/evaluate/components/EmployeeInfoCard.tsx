import Link from 'next/link'; // 1. Import Link
import { MapPin, Users } from 'lucide-react';

// ไม่ต้องใช้ 'use client' หรือ useState แล้ว
export default function EmployeeInfoCard() {
    return (
        <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center justify-between mb-6">
            {/* ... (ส่วนข้อมูลพนักงานเหมือนเดิม) ... */}
            <div className="flex items-center">
                <img src="https://api.dicebear.com/9.x/adventurer/svg?seed=Alex" alt="Employee" width={80} height={80} className="rounded-lg object-cover" />
                <div className="ml-5">
                    <h2 className="text-2xl font-bold text-gray-800">Ms.Krisxandra Capitle</h2>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin size={14} className="mr-1.5" />
                        <span>Progression</span>
                    </div>
                </div>
            </div>

            {/* ... (ส่วน Middle เหมือนเดิม) ... */}
            <div className="text-sm text-gray-600 grid grid-cols-4 gap-x-6 gap-y-2 flex-grow mx-8">
                <span className="text-gray-500">Employee ID:</span><span className="font-semibold text-gray-800">50096</span>
                <span className="text-gray-500">Position:</span><span className="font-semibold text-gray-800">Web Developer</span>
                <span className="text-gray-500">Start Date:</span><span className="font-semibold text-gray-800">21-01-2025</span>
                <span className="text-gray-500">Level:</span><span className="font-semibold text-gray-800">P6</span>
                <span className="text-gray-500">Company:</span><span className="font-semibold text-gray-800">Your Company</span>
            </div>

            {/* Right Side: Promotion Status & Change Button */}
            <div className="text-right flex-shrink-0">
                <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-700">Promotion #3</span>
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-md inline-block ml-2">
                        NEW
                    </div>
                </div>
                {/* 2. เปลี่ยนจาก button เป็น Link */}
                <Link 
                    href="/roadmap/employee"
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all duration-200 active:scale-95"
                >
                    <Users size={16} className="mr-2" />
                    Change Employee
                </Link>
            </div>
        </div>
    );
}