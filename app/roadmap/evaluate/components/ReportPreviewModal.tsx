interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // รับข้อมูลจริงจากแบบฟอร์มหลักมาแสดงผล
}

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

  console.log("preview data", data);

  const splitRange = (value?: string) => {
    const [start = "", end = ""] = (value || "").split(" - ");
    return { start, end };
  };

  const formatRange = (value?: string) => {
    const [start = "", end = ""] = (value || "").split(" - ");
    return [start, end].filter(Boolean).join(" - ") || "-";
  };

  const sumWeights = (items?: any[]) =>
    (items ?? []).reduce((sum, item) => sum + Number(item.weight || 0), 0);

  const evaluationPeriod = splitRange(data?.evaluationPeriod);
  const evaluationPeriodContinued = splitRange(data?.evaluationPeriodContinued);

  // คอมโพเนนต์ย่อยสำหรับแสดงข้อมูลพนักงานส่วนหัว (แชร์ร่วมกันทั้งหน้า 1 และ 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* กล่อง Pop-up ใหญ่คลุมห้อง Preview */}
      <div className="bg-slate-100 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* แถบเมนูด้านบน */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-bold text-slate-800 text-base">
              รายงานจำลองก่อนพิมพ์ (Report Preview)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* พื้นที่แสดงแผ่นเอกสารจำลองกระดาษ A4 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-500/20 shadow-inner">
          {/* ==================== แผ่นกระดาษหน้าที่ 1 ==================== */}
          <div className="bg-white max-w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md border border-slate-300/60 space-y-5 print:shadow-none print:border-none">
            {/* 🌟 จุดที่แก้ไข: วางแผงข้อมูลพนักงานของหน้าที่ 1 แทนที่ <EmployeeHeader /> เดิม */}
            <div className="border border-slate-400 text-xs p-3 space-y-2 bg-white text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
                <span className="font-bold text-sm tracking-wide">
                  แบบประเมิน ROAD MAP (หน้าที่ 1)
                </span>
                <div className="flex gap-4 font-medium text-[11px]">
                  <span>
                    การประเมินครั้งที่: <span className="underline">1</span>
                  </span>
                  <span>
                    ประจำเดือน:{" "}
                    <span className="underline">
                      {data?.submittedMonth || "-"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
                <div>
                  <span className="font-semibold text-slate-500">
                    รหัสพนักงาน:
                  </span>{" "}
                  {data?.employeeCode || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Name:</span>{" "}
                  {data?.employeeName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Type:</span>{" "}
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.14em] ${labelStyles[data?.evaluationType || "Probation"] || "bg-slate-100 text-slate-700"}`}
                  >
                    {data?.evaluationType || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Nickname:
                  </span>{" "}
                  {data?.nickname || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Position:
                  </span>{" "}
                  {data?.position || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Department:
                  </span>{" "}
                  {data?.department || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Division:
                  </span>{" "}
                  {data?.division || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Level:</span>{" "}
                  {data?.level || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Start Date:
                  </span>{" "}
                  {data?.startDate || "-"}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-300 text-[11px] mt-4 grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-center">
              {/* แถวที่ 1 - 3 รายการแรก (ทำให้จบใน 8 คอลัมน์) */}
              <div className="p-2 font-bold text-slate-700 border-b border-slate-300 bg-slate-50/50 whitespace-nowrap">
                ระยะเวลาในการประเมินปกติ:
              </div>
              <div className="p-2 text-slate-600 border-b border-slate-300 whitespace-nowrap">
                {formatRange(data?.evaluationPeriod)}
              </div>
              <div className="p-2 font-bold text-slate-700 border-b border-slate-300 bg-slate-50/50 whitespace-nowrap">
                ตำแหน่งใหม่:
              </div>
              <div className="p-2 text-slate-600 border-b border-slate-300 whitespace-nowrap">
                {data?.newDesignation || "ไม่ปรับ"}
              </div>
              <div className="p-2 font-bold text-slate-700 border-b border-slate-300 bg-slate-50/50 whitespace-nowrap">
                ระดับใหม่:
              </div>
              <div className="p-2 text-slate-600 border-b border-slate-300 whitespace-nowrap">
                {data?.newLevel || "ไม่ปรับ"}
              </div>
              {/* ช่องว่างเติมเต็มเพื่อให้เส้นขอบตรงกัน */}
              <div className="h-full border-b border-slate-300 bg-slate-50/50"></div>
              <div className="h-full border-b border-slate-300"></div>

              {/* แถวที่ 2 - 4 รายการหลัง */}
              <div className="p-2 font-bold text-slate-700 bg-slate-50/50 whitespace-nowrap">
                ระยะเวลาในการประเมิน (ต่อ):
              </div>
              <div className="p-2 text-slate-600 whitespace-nowrap">
                {formatRange(data?.evaluationPeriodContinued) || "-"}
              </div>
              <div className="p-2 font-bold text-slate-700 bg-slate-50/50 whitespace-nowrap">
                ฐานเงินเดือนใหม่:
              </div>
              <div className="p-2 text-slate-600 whitespace-nowrap">
                {data?.newSalary || "-"}
              </div>
              <div className="p-2 font-bold text-slate-700 bg-slate-50/50 whitespace-nowrap">
                ตำแหน่ง:
              </div>
              <div className="p-2 text-slate-600 whitespace-nowrap">
                {data?.position || "Staff"}
              </div>
              <div className="p-2 font-bold text-slate-700 bg-slate-50/50 whitespace-nowrap">
                ค่าตอบแทนพิเศษ:
              </div>
              <div className="p-2 text-slate-600 whitespace-nowrap">
                {data?.specialCompensation ?? 0}
              </div>
            </div>

            {/* ตารางส่วนที่ 1: Company Common Ground */}
            <div className="border border-slate-400 text-xs">
              <div className="grid grid-cols-[1fr_80px_100px_150px] bg-slate-900 text-white font-bold p-2 text-center border-b border-slate-400">
                <div className="text-left">หัวข้อการประเมิน</div>
                <div>น้ำหนัก</div>
                <div>ผลการประเมิน</div>
                <div>หมายเหตุ</div>
              </div>
              <div className="p-2 bg-slate-100 font-bold border-b border-slate-400 text-slate-700">
                Company Common Ground
              </div>
              {data?.companyItems?.map((item: any, idx: number) => (
                <div
                  key={item.id || `company-${idx}`}
                  className="grid grid-cols-[1fr_80px_100px_150px] p-2 border-b border-slate-300 text-center items-center text-slate-600"
                >
                  <div className="text-left font-medium">{item.topic}</div>
                  <div>{item.weight}</div>
                  <div className="font-semibold text-slate-800">
                    {item.score}
                  </div>
                  <div>{item.remark || ""}</div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_80px_100px_150px] bg-slate-50 font-bold p-2 text-center border-t border-slate-400 text-slate-800">
                <div className="text-left">รวมคะแนน</div>
                <div>{sumWeights(data?.companyItems)}</div>
                <div className="text-blue-600 text-sm">
                  {data?.companyScore}
                </div>
              </div>
            </div>

            {/* ตารางส่วนที่ 2: Department Common Ground */}
            <div className="border border-slate-400 text-xs mt-4">
              <div className="p-2 bg-slate-100 font-bold border-b border-slate-400 text-slate-700">
                Department Common Ground
              </div>
              {data?.departmentItems?.map((item: any, idx: number) => (
                <div
                  key={item.id || `department-${idx}`}
                  className="grid grid-cols-[1fr_80px_100px_150px] p-2 border-b border-slate-300 text-center items-center text-slate-600"
                >
                  <div className="text-left font-medium">{item.topic}</div>
                  <div>{item.weight}</div>
                  <div className="font-semibold text-slate-800">
                    {item.score}
                  </div>
                  <div>{item.remark || ""}</div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_80px_100px_150px] bg-slate-50 font-bold p-2 text-center border-t border-slate-400 text-slate-800">
                <div className="text-left">รวมคะแนน</div>
                <div>{sumWeights(data?.departmentItems)}</div>
                <div className="text-blue-600 text-sm">
                  {data?.departmentScore}
                </div>
                <div></div>
              </div>
            </div>
            {/* ตารางส่วนที่ 3: Expectation */}
            <div className="border border-slate-400 text-xs mt-4">
              <div className="p-2 bg-emerald-700 text-white font-bold border-b border-slate-400 text-center">
                Expectation
              </div>
              {data?.expectationItems?.map((item: any, idx: number) => (
                <div
                  key={item.id || `expectation-${idx}`}
                  className="grid grid-cols-[1fr_80px_100px_150px] p-2 border-b border-slate-300 text-center items-center text-slate-600"
                >
                  <div className="text-left font-medium">{item.topic}</div>
                  <div>{item.weight}</div>
                  <div className="font-semibold text-slate-800">
                    {item.score}
                  </div>
                  <div>{item.remark || ""}</div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_80px_100px_150px] bg-slate-50 font-bold p-2 text-center border-t border-slate-400 text-slate-800">
                <div className="text-left">รวมคะแนน</div>
                <div>{sumWeights(data?.expectationItems)}</div>
                <div className="text-blue-600 text-sm">
                  {data?.expectationScore}
                </div>
                <div></div>
              </div>
            </div>
            <div className="text-xs mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-blue-200 bg-white p-4">
                  <div className="bg-blue-600 px-3 py-2 text-white font-semibold text-sm">
                    สรุปคะแนน
                  </div>
                  <div className="space-y-2 p-3 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>คะแนนประเมินผลงาน</span>
                      <span className="font-semibold text-blue-600">
                        {data?.totalScore ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>คะแนนเต็ม</span>
                      <span className="font-semibold text-blue-600">
                        {data?.maxScore ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>คิดเป็นเปอร์เซ็นต์</span>
                      <span className="font-semibold text-blue-600">
                        {data?.maxScore
                          ? `${Math.round(
                              (Number(data?.totalScore ?? 0) /
                                Number(data?.maxScore ?? 1)) *
                                100,
                            )}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-white p-4">
                  <div className="bg-blue-600 px-3 py-2 text-white font-semibold text-sm">
                    ความคาดหวัง
                  </div>
                  <div className="divide-y divide-slate-100 text-sm">
                    {[
                      ["Probation", "B : 75 - 84 (ดี)", "text-blue-600"],
                      [
                        "Performance",
                        "A : 85 - 100 (ดีมาก)",
                        "text-emerald-600",
                      ],
                      ["Promotion", "B : 75 - 84 (ดี)", "text-blue-600"],
                      ["Progression", "B : 75 - 84 (ดี)", "text-blue-600"],
                    ].map(([label, value, color]) => (
                      <div
                        key={label}
                        className="flex justify-between px-3 py-2"
                      >
                        <span className="font-medium text-slate-700">
                          {label}
                        </span>
                        <span className={`font-semibold ${color}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อคิดเห็นจากผู้ประเมิน */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm mt-4">
              <div className="font-semibold text-slate-800 mb-3">
                ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน
              </div>

              <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-white p-4 text-slate-800">
                {data?.summaryData?.additionalComment ||
                  data?.managerComment ||
                  "-"}
              </div>
            </div>

            {/* เซ็นชื่อผู้ประเมินและพนักงานรับทราบ */}
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              {[
                {
                  title: "ลงชื่อผู้ประเมิน",
                  value: data?.summaryData?.evaluatorSignature || "",
                  date: data?.summaryData?.evaluatorSignDate || "",
                },
                {
                  title: "พนักงานรับทราบ",
                  value: data?.summaryData?.employeeSignature || "",
                  date: data?.summaryData?.employeeSignDate || "",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                >
                  <div className="text-sm font-semibold text-slate-900 mb-2">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    (ชื่อ-นามสกุล หรือเว้นว่างเพื่อเซ็น)
                  </div>
                  <div className="min-h-[42px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-700">
                    {item.value || "________________________"}
                  </div>
                  <div className="mt-4 text-xs text-slate-500 text-center">
                    วันที่
                  </div>
                  <div className="mx-auto w-[120px] text-center text-sm text-slate-700">
                    {item.date || "__________"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== แผ่นกระดาษหน้าที่ 2 ==================== */}
          <div className="bg-white max-w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md border border-slate-300/60 space-y-5 print:shadow-none print:border-none print:break-before-page">
            {/* 🌟 จุดที่แก้ไข: วางแผงข้อมูลพนักงานของหน้าที่ 2 แทนที่ <EmployeeHeader /> เดิม */}
            <div className="border border-slate-400 text-xs p-3 space-y-2 bg-white text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
                <span className="font-bold text-sm tracking-wide">
                  แบบประเมิน ROAD MAP (หน้าที่ 2)
                </span>
                <div className="flex gap-4 font-medium text-[11px]">
                  <span>
                    การประเมินครั้งที่: <span className="underline">1</span>
                  </span>
                  <span>
                    ประจำเดือน:{" "}
                    <span className="underline">
                      {data?.submittedMonth || "-"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
                <div>
                  <span className="font-semibold text-slate-500">ID:</span>{" "}
                  {data?.id || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Name:</span>{" "}
                  {data?.employeeName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Position:
                  </span>{" "}
                  {data?.position || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Department:
                  </span>{" "}
                  {data?.department || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Division:
                  </span>{" "}
                  {data?.division || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Level:</span>{" "}
                  {data?.level || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Start Date:
                  </span>{" "}
                  {data?.startDate || "-"}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white text-xs font-bold p-1.5 px-3">
              ข้อมูลระเบียบวินัยในการทำงาน
            </div>

            {/* ส่วนข้อมูล Late Data */}
            <div className="border border-slate-300 bg-emerald-50/20 text-xs rounded p-3 space-y-1 text-slate-600">
              <div className="font-bold text-emerald-800 border-b border-emerald-100 pb-1 mb-1">
                ข้อมูลสาย / Late Data
              </div>
              <div>เดือนที่ 1 : - ครั้ง รวม - นาที</div>
              <div>เดือนที่ 2 : - ครั้ง รวม - นาที</div>
              <div>เดือนที่ 3 : - ครั้ง รวม - นาที</div>
              <div className="text-amber-700">
                ช่วงต่อโปร เดือนที่ 1 : - ครั้ง รวม - นาที
              </div>
              <div className="text-amber-700">
                ช่วงต่อโปร เดือนที่ 2 : - ครั้ง รวม - นาที
              </div>
            </div>

            {/* ตารางระเบียบวินัย Discipline */}
            <div className="border border-slate-400 text-xs mt-4">
              <div className="grid grid-cols-[1fr_100px_90px_100px] bg-emerald-700 text-white font-bold p-2 text-center">
                <div className="text-left">การลงโทษ / Discipline</div>
                <div>จำนวนครั้ง</div>
                <div>หักคะแนน</div>
                <div>คะแนนที่หัก</div>
              </div>
              {[
                { title: "ว.91 : - ครั้ง หัวข้อ : -", score: "-5" },
                { title: "ว.92 : - ครั้ง หัวข้อ : -", score: "-10" },
                { title: "Warning 1 : 1 ฉบับ หัวข้อ : -", score: "-25" },
                { title: "Last Warning : 1 ฉบับ หัวข้อ : -", score: "-100" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_100px_90px_100px] p-2 border-b border-slate-300 text-center text-slate-600 items-center"
                >
                  <div className="text-left font-light">{item.title}</div>
                  <div>-</div>
                  <div className="text-rose-500 font-medium">{item.score}</div>
                  <div className="font-semibold">0</div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_100px_90px_100px] bg-emerald-50 font-bold p-2 text-center text-emerald-900 border-t border-slate-400">
                <div className="text-center">รวมคะแนนระเบียบวินัย</div>
                <div className="text-right pr-4 text-emerald-700">0</div>
              </div>
            </div>

            {/* ส่วนท้ายช่องเซ็นลายเซ็น */}
            <div className="grid grid-cols-2 gap-6 pt-10 text-xs text-slate-500">
              <div className="border border-slate-300 p-4 rounded text-center space-y-6 pt-8 bg-slate-50/50">
                <div>
                  ลงชื่อผู้ประเมิน......................................................
                </div>
                <div>วันที่........../........../..........</div>
              </div>
              <div className="border border-slate-300 p-4 rounded text-center space-y-6 pt-8 bg-slate-50/50">
                <div>
                  พนักงานรับทราบ......................................................
                </div>
                <div>วันที่........../........../..........</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
