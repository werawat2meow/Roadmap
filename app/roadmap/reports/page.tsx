"use client";

import { useState, useEffect } from "react";
import ReportsHeader from "./components/ReportsHeader";
import ReportsTabs from "./components/ReportsTabs";
import ReportPanel from "./components/ReportPanel";
import { HelpCircle } from "lucide-react";
import ReportNotice from "./components/ReportNotice";

const tabs = [
  { id: "probation", label: "Probation" },
  { id: "performance", label: "Performance" },
  { id: "promote", label: "Promote" },
  { id: "progression", label: "Progression" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("probation");
  const [quarter, setQuarter] = useState("Level 2");
  const [scope, setScope] = useState("ทุกแผนก");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("hide_reports_guide");
    if (!isDismissed) {
      const timer = setTimeout(() => setShowGuide(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem("hide_reports_guide", "true");
  };

  const openGuide = () => {
    setShowGuide(true);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900">Reports</h1>{" "}
            {/* เพิ่มบรรทัดนี้กลับมา */}
            <button
              onClick={openGuide}
              className="p-1.5 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-all duration-200 cursor-pointer"
              title="วิธีใช้งาน"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="mb-2 text-slate-500 mt-2 font-medium">
            สรุปผลข้อมูลการประเมินและสถิติต่างๆ
          </p>
        </div>
      </div>

      <ReportNotice isOpen={showGuide} onClose={closeGuide} />

      
      <ReportsHeader
        quarter={quarter}
        scope={scope}
        onQuarterChange={setQuarter}
        onScopeChange={setScope}
        onExport={() => {
          console.log("Export reports");
        }}
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <ReportsTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="mt-3">
        <ReportPanel activeTab={activeTab} quarter={quarter} scope={scope} />
      </div>
    </div>
  );
}
