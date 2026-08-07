"use client";

import { useEffect, useState } from "react";
import { Card, Typography, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import { swalConfirm, swalSuccess, swalError } from "@/app/components/Swal";
import EmployeeSkillSearch from "./components/EmployeeSkillSearch";
import EmployeeSkillTable from "./components/EmployeeSkillTable";
import EmployeeSkillPagination from "./components/EmployeeSkillPagination";
import EmployeeSkillModal from "./components/EmployeeSkillModal";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  employeeId: "",
  skillId: "",
  categoryId: "",
  importanceLevel: "",
  isVerified: "",
};

export default function EmployeeSkillPage() {
  const router = useRouter();
  const { user, loadingUser: authLoading } = useAuth();
  const { Text } = Typography;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openModal, setOpenModal] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const canView = hasPermission(user, "ems.employee_skills.view");
  const canCreate = hasPermission(user, "ems.employee_skills.create");
  const canEdit = hasPermission(user, "ems.employee_skills.edit");
  const canDelete = hasPermission(user, "ems.employee_skills.delete");
  const canImport = hasPermission(user, "ems.employee_skills.import");
  const canExport = hasPermission(user, "ems.employee_skills.export");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canView) {
      router.replace("/admin");
    }
  }, [authLoading, user, canView, router]);

  async function loadData() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", page);
      params.set("pageSize", pageSize);

      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.employeeId) params.set("employee_id", filters.employeeId);
      if (filters.skillId) params.set("skill_id", filters.skillId);
      if (filters.categoryId) params.set("category_id", filters.categoryId);
      if (filters.importanceLevel) params.set("importance_level", filters.importanceLevel);
      if (filters.isVerified !== "") params.set("is_verified", filters.isVerified);

      const res = await fetch(`/api/admin/employee-skills?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setData(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [authLoading, user, page, pageSize, filters]);

  const reloadData = () => loadData();

  const handleExport = () => {
    swalError("ยังไม่ได้พัฒนาฟังก์ชัน Export");
  };

  const handleCreate = () => {
    if (!canCreate) return swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูล");
    setEditingData(null);
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    if (!canEdit) return swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
    setEditingData(row);
    setOpenModal(true);
  };

  const handleSave = async (values) => {
    if (!editingData && !canCreate) return swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูล");
    if (editingData && !canEdit) return swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูล");

    try {
      setSaving(true);
      const isEdit = !!editingData;
      const url = isEdit
        ? `/api/admin/employee-skills/${editingData.id}`
        : "/api/admin/employee-skills";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      await swalSuccess(isEdit ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ");
      setOpenModal(false);
      setEditingData(null);
      reloadData();
    } catch (err) {
      swalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canDelete) return swalError("คุณไม่มีสิทธิ์ลบข้อมูล");

    const ok = await swalConfirm({
      title: "ยืนยันการลบ",
      text: `ต้องการลบ Skill ของ ${row.employee_name} ใช่หรือไม่?`,
      confirmButtonText: "ลบ",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/employee-skills/${row.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "ลบข้อมูลไม่สำเร็จ");
      }

      await swalSuccess("ลบข้อมูลสำเร็จ");
      reloadData();
    } catch (err) {
      swalError(err.message);
    }
  };

  const handleImport = () => {
    swalError("ยังไม่ได้พัฒนาฟังก์ชัน Import");
  }

  const updateFilter = (key) => (value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
  };

  if (authLoading )return <LoadingOrb />;
  if (!user || !canView) return null;

  return (
    <>
      <Card variant="borderless" title="Employee Skills">

         <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          closable
          title="เกี่ยวกับ Employee Skills"
          description={
            <Text type="secondary">
              Employee Skills คือข้อมูลทักษะของพนักงานแต่ละคน แสดงระดับทักษะปัจจุบัน (Current Level)
              เทียบกับระดับเป้าหมาย (Target Level) พร้อมระบุระดับความสำคัญ (Importance)
              ของทักษะนั้นต่อตำแหน่งงาน และสถานะการยืนยันความถูกต้อง (Verified)
              ใช้สำหรับวิเคราะห์ช่องว่างทักษะ (Skill Gap) และวางแผนพัฒนาบุคลากรรายบุคคล
            </Text>
          }
          style={{ marginBottom: 16 }}
        />
        
        <EmployeeSkillSearch
          search={filters.search}
          onSearchChange={updateFilter("search")}
          status={filters.status}
          onStatusChange={updateFilter("status")}
          employeeId={filters.employeeId}
          onEmployeeChange={updateFilter("employeeId")}
          skillId={filters.skillId}
          onSkillChange={updateFilter("skillId")}
          categoryId={filters.categoryId}
          onCategoryChange={updateFilter("categoryId")}
          importanceLevel={filters.importanceLevel}
          onImportanceLevelChange={updateFilter("importanceLevel")}
          isVerified={filters.isVerified}
          onVerifiedChange={updateFilter("isVerified")}
          canCreate={canCreate}
          canExport={canExport}
          canImport={canImport}
          onAdd={handleCreate}
          onRefresh={reloadData}
          onExport={handleExport}
          onImport={handleImport}
        />

        <EmployeeSkillTable
          loading={loading}
          data={data}
          canEdit={canEdit}
          canDelete={canDelete}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />

        <EmployeeSkillPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
        />
      </Card>

      <EmployeeSkillModal
        open={openModal}
        editingData={editingData}
        loading={saving}
        onCancel={() => {
          setOpenModal(false);
          setEditingData(null);
        }}
        onSubmit={handleSave}
      />
    </>
  );
}