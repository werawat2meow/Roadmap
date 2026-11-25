"use client";

import { Printer, X } from "lucide-react";

type Props = { isOpen: boolean; onClose: () => void; data: any };

const questions = [
  {
    th: "ปัจจุบันท่านมีการทำงาน หรือประกอบอาชีพอื่นนอกงานประจำหรือไม่",
    en: "Are you currently engaged in any other employment or occupation outside of your primary role?",
  },
  {
    th: "ปัจจุบันท่านเป็นเจ้าของกิจการงานส่วนตัวหรือไม่",
    en: "Are you currently a business owner or partner in any other business entity?",
  },
  {
    th: "ปัจจุบันท่านดำรงตำแหน่งกรรมการบริษัท หรือผู้บริหารในกิจการอื่นหรือไม่",
    en: "Do you currently own or operate a private business enterprise?",
  },
  {
    th: "ปัจจุบันท่านถือหุ้นในบริษัท หรือเป็นหุ้นส่วนในกิจการหรือไม่",
    en: "Do you currently hold equity/shares or serve as a partner in any business entity?",
  },
];

export default function OutsideFormPreviewModal({ isOpen, onClose, data }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:block print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; }
          body * { visibility: hidden; }
          .outside-print-area, .outside-print-area * { visibility: visible !important; }
          .outside-shell { position: absolute !important; inset: 0 !important; display: block !important; width: 100% !important; max-width: none !important; height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; }
          .outside-print-area { display: block !important; width: 100% !important; height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; box-sizing: border-box !important; padding: 4mm !important; font-size: 8.5px !important; line-height: 1.05 !important; color: #000 !important; background: #fff !important; page-break-after: avoid !important; break-after: avoid !important; }
          .outside-print-area * { color: #000 !important; }
          .outside-print-area .bg-black,
          .outside-print-area .bg-black * { color: #fff !important; background-color: #000 !important; }
          .outside-print-area .border,
          .outside-print-area [class*="border-"] { border-color: #000 !important; }
          .outside-print-area .border-dotted { border-color: #000 !important; }
          .outside-print-area h1 { font-size: 14px !important; }
          .outside-print-area .py-3 { padding-top: 3px !important; padding-bottom: 3px !important; }
          .outside-print-area .p-3 { padding: 3px !important; }
          .outside-print-area .p-5 { padding: 4px !important; }
          .outside-print-area .mt-7 { margin-top: 8px !important; }
          .outside-print-area .min-h-48 { min-height: 120px !important; }
          .outside-print-area .min-h-16 { min-height: 30px !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      ` }} />

      <div className="outside-shell flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        <div className="no-print flex items-center justify-between border-b bg-white px-6 py-4 text-slate-900">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Outside Employment Form Preview</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Print form for employee</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white"><Printer className="h-4 w-4" /> Print PDF</button>
            <button type="button" onClick={onClose} className="rounded-full p-2"><X /></button>
          </div>
        </div>

        <div className="outside-print-area overflow-y-auto bg-white p-8 text-[12px] leading-relaxed text-slate-900">
          <header className="border border-slate-500 text-center">
            <h1 className="py-3 text-xl font-black text-slate-900">Outside Employment History and Secondary Activities Form</h1>
            <p className="border-t border-slate-400 py-2 font-semibold">แบบฟอร์มประวัติการทำงานนอก หรืองานอดิเรก</p>
            <div className="grid grid-cols-2 border-t border-slate-400 p-3 font-bold"><span>ประจำเดือน พฤษภาคม 2569</span><span>แผนกการเงิน</span></div>
          </header>

          <div className="grid grid-cols-4 gap-x-6 gap-y-2 border-x border-b border-slate-500 p-3 text-[11px]">
            <Info label="ID" value={data?.employeeCode} /><Info label="Name" value={data?.employeeName} /><Info label="Nickname" value={data?.nickname} /><Info label="Position" value={data?.position} />
            <Info label="Department" value={data?.department} /><Info label="Division" value={data?.division} /><Info label="Unit" value={data?.unit} /><Info label="ระดับ / Level" value={data?.level} />
            <Info label="Start Date" value={data?.startDate} /><Info label="Employee age" value="" /><Info label="Company" value={data?.company} />
          </div>

          <div className="bg-black px-3 py-3 font-bold text-white"><div>ส่วนที่ 1 ข้อมูลการทำงานและกิจการอื่น</div><div>Section 1: Employment Details and Other Business Commitments</div></div>
          <div className="border-x border-b border-slate-500 px-3">{questions.map((question, index) => <Question key={question.en} number={index + 1} th={question.th} en={question.en} />)}</div>

          <div className="bg-black px-3 py-3 font-bold text-white"><div>ส่วนที่ 2 การอนุญาตให้สามารถทำงานอื่นนอกเวลาได้โดยมีเงื่อนไขนี้</div><div>Section 2: Approval for secondary or outside employment is subject to the following terms and conditions</div></div>
          <div className="min-h-48 border-x border-b border-slate-500 p-5">
            <div className="space-y-6 border-b border-dotted border-slate-500" />
            <div className="mx-auto mt-7 w-full max-w-xl overflow-hidden border border-slate-500 text-center">
              <div className="bg-black py-2 font-bold text-white"><div>อนุญาตให้สามารถทำงานพิเศษได้</div><div>Approval for secondary or outside employment</div></div>
              <div className="grid grid-cols-3 divide-x border-t border-slate-500">
                <ApprovalOption th="อนุมัติ" en="Approved" />
                <ApprovalOption th="รอพิจารณา" en="Pending review" />
                <ApprovalOption th="ไม่อนุมัติ" en="Not approved" />
              </div>
            </div>
            <div className="mx-auto mt-7 w-full max-w-xl border-b border-dotted border-slate-500 pb-8 text-center">ผู้อนุมัติ / Approver<br /><span className="inline-block pt-3">วันที่ / Date ____ / ____ / ______</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: unknown }) { return <div><span className="font-bold">{label}: </span>{String(value || "-")}</div>; }

function Question({ number, th, en }: { number: number; th: string; en: string }) {
  return <div className="border-b border-dotted border-slate-500 py-3"><div className="font-bold">{number}. {th}<div className="font-semibold">{en}</div></div><div className="mt-2 grid grid-cols-2 gap-8"><span>ชื่อกิจการ / บริษัท<br />Company / Business Entity Name: __________________________</span><span>ลักษณะธุรกิจ<br />Nature of Business: __________________________</span><span>ตำแหน่งของท่าน<br />Current Position: __________________________</span><span>เวลาที่ใช้ในการทำงานหรือดูแลกิจการ<br />Time Commitment: __________</span></div><div className="mt-2">ลักษณะการมีส่วนได้เสีย<br />Nature of Interest:</div><div className="grid grid-cols-6 gap-2 text-center"><span>□<br />เจ้าของกิจการ<br />Business Owner</span><span>□<br />หุ้นส่วน<br />Sole Proprietor</span><span>□<br />ผู้ถือหุ้น<br />Partner</span><span>□<br />กรรมการ<br />Shareholder</span><span>□<br />ผู้บริหาร<br />Executive Officer</span><span>□<br />อื่น ๆ<br />Other (Please specify)</span></div></div>;
}

function ApprovalOption({ th, en }: { th: string; en: string }) { return <label className="flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 px-2"><span className="text-xl leading-none">□</span><span className="font-semibold">{th}</span><span className="text-[10px]">{en}</span></label>; }
