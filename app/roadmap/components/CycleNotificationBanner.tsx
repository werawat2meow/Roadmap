"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, ArrowRight, X } from "lucide-react";
import { getEvaluationCycleInfo  } from "@/lib/roadmap/cycleHelper";

type ActiveAlert = {
  id: string;
  title: string;
  message: string;
  action_url?: string;
  actionLabel: string;
  actionTarget: "nominate" | "select";
};

export default function CycleNotificationBanner() {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      try {
        // 1. ดึงการแจ้งเตือนของ user ที่ล็อกอินอยู่จาก API
        const notiRes = await fetch(
          "/api/admin/notifications?page=1&pageSize=10",
        );
        const notiJson = await notiRes.json();

        if (notiJson.success && Array.isArray(notiJson.data)) {
          // หาแจ้งเตือนที่เกี่ยวกับ roadmap หรือ nomination ที่ยังไม่ได้อ่าน
          const cycleInfo = getEvaluationCycleInfo();

          const roadmapAlert = notiJson.data.find((n: any) => {
            const text = `${n.title || ""} ${n.message || ""}`;

            const isRoadmap =
              n.module_code === "roadmap" ||
              n.notification_type?.includes("roadmap") ||
              n.notification_type?.includes("nomination") ||
              n.notification_type?.includes("evaluation");

            const isNominationAlert =
              text.includes("เสนอชื่อ") ||
              text.includes("ส่งรายชื่อ") ||
              n.notification_type?.includes("nomination");

            if (!isRoadmap || n.is_read) return false;

            // ถ้าเป็นแจ้งเตือนเสนอชื่อ แต่ตอนนี้ไม่ใช่วันที่ 26-28 แล้ว ให้ข้าม
            if (isNominationAlert && !cycleInfo.isNominationPeriod)
              return false;

            return true;
          });

          if (roadmapAlert) {
            const text = `${roadmapAlert.title || ""} ${roadmapAlert.message || ""}`;

            const isEvaluationAlert =
              text.includes("ลงคะแนน") ||
              text.includes("ฟอร์มประเมิน") ||
              text.includes("พร้อมลงคะแนน") ||
              roadmapAlert.notification_type?.includes("evaluation");

            setActiveAlert({
              id: roadmapAlert.id,
              title: roadmapAlert.title || "แจ้งเตือนจาก HR",
              message: roadmapAlert.message || "มีรายการแจ้งเตือนจาก HR",
              action_url: roadmapAlert.action_url || "/roadmap/evaluatemgr",
              actionLabel: isEvaluationAlert
                ? "เลือกพนักงานเพื่อประเมิน"
                : "เสนอชื่อพนักงานทันที",
              actionTarget: isEvaluationAlert ? "select" : "nominate",
            });
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load cycle banner alert:", err);
      }
    }

    loadAlerts();
  }, [user]);

  if (dismissed || !activeAlert) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-4 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20 animate-fade-in border border-amber-400/40 mb-6">
      <div className="flex items-center gap-3">
        <span className="p-2 bg-white/20 rounded-2xl animate-pulse flex-shrink-0">
          <Bell size={20} />
        </span>
        <div>
          <div className="font-bold text-sm md:text-base flex items-center gap-2">
            {activeAlert.title}
          </div>
          <p className="text-xs md:text-sm text-amber-50 mt-0.5">
            {activeAlert.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={() => {
            const selector =
              activeAlert.actionTarget === "select"
                ? "[data-select-evaluation-btn]"
                : "[data-nominate-btn]";

            const actionBtn = document.querySelector(
              selector,
            ) as HTMLButtonElement;

            if (actionBtn) {
              actionBtn.click();
            }

            setDismissed(true);
          }}
          className="bg-white text-orange-600 px-4 py-2 rounded-2xl font-bold text-xs hover:bg-orange-50 shadow-sm transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          {activeAlert.actionLabel}
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          title="ปิดการแจ้งเตือน"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
