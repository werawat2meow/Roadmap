"use client";

interface BranchSummary {
  branch: string;
  count: number;
  totalAmount: number;
}

// เพิ่ม props month และ year เพื่อแสดงในหัวข้อตาราง
interface RecentEvaluationsProps {
  data?: BranchSummary[];
  month?: string;
  year?: string;
}

const MONTH_NAMES_THAI = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export default function RecentEvaluations({
  data,
  month,
  year,
}: RecentEvaluationsProps) {
  // คำนวณยอดรวมท้ายตาราง
  const totalPeople = data?.reduce((sum, item) => sum + item.count, 0) || 0;
  const grandTotal =
    data?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;

  // แปลงเลขปีเป็น พ.ศ. (ถ้าต้องการ)
  const displayYear = year
    ? parseInt(year) > 2500
      ? year
      : (parseInt(year) + 543).toString()
    : "";
  const displayMonth =
    month && month !== "all" ? MONTH_NAMES_THAI[parseInt(month) - 1] : "";
  const titleText =
    month === "all"
      ? `รายการปรับ Road Map ประจำปี ${displayYear}`
      : `รายการปรับ Road Map ประจำเดือน ${displayMonth} ${displayYear}`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
      {/* หัวข้อตารางตามภาพตัวอย่าง */}
      <h3 className="font-bold text-center text-slate-800 mb-6 text-lg leading-tight">
        {titleText}
      </h3>

      <div className="overflow-hidden border border-slate-300 rounded-sm">
        <table className="w-full text-[13px] md:text-sm text-center border-collapse">
          <thead>
            {/* หัวตารางสีเทา ตัวอักษรเข้ม */}
            <tr className="bg-[#f2f2f2] text-slate-800 font-bold border-b border-slate-300">
              <th className="py-2.5 px-4 border-r border-slate-300">สังกัด</th>
              <th className="py-2.5 px-4 border-r border-slate-300">จำนวน</th>
              <th className="py-2.5 px-4">ยอดปรับ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="text-slate-700">
                  <td className="py-2.5 px-4 border-r border-slate-300">
                    {item.branch}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-300">
                    {item.count} คน
                  </td>
                  <td className="py-2.5 px-4 font-medium">
                    {item.totalAmount.toLocaleString()} บาท
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-12 text-slate-400 italic bg-slate-50"
                >
                  ไม่มีข้อมูลการปรับในเดือนนี้
                </td>
              </tr>
            )}
          </tbody>
          {/* แถวสรุปผลรวมด้านล่างสีเทาอ่อน */}
          <tfoot>
            <tr className="bg-[#e6e6e6] font-bold text-slate-900 border-t border-slate-300">
              <td className="py-2.5 px-4 border-r border-slate-300 text-center">
                รวมรายการปรับ
              </td>
              <td className="py-2.5 px-4 border-r border-slate-300">
                {totalPeople} คน
              </td>
              <td className="py-2.5 px-4">{grandTotal.toLocaleString()} บาท</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
