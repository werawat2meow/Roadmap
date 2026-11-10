"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

type Level = "branch" | "department" | "division" | "unit";
type Company = {
  id: string;
  company_name_th?: string;
  company_name_en?: string;
  company_code?: string;
  status?: string;
};
type Branch = {
  id: string;
  branch_code: string;
  branch_name: string;
  company_id: string;
  company_name?: string;
  phone?: string;
  group_id?: string;
  branch_image_url?: string;
  branch_image_path?: string;
  status?: string;
};
type Department = {
  id: string;
  department_code: string;
  department_name: string;
  branch_ids: string[];
  department_color?: string;
  department_icon?: string;
  status?: string;
};
type Division = {
  id: string;
  division_code: string;
  division_name: string;
  department_id: string;
  status?: string;
};
type Unit = {
  id: string;
  unit_code: string;
  unit_name: string;
  division_id: string;
  status?: string;
};

const levels: { key: Level; title: string; caption: string }[] = [
  { key: "branch", title: "สังกัด", caption: "เลือกสังกัดเพื่อดูแผนก" },
  { key: "department", title: "แผนก", caption: "อยู่ภายใต้สังกัดที่เลือก" },
  { key: "division", title: "ฝ่าย", caption: "อยู่ภายใต้แผนกที่เลือก" },
  { key: "unit", title: "หน่วย", caption: "อยู่ภายใต้ฝ่ายที่เลือก" },
];

async function readList<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  const json = await response.json();
  if (!response.ok || !json.success)
    throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
  return Array.isArray(json.data) ? json.data : [];
}

export default function EmployeeSettingsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState<Level | null>(null);
  const [editing, setEditing] = useState<{ level: Level; id: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<{
    level: Level;
    id: string;
    name: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [companyRows, branchRows, departmentRows, divisionRows, unitRows] =
        await Promise.all([
          readList<Company>("/api/admin/companies?scope_context=ems.employees"),
          readList<Branch>("/api/admin/branches?scope_context=ems.employees"),
          readList<Department>(
            "/api/admin/departments?all=true&scope_context=ems.employees",
          ),
          readList<Division>(
            "/api/admin/divisions?all=true&scope_context=ems.employees",
          ),
          readList<Unit>(
            "/api/admin/units?all=true&scope_context=ems.employees",
          ),
        ]);
      setCompanies(companyRows);
      setBranches(branchRows);
      setDepartments(departmentRows);
      setDivisions(divisionRows);
      setUnits(unitRows);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "โหลดโครงสร้างองค์กรไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const match = (codeValue: string, nameValue: string) =>
      !query || `${codeValue} ${nameValue}`.toLocaleLowerCase().includes(query);
    return {
      branch: branches.filter((row) => match(row.branch_code, row.branch_name)),
      department: departments.filter(
        (row) =>
          row.branch_ids?.includes(branchId) &&
          match(row.department_code, row.department_name),
      ),
      division: divisions.filter(
        (row) =>
          row.department_id === departmentId &&
          match(row.division_code, row.division_name),
      ),
      unit: units.filter(
        (row) =>
          row.division_id === divisionId && match(row.unit_code, row.unit_name),
      ),
    };
  }, [
    branches,
    departments,
    divisions,
    units,
    branchId,
    departmentId,
    divisionId,
    search,
  ]);

  const selectedBranch = branches.find((row) => row.id === branchId);
  // The UI has no company picker. Use one stable existing company for new branches.
  const companyId = [...companies]
    .filter((row) => row.status === "active")
    .sort((a, b) =>
      (a.company_code || a.id).localeCompare(b.company_code || b.id),
    )[0]?.id || "";
  const selectedDepartment = departments.find((row) => row.id === departmentId);
  const selectedDivision = divisions.find((row) => row.id === divisionId);

  function openAdd(level: Level) {
    setEditing(null);
    setCode("");
    setName("");
    setNotice("");
    setError("");
    setAdding(level);
  }

  function openEdit(level: Level, id: string) {
    const row =
      level === "branch"
        ? branches.find((item) => item.id === id)
        : level === "department"
          ? departments.find((item) => item.id === id)
          : level === "division"
            ? divisions.find((item) => item.id === id)
            : units.find((item) => item.id === id);
    if (!row) return;
    const prefix =
      level === "branch"
        ? "branch"
        : level === "department"
          ? "department"
          : level === "division"
            ? "division"
            : "unit";
    setCode(String(row[`${prefix}_code` as keyof typeof row] || ""));
    setName(String(row[`${prefix}_name` as keyof typeof row] || ""));
    setError("");
    setEditing({ level, id });
    setAdding(level);
  }

  async function save() {
    if (!adding || saving) return;
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    if (adding === "branch" && !editing && !companyId) {
      setError("ยังไม่มีบริษัทที่ใช้งานสำหรับเพิ่มสังกัด");
      return;
    }
    const branchOriginal =
      editing?.level === "branch"
        ? branches.find((item) => item.id === editing.id)
        : null;
    const departmentOriginal =
      editing?.level === "department"
        ? departments.find((item) => item.id === editing.id)
        : null;
    const divisionOriginal =
      editing?.level === "division"
        ? divisions.find((item) => item.id === editing.id)
        : null;
    const unitOriginal =
      editing?.level === "unit"
        ? units.find((item) => item.id === editing.id)
        : null;
    const config = {
      branch: {
        url: "/api/admin/branches",
        body: {
          branch_code: editing ? code : "",
          branch_name: name.trim(),
          company_id: branchOriginal?.company_id || companyId,
          phone: branchOriginal?.phone,
          group_id: branchOriginal?.group_id,
          branch_image_url: branchOriginal?.branch_image_url,
          branch_image_path: branchOriginal?.branch_image_path,
          status: branchOriginal?.status || "active",
        },
      },
      department: {
        url: "/api/admin/departments",
        body: {
          department_code: editing ? code : "",
          department_name: name.trim(),
          branch_ids: departmentOriginal?.branch_ids || [branchId],
          department_color: departmentOriginal?.department_color,
          department_icon: departmentOriginal?.department_icon,
          status: departmentOriginal?.status || "active",
        },
      },
      division: {
        url: "/api/admin/divisions",
        body: {
          division_code: editing ? code : "",
          division_name: name.trim(),
          department_id: divisionOriginal?.department_id || departmentId,
          status: divisionOriginal?.status || "active",
        },
      },
      unit: {
        url: "/api/admin/units",
        body: {
          unit_code: editing ? code : "",
          unit_name: name.trim(),
          division_id: unitOriginal?.division_id || divisionId,
          status: unitOriginal?.status || "active",
        },
      },
    }[adding];
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editing ? `${config.url}/${editing.id}` : config.url,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config.body),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || "บันทึกไม่สำเร็จ");
      const createdId = json.data?.id;
      const title =
        levels.find((item) => item.key === adding)?.title || "รายการ";
      if (!editing && createdId && adding === "branch") {
        setBranchId(createdId);
        setDepartmentId("");
        setDivisionId("");
      }
      if (!editing && createdId && adding === "department") {
        setDepartmentId(createdId);
        setDivisionId("");
      }
      if (!editing && createdId && adding === "division")
        setDivisionId(createdId);
      setAdding(null);
      setEditing(null);
      setNotice(`${editing ? "แก้ไข" : "เพิ่ม"}${title}เรียบร้อยแล้ว`);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function dependencyCount(level: Level, id: string) {
    if (level === "branch")
      return departments.filter((row) => row.branch_ids?.includes(id)).length;
    if (level === "department")
      return divisions.filter((row) => row.department_id === id).length;
    if (level === "division")
      return units.filter((row) => row.division_id === id).length;
    return 0;
  }

  async function remove() {
    if (!deleting || saving) return;
    setSaving(true);
    setError("");
    try {
      const url = {
        branch: "branches",
        department: "departments",
        division: "divisions",
        unit: "units",
      }[deleting.level];
      const response = await fetch(`/api/admin/${url}/${deleting.id}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || "ลบไม่สำเร็จ");
      if (deleting.level === "branch" && branchId === deleting.id) {
        setBranchId("");
        setDepartmentId("");
        setDivisionId("");
      }
      if (deleting.level === "department" && departmentId === deleting.id) {
        setDepartmentId("");
        setDivisionId("");
      }
      if (deleting.level === "division" && divisionId === deleting.id)
        setDivisionId("");
      setNotice(`ลบ${deleting.name}แล้ว`);
      setDeleting(null);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const rows = {
      branch: visible.branch.map((row) => ({
      id: row.id,
      code: row.branch_code,
      name: row.branch_name,
      detail: "",
      status: row.status,
    })),
    department: visible.department.map((row) => ({
      id: row.id,
      code: row.department_code,
      name: row.department_name,
      detail: "",
      status: row.status,
    })),
    division: visible.division.map((row) => ({
      id: row.id,
      code: row.division_code,
      name: row.division_name,
      detail: "",
      status: row.status,
    })),
    unit: visible.unit.map((row) => ({
      id: row.id,
      code: row.unit_code,
      name: row.unit_name,
      detail: "",
      status: row.status,
    })),
  };

  function select(level: Level, id: string) {
    if (level === "branch") {
      setBranchId(id);
      setDepartmentId("");
      setDivisionId("");
    }
    if (level === "department") {
      setDepartmentId(id);
      setDivisionId("");
    }
    if (level === "division") setDivisionId(id);
  }

  return (
    <div className="space-y-6 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <Settings2 size={28} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">ตั้งค่าโครงสร้างองค์กร</h1>
            <p className="mt-1 text-sm text-slate-500">
              เลือกจากสังกัด แล้วเพิ่มแผนก ฝ่าย และหน่วยตามลำดับ
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} /> รีเฟรช
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหารหัสหรือชื่อในแต่ละระดับ..."
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-emerald-500"
          />
        </label>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        {levels.map((level, index) => {
          const parentReady =
            index === 0 ||
            (index === 1
              ? !!branchId
              : index === 2
                ? !!departmentId
                : !!divisionId);
          const selectedId =
            level.key === "branch"
              ? branchId
              : level.key === "department"
                ? departmentId
                : level.key === "division"
                  ? divisionId
                  : "";
          const parentName =
            level.key === "department"
              ? selectedBranch?.branch_name
              : level.key === "division"
                ? selectedDepartment?.department_name
                : level.key === "unit"
                  ? selectedDivision?.division_name
                  : "";
          const Icon = [Building2, Layers3, UsersRound, Settings2][index];
          return (
            <section
              key={level.key}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-100 p-2.5 text-emerald-600">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">{level.title}</h2>
                    <p className="text-xs text-slate-500">
                      {parentName ? `ใน ${parentName}` : level.caption}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-600">
                  {parentReady ? rows[level.key].length : 0}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openAdd(level.key)}
                disabled={!parentReady || loading || (index === 0 && !companyId)}
                className="mb-4 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <Plus size={19} /> เพิ่ม{level.title}
              </button>
              <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
                {!parentReady ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    {index === 0
                      ? "ยังไม่มีบริษัทที่ใช้งานสำหรับเพิ่มสังกัด"
                      : `เลือก${levels[index - 1].title}ก่อน`}
                  </p>
                ) : loading ? (
                  <p className="p-4 text-center text-sm text-slate-500">
                    กำลังโหลด...
                  </p>
                ) : rows[level.key].length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    ยังไม่มี{level.title}ในรายการนี้
                  </p>
                ) : (
                  rows[level.key].map((row) => (
                    <div
                      key={row.id}
                      className={`rounded-xl border p-2 transition ${selectedId === row.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"}`}
                    >
                      <button
                        type="button"
                        onClick={() => select(level.key, row.id)}
                        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 px-1 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {row.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {row.code}
                            {row.detail ? ` · ${row.detail}` : ""}
                            {row.status !== "active" ? " · ไม่ใช้งาน" : ""}
                          </span>
                        </span>
                        {level.key !== "unit" && (
                          <ChevronRight
                            size={18}
                            className="shrink-0 text-slate-400"
                          />
                        )}
                      </button>
                      <div className="mt-1 flex gap-2 border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => openEdit(level.key, row.id)}
                          className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-gradient-to-b from-amber-300 to-amber-500 px-2 text-sm font-bold text-amber-950 shadow-sm transition hover:from-amber-200 hover:to-amber-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                        >
                          <Pencil size={14} /> แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setDeleting({
                              level: level.key,
                              id: row.id,
                              name: row.name,
                            });
                          }}
                          disabled={dependencyCount(level.key, row.id) > 0}
                          title={
                            dependencyCount(level.key, row.id) > 0
                              ? `มี${levels[index + 1]?.title}อยู่ ต้องจัดการรายการย่อยก่อน`
                              : "ลบรายการ"
                          }
                          className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-gradient-to-b from-red-500 to-red-700 px-2 text-sm font-bold text-white shadow-sm transition hover:from-red-400 hover:to-red-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                          <Trash2 size={14} /> ลบ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {adding && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving)
              setAdding(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-structure-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="add-structure-title" className="text-xl font-bold">
                  {editing ? "แก้ไข" : "เพิ่ม"}
                  {levels.find((item) => item.key === adding)?.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {adding === "branch"
                    ? "กรอกชื่อสังกัด"
                    : `อยู่ภายใต้${adding === "department" ? selectedBranch?.branch_name : adding === "division" ? selectedDepartment?.department_name : selectedDivision?.division_name}`}
                </p>
              </div>
              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setAdding(null)}
                className="cursor-pointer rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <label className="block text-sm font-semibold">
              ชื่อ
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={150}
                autoFocus
                placeholder="กรอกชื่อ"
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-emerald-500"
              />
            </label>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setAdding(null)}
                disabled={saving}
                className="min-h-12 flex-1 cursor-pointer rounded-xl border border-red-600 bg-gradient-to-b from-red-500 to-red-700 font-semibold text-white shadow-sm transition hover:from-red-400 hover:to-red-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={
                  saving ||
                  !name.trim() ||
                  (adding === "branch" && !editing && !companyId)
                }
                className="min-h-12 flex-1 cursor-pointer rounded-xl border border-emerald-600 bg-gradient-to-b from-emerald-400 to-emerald-700 font-semibold text-white shadow-sm transition hover:from-emerald-300 hover:to-emerald-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleting && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-structure-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 id="delete-structure-title" className="text-xl font-bold">
              ยืนยันลบ {deleting.name}?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              ระบบจะตรวจรายการย่อยและพนักงานอีกครั้งก่อนลบ
              หากยังมีการใช้งานจะไม่อนุญาตให้ลบ
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={saving}
                className="min-h-12 flex-1 cursor-pointer rounded-xl border border-red-600 bg-gradient-to-b from-red-500 to-red-700 font-semibold text-white shadow-sm transition hover:from-red-400 hover:to-red-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={saving}
                className="min-h-12 flex-1 cursor-pointer rounded-xl border border-emerald-600 bg-gradient-to-b from-emerald-400 to-emerald-700 font-semibold text-white shadow-sm transition hover:from-emerald-300 hover:to-emerald-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "กำลังลบ..." : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
