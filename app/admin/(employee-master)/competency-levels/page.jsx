"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import LoadingOrb from "@/app/components/LoadingOrb";
import { swalError } from "@/app/components/Swal";

import {
  CompetencyLevelSearch,
  CompetencyLevelTable,
  CompetencyLevelPagination,
  CompetencyLevelModal,
} from "./components";

export default function CompetencyLevelsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  /* ===========================================
   * Permission
   * =========================================== */

  const canView = hasPermission(user,"ems.competency_levels.view");
  const canCreate = hasPermission(user,"ems.competency_levels.create");
  const canEdit = hasPermission(user,"ems.competency_levels.edit");
  const canDelete = hasPermission(user,"ems.competency_levels.delete");

  /* ===========================================
   * Load Data
   * =========================================== */

  const loadData = async (
    page,
    pageSize,
    search,
    status
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        pageSize,
      });

      if (search) {
        params.append("search", search);
      }

      if (status) {
        params.append("status", status);
      }

      const res = await fetch(
        `/api/admin/competency-levels?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            "โหลดข้อมูล Competency Level ไม่สำเร็จ"
        );
      }

      setData(json.data || []);

      setPagination(
        json.pagination || {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 1,
        }
      );

    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "โหลดข้อมูล Competency Level ไม่สำเร็จ"
      );

    } finally {
      setLoading(false);
    }
  };
  /* ===========================================
   * Auto Load
   * =========================================== */

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
      return;
    }
  }, [loadingUser, user, canView, router]);

  useEffect(() => {
    if (loadingUser) return;
    if (!user) return;
    if (!canView) return;

    const timer = setTimeout(() => {
      loadData(
        pagination.page,
        pagination.pageSize,
        filters.search,
        filters.status
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    filters.search,
    filters.status,
    pagination.page,
    pagination.pageSize,
    loadingUser,
    user,
    canView,
  ]);

  /* ===========================================
   * Search
   * =========================================== */

  const handleSearch = ({
    search,
    status,
  }) => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));

    setFilters({
      search,
      status,
    });
  };

  /* ===========================================
   * Pagination
   * =========================================== */

  const handlePageChange = (
    page,
    pageSize
  ) => {
    setPagination((prev) => ({
      ...prev,
      page,
      pageSize,
    }));
  };

  /* ===========================================
   * Create
   * =========================================== */

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  /* ===========================================
   * Edit
   * =========================================== */

  const handleEdit = (record) => {
    setEditingItem(record);
    setModalOpen(true);
  };

  /* ===========================================
   * Reload
   * =========================================== */

  const reloadData = () => {
    loadData(
      pagination.page,
      pagination.pageSize,
      filters.search,
      filters.status
    );
  };

  /* ===========================================
   * Save
   * =========================================== */

  const handleSaveSuccess = () => {
    setModalOpen(false);
    setEditingItem(null);

    reloadData();
  };

  /* ===========================================
   * Delete
   * =========================================== */

  const handleDeleteSuccess = () => {
    reloadData();
  };

  if (loadingUser) {
    return <LoadingOrb />;
  }

  if (!user || !canView) {
    return null;
  }

  return (
    <Card
      variant="borderless"
      title="Competency Levels"
      extra={
        canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            เพิ่ม Competency Level
          </Button>
        )
      }
    >
      <CompetencyLevelSearch
        loading={loading}
        filters={filters}
        onSearch={handleSearch}
      />

      <CompetencyLevelTable
        loading={loading}
        data={data}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
      />

      <CompetencyLevelPagination
        pagination={pagination}
        onChange={handlePageChange}
      />

      <CompetencyLevelModal
        open={modalOpen}
        item={editingItem}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleSaveSuccess}
      />
    </Card>
  );
}