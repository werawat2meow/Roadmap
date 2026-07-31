"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {Button,Card,Form,Typography,} from "antd";
import {PlusOutlined,} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import {swalConfirm,swalError,swalSuccess} from "../../../components/Swal";
import { Modal } from "antd"; 
import LoadingOrb from "../../../components/LoadingOrb";
const { Title } = Typography;
const CareerPathSearch = dynamic(() =>import("./components/CareerPathSearch"));
const CareerPathTable = dynamic(() =>import("./components/CareerPathTable"));
const CareerPathModal = dynamic(() =>import("./components/CareerPathModal"), {ssr: false,});
const CareerPathViewDrawer = dynamic(() =>import("./components/CareerPathViewDrawer"), {ssr: false,});

export default function CareerPathsPage() {
  // Permistion
  const [form] = Form.useForm();
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user,"ems.career_paths.view");
  const canCreate = hasPermission(user,"ems.career_paths.create");
  const canEdit = hasPermission(user,"ems.career_paths.edit");
  const canDelete = hasPermission(user, "ems.career_paths.delete");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [careerPaths, setCareerPaths] = useState([]);
  const [families, setFamilies] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] =useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] =useState(false);

  useEffect(() => {
    if (loadingUser) return;
    if (!canView) return;
    loadCareerPaths();
    loadFamilies();
  }, [loadingUser, canView]);

  async function loadCareerPaths(
    currentPage = page,
    currentPageSize = pageSize
  ) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(currentPageSize),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const res = await fetch(
        `/api/admin/career-paths?${params.toString()}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error || "Load Career Paths Failed"
        );
      }

      let rows = json.data || [];

      /* =========================
         Client Filter
      ========================= */

      if (statusFilter !== undefined) {
        rows = rows.filter(
          (item) =>
            item.is_active === statusFilter
        );
      }

      setCareerPaths(rows);

      setPage(currentPage);
      setPageSize(currentPageSize);
      setTotal(
        statusFilter !== undefined
          ? rows.length
          : json.pagination?.total || 0
      );

    } catch (error) {
      console.error(error);

      swalError(
        error.message ||
          "ไม่สามารถโหลดข้อมูล Career Paths ได้"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadFamilies() {
    try {
      const res = await fetch(
        "/api/admin/position-families?all=true"
      );

      const json = await res.json();

      if (json.success) {
        setFamilies(json.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleSearch() {
    setPage(1);

    loadCareerPaths(1, pageSize);
  }

  function handleReset() {

    setSearch("");

    setStatusFilter(undefined);

    setPage(1);

    loadCareerPaths(1, pageSize);
  }

  function handlePageChange(
    nextPage,
    nextPageSize
  ) {
    loadCareerPaths(
      nextPage,
      nextPageSize
    );
  }

  useEffect(() => {
    if (loadingUser) return;
    if (!canView) return;

    loadCareerPaths(1, pageSize);

  }, [loadingUser, canView, statusFilter]);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, canView, loadingUser, router]);

  function handleCreate() {
    setEditingItem(null);

    setModalOpen(true);
  }

  function handleEdit(record) {
    setEditingItem(record);
    setModalOpen(true);
  }

  function handleView(record) {
    setSelectedItem(record);
    setDrawerOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingItem(null);
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setSelectedItem(null);
  }

  async function handleSubmit(values) {
    try {
      setSaving(true);

      const payload = {
        path_code: values.path_code?.trim().toUpperCase(),
        path_name: values.path_name?.trim(),
        position_family_id: values.position_family_id,
        description: values.description?.trim() || null,
        sort_order: Number(values.sort_order) || 0,
        is_active: values.is_active,
      };

      const url = editingItem
        ? `/api/admin/career-paths/${editingItem.id}`
        : "/api/admin/career-paths";

      const method = editingItem
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error ||
            "Save Career Path Failed"
        );
      }

      swalSuccess(
        editingItem
          ? "แก้ไข Career Path สำเร็จ"
          : "สร้าง Career Path สำเร็จ"
      );

      handleCloseModal();

      loadCareerPaths(page, pageSize);

    } catch (error) {
      console.error(error);

      swalError(
        error.message ||
          "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record) {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ ${record.path_name} ใช่หรือไม่ ?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          setLoading(true);

          const res = await fetch(
            `/api/admin/career-paths/${record.id}`,
            {
              method: "DELETE",
            }
          );

          const json = await res.json();

          if (!json.success) {
            throw new Error(
              json.error ||
                "Delete Failed"
            );
          }

          swalSuccess(
            "ลบ Career Path สำเร็จ"
          );

          loadCareerPaths(page, pageSize);

        } catch (error) {
          console.error(error);

          swalError(
            error.message ||
              "ไม่สามารถลบข้อมูลได้"
          );
        } finally {
          setLoading(false);
        }
      },
    });
  }

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <>
      <Card>

        <CareerPathSearch
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loading={loading}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={handleCreate}
          canCreate={canCreate}
        />

        <div style={{ marginTop: 16 }} />

        <CareerPathTable
          data={careerPaths}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
          onView={handleView}
          onEdit={
            canEdit
              ? handleEdit
              : undefined
          }
          onDelete={
            canDelete
              ? handleDelete
              : undefined
          }
        />

      </Card>

      <CareerPathModal
        open={modalOpen}
        form={form}
        loading={saving}
        editingItem={editingItem}
        families={families}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
      />

      <CareerPathViewDrawer
        open={drawerOpen}
        data={selectedItem}
        onClose={handleCloseDrawer}
      />
    </>
  );
}