"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FileSearch, Printer, Search, X } from "lucide-react";

type ChecklistItem = { status: string; applicability: string };
type PresentRecord = {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  level: string;
  evaluationStatus: string;
  checklist: ChecklistItem[];
};
type Rule = {
  position_level_id: string;
  is_allowed: boolean;
  limit_amount: number | null;
  limit_unit: string | null;
  scope_text: string | null;
  condition_text: string | null;
};
type Authority = { id: string; authority_name: string; rules: Rule[] };
type CategoryLevelRule = { position_level_id: string; is_allowed: boolean; limit_amount?: number | null; limit_unit?: string | null; scope_text?: string | null; condition_text?: string | null };
type AuthorityCategory = { id: string; category_code: string; category_name: string; levelRules: CategoryLevelRule[]; authorities: Authority[] };
type Level = { id: string; level_code: string; level_name: string };

const isPresentReady = (record: PresentRecord) => {
  const levelNumber = Number(record.level.match(/P(\d+)/i)?.[1] || 0);
  const applicable = record.checklist.filter((item) => item.applicability !== "not_applicable");
  return levelNumber >= 7 && record.evaluationStatus === "Completed" && applicable.length > 0 && applicable.every((item) => item.status === "passed");
};

export default function PresentPage() {
  const [records, setRecords] = useState<PresentRecord[]>([]);
  const [categories, setCategories] = useState<AuthorityCategory[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selected, setSelected] = useState<PresentRecord | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [checklistResponse, authorityResponse] = await Promise.all([
          fetch("/roadmap/api/checklist", { cache: "no-store" }),
          fetch("/api/admin/authority-settings", { cache: "no-store" }),
        ]);
        const checklist = await checklistResponse.json();
        const authority = await authorityResponse.json();
        if (!checklistResponse.ok || !checklist.success) throw new Error(checklist.error || "โหลดข้อมูล Present ไม่สำเร็จ");
        if (!authorityResponse.ok || !authority.success) throw new Error(authority.error || "โหลดข้อมูลอำนาจไม่สำเร็จ");
        setRecords(checklist.data || []);
        setCategories(authority.data || []);
        setLevels(authority.levels || []);
      } catch (loadError: any) {
        setError(loadError?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const readyRecords = useMemo(
    () => records.filter(isPresentReady).filter((record) => `${record.employeeName} ${record.employeeCode} ${record.department}`.toLowerCase().includes(search.toLowerCase())),
    [records, search],
  );
  const selectedLevel = selected ? levels.find((level) => level.level_code.toUpperCase() === selected.level.toUpperCase()) : undefined;

  return (
    <div className="min-h-screen p-6 text-slate-900 lg:p-10">
      <style jsx global>{`@media print { body * { visibility: hidden; } .present-print-area, .present-print-area * { visibility: visible; } .present-print-area { position: absolute; inset: 0; background: white; } .present-toolbar, .present-list { display: none !important; } .present-page { break-after: page; box-shadow: none !important; margin: 0 !important; } }`}</style>
      <div className="present-toolbar mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">Present</h1>
          <p className="mt-1 text-slate-500">เอกสารอำนาจการบริหารสำหรับพนักงานที่ผ่านการประเมินและ Checklist แล้ว</p>
        </div>
        {selected && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelected(null)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"><X size={16} className="mr-2 inline" />กลับรายการ</button>
            <button type="button" onClick={() => window.print()} className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Printer size={16} className="mr-2 inline" />พิมพ์ / PDF</button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!selected ? (
        <section className="present-list rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัสพนักงาน" className="w-full bg-transparent text-sm outline-none" /></div>
          {loading ? <p className="py-12 text-center text-slate-500">กำลังโหลดข้อมูล...</p> : readyRecords.length === 0 ? <div className="py-16 text-center text-slate-500"><FileSearch className="mx-auto mb-3 text-slate-300" size={36} /><p className="font-semibold">ยังไม่มีพนักงานที่พร้อม Present</p><p className="mt-1 text-sm">ต้องเป็น Level P7 ขึ้นไป และผ่าน Evaluation กับ Checklist ครบแล้ว</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">พนักงาน</th><th className="px-4 py-3">ตำแหน่ง</th><th className="px-4 py-3">แผนก</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3 text-right">ดำเนินการ</th></tr></thead><tbody className="divide-y divide-slate-100">{readyRecords.map((record) => <tr key={record.id}><td className="px-4 py-4"><div className="font-semibold">{record.employeeName}</div><div className="text-xs text-slate-500">{record.employeeCode}</div></td><td className="px-4 py-4">{record.position}</td><td className="px-4 py-4">{record.department}</td><td className="px-4 py-4"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{record.level}</span></td><td className="px-4 py-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">พร้อม Present</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelected(record)} className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">ดู Present</button></td></tr>)}</tbody></table></div>}
        </section>
      ) : <PresentDocument record={selected} categories={categories} level={selectedLevel} />}
    </div>
  );
}

function PresentDocument({ record, categories, level }: { record: PresentRecord; categories: AuthorityCategory[]; level?: Level }) {
  const visibleCategories = categories.filter((category) => {
    if (!level) return false;
    const categoryRule = category.levelRules?.find((item) => item.position_level_id === level.id);
    if (categoryRule) return categoryRule.is_allowed;
    return category.authorities.some((authority) => authority.rules.some((rule) => rule.position_level_id === level.id && rule.is_allowed));
  });

  const renderCategory = (category: AuthorityCategory) => (
    <section key={category.id} className="mb-4">
      <div className="bg-slate-900 px-3 py-2 text-sm font-bold text-white">{category.category_code} {category.category_name}</div>
      <div className="grid grid-cols-[1fr_72px_1fr] bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-700"><span>ข้อ / รายการอำนาจ</span><span className="text-center">ได้รับสิทธิ์</span><span>ขอบเขต / เงื่อนไข</span></div>
      {category.authorities.map((authority, index) => {
        const explicitRule = level ? authority.rules.find((item) => item.position_level_id === level.id) : undefined;
        const categoryRule = level ? category.levelRules?.find((item) => item.position_level_id === level.id) : undefined;
        const rule = explicitRule || categoryRule;
        const detail = [rule?.scope_text, rule?.condition_text, rule?.limit_amount != null ? `${rule.limit_amount.toLocaleString()} ${rule.limit_unit || ""}` : ""].filter(Boolean).join(" · ");
        return <div key={authority.id} className="grid grid-cols-[1fr_72px_1fr] border-b border-slate-200 px-3 py-2 text-[10px]"><span>{category.category_code}.{index + 1} {authority.authority_name}</span><span className="text-center">{rule?.is_allowed ? <Check className="mx-auto text-emerald-600" size={14} /> : <span className="text-slate-400">□</span>}</span><span>{detail || "-"}</span></div>;
      })}
    </section>
  );

  return (
    <div className="present-print-area mx-auto max-w-[850px] space-y-5">
      <article className="present-page min-h-[1120px] bg-white p-8 shadow-xl"><div className="border-t-4 border-amber-500 pb-3 text-center text-xs font-bold text-slate-900">INTERNAL DELEGATION OF AUTHORITY</div><div className="mb-4 border-b border-slate-300 pb-3 text-lg font-black text-slate-800">SBD <span className="text-xs font-normal">BUSINESS DEVELOPMENT</span><span className="float-right text-xs font-normal">วันที่ออกประกาศ: ____/____/____</span></div><div className="mb-4 grid grid-cols-[120px_1fr] gap-4 rounded-xl border border-slate-300 p-3"><div className="flex items-center justify-center bg-slate-100 text-3xl font-black text-slate-300">{record.employeeName.slice(0, 1)}</div><div className="grid grid-cols-2 gap-y-2 text-xs"><b>ชื่อ-นามสกุล</b><span>{record.employeeName}</span><b>ตำแหน่ง</b><span>{record.position}</span><b>แผนก</b><span>{record.department}</span><b>ระดับ</b><span className="font-bold">{record.level}</span></div></div>{visibleCategories.slice(0, 3).map(renderCategory)}<div className="mt-8 text-right text-[10px] text-slate-500">1 / 2</div></article>
      <article className="present-page min-h-[1120px] bg-white p-8 shadow-xl">{visibleCategories.slice(3).map(renderCategory)}<div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs"><div className="border-t border-slate-400 pt-3">ผู้รับมอบอำนาจรับทราบ<br /><br />ลงชื่อ ____________________</div><div className="border-t border-slate-400 pt-3">ผู้มีอำนาจอนุมัติ<br /><br />ลงชื่อ ____________________</div></div><div className="mt-8 text-right text-[10px] text-slate-500">2 / 2</div></article>
    </div>
  );
}
