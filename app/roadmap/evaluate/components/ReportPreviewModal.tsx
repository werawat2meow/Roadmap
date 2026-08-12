import { Printer, X, ClipboardCheck } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

// ใช้สี Gradient ตามที่คุณส่งมาต้นฉบับ
const labelStyles: Record<string, string> = {
  Probation:
    "text-white bg-gradient-to-r from-sky-400 to-blue-700 shadow-sm font-bold",
  Performance:
    "text-amber-950 bg-gradient-to-r from-yellow-300 to-orange-500 shadow-sm font-bold",
  Promote:
    "text-white bg-gradient-to-r from-lime-400 to-emerald-700 shadow-sm font-bold",
  Progression:
    "text-white bg-gradient-to-r from-orange-400 to-rose-600 shadow-sm font-bold",
};

export default function ReportPreviewModal({
  isOpen,
  onClose,
  data,
}: PreviewModalProps) {
  if (!isOpen) return null;

  const formatRange = (value?: string) => {
    const [start = "", end = ""] = (value || "").split(" - ");
    return [start, end].filter(Boolean).join(" - ") || "-";
  };

  const sumWeights = (items?: any[]) =>
    (items ?? []).reduce((sum, item) => sum + Number(item.weight || 0), 0);

  const evaluationRound = data?.evaluationRound ?? "-";
  const disciplineData = data?.disciplineData;
  const totalDisciplineScore = (disciplineData?.disciplineItems ?? []).reduce(
    (sum, item) =>
      sum + Number(item.count || 0) * Number(item.penaltyScore || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:block">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  /* 1. ล้างสไตล์พื้นฐาน เงา ขอบมน */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
    border-radius: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  nav, aside, footer, .no-print, button {
    display: none !important;
  }

  body * {
    visibility: hidden;
  }

  .print-area, .print-area * {
    visibility: visible !important;
  }

  @page {
    size: A4 portrait;
    margin: 0; 
  }

  /* 2. จัดการ Container ให้ราบไปกับหน้ากระดาษ */
  .fixed.inset-0 {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    display: block !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  .bg-slate-100.rounded-2xl, 
  .flex-1.overflow-y-auto {
    height: auto !important;
    max-height: none !important;
    display: block !important;
    overflow: visible !important;
    background: white !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* 3. ตั้งค่า Print Area และแก้ปัญหา "ช่องว่างไม่เท่ากัน" */
  .print-area {
    width: 100% !important;
    min-height: 297mm !important;
    margin: 0 !important;
    padding: 8mm !important; /* ระยะขอบกระดาษขาว */
    page-break-after: always !important;
    box-sizing: border-box !important;
    display: block !important; /* เปลี่ยนจาก flex เป็น block เพื่อให้คุม Margin ง่ายขึ้น */
    background: white !important;
  }

  .print-area:last-child {
    page-break-after: auto !important;
  }

  /* 4. จุดตาย: บังคับระยะห่างระหว่าง Section ให้เท่ากันทั้งหมด (แก้ปัญหาเว้นห่างเกิน) */
  /* บังคับให้ Margin ล่างของทุกส่วนในหน้า 2 เท่ากับ 15px */
  .print-area section, 
  .print-area .border, 
  .print-area .grid, 
  .print-area > div {
    margin-bottom: 12px !important; 
    margin-top: 0 !important;
  }

  /* ปิด mt-auto ที่ทำให้ลายเซ็นกระโดดไปล่างสุด */
  .print-area .mt-auto {
    margin-top: 20px !important; 
  }

  /* ปรับแต่งช่องลายเซ็นให้เล็กลงตอนปริ้น */
  .print-area .h-16 {
    height: 40px !important;
  }

  /* ป้องกันไม่ให้ตารางโดนตัดแบ่งครึ่งหน้า (ถ้าเป็นไปได้) */
  table, section {
    page-break-inside: avoid !important;
  }
}
    `,
        }}
      />

      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Toolbar */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 rounded-t-2xl no-print">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Report Preview
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Preview ก่อนพิมพ์รายงานจริง
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> พิมพ์รายงาน / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Paper Space */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-500/20 space-y-10 custom-scrollbar">
          {/* ==================== หน้าที่ 1 ==================== */}
          <div className="print-area bg-white w-full max-w-none mx-auto p-6 shadow-2xl border border-slate-300 relative flex flex-col text-slate-800">
            <header className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-xl font-black text-slate-900">
                แบบประเมิน ROAD MAP (หน้าที่ 1)
              </h1>
              <div className="text-right flex items-center gap-4 text-[11px] font-bold">
                <p>
                  การประเมินครั้งที่:{" "}
                  <span className="underline">{evaluationRound}</span>
                </p>
                <p>
                  ประจำเดือน:{" "}
                  <span className="underline">
                    {data?.submittedMonth || "-"}
                  </span>
                </p>
              </div>
            </header>

            {/* ส่วนหัวข้อมูลพนักงาน (กลับมาครบทุกฟิลด์ 100%) */}
            <div className="border border-slate-400 p-3 bg-white mb-4">
              <div className="grid grid-cols-4 gap-y-2 gap-x-6 text-[10px]">
                <InfoCell label="รหัสพนักงาน" value={data?.employeeCode} />
                <InfoCell label="Name" value={data?.employeeName} />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-500 mb-0.5">
                    Type:
                  </span>
                  <span
                    className={`inline-flex self-start rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider ${labelStyles[data?.evaluationType || "Probation"] || "bg-slate-100 text-slate-700"}`}
                  >
                    {data?.evaluationType || "-"}
                  </span>
                </div>
                <InfoCell label="Nickname" value={data?.nickname} />
                <InfoCell label="Position" value={data?.position} />
                <InfoCell label="Company / สังกัด" value={data?.company} />
                <InfoCell label="Department" value={data?.department} />
                <InfoCell label="Division" value={data?.division} />
                <InfoCell label="Unit" value={data?.unit} />
                <InfoCell label="Level" value={data?.level} />
                <InfoCell label="Start Date" value={data?.startDate} />
                <InfoCell label="Employee age" value={data?.employeeAge} />
              </div>
            </div>

            {/* ตารางข้อมูลการประเมินเบื้องต้น (ครบถ้วน) */}
            <div className="bg-white border border-slate-300 text-[10px] mb-6 grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-center rounded overflow-hidden">
              <GridCell
                label="ระยะเวลาในการประเมินปกติ"
                value={formatRange(data?.evaluationPeriod)}
              />
              <GridCell
                label="ตำแหน่งใหม่"
                value={data?.newDesignation || "ไม่ปรับ"}
              />
              <GridCell label="ระดับใหม่" value={data?.newLevel || "ไม่ปรับ"} />
              <div className="h-full border-b border-slate-300 bg-slate-50/50"></div>
              <div className="h-full border-b border-slate-300"></div>

              <GridCell
                label="ระยะเวลาในการประเมิน (ต่อ)"
                value={formatRange(data?.evaluationPeriodContinued)}
              />
              <GridCell label="ฐานเงินเดือนใหม่" value={data?.newSalary} />
              <GridCell label="ตำแหน่ง" value={data?.position || "Staff"} />
              <GridCell
                label="ค่าตอบแทนพิเศษ"
                value={data?.specialCompensation ?? 0}
              />
            </div>

            {/* ตารางประเมินผลงาน 3 ส่วน */}
            <div className="space-y-4 flex-1">
              <EvaluationTable
                title="Company Common Ground"
                items={data?.companyItems}
                total={data?.companyScore}
              />
              <EvaluationTable
                title="Department Common Ground"
                items={data?.departmentItems}
                total={data?.departmentScore}
              />
              <EvaluationTable
                title="Expectation"
                items={data?.expectationItems}
                total={data?.expectationScore}
                isEmerald
              />
            </div>

            {/* การ์ดสรุปคะแนน (UI สีน้ำเงินตามรูปต้นฉบับ) */}
            <div className="grid grid-cols-2 gap-3 mt-4 print:mt-2">
              {/* การ์ดฝั่งซ้าย: สรุปคะแนน */}
              <div className="rounded-lg border border-blue-200 bg-white overflow-hidden shadow-sm h-fit">
                <div className="bg-blue-600 px-2.5 py-1 text-white font-bold text-[10px] uppercase tracking-wide">
                  สรุปคะแนน
                </div>
                <div className="p-2 space-y-1 text-[10px] text-slate-600">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-0.5">
                    <span>คะแนนประเมินผลงาน</span>
                    <span className="font-bold text-blue-700">
                      {data?.totalScore ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-0.5">
                    <span>คะแนนเต็ม</span>
                    <span className="font-bold text-slate-800">
                      {data?.maxScore ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="font-bold text-slate-800 uppercase text-[9px]">
                      คิดเป็นเปอร์เซ็นต์
                    </span>
                    <span className="font-black text-blue-700 leading-none">
                      {data?.maxScore
                        ? Math.round(
                            (Number(data?.totalScore) /
                              Number(data?.maxScore)) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* การ์ดฝั่งขวา: ความคาดหวัง (บีบแถวให้เตี้ยลง) */}
              <div className="rounded-lg border border-blue-200 bg-white overflow-hidden shadow-sm h-fit">
                <div className="bg-blue-600 px-2.5 py-1 text-white font-bold text-[10px] uppercase tracking-wide text-center">
                  เกณฑ์ความคาดหวัง
                </div>
                <div className="p-1 px-1.5 space-y-0">
                  {/* ใช้ MiniGradeRow แต่ลดขนาดและระยะห่าง */}
                  <MiniGradeRow
                    label="Probation"
                    value="B : 75-84 (ดี)"
                    color="text-blue-600"
                  />
                  <MiniGradeRow
                    label="Performance"
                    value="A : 85-100 (ดีมาก)"
                    color="text-emerald-600"
                  />
                  <MiniGradeRow
                    label="Promotion"
                    value="A : 75-84 (ดี)"
                    color="text-blue-600"
                  />
                  <MiniGradeRow
                    label="Progression"
                    value="A : 75-84 (ดี)"
                    color="text-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* ข้อคิดเห็น */}
            <div className="mt-5 border border-slate-300 rounded-xl p-3 bg-slate-50/20">
              <p className="text-[10px] font-bold text-slate-800 mb-1.5 border-b border-slate-200 pb-1">
                ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน:
              </p>
              <div className="min-h-[50px] text-[11px] text-slate-600 leading-relaxed italic">
                {data?.summaryData?.additionalComment ||
                  data?.managerComment ||
                  "-"}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-10">
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 flex items-center justify-center text-slate-400 text-xs italic mb-2">
                  {data?.summaryData?.evaluatorSignature ||
                    "......................................................................"}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  ลงชื่อผู้ประเมิน
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">
                  วันที่ {data?.summaryData?.evaluatorSignDate}
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 flex items-center justify-center text-slate-400 text-xs italic mb-2">
                  {data?.summaryData?.employeeSignature ||
                    "......................................................................"}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  พนักงานรับทราบ
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">
                  วันที่ {data?.summaryData?.employeeSignDate}
                </p>
              </div>
            </div>
          </div>

          {/* ==================== หน้าที่ 2 ==================== */}
          <div className="print-area bg-white w-full max-w-none mx-auto p-6 shadow-2xl border border-slate-300 relative flex flex-col text-slate-800">
            <header className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-xl font-black text-slate-900">
                แบบประเมิน ROAD MAP (หน้าที่ 2)
              </h1>
            </header>
            <div className="border border-slate-300 rounded overflow-hidden mb-3 shadow-sm print:mb-2">
              {/* ส่วนหัวตาราง บีบให้เตี้ยลง */}
              <div className="bg-emerald-700 text-white text-[9px] font-bold py-1 px-3 uppercase tracking-widest">
                ข้อมูลสาย / Late Data (รายเดือน)
              </div>

              {/* ส่วนเนื้อหา บีบ Padding และระยะห่างบรรทัด */}
              <div className="p-2 px-3 bg-white space-y-0.5 text-[10px] text-slate-700">
                {/* ข้อมูลสายปกติ */}
                {(disciplineData?.lateNormal ?? []).map(
                  (m: any, index: number) => (
                    <div
                      key={`lateNormal-${index}`}
                      className="flex items-center justify-between border-b border-slate-50 pb-0.5 last:border-0 leading-tight"
                    >
                      <span className="font-bold text-emerald-800 w-20">
                        เดือนที่ {index + 1} :
                      </span>
                      <div className="flex-1 text-right">
                        <span className="font-semibold text-slate-900">
                          {m.count || 0}
                        </span>{" "}
                        ครั้ง
                        <span className="mx-2 text-slate-300">|</span>
                        รวม{" "}
                        <span className="font-semibold text-slate-900">
                          {m.minutes || 0}
                        </span>{" "}
                        นาที
                      </div>
                    </div>
                  ),
                )}

                {/* ระยะห่างระหว่างช่วง บีบจาก h-2 เหลือ h-1 */}
                {(disciplineData?.lateExtended ?? []).length > 0 && (
                  <div className="h-1" />
                )}

                {/* ข้อมูลสายช่วงต่อโปร */}
                {(disciplineData?.lateExtended ?? []).map(
                  (m: any, index: number) => (
                    <div
                      key={`lateExtended-${index}`}
                      className="flex items-center justify-between border-b border-emerald-50 pb-0.5 last:border-0 bg-emerald-50/20 -mx-3 px-3 leading-tight"
                    >
                      <span className="font-bold text-emerald-900 w-32">
                        ช่วงต่อโปร เดือนที่ {index + 1} :
                      </span>
                      <div className="flex-1 text-right text-[9.5px]">
                        <span className="font-semibold text-slate-900">
                          {m.count || 0}
                        </span>{" "}
                        ครั้ง
                        <span className="mx-2 text-slate-300">|</span>
                        รวม{" "}
                        <span className="font-semibold text-slate-900">
                          {m.minutes || 0}
                        </span>{" "}
                        นาที
                      </div>
                    </div>
                  ),
                )}

                {/* กรณีไม่มีข้อมูล */}
                {!disciplineData?.lateNormal?.length &&
                  !disciplineData?.lateExtended?.length && (
                    <div className="text-center py-1 italic text-slate-400 text-[9px]">
                      ไม่มีประวัติการมาสายในช่วงเวลานี้
                    </div>
                  )}
              </div>
            </div>

            {/* ตารางระเบียบวินัย */}
            <section className="flex-1">
              <table className="w-full text-[9px] border-collapse border border-slate-300">
                {/* ลดฟอนต์ตารางเหลือ 9px */}
                <thead>
                  <tr className="bg-emerald-700 text-white font-bold uppercase text-[8.5px]">
                    {/* หัวตารางเล็กลง */}
                    <th className="py-1 px-2 text-left w-[60%] border border-emerald-800">
                      การลงโทษ / Discipline
                    </th>
                    <th className="p-1 border border-emerald-800 text-center w-[12%]">
                      จำนวน
                    </th>
                    <th className="p-1 border border-emerald-800 text-center w-[12%]">
                      หัก
                    </th>
                    <th className="p-1 border border-emerald-800 text-center w-[16%]">
                      รวมหัก
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(disciplineData?.disciplineItems ?? []).map(
                    (item: any, i: number) => {
                      const standardLabels = [
                        { name: "ว.91", unit: "ครั้ง" },
                        { name: "ว.92", unit: "ครั้ง" },
                        { name: "ว.93", unit: "ครั้ง" },
                        { name: "ว.94", unit: "ครั้ง" },
                        { name: "Warning 1", unit: "ฉบับ" },
                        { name: "Warning 2", unit: "ฉบับ" },
                        { name: "Last Warning", unit: "ฉบับ" },
                        { name: "ลาป่วย / ลากิจ", unit: "วัน" },
                      ];

                      const label = standardLabels[i] || {
                        name: "ระเบียบวินัย",
                        unit: "",
                      };
                      const count = item.count || 0;
                      const penalty = item.penaltyScore || 0;
                      const totalDeducted = Number(count) * Number(penalty);

                      return (
                        <tr key={i} className="hover:bg-slate-50 leading-tight">
                          {/* บีบบรรทัดให้ชิดขึ้น */}
                          <td className="py-1 px-2 border-x border-slate-200">
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-slate-800 min-w-[70px]">
                                {label.name}
                              </span>
                              <span className="text-slate-400 text-[8px]">
                                {count} {label.unit}
                              </span>
                              <span className="text-slate-400 font-normal text-[8px] truncate max-w-[150px]">
                                หัวข้อ: {item.detail || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="p-1 text-center border-r border-slate-200 font-medium text-slate-700">
                            {count}
                          </td>
                          <td className="p-1 text-center text-rose-500 font-bold border-r border-slate-200">
                            {penalty !== 0 ? `-${penalty}` : 0}
                          </td>
                          <td className="p-1 text-center font-black border-r border-slate-200 bg-slate-50/30 text-slate-900">
                            {totalDeducted !== 0 ? totalDeducted : 0}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border border-slate-300">
                  <tr className="leading-none">
                    <td
                      colSpan={3}
                      className="py-1 px-3 text-left uppercase text-[8px] text-slate-500 tracking-wider"
                    >
                      รวมคะแนนระเบียบวินัยที่ถูกหักสุทธิ
                    </td>
                    <td className="py-1 text-center text-rose-600 text-[11px] bg-white border-l border-slate-300 font-black">
                      {totalDisciplineScore}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* คะแนนระเบียบวินัย Card */}
              <div className="grid grid-cols-2 gap-3 mt-3 print:mt-2">
                {/* การ์ดฝั่งซ้าย: สรุปคะแนนระเบียบวินัย */}
                <div className="rounded-lg border border-blue-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-blue-600 px-2.5 py-1 text-white font-bold text-[10px] uppercase tracking-wide">
                    สรุปคะแนนวินัย
                  </div>
                  <div className="p-2 px-3 flex-1 flex flex-col justify-between text-[10px] text-slate-600">
                    <div className="space-y-1">
                      <div className="flex justify-between border-b border-slate-50 pb-0.5">
                        <span>คะแนนเต็มพื้นฐาน</span>
                        <span className="font-bold text-slate-800">100</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-0.5">
                        <span>คะแนนที่ถูกหัก</span>
                        <span className="font-bold text-rose-600">
                          {totalDisciplineScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1 mt-auto">
                      <span className="font-bold text-slate-800 uppercase text-[9px]">
                        คงเหลือสุทธิ
                      </span>
                      <span className="font-black text-blue-700 leading-none">
                        {100 + totalDisciplineScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* การ์ดฝั่งขวา: เกณฑ์การวัดผล / เกรด */}
                <div className="rounded-lg border border-blue-200 bg-white shadow-sm overflow-hidden h-full">
                  <div className="bg-blue-600 px-2.5 py-1 text-white font-bold text-[10px] uppercase tracking-wide text-center">
                    เกณฑ์การวัดผล / เกรด
                  </div>
                  <div className="p-1 space-y-0">
                    <MiniGradeRow
                      label="Performance"
                      value="A : 51 - 100 (ดีมาก)"
                      color="text-emerald-600"
                    />
                    <MiniGradeRow
                      label="Promotion | Progression"
                      value="B : 21 - 50 (ดี)"
                      color="text-blue-600"
                    />
                    <MiniGradeRow
                      label="Probation"
                      value="C : 1 - 20 (พอใช้)"
                      color="text-amber-600"
                    />
                    <MiniGradeRow
                      label="ไม่ผ่านเกณฑ์"
                      value="D : 0 (ต่ำมาตรฐาน)"
                      color="text-rose-600"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ข้อคิดเห็น */}
            <div className="mt-5 border border-slate-300 rounded-xl p-3 bg-slate-50/20">
              <p className="text-[10px] font-bold text-slate-800 mb-1.5 border-b border-slate-200 pb-1">
                ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน:
              </p>
              <div className="min-h-[50px] text-[11px] text-slate-600 leading-relaxed italic">
                {data?.disciplineData?.comment || "-"}
              </div>
            </div>

            {/* ลายเซ็น หน้า 2 */}
            <div className="mt-auto grid grid-cols-2 gap-10">
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 flex items-center justify-center text-slate-400 text-xs italic mb-2">
                  {data?.disciplineData?.evaluatorSignature ||
                    "......................................................................"}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  ลงชื่อผู้ประเมิน
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">
                  วันที่{" "}
                  {data?.disciplineData?.evaluatorSignDate ||
                    "........../........../..........."}
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 flex items-center justify-center text-slate-400 text-xs italic mb-2">
                  {data?.disciplineData?.employeeSignature ||
                    "......................................................................"}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  พนักงานรับทราบ
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">
                  วันที่{" "}
                  {data?.disciplineData?.employeeSignDate ||
                    "........../........../..........."}
                </p>
              </div>
            </div>
            {/* 🌟 ตารางหลักเกณฑ์การคิดคะแนน (ต่อท้ายลายเซ็น หน้า 2) 🌟 */}
            <div className="mt-8">
              <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-800">
                  หลักเกณฑ์ในการคิดคะแนนสำหรับข้อมูลระเบียบวินัย
                </p>
                <p className="text-[9px] text-slate-500">
                  คะแนนเต็มด้านวินัยในการทำงานมี 100 คะแนน
                  พนักงานจะถูกหักคะแนนตามบทลงโทษที่ได้รับตามรายละเอียด ดังนี้
                </p>
              </div>

              <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
                {/* Header แถบสีเขียวเข้ม */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-tighter">
                  <div className="p-2 border-r border-emerald-800">
                    1. การประเมินข้อมูลสาย ดังนี้
                  </div>
                  <div className="p-2 col-span-2 text-center uppercase tracking-widest">
                    การลงโทษ / Discipline มีเงื่อนไขในการหักคะแนนดังนี้
                  </div>
                </div>

                {/* Body ตาราง */}
                <div className="text-[9px] text-slate-600 bg-white leading-tight">
                  {/* Row 1 */}
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-slate-200">
                    <div className="p-1.5 px-3 border-r border-slate-200 bg-slate-50/30">
                      1.1 สาย 31 - 60 นาที ได้รับบทลงโทษ ว.91
                    </div>
                    <div className="p-1.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800">ว.91</span> :
                      หัก ครั้งละ 5 คะแนน
                    </div>
                    <div className="p-1.5 px-3">
                      <span className="font-bold text-slate-800">
                        Warning 1
                      </span>{" "}
                      : หัก ฉบับละ 25 คะแนน
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-slate-200">
                    <div className="p-1.5 px-3 border-r border-slate-200 bg-slate-50/30">
                      1.2 สาย 61 - 90 นาที ได้รับบทลงโทษ ว.92
                    </div>
                    <div className="p-1.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800">ว.92</span> :
                      หัก ครั้งละ 10 คะแนน
                    </div>
                    <div className="p-1.5 px-3">
                      <span className="font-bold text-slate-800">
                        Warning 2
                      </span>{" "}
                      : หัก ฉบับละ 50 คะแนน
                    </div>
                  </div>
                  {/* Row 3 */}
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-slate-200">
                    <div className="p-1.5 px-3 border-r border-slate-200 bg-slate-50/30">
                      1.3 สาย 91 - 100 นาที ได้รับบทลงโทษ ว.93
                    </div>
                    <div className="p-1.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800">ว.93</span> :
                      หัก ครั้งละ 15 คะแนน
                    </div>
                    <div className="p-1.5 px-3">
                      <span className="font-bold text-slate-800">
                        Last Warning
                      </span>{" "}
                      : หัก ฉบับละ 100 คะแนน
                    </div>
                  </div>
                  {/* Row 4 */}
                  <div className="grid grid-cols-[1.2fr_1fr_1fr]">
                    <div className="p-1.5 px-3 border-r border-slate-200 bg-slate-50/30">
                      1.4 สาย 101 นาทีขึ้นไป ได้รับบทลงโทษ Warning 1
                    </div>
                    <div className="p-1.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800">ว.94</span> :
                      หัก ครั้งละ 100 คะแนน
                    </div>
                    <div className="p-1.5 px-3">
                      <span className="font-bold text-slate-800">
                        ลาป่วย / ลากิจ
                      </span>{" "}
                      : หัก วันละ 1 คะแนน
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="mt-4 border-t border-slate-100 pt-3 text-[8px] text-slate-400 text-center uppercase tracking-widest">
              Road Map Evaluation System
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Sub-Components --- */

function InfoCell({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-slate-500 mb-0.5 whitespace-nowrap">
        {label}:
      </span>
      <span className="text-slate-800 font-bold leading-tight">
        {value || "-"}
      </span>
    </div>
  );
}

function GridCell({ label, value }: any) {
  return (
    <>
      <div className="p-2 font-bold text-slate-700 border-b border-slate-300 bg-slate-50/50 whitespace-nowrap">
        {label}:
      </div>
      <div className="p-2 text-slate-600 border-b border-slate-300 whitespace-nowrap font-medium text-center">
        {value || "-"}
      </div>
    </>
  );
}

function EvaluationTable({ title, items, total, isEmerald = false }: any) {
  return (
    <section className="mb-2 last:mb-0">
      {/* ส่วนหัวตารางที่รวมหัวข้อคอลัมน์ไว้ในแถวเดียว (สีขาวทั้งหมด) */}
      <div
        className={`border-x border-t border-slate-300 flex items-center rounded-t text-white overflow-hidden ${
          isEmerald ? "bg-emerald-700" : "bg-slate-800"
        }`}
      >
        {/* หัวข้อหลักฝั่งซ้าย (65%) */}
        <div className="w-[65%] px-3 py-1.5">
          <h4 className="text-[9px] font-bold uppercase tracking-widest">
            {title}
          </h4>
        </div>

        {/* หัวข้อคอลัมน์ฝั่งขวา (แบ่งตามสัดส่วนตาราง) */}
        <div className="w-[10%] text-center text-[8px] font-bold border-l border-white/20 py-1.5 uppercase">
          น้ำหนัก
        </div>
        <div className="w-[10%] text-center text-[8px] font-bold border-l border-white/20 py-1.5 uppercase">
          ผลประเมิน
        </div>
        <div className="w-[15%] text-center text-[8px] font-bold border-l border-white/20 py-1.5 uppercase">
          หมายเหตุ
        </div>
      </div>

      <table className="w-full text-[9px] border-collapse border border-slate-300">
        {/* เอา thead ออกแล้ว เพราะย้ายขึ้นไปข้างบน */}
        <tbody className="divide-y divide-slate-200">
          {items?.map((item: any, i: number) => (
            <tr key={i} className="hover:bg-slate-50 leading-tight">
              <td className="p-1.5 px-2 w-[65%] font-medium text-slate-700 border-r border-slate-100">
                {item.topic}
              </td>
              <td className="p-1 w-[10%] text-center text-slate-400 border-r border-slate-100">
                {item.weight}
              </td>
              <td className="p-1 w-[10%] text-center font-bold text-slate-900 border-r border-slate-100">
                {item.score}
              </td>
              <td className="p-1 w-[15%] text-[8px] text-slate-400 italic leading-none px-2">
                {item.remark || "-"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50/80 font-bold border-t border-slate-300">
          <tr className="leading-none">
            <td
              colSpan={2}
              className="py-1 px-2 text-right uppercase text-[8px] text-slate-500 tracking-tighter"
            >
              Total Score
            </td>
            <td className="py-1 text-center text-blue-700 font-black text-[11px]">
              {total}
            </td>
            <td className="w-[15%]"></td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function MiniGradeRow({ label, value, color }: any) {
  return (
    <div className="flex justify-between px-2 py-1 text-[10px] border-b border-slate-50 last:border-0">
      <span className="font-medium text-slate-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
