'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import EvaluationTabs from '@/app/roadmap/evaluate/components/EvaluationTabs';
import EmployeeInfoCard from '@/app/roadmap/evaluate/components/EmployeeInfoCard';
import SummarySidebar from '@/app/roadmap/evaluate/components/SummarySidebar';

// --- นำเข้าคอมโพเนนต์สำหรับแต่ละแท็บ ---
import EvaluationForm from '@/app/roadmap/evaluate/components/EvaluationForm'; // นี่คือฟอร์มสำหรับ Probation
import PerformanceForm from '@/app/roadmap/evaluate/components/PerformanceForm';
import ProgressionForm from '@/app/roadmap/evaluate/components/ProgressionForm';
import PromoteForm from '@/app/roadmap/evaluate/components/PromoteForm';


export default function EvaluatePage() {
    const [showPopup, setShowPopup] = useState(false);
    const [dontShowToday, setDontShowToday] = useState(false);
    const [activeTab, setActiveTab] = useState('Probation');

    useEffect(() => {
        const expiryTime = localStorage.getItem('hideEvaluationPopupUntil');
        if (!expiryTime || new Date().getTime() > parseInt(expiryTime)) {
            const timer = setTimeout(() => setShowPopup(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClosePopup = () => {
        if (dontShowToday) {
            const tomorrow = new Date().getTime() + 24 * 60 * 60 * 1000;
            localStorage.setItem('hideEvaluationPopupUntil', tomorrow.toString());
        }
        setShowPopup(false);
    };

    // --- ฟังก์ชันสำหรับเลือกแสดงฟอร์มตาม activeTab ---
    const renderFormContent = () => {
        switch (activeTab) {
            case 'Probation':
                return <EvaluationForm />; // ใช้ EvaluationForm ที่มีอยู่แล้ว
            case 'Performance':
                return <PerformanceForm />;
            case 'Progression':
                return <ProgressionForm />;
            case 'Promote':
                return <PromoteForm />;
            default:
                return <EvaluationForm />;
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen relative">
            
            {showPopup && (
                <div className="absolute top-[180px] left-[260px] md:left-[200px] z-50 animate-bounce-slow max-w-sm">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 p-4 rounded-2xl border-b-8 border-amber-600 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4),0_8px_16px_-6px_rgba(0,0,0,0.2)] relative">
                        <div className="absolute -top-3 left-12 w-6 h-6 bg-amber-400 rotate-45 border-l border-t border-amber-300 shadow-[-4px_-4px_6px_rgba(0,0,0,0.05)]" />
                        <div className="flex items-start space-x-3">
                            <AlertCircle size={20} className="mt-0.5 text-amber-950 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-extrabold text-sm text-amber-950">คำแนะนำการประเมิน</h4>
                                <p className="text-xs font-semibold text-amber-900 mt-1 leading-relaxed">
                                    อย่าลืมเลือกหัวข้อการประเมินกลุ่ม <span className="underline decoration-2 font-black">4 P</span> ด้านบนนี้ให้ถูกต้องก่อนทำการบันทึกข้อมูลคะแนนพนักงานนะคะ
                                </p>
                            </div>
                            <button onClick={handleClosePopup} className="text-amber-950 hover:bg-amber-300/40 p-1 rounded-lg transition-colors cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="mt-3 pt-2 border-t border-amber-600/20 flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-[11px] font-bold text-amber-950 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={dontShowToday}
                                    onChange={(e) => setDontShowToday(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded bg-amber-600/30 border-none text-amber-950 focus:ring-0 cursor-pointer"
                                />
                                <span>ไม่ต้องแสดงอีกในวันนี้</span>
                            </label>
                            <button 
                                onClick={handleClosePopup}
                                className="bg-amber-950 text-white text-[11px] font-extrabold py-1 px-3 rounded-lg border-b-2 border-black hover:bg-amber-900 active:border-b-0 active:translate-y-[2px] transition-all cursor-pointer"
                            >
                                รับทราบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto relative">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">ประเมิน</h1>
                        <p className="text-gray-500 mt-1">ติดตามและจัดการผลการประเมินพนักงาน</p>
                    </div>
                </div>
                <div id="evaluation-tabs-container">
                    <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-6">
                <EmployeeInfoCard />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {renderFormContent()}
                    </div>
                    <div>
                        <SummarySidebar />
                    </div>
                </div>
            </div>
        </div>
    );
};