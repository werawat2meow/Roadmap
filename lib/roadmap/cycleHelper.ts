// lib/roadmap/cycleHelper.ts

export type CyclePhase = 
  | "NOMINATING"      // 26 - 28: หัวหน้าส่งชื่อเข้าแผน
  | "HR_PREPARING"    // 29 ถึง 2: HRM ออกใบประเมิน
  | "EVALUATING"       // 3 ถึง 7 (เตือนวันที่ 6-7): หัวหน้าทำประเมิน
  | "LOCKED"          // 9 เป็นต้นไป: ปิดรับผลประเมินของหัวหน้า
  | "NORMAL";

export function getEvaluationCycleInfo(customDate?: Date) {
  // const now = customDate || new Date();
  const now = customDate || new Date("2026-10-06");
  const day = now.getDate();
  

  // 1. วันที่ 26 - 28: ช่วงส่งชื่อ
  const isNominationPeriod = day >= 26 && day <= 28;
  const isNominationAlert = day >= 26 && day <= 27;

  // 2. ภายในวันที่ 2 (หรือ 29 ถึง 2): ช่วง HRM ออกใบประเมิน
  const isHrPreparePeriod = day >= 29 || day <= 2;

  // 3. วันที่ 6 - 7: หัวหน้าต้องทำให้เสร็จ
  const isEvaluationDueSoon = day >= 6 && day <= 7;

  // 4. วันที่ 9 เป็นต้นไป: ล็อคไม่ให้หัวหน้าส่ง/แก้ไข
  const isManagerLocked = day >= 9;

  let phase: CyclePhase = "NORMAL";
  if (isNominationPeriod) phase = "NOMINATING";
  else if (isHrPreparePeriod) phase = "HR_PREPARING";
  else if (isManagerLocked) phase = "LOCKED";
  else if (isEvaluationDueSoon) phase = "EVALUATING";

  return {
    day,
    phase,
    isNominationPeriod,
    isNominationAlert,
    isHrPreparePeriod,
    isEvaluationDueSoon,
    isManagerLocked,
  };
}