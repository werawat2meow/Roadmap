// components/LanguageHeader

"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { readFilters, updateFilter } from "@/app/jobs/lib/filters";
import { useBranches } from "@/app/jobs/contexts/BranchContext";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";


interface Language {
  id: string;
  language_name: string;
  language_slug: string;
}


export default function LanguageHeader() {

  const { branches } = useBranches();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [urgentFilter, setUrgentFilter] = useState(false);

  const { locale, setLocale } = useLanguage();

  useEffect(() => {
    const loadData = async () => {
      try {
        const languageRes = await fetch("/jobs/api/language").then((res) => res.json());
        const { data: languageData } = languageRes;
        setLanguages(languageData ?? []);

        const savedLang = localStorage.getItem("language_slug");
        const defaultLang =
          savedLang &&
          (languageData ?? []).some((item: Language) => item.language_slug === savedLang)
            ? savedLang
            : languageData?.[0]?.language_slug ?? "";

        if (defaultLang) {
          setLocale(defaultLang);
          localStorage.setItem("language_slug", defaultLang);
        }
      } catch (error) {
        console.error("Header load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setLocale]);

  useEffect(() => {
    const syncFilters = () => {
      const { branchId, urgent } = readFilters();
      setSelectedBranchId(branchId);
      setUrgentFilter(urgent);
    };

    syncFilters();

    window.addEventListener("branch-change", syncFilters);
    window.addEventListener("storage", syncFilters);

    return () => {
      window.removeEventListener("branch-change", syncFilters);
      window.removeEventListener("storage", syncFilters);
    };
  }, []);

  const totalJobCount = useMemo(
    () => branches.reduce((sum, branch) => sum + (branch.job_count ?? 0), 0),
    [branches]
  );
  const totalUrgentCount = useMemo(
    () => branches.reduce((sum, branch) => sum + (branch.urgent_count ?? 0), 0),
    [branches]
  );

  function handleUpdateFilter(branchId: string, urgent: boolean) {
    setMenuOpen(false)
    updateFilter(branchId, urgent);
    setSelectedBranchId(branchId);
    setUrgentFilter(urgent);
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocale(value);
    localStorage.setItem("language_slug", value);
  };

  return (
    <header className="border-b border-gray-200 bg-[#123a63] sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl lg:px-6">
        {/* บรรทัดที่ 1 บน Mobile: โลโก้/ปุ่ม เมนู */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-50 md:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>
              <div className="text-base font-semibold text-gray-50">
                <Link href="/jobs">Recruitment System</Link>
              </div>
              {loading ? (
                <div className="text-xs text-gray-500">Loading...</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* บรรทัดที่ 2 บน Mobile: ปุ่ม Action และ ตัวเลือกภาษา */}
        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          <div>
            <Link 
              href="/jobs/register/resume"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-gray-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-amber-300 hover:to-amber-500 hover:shadow-amber-500/40 active:scale-95"
            >
              <span>{getUIText(uiText.btnResume, locale)}</span>
            </Link>
          </div>
          <div>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-blue-200"
              value={locale}
              onChange={handleChange}
            >
              {languages.length === 0 ? (
                <option value="">No language</option>
              ) : (
                languages.map((lang) => (
                  <option key={lang.language_slug} value={lang.language_slug}>
                    {lang.language_name.toUpperCase()}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <div className="text-base font-semibold text-gray-900">สาขางาน</div>
                <div className="text-xs text-gray-500">เลือก branch เพื่อกรองงาน</div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700"
              >
                X
              </button>
            </div>

            <div className="max-h-[calc(100vh-64px)] overflow-y-auto p-4 bg-gray-900/70 border-b border-gray-200 backdrop-blur-md shadow-sm rounded-b-lg">
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleUpdateFilter("", false)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedBranchId === "" && !urgentFilter
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>ทั้งหมด</span>
                  <span className="text-xs text-gray-500">{totalJobCount}</span>
                </button>

                {/* ปุ่มงานด่วน */}
                <button
                  type="button"
                  onClick={() => handleUpdateFilter("", !urgentFilter)}
                  disabled={totalUrgentCount  === 0}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition 
                  ${totalUrgentCount  === 0 
                    ? "cursor-not-allowed bg-gray-100 text-gray-400" 
                    : urgentFilter 
                    ? "bg-blue-50 text-blue-700" 
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>🔥 งานด่วน</span>
                  <span className="ml-3 shrink-0 text-xs">({totalUrgentCount })</span>
                </button>

                {branches.map((branch) => {
                  const isActive = selectedBranchId === branch.branch_id;
                  const isDisabled = branch.job_count === 0;

                  return (
                    <button
                      key={branch.branch_id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleUpdateFilter(branch.branch_id, urgentFilter)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        isDisabled
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : isActive
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="truncate">{branch.branch_name}</span>
                      <span className="ml-3 shrink-0 text-xs">({branch.job_count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}