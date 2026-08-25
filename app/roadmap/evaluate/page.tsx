"use client";

import { useState } from "react";
import EvaluationTabs from "@/app/roadmap/evaluate/components/EvaluationTabs";
import SummarySidebar from "@/app/roadmap/evaluate/components/SummarySidebar";
import EvaluationForm from "@/app/roadmap/evaluate/components/EvaluationForm";

export default function EvaluatePage() {
  const [activeTab, setActiveTab] = useState<'Probation'|'Performance'|'Promote'|'Progression'>('Probation');

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen relative">
      <div className="w-full relative">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Evaluate HR</h1>
            <p className="text-gray-500 mt-1">
              ติดตามและจัดการผลการประเมินพนักงาน
            </p>
          </div>
        </div>
        <div id="evaluation-tabs-container">
          <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="w-full mt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-red-500 font-bold text-center">
            *** กรุณาเลือกพนักงานจากเมนู Employee เพื่อทำฟอร์มประเมิน ***
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <EvaluationForm formType={activeTab} />
          </div>
          <div>
            <SummarySidebar allFormData={{}} />
          </div>
        </div>
      </div>
    </div>
  );
}