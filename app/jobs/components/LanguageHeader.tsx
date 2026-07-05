"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Language {
  id: string;
  language_name: string;
  language_slug: string;
}

interface BranchItem {
  id: string;
  branch_name: string;
  job_count: number;
}

const BRANCH_STORAGE_KEY = "selected_branch_id";
const URGENT_STORAGE_KEY = "urgent_filter";

function readSavedBranch() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BRANCH_STORAGE_KEY) ?? "";
}

function readSavedUrgent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(URGENT_STORAGE_KEY) === "true";
}

export default function LanguageHeader() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [urgentFilter, setUrgentFilter] = useState( readSavedUrgent());

  const { locale, setLocale } = useLanguage();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [languageRes, branchRes, jobRes, descRes] = await Promise.all([
          supabase.from("recruit_language").select("id, language_name, language_slug").order("id"),
          supabase.from("branches").select("id, branch_name").order("branch_name"),
          supabase.from("recruit_job_open").select(`branch_id, urgent, position_id`),
          supabase.from("recruit_job_description").select(`branch_id,positions_id`),
        ]);

        const { data: languageData, error: languageError } = languageRes;
        const { data: branchData, error: branchError } = branchRes;
        const { data: jobRows } = jobRes;
        const { data: descRows } = descRes;

        /**
        * สร้าง key จาก
        * branch_id + position_id
        *
        * เพื่อเช็คว่ามี description จริง
        */
        const validDescriptions = new Set(
          (descRows ?? []).map((d) =>
            `${d.branch_id}_${d.positions_id}`
          )
        );

        const counts = (jobRows ?? []).reduce<
          Record<string, number>
        >((acc, job) => {

          const key =
            `${job.branch_id}_${job.position_id}`;

          /**
           * นับเฉพาะ job_open
           * ที่มี description คู่กัน
           */
          if (
            job.branch_id &&
            validDescriptions.has(key)
          ) {
            acc[job.branch_id] =
              (acc[job.branch_id] ?? 0) + 1;
          }

          return acc;

        }, {});

        setLanguages(languageData ?? []);

        setBranches(
          (branchData ?? []).map((branch) => ({
            id: branch.id,
            branch_name: branch.branch_name,
            job_count: counts[branch.id] ?? 0,
          }))
        );

        const savedLang = localStorage.getItem("language_slug");
        const defaultLang =
          savedLang && (languageData ?? []).some((item) => item.language_slug === savedLang)
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocale(value);
    localStorage.setItem("language_slug", value);
  };

  // const selectBranch = (branchId: string) => {
  //   localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
  //   window.dispatchEvent(new Event("branch-change"));
  //   setMenuOpen(false);
  // };

  const selectBranch = (branchId: string) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, branchId);

    setMenuOpen(false);

    if (pathname === "/jobs") {
      // อยู่หน้า jobs แล้ว
      window.dispatchEvent(new Event("branch-change"));
    } else {
      // ไปหน้า jobs แล้วให้ JobsPage อ่าน localStorage
      router.push("/jobs");
    }
  };

  const selectedBranchId = readSavedBranch();

  return (
    <header 
      className="
      border-b 
      border-gray-200 
      bg-[#0d47a1]
      sticky top-0 z-50
      backdrop-blur-md
      shadow-sm
    " 
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
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
              <Link href={`/jobs`}>
                Recruitment System
              </Link>
              
            </div>
            {loading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-gray-50 sm:block">Language</span>

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

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden ">
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
                  onClick={() => selectBranch("")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedBranchId === ""
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>ทั้งหมด</span>
                  <span className="text-xs text-gray-500">
                    {branches.reduce((sum, item) => sum + item.job_count, 0)}
                  </span>
                </button>

                {branches.map((branch) => {
                  const isActive = selectedBranchId === branch.id;
                  const isDisabled = branch.job_count === 0;

                  return (
                    <button
                      key={branch.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => selectBranch(branch.id)}
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