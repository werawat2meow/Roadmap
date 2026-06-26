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
                <nav className="mb-px flex space-x-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                // 3. เปลี่ยนตรงนี้ให้เรียกฟังก์ชันที่ส่งมาจากไฟล์หลักแทน
                                onClick={() => onTabChange(tab)}
                                className={`
                                    whitespace-nowrap cursor-pointer relative py-2 px-4 text-sm font-semibold rounded-xl
                                    transition-all duration-200 ease-out select-none
                                    ${
                                        isActive
                                        ? 'text-gray-900 bg-gray-100/80 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {tab}
                                
                                {/* เส้นใต้เคลื่อนไหวเมื่อ Active */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
