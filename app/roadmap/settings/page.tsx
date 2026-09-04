"use client";

import { useMemo, useState, useEffect } from "react";
import SettingsHeader from "./components/SettingsHeader";
import SettingsTabs from "./components/SettingsTabs";
import CategoryCard from "./components/CategoryCard";
import AddCategoryModal from "./components/AddCategoryModal";
import AccessPermissionsPanel from "./components/AccessPermissionsPanel";
import { swalConfirm, swalError, swalSuccess } from "../../components/Swal";
import SettingsTour from "./components/SettingsTour";

type Item = {
  id: string;
  topic: string;
  weight: number;
  saved?: boolean;
};

type Category = {
  id: string;
  title: string;
  type: string;
  level: string;
  items: Item[];
  department_id?: string;
  division_id?: string;
  unit_id?: string;
};

type Department = { id: string; department_name: string };
type Division = { id: string; division_name: string; department_id: string };
type Unit = { id: string; unit_name: string; division_id: string };

const menuOptions = [
  "Overview",
  "Employee",
  "Evaluate HR",
  "Evaluate MGR",
  "Reports",
  "Management",
  "Send Account",
  "Settings",
];

const tabTypeMap: Record<string, string> = {
  Company: "Company Common Ground",
  Department: "Department Common Ground",
  Expectations: "Expectations",
};

type User = {
  id: string;
  accessId?: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Management" | "ยังไม่กำหนด";
  menus: string[];
};

const LEVEL_ORDER = ["P9", "P8", "P7", "P6", "P5", "P4", "P3", "P2"];

const getLevelIndex = (level: string) =>
  LEVEL_ORDER.indexOf(level) >= 0
    ? LEVEL_ORDER.indexOf(level)
    : LEVEL_ORDER.length;

const sortCategories = (items: Category[]) =>
  [...items].sort((a, b) => {
    const typeOrder = (type: string) =>
      type === "Company Common Ground"
        ? 0
        : type === "Department Common Ground"
          ? 1
          : 2;

    const aType = typeOrder(a.type);
    const bType = typeOrder(b.type);
    if (aType !== bType) return aType - bType;

    return getLevelIndex(a.level) - getLevelIndex(b.level);
  });

export default function SettingsPage() {
  const [tab, setTab] = useState<string>(() => {
    if (typeof window === "undefined") return "ทั้งหมด";
    return localStorage.getItem("roadmapSettingsTab") || "ทั้งหมด";
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const handleTabChange = (nextTab: string) => {
    setTab(nextTab);
    setCurrentPage(1);
  };

  const visibleCategories = useMemo(() => {
    if (tab === "ทั้งหมด") {
      return sortCategories(categories);
    }

    const expectedType = tabTypeMap[tab] ?? tab;
    return sortCategories(
      categories.filter((cat) => cat.type === expectedType),
    );
  }, [tab, categories]);

  const totalPages = Math.max(
    Math.ceil(visibleCategories.length / itemsPerPage),
    1,
  );

  const pagedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return visibleCategories.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleCategories, currentPage]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/roadmap/api/settings");
        const json = await res.json();
        if (res.ok && json.success) {
          setCategories(json.data);
        } else {
          console.error("Load categories failed", json.error);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadLookupData() {
      try {
        const [deptRes, divRes, unitRes] = await Promise.all([
          fetch("/api/admin/departments?all=true"),
          fetch("/api/admin/divisions?all=true"),
          fetch("/api/admin/units?all=true"),
        ]);

        const [deptJson, divJson, unitJson] = await Promise.all([
          deptRes.json(),
          divRes.json(),
          unitRes.json(),
        ]);

        if (deptRes.ok && deptJson.success) setDepartments(deptJson.data);
        if (divRes.ok && divJson.success) setDivisions(divJson.data);
        if (unitRes.ok && unitJson.success) setUnits(unitJson.data);
      } catch (error) {
        console.error("Failed to load department/division/unit lookups", error);
      }
    }

    loadLookupData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("roadmapSettingsTab", tab);
    }
  }, [tab]);

  const handleCreateCategory = async (newCategory: {
    title: string;
    type: string;
    level: string;
    department_id?: string;
    division_id?: string;
    unit_id?: string;
  }) => {
    try {
      const res = await fetch("/roadmap/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCategories((prev) => [
          ...prev,
          { ...json.data, items: json.data.items ?? [] },
        ]);
        setModalOpen(false);
      } else {
        console.error("Create category failed", json.error);
      }
    } catch (error) {
      console.error("Failed to create category", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      swalError("ไม่พบหัวข้อที่จะลบ");
      return;
    }

    if (category.items?.length > 0) {
      swalError(
        "ไม่สามารถลบได้",
        "หัวข้อนี้มีข้อมูลตัวชี้วัดอยู่ ต้องลบรายละเอียดภายในก่อน",
      );
      return;
    }

    const confirmed = await swalConfirm(
      "ยืนยันการลบ",
      "คุณแน่ใจว่าจะลบหัวข้อนี้? การลบจะไม่สามารถกู้คืนได้",
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/roadmap/api/settings/${categoryId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setCategories((prev) => prev.filter((item) => item.id !== categoryId));
        swalSuccess("ลบสำเร็จ");
      } else {
        swalError(
          "ลบไม่สำเร็จ",
          json?.error || `เกิดข้อผิดพลาด (${res.status})`,
        );
      }
    } catch (error) {
      swalError("ลบไม่สำเร็จ", "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("Failed to delete category", error);
    }
  };

  const handleAddItem = async (categoryId: string) => {
    try {
      const res = await fetch("/roadmap/api/settings/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  items: [...category.items, { ...json.data, saved: true }],
                }
              : category,
          ),
        );
      } else {
        console.error("Create item failed", json.error);
      }
    } catch (error) {
      console.error("Failed to add item", error);
    }
  };

  const handleChangeItem = async (
    categoryId: string,
    itemId: string,
    field: "topic" | "weight",
    value: string | number,
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId
                  ? { ...item, [field]: value, saved: false }
                  : item,
              ),
            }
          : category,
      ),
    );

    try {
      const payload: Record<string, string | number> = { id: itemId };
      if (field === "topic") {
        payload.topic = String(value);
      }
      if (field === "weight") {
        payload.weight = Number(value);
      }

      await fetch("/roadmap/api/settings/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to update item", error);
    }
  };

  const handleRemoveItem = async (categoryId: string, itemId: string) => {
    try {
      const res = await fetch(`/roadmap/api/settings/items?id=${itemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  items: category.items.filter((item) => item.id !== itemId),
                }
              : category,
          ),
        );
      } else {
        console.error("Delete item failed", json.error);
      }
    } catch (error) {
      console.error("Failed to remove item", error);
    }
  };

  const handleUpdateCategory = async (
    categoryId: string,
    title: string,
    level: string,
    department_id?: string,
    division_id?: string,
    unit_id?: string,
  ) => {
    try {
      const payload: Record<string, string | undefined> = {
        title,
        level,
      };

      if (department_id) payload.department_id = department_id;
      if (division_id) payload.division_id = division_id;
      if (unit_id) payload.unit_id = unit_id;

      const res = await fetch(`/roadmap/api/settings/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  title,
                  level,
                  department_id,
                  division_id,
                  unit_id,
                }
              : category,
          ),
        );
      } else {
        console.error("Update category failed", json.error);
      }
    } catch (error) {
      console.error("Failed to update category", error);
    }
  };

  const selectedUser = useMemo(() => {
    return users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;
  }, [users, selectedUserId]);

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const hasValidAccessId =
        typeof updatedUser.accessId === "string" &&
        updatedUser.accessId.length > 0 &&
        updatedUser.accessId !== "undefined";

      const url = hasValidAccessId
        ? `/roadmap/api/user-access/${updatedUser.accessId}`
        : "/roadmap/api/user-access";
      const method = hasValidAccessId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: updatedUser.id,
          role: updatedUser.role,
          menus: updatedUser.menus,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        console.error("Save failed", json.error || `Status ${res.status}`);
        return updatedUser;
      }

      const nextUser: User = {
        ...updatedUser,
        accessId: json.data?.id ?? updatedUser.accessId,
      };

      setUsers((prev) =>
        prev.map((user) => (user.id === nextUser.id ? nextUser : user)),
      );

      setSelectedUserId(nextUser.id); // <--- เพิ่ม

      return nextUser;
    } catch (error) {
      console.error("Failed to save user access", error);
      return updatedUser;
    }
  };

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);

      try {
        await fetch("/roadmap/api/user-access/sync-from-portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const [employeesRes, accessRes] = await Promise.all([
          fetch("/roadmap/api/employees"),
          fetch("/roadmap/api/user-access"),
        ]);

        const employeesJson = await employeesRes.json();
        const accessJson = await accessRes.json();

        const accessMap = new Map<string, any>();

        if (accessJson.success && Array.isArray(accessJson.data)) {
          for (const item of accessJson.data) {
            if (item.employee_id) {
              accessMap.set(item.employee_id, item);
            }
          }
        }

        const mappedUsers =
          employeesJson.success && Array.isArray(employeesJson.data)
            ? employeesJson.data
                .map((item: any) => {
                  const access = accessMap.get(item.id);

                  return {
                    id: item.id,
                    accessId: access?.id,
                    name: item.name,
                    email: item.email ?? "",
                    role: access?.role ?? "ยังไม่กำหนด",
                    menus: access?.menus ?? [],
                  } as User;
                })
                .filter((user: User) => Boolean(user.accessId))
            : [];

        setUsers(mappedUsers);

        if (mappedUsers.length > 0) {
          setSelectedUserId(mappedUsers[0].id);
        } else {
          setSelectedUserId("");
        }
      } catch (error) {
        console.error("Failed to load users", error);
        setUsers([]);
        setSelectedUserId("");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <div className="p-6 lg:p-10">
      <SettingsHeader
        description={
          tab === "สิทธิ์การเข้าถึง"
            ? "จัดการสิทธิ์การเข้าถึงของผู้ใช้ในระบบ"
            : "จัดการหัวข้อและตัวชี้วัดการประเมิน"
        }
        onAdd={
          tab !== "สิทธิ์การเข้าถึง" ? () => setModalOpen(true) : undefined
        }
      />

      <SettingsTabs activeTab={tab} onChange={handleTabChange} />

      <div className="space-y-6 mt-6">
        {tab === "สิทธิ์การเข้าถึง" ? (
          <AccessPermissionsPanel
            users={users}
            selectedUserId={selectedUserId}
            selectedUser={
              selectedUser ?? {
                id: "",
                name: "",
                email: "",
                role: "ยังไม่กำหนด",
                menus: [],
              }
            }
            menuOptions={menuOptions}
            onSelectUser={setSelectedUserId}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <>
            <div className="space-y-6">
              {pagedCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  departments={departments}
                  divisions={divisions}
                  units={units}
                  onUpdate={handleUpdateCategory}
                  onDelete={() => handleDeleteCategory(category.id)}
                  onAddItem={handleAddItem}
                  onChangeItem={handleChangeItem}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-4 mt-6 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  แสดงข้อมูล {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    visibleCategories.length,
                  )}{" "}
                  จากทั้งหมด {visibleCategories.length} รายการ
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === page
                              ? "bg-blue-600 text-white font-bold"
                              : "text-slate-600 bg-white hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            <AddCategoryModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onCreate={handleCreateCategory}
            />
          </>
        )}
      </div>
      <SettingsTour />
    </div>
  );
}
