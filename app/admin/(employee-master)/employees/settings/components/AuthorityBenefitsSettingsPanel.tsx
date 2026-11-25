"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";

type PanelTab = "authority" | "benefit";
type Level = { id: string; level_code: string; level_name: string; sort_order: number; status?: string | null };
type Rule = {
  id: string;
  position_level_id: string;
  is_allowed: boolean;
  limit_amount: number | null;
  limit_unit: string | null;
  scope_text: string | null;
  condition_text: string | null;
};
type CategoryLevelRule = { id: string; position_level_id: string; is_allowed: boolean };
type Authority = { id: string; category_id: string; authority_code: string; authority_name: string; rules: Rule[] };
type Category = { id: string; category_code: string; category_name: string; authorities: Authority[]; levelRules: CategoryLevelRule[] };

type Props = { activeTab: PanelTab; onChange: (tab: PanelTab) => void };

const request = async (options?: RequestInit) => {
  const response = await fetch("/api/admin/authority-settings", { ...options, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถดำเนินการได้");
  return result;
};

export default function AuthorityBenefitsSettingsPanel({ activeTab, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [authorityDraft, setAuthorityDraft] = useState<Record<string, string>>({});
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);
  const [editingRule, setEditingRule] = useState<{ authority: Authority; level: Level; rule?: Rule } | null>(null);
  const [bulkAuthorityId, setBulkAuthorityId] = useState("");
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<Category | null>(null);
  const [bulkSelectedLevelIds, setBulkSelectedLevelIds] = useState<string[]>([]);
  const [categoryLevelTarget, setCategoryLevelTarget] = useState<Category | null>(null);
  const [categorySelectedLevelIds, setCategorySelectedLevelIds] = useState<string[]>([]);
  const [ruleForm, setRuleForm] = useState({ isAllowed: false, limitAmount: "", limitUnit: "", scopeText: "", conditionText: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request();
      setCategories(result.data || []);
      const nextLevels = result.levels || [];
      setLevels(nextLevels);
      setSelectedLevelIds(nextLevels.filter((level: Level) => !level.status || level.status === "active").map((level: Level) => level.id));
    } catch (loadError: any) {
      setError(loadError?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const orderedLevels = useMemo(() => [...levels].sort((a, b) => a.sort_order - b.sort_order), [levels]);
  const selectedLevels = useMemo(() => orderedLevels.filter((level) => selectedLevelIds.includes(level.id)), [orderedLevels, selectedLevelIds]);

  const toggleLevel = (levelId: string) => {
    setSelectedLevelIds((current) => current.includes(levelId) ? current.filter((id) => id !== levelId) : [...current, levelId]);
  };

  const saveSelectedLevels = async () => {
    setSaving(true);
    try {
      await Promise.all(
        orderedLevels.map((level) => request({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource: "level", id: level.id, status: selectedLevelIds.includes(level.id) ? "active" : "inactive" }),
        })),
      );
      await load();
    } catch (saveError: any) {
      setError(saveError?.message || "ไม่สามารถบันทึก Level ที่ใช้งานได้");
    } finally {
      setSaving(false);
    }
  };

  const bulkAuthorities = bulkCategoryTarget?.authorities || [];

  const selectBulkAuthority = (authorityId: string) => {
    const authority = bulkAuthorities.find((item) => item.id === authorityId);
    setBulkAuthorityId(authorityId);
    setBulkSelectedLevelIds(
      authority
        ? orderedLevels
            .filter((level) => authority.rules.some((rule) => rule.position_level_id === level.id && rule.is_allowed))
            .map((level) => level.id)
        : [],
    );
  };

  const openBulkEditor = (category: Category) => {
    const firstAuthority = category.authorities[0];
    if (!firstAuthority) return;
    setBulkCategoryTarget(category);
    setBulkAuthorityId(firstAuthority.id);
    setBulkSelectedLevelIds(
      orderedLevels
        .filter((level) => firstAuthority.rules.some((rule) => rule.position_level_id === level.id && rule.is_allowed))
        .map((level) => level.id),
    );
  };

  const saveBulkPermissions = async () => {
    const authority = bulkAuthorities.find((item) => item.id === bulkAuthorityId);
    if (!authority) return;

    setSaving(true);
    try {
      await Promise.all(
        orderedLevels.map(async (level) => {
          const existing = authority.rules.find((rule) => rule.position_level_id === level.id);
          const isAllowed = bulkSelectedLevelIds.includes(level.id);
          const payload = existing
            ? { resource: "rule", id: existing.id, is_allowed: isAllowed }
            : {
                resource: "rule",
                authorityId: authority.id,
                positionLevelId: level.id,
                isAllowed,
              };

          await request({
            method: existing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }),
      );
      setBulkAuthorityId("");
      setBulkCategoryTarget(null);
      setBulkSelectedLevelIds([]);
      await load();
    } catch (saveError: any) {
      setError(saveError?.message || "à¸šà¸±à¸™à¸—à¸¶à¸à¸ªà¸´à¸—à¸˜à¸´à¹Œà¸«à¸¥à¸²à¸¢ Level à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
    } finally {
      setSaving(false);
    }
  };

  const openCategoryLevelEditor = (category: Category) => {
    setCategoryLevelTarget(category);
    setCategorySelectedLevelIds(
      orderedLevels
        .filter((level) => category.levelRules.some((rule) => rule.position_level_id === level.id && rule.is_allowed))
        .map((level) => level.id),
    );
  };

  const saveCategoryLevels = async () => {
    if (!categoryLevelTarget) return;
    setSaving(true);
    try {
      await Promise.all(
        orderedLevels.map(async (level) => {
          const existingCategoryRule = categoryLevelTarget.levelRules.find((rule) => rule.position_level_id === level.id);
          const isAllowed = categorySelectedLevelIds.includes(level.id);
          if (existingCategoryRule) {
            await request({
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resource: "category_rule", id: existingCategoryRule.id, is_allowed: isAllowed }),
            });
          } else {
            await request({
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resource: "category_rule", categoryId: categoryLevelTarget.id, positionLevelId: level.id, isAllowed }),
            });
          }

          await Promise.all(
            categoryLevelTarget.authorities.map(async (authority) => {
              const existingRule = authority.rules.find((rule) => rule.position_level_id === level.id);
              if (existingRule) {
                await request({
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ resource: "rule", id: existingRule.id, is_allowed: isAllowed }),
                });
              } else {
                await request({
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ resource: "rule", authorityId: authority.id, positionLevelId: level.id, isAllowed }),
                });
              }
            }),
          );
        }),
      );
      setCategoryLevelTarget(null);
      setCategorySelectedLevelIds([]);
      await load();
    } catch (saveError: any) {
      setError(saveError?.message || "ไม่สามารถบันทึกสิทธิ์ของหมวดได้");
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async () => {
    if (!categoryCode.trim() || !categoryName.trim()) return;
    setSaving(true);
    try {
      await request({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "category", categoryCode, categoryName }) });
      setCategoryCode(""); setCategoryName(""); await load();
    } catch (saveError: any) { setError(saveError?.message || "เพิ่มหมวดไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  const createAuthority = async (categoryId: string) => {
    const value = authorityDraft[categoryId]?.trim();
    if (!value) return;
    setSaving(true);
    try {
      const category = categories.find((item) => item.id === categoryId);
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const authorityCode = slug
        ? `${categoryId.slice(0, 8)}_${slug}`
        : `authority_${categoryId.slice(0, 8)}_${Date.now()}`;

      const result = await request({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "authority", categoryId, authorityCode, authorityName: value }) });
      const authorityId = result.data?.id;
      if (authorityId && category?.levelRules?.length) {
        await Promise.all(category.levelRules.map((rule) => request({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource: "rule", authorityId, positionLevelId: rule.position_level_id, isAllowed: rule.is_allowed }),
        })));
      }
      setAuthorityDraft((current) => ({ ...current, [categoryId]: "" })); await load();
    } catch (saveError: any) { setError(saveError?.message || "เพิ่มรายการอำนาจไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  const openRuleEditor = (authority: Authority, level: Level) => {
    const existing = authority.rules.find((rule) => rule.position_level_id === level.id);
    setEditingRule({ authority, level, rule: existing });
    setRuleForm({
      isAllowed: existing?.is_allowed ?? false,
      limitAmount: existing?.limit_amount == null ? "" : String(existing.limit_amount),
      limitUnit: existing?.limit_unit || "",
      scopeText: existing?.scope_text || "",
      conditionText: existing?.condition_text || "",
    });
  };

  const saveRule = async () => {
    if (!editingRule) return;
    setSaving(true);
    try {
      const payload = {
        is_allowed: ruleForm.isAllowed,
        limit_amount: ruleForm.limitAmount.trim() ? Number(ruleForm.limitAmount) : null,
        limit_unit: ruleForm.limitUnit.trim() || null,
        scope_text: ruleForm.scopeText.trim() || null,
        condition_text: ruleForm.conditionText.trim() || null,
      };
      if (editingRule.rule) {
        await request({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "rule", id: editingRule.rule.id, ...payload }) });
      } else {
        await request({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "rule", authorityId: editingRule.authority.id, positionLevelId: editingRule.level.id, isAllowed: payload.is_allowed, limitAmount: payload.limit_amount, limitUnit: payload.limit_unit, scopeText: payload.scope_text, conditionText: payload.condition_text }) });
      }
      setEditingRule(null);
      await load();
    } catch (saveError: any) { setError(saveError?.message || "บันทึกสิทธิ์ไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  const remove = async (resource: "category" | "authority", id: string) => {
    if (!window.confirm("ยืนยันการลบรายการนี้หรือไม่?")) return;
    setSaving(true);
    try {
      await request({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, id }) });
      await load();
    } catch (deleteError: any) { setError(deleteError?.message || "ลบข้อมูลไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">{activeTab === "authority" ? <ShieldCheck size={25} /> : <CircleDollarSign size={25} />}</span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{activeTab === "authority" ? "ตั้งค่าอำนาจตามระดับ" : "ตั้งค่าสิทธิประโยชน์พนักงาน"}</h2>
            <p className="mt-1 text-sm text-slate-500">{activeTab === "authority" ? "กำหนดรายการอำนาจ ขอบเขต เงื่อนไข และวงเงินของแต่ละ Level" : "ใช้ข้อมูล Benefit เดิมของระบบ โดยจะเชื่อมต่อในขั้นถัดไป"}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-2 text-xs font-semibold ${activeTab === "authority" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{activeTab === "authority" ? "เชื่อมต่อแล้ว" : "ใช้ตาราง Benefit เดิม"}</span>
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => onChange("authority")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "authority" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>อำนาจตาม Level</button>
        <button type="button" onClick={() => onChange("benefit")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "benefit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>สิทธิประโยชน์</button>
      </div>

      {activeTab === "benefit" ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">ส่วน Benefit จะเชื่อมกับ `benefits`, `benefit_matrix` และ `benefit_policy_rules` ที่มีอยู่แล้วในขั้นถัดไป</div>
      ) : (
        <div className="max-h-[calc(100vh-220px)] space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 pr-3 lg:p-6 lg:pr-5">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">เลือกระดับที่ต้องการตั้งค่า</h3>
                <p className="mt-1 text-xs text-slate-600">เลือกเฉพาะ Level ที่องค์กรใช้งาน ตารางด้านล่างจะแสดงตามที่เลือก</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => setSelectedLevelIds(orderedLevels.map((level) => level.id))} className="cursor-pointer rounded-lg bg-white px-3 py-2 font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50">เลือกทั้งหมด</button>
                <button type="button" onClick={() => setSelectedLevelIds([])} className="cursor-pointer rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-2 font-semibold text-amber-950 shadow-sm transition hover:from-amber-500 hover:to-yellow-600">ล้างทั้งหมด</button>
                <button type="button" onClick={() => void saveSelectedLevels()} disabled={saving} className="cursor-pointer rounded-lg bg-gradient-to-r from-emerald-500 to-green-700 px-3 py-2 font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึก Level ที่ใช้งาน"}</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {orderedLevels.map((level) => {
                const selected = selectedLevelIds.includes(level.id);
                return <button key={level.id} type="button" onClick={() => toggleLevel(level.id)} className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold transition ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"}`} aria-pressed={selected}>{selected ? "✓ " : ""}{level.level_code}</button>;
              })}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
            <input value={categoryCode} onChange={(event) => setCategoryCode(event.target.value)} placeholder="รหัสหมวด เช่น HR" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="ชื่อหมวดอำนาจ" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={() => void createCategory()} disabled={saving || !categoryCode.trim() || !categoryName.trim()} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-green-800 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500"><Plus size={16} /> เพิ่มหมวด</button>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {loading ? <div className="flex justify-center p-10 text-slate-500"><Loader2 className="animate-spin" /></div> : categories.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">ยังไม่มีหมวดอำนาจ กรุณาเพิ่มหมวดแรก</p> : categories.map((category) => (
            <section key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 bg-white px-4 py-2">
                <button type="button" onClick={() => openBulkEditor(category)} disabled={category.authorities.length === 0 || saving} className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">กำหนดสิทธิ์หลายรายการในหมวดนี้</button>
                <button type="button" onClick={() => openCategoryLevelEditor(category)} disabled={saving} className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">กำหนดสิทธิ์ของหมวด</button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-100 px-4 py-3"><div><span className="mr-2 rounded bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">{category.category_code}</span><span className="font-bold">{category.category_name}</span></div><button type="button" onClick={() => void remove("category", category.id)} className="cursor-pointer text-red-500 transition hover:text-red-700" title="ลบหมวด"><Trash2 size={16} /></button></div>
              <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="w-72 px-4 py-3">รายการอำนาจ</th>{selectedLevels.map((level) => <th key={level.id} className="px-3 py-3 text-center">{level.level_code}</th>)}<th className="px-4 py-3">จัดการ</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {category.authorities.map((authority) => <tr key={authority.id}><td className="px-4 py-3"><div className="font-semibold">{authority.authority_name}</div></td>{selectedLevels.map((level) => { const rule = authority.rules.find((item) => item.position_level_id === level.id); return <td key={level.id} className="px-3 py-3 text-center"><button type="button" onClick={() => openRuleEditor(authority, level)} disabled={saving} className={`cursor-pointer min-h-9 min-w-16 rounded-md border px-2 text-xs font-bold ${rule?.is_allowed ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-400"}`} aria-label={`${authority.authority_name} ${level.level_code}`}>{rule?.is_allowed ? "✓ มีสิทธิ์" : "ไม่มีสิทธิ์"}{rule?.limit_amount != null ? <span className="block font-normal">{rule.limit_amount.toLocaleString()} {rule.limit_unit || ""}</span> : null}</button></td>; })}<td className="px-4 py-3"><button type="button" onClick={() => void remove("authority", authority.id)} className="cursor-pointer text-red-500 transition hover:text-red-700" title="ลบรายการ"><Trash2 size={16} /></button></td></tr>)}
                    <tr><td colSpan={selectedLevels.length + 2} className="px-4 py-3"><div className="flex gap-2"><input value={authorityDraft[category.id] || ""} onChange={(event) => setAuthorityDraft((current) => ({ ...current, [category.id]: event.target.value }))} placeholder="เพิ่มรายการอำนาจในหมวดนี้" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => void createAuthority(category.id)} disabled={saving || !authorityDraft[category.id]?.trim()} className="cursor-pointer rounded-lg bg-gradient-to-r from-emerald-500 to-green-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-green-800 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500"><Plus size={15} /></button></div></td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
      {categoryLevelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setCategoryLevelTarget(null); setCategorySelectedLevelIds([]); } }}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="category-level-title">
            <h3 id="category-level-title" className="text-lg font-bold text-slate-900">กำหนดสิทธิ์ของหมวด</h3>
            <p className="mt-1 text-sm text-slate-500">{categoryLevelTarget.category_code} {categoryLevelTarget.category_name}</p>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">การบันทึกจะกำหนดค่าเริ่มต้นให้หัวข้อย่อยทั้งหมดในหมวดนี้ และสามารถแก้ Override รายการย่อยภายหลังได้</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {orderedLevels.map((level) => {
                const selected = categorySelectedLevelIds.includes(level.id);
                return <button key={level.id} type="button" onClick={() => setCategorySelectedLevelIds((current) => selected ? current.filter((id) => id !== level.id) : [...current, level.id])} className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-bold transition ${selected ? "border-indigo-600 bg-indigo-600 text-white shadow-md" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50"}`}>{selected ? "✓ " : ""}{level.level_code}</button>;
              })}
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => { setCategoryLevelTarget(null); setCategorySelectedLevelIds([]); }} disabled={saving} className="cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-600 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-50">ยกเลิก</button>
              <button type="button" onClick={() => void saveCategoryLevels()} disabled={saving} className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์หมวด"}</button>
            </div>
          </div>
        </div>
      )}
      {bulkAuthorityId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setBulkAuthorityId(""); setBulkSelectedLevelIds([]); } }}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="bulk-authority-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="bulk-authority-title" className="text-lg font-bold text-slate-900">กำหนดสิทธิ์หลาย Level</h3>
                <p className="mt-1 text-sm text-slate-500">เลือกรายการอำนาจและกำหนด Level ที่มีสิทธิ์พร้อมกัน</p>
              </div>
              <button type="button" onClick={() => { setBulkAuthorityId(""); setBulkSelectedLevelIds([]); }} className="cursor-pointer rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
            </div>
            <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{bulkCategoryTarget?.category_code} {bulkCategoryTarget?.category_name}</p>
            <select value={bulkAuthorityId} onChange={(event) => selectBulkAuthority(event.target.value)} className="mt-3 w-full cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {bulkAuthorities.map((authority) => <option key={authority.id} value={authority.id}>{authority.authority_name}</option>)}
            </select>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {orderedLevels.map((level) => {
                const selected = bulkSelectedLevelIds.includes(level.id);
                return <button key={level.id} type="button" onClick={() => setBulkSelectedLevelIds((current) => selected ? current.filter((id) => id !== level.id) : [...current, level.id])} className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-bold transition ${selected ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50"}`}>{selected ? "✓ " : ""}{level.level_code}</button>;
              })}
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => { setBulkAuthorityId(""); setBulkSelectedLevelIds([]); }} disabled={saving} className="cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-600 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-50">ยกเลิก</button>
              <button type="button" onClick={() => void saveBulkPermissions()} disabled={saving} className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 to-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-600 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}</button>
            </div>
          </div>
        </div>
      )}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditingRule(null); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="authority-rule-title">
            <h3 id="authority-rule-title" className="text-lg font-bold">กำหนดสิทธิ์ {editingRule.authority.authority_name} · {editingRule.level.level_code}</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold"><input type="checkbox" checked={ruleForm.isAllowed} onChange={(event) => setRuleForm((current) => ({ ...current, isAllowed: event.target.checked }))} className="h-4 w-4 accent-emerald-600" /> Level นี้มีอำนาจ</label>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">วงเงิน<input type="number" value={ruleForm.limitAmount} onChange={(event) => setRuleForm((current) => ({ ...current, limitAmount: event.target.value }))} placeholder="เช่น 30000" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">หน่วยวงเงิน<input value={ruleForm.limitUnit} onChange={(event) => setRuleForm((current) => ({ ...current, limitUnit: event.target.value }))} placeholder="บาท / รายการ" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label></div>
              <label className="block text-sm font-semibold">ขอบเขต<textarea value={ruleForm.scopeText} onChange={(event) => setRuleForm((current) => ({ ...current, scopeText: event.target.value }))} placeholder="เช่น เฉพาะสังกัด, ภายในแผนก, P7-P10" rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label>
              <label className="block text-sm font-semibold">เงื่อนไข<textarea value={ruleForm.conditionText} onChange={(event) => setRuleForm((current) => ({ ...current, conditionText: event.target.value }))} placeholder="เช่น ต้องอนุมัติ Director ก่อน" rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingRule(null)} disabled={saving} className="cursor-pointer rounded-lg bg-gradient-to-r from-red-500 to-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-600 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-50">ยกเลิก</button><button type="button" onClick={() => void saveRule()} disabled={saving} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
