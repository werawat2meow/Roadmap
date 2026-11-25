"use client";

import { Printer, X } from "lucide-react";

type ExpectationPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: any;
};

type PdfRow = { topic: string; weight: number; note: string };

export default function ExpectationPreviewModal({
  isOpen,
  onClose,
  data,
}: ExpectationPreviewModalProps) {
  if (!isOpen) return null;

  const toPdfRows = (rows: any[] = []): PdfRow[] =>
    rows
      .filter((row) => row.topic || row.itemId)
      .map((row) => ({
        topic: row.topic || "-",
        weight: Number(row.maxScore ?? 0),
        note: row.note || "",
      }));

  const companyRows = toPdfRows(data?.companyRows);
  const departmentRows = toPdfRows(data?.departmentRows);
  const expectationRows = toPdfRows(data?.expectationRows);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:block print:bg-white print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              * { box-shadow: none !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              html, body {
                height: 297mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
              }
              body * { visibility: hidden; }
              .expectation-print-area, .expectation-print-area * { visibility: visible !important; }
              .no-print { display: none !important; }
              .expectation-modal-shell {
                position: absolute !important;
                inset: 0 !important;
                display: block !important;
                width: 100% !important;
                max-width: none !important;
                height: 297mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                border-radius: 0 !important;
              }
              .expectation-print-area {
                display: block !important;
                width: 100% !important;
                height: 297mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                padding: 4mm !important;
                font-size: 8px !important;
                line-height: 1.05 !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .expectation-print-area section { margin-top: 4px !important; }
              .expectation-print-area table { line-height: 1.05 !important; }
              .expectation-print-area th,
              .expectation-print-area td { padding: 2px !important; }
              .expectation-print-area .mt-3 { margin-top: 5px !important; }
              .expectation-print-area .mt-7 { margin-top: 12px !important; }
              @page { size: A4 portrait; margin: 0; }
            }
          `,
        }}
      />

      <div className="expectation-modal-shell flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        <div className="no-print flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Expectation Form Preview</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Draft / Expectation</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-sm font-bold text-white">
              <Printer className="h-4 w-4" /> Print PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-700 hover:bg-slate-100" aria-label="Close preview">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="expectation-print-area overflow-y-auto bg-white p-7 text-[10px] text-slate-900">
          <header className="border-t-2 border-blue-600 text-center">
            <h1 className="text-base font-black underline">Expectation Form</h1>
            <p className="font-semibold">แบบฟอร์มความคาดหวังก่อนการประเมิน</p>
            {/* <p className="mt-1 border-b border-slate-400 pb-1 text-[8px] font-semibold">
              วันที่จัดทำแบบฟอร์ม: {data?.createdAt || "____ / ____ / ______"}
            </p> */}
          </header>

          <div className="flex justify-end gap-5 border-b border-slate-400 px-1 py-1 text-[8px]">
            {["Probation", "Performance", "Promotion", "Progression"].map((type) => {
              const selected = data?.evaluationType === (type === "Promotion" ? "Promote" : type);
              return (
                <span key={type} className="whitespace-nowrap">
                  <span className="mr-1 inline-block h-2 w-2 border border-slate-700 align-middle text-center leading-[6px]">{selected ? "✓" : ""}</span>
                  {type}
                </span>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-x-4 gap-y-1 border-x border-b border-slate-500 p-2 text-[8px]">
            <InfoItem label="ID" value={data?.employeeCode} />
            <InfoItem label="Name" value={data?.employeeName} />
            <InfoItem label="Nickname" value={data?.nickname} />
            <InfoItem label="Position" value={data?.position} />
            <InfoItem label="Department" value={data?.department} />
            <InfoItem label="Division" value={data?.division} />
            <InfoItem label="Unit" value={data?.unit} />
            <InfoItem label="ระดับ" value={data?.level} />
            <InfoItem label="Start Date" value={data?.startDate} />
            <InfoItem label="Employee age" value={calculateWorkAge(data?.startDate)} />
            <InfoItem label="Company" value={data?.company} />
          </div>

          <div className="grid grid-cols-3 border-x border-b border-slate-500 text-[8px]">
            <InfoCell label="ระยะเวลาในการประเมินปกติ" value={data?.evaluationPeriod} />
            <InfoCell label="ตำแหน่งใหม่" value={data?.newDesignation} />
            <InfoCell label="ระดับใหม่" value={data?.newLevel} />
          </div>

          <ExpectationTable title="Company Common Ground" rows={companyRows} />
          <ExpectationTable title="Department Common Ground" rows={departmentRows} />
          <ExpectationTable title="Expectation" rows={expectationRows} />

          <div className="mt-3 grid grid-cols-2 gap-2"><GradeTable /><ScoreRuleTable /></div>

          <div className="mt-3">
            <div className="font-bold underline">ข้อเสนอแนะเพิ่มเติม</div>
            <div className="mt-1 min-h-12 border-b border-dotted border-slate-500 px-1 py-2">
              {data?.managerComment || data?.summaryData?.additionalComment || ""}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-20 text-center text-[9px]">
            <SignatureBlock label="พนักงานรับทราบ" />
            <SignatureBlock label="ผู้จัดทำ" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: unknown }) {
  return <div className="min-w-0"><span className="font-bold">{label}: </span><span className="break-words">{String(value || "-")}</span></div>;
}

function InfoCell({ label, value }: { label: string; value?: unknown }) {
  return <div className="border-r border-slate-400 p-1 last:border-r-0"><span className="font-bold">{label}: </span>{String(value || "-")}</div>;
}

function calculateWorkAge(value?: string) {
  if (!value) return "-";

  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "-";

  const today = new Date();
  if (start > today) return "-";

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += previousMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${years} ปี ${months} เดือน ${days} วัน`;
}

function ExpectationTable({ title, rows }: { title: string; rows: PdfRow[] }) {
  const displayRows = rows;
  return (
    <section className="mt-2">
      <div className="border border-slate-500 bg-slate-800 px-2 py-1 font-bold text-white">{title}</div>
      <table className="w-full table-fixed border-collapse border border-slate-500">
        <thead><tr className="bg-slate-100">
          <th className="w-[65%] border border-slate-500 p-1 text-left">หัวข้อความคาดหวัง</th>
          <th className="w-[10%] border border-slate-500 p-1">น้ำหนัก</th>
          <th className="w-[10%] border border-slate-500 p-1">ผลการประเมิน</th>
          <th className="w-[15%] border border-slate-500 p-1">หมายเหตุ</th>
        </tr></thead>
        <tbody>{displayRows.map((row, index) => <tr key={`${title}-${index}`} className="h-6">
          <td className="border border-slate-500 p-1">{row?.topic || ""}</td>
          <td className="border border-slate-500 p-1 text-center">{row?.weight || ""}</td>
          <td className="border border-slate-500 p-1 text-center">&nbsp;</td>
          <td className="border border-slate-500 p-1">{row?.note || ""}</td>
        </tr>)}</tbody>
        <tfoot><tr className="bg-emerald-50 font-bold">
          <td className="border border-slate-500 p-1 text-left">รวมคะแนน</td>
          <td className="border border-slate-500 p-1 text-center">{rows.reduce((sum, row) => sum + row.weight, 0)}</td>
          <td className="border border-slate-500 p-1 text-center">0</td>
          <td className="border border-slate-500 p-1" />
        </tr></tfoot>
      </table>
    </section>
  );
}

function GradeTable() {
  const rows = [
    ["Probation", "B : 75-84", "C : 65-74", "C : 1-20"],
    ["Performance", "A : 85-100", "A : 85-100", "A : 51-100"],
    ["Promotion", "B : 75-84", "B : 75-84", "B : 21-50"],
    ["Progression", "B : 75-84", "B : 75-84", "B : 21-50"],
  ];
  return <table className="w-full border-collapse border border-slate-500 text-[7px]"><caption className="border border-slate-500 bg-slate-200 p-1 text-left font-bold">หลักเกณฑ์การประเมินแบ่งออกเป็น 3 หัวข้อ</caption><thead><tr>{["Road Map", "คะแนนประเมินจากหัวหน้า", "คะแนนจากการทำข้อสอบ", "คะแนนประเมินวินัยการทำงาน"].map((x) => <th key={x} className="border border-slate-500 p-1">{x}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="border border-slate-500 p-1">{cell}</td>)}</tr>)}</tbody></table>;
}

function ScoreRuleTable() {
  const rows = [
    ["2.91 : ผ่านด้วย 5 คะแนน", "Warning 1 : หักต้น 25 คะแนน"],
    ["2.92 : ผ่านด้วย 10 คะแนน", "Warning 2 : หักต้น 50 คะแนน"],
    ["2.93 : ผ่านด้วย 15 คะแนน", "Last Warning : หักต้น 100 คะแนน"],
    ["2.94 : ผ่านด้วย 100 คะแนน", "ลากิจ,ลาป่วย : หักวันละ 1 คะแนน"],
  ];
  return <table className="w-full border-collapse border border-slate-500 text-[7px]"><caption className="border border-slate-500 bg-slate-200 p-1 text-left font-bold">เงื่อนไขการพิจารณาผ่านเกณฑ์ประเมิน</caption><tbody>{rows.map((row) => <tr key={row[0]}><td className="border border-slate-500 p-1">{row[0]}</td><td className="border border-slate-500 p-1">{row[1]}</td></tr>)}</tbody></table>;
}

function SignatureBlock({ label }: { label: string }) {
  return <div><div className="border-b border-dotted border-slate-700 pb-5" /><div className="mt-1 font-bold">{label}</div><div className="mt-1">วันที่ ____ / ____ / ______</div></div>;
}
