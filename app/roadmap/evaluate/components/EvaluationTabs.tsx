'use client';

import { Dispatch, SetStateAction } from 'react';

const tabs = ['Probation', 'Performance', 'Promote', 'Progression'];

// 1. กำหนด Type ของ Props ที่คอมโพเนนต์นี้ต้องรับจากข้างนอก
interface EvaluationTabsProps {
    activeTab: string;
    onTabChange: Dispatch<SetStateAction<string>> | ((tab: string) => void);
}

// 2. ปรับตัวฟังก์ชันให้เปิดรับค่า activeTab และ onTabChange จากข้างนอกแทนการสร้างเอง
export default function EvaluationTabs({ activeTab, onTabChange }: EvaluationTabsProps) {
    
    // ❌ ลบบรรทัด useState เดิมออกไปแล้ว เพราะเราใช้ค่าจากข้างนอกแทน

    return (
        <div className="w-full">
            <div className="border-b border-gray-100">
                {/* 
                  1. เพิ่ม overflow-x-auto เพื่อให้ swipe ซ้าย-ขวาได้บนมือถือ
                  2. เพิ่ม scrollbar-hide หรือใช้สไตล์ซ่อน scrollbar เพื่อความสวยงาม
                  3. ใช้ space-x-1 แทน space-x-2 เพื่อประหยัดพื้นที่บนหน้าจอเล็ก
                */}
                <nav className="mb-px flex space-x-1 overflow-x-auto no-scrollbar py-1 select-none">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                className={`
                                    /* whitespace-nowrap สำคัญมากเพื่อให้ตัวหนังสือไม่ขึ้นบรรทัดใหม่ */
                                    whitespace-nowrap cursor-pointer relative py-2.5 px-5 text-sm font-semibold rounded-xl
                                    transition-all duration-200 ease-out flex-shrink-0
                                    ${
                                        isActive
                                        ? 'text-blue-600 bg-blue-50/50 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {tab}
                                
                                {isActive && (
                                    /* ปรับเส้นใต้ให้ดูพรีเมียมขึ้น */
                                    <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-blue-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* css สำหรับซ่อน Scrollbar แต่ยังสามารถเลื่อนดูได้ */}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </div>
    );
}
