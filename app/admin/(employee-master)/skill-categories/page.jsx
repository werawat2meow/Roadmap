"use client";

import { useEffect, useState } from "react";
import { Card, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import LoadingOrb from "../../../components/LoadingOrb";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import {
  SkillCategorySearch,
  SkillCategoryTable,
  SkillCategoryPagination,
  SkillCategoryModal,
} from "./components";

export default function SkillCategoriesPage() {
  const { user, loadingUser } = useAuth();
   const router = useRouter();
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

  const canView = hasPermission(user,"ems.skill_categories.view");
  const canCreate = hasPermission(user,"ems.skill_categories.create");
  const canEdit = hasPermission(user,"ems.skill_categories.edit");
  const canDelete = hasPermission(user,"ems.skill_categories.delete");

  /* ===========================================
   * Load Data
   * =========================================== */

  const loadData = async (
    page = pagination.page,
    pageSize = pagination.pageSize,
    search = filters.search,
    status = filters.status
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
        `/api/admin/skill-categories?${params}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      setData(json.data || []);

      setPagination(json.pagination);

    } catch (err) {
      console.error(err);

      message.error(
        err.message || "โหลดข้อมูลไม่สำเร็จ"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
    loadData();
  }, [loadingUser, user, canView, router]);
  /* ===========================================
   * Search
   * =========================================== */

  const handleSearch = ({ search, status }) => {
    const nextFilters = {
      search,
      status,
    };

    setFilters(nextFilters);

    loadData(1, pagination.pageSize, search, status);
  };

  const handlePageChange = (page, pageSize) => {
    loadData(
      page,
      pageSize,
      filters.search,
      filters.status
    );
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
   * Save
   * =========================================== */

  const handleSaveSuccess = () => {
    setModalOpen(false);
    setEditingItem(null);

    loadData(
      pagination.page,
      pagination.pageSize,
      filters.search,
      filters.status
    );
  };

  /* ===========================================
   * Delete
   * =========================================== */

  const handleDeleteSuccess = () => {
    loadData(
      pagination.page,
      pagination.pageSize,
      filters.search,
      filters.status
    );
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  return (
    <Card
      title="Skill Categories"
      extra={
        canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            เพิ่มหมวดหมู่ทักษะ
          </Button>
        )
      }
    >
      <SkillCategorySearch
        loading={loading}
        filters={filters}
        onSearch={handleSearch}
      />

      <SkillCategoryTable
        loading={loading}
        data={data}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
      />

      <SkillCategoryPagination
        pagination={pagination}
        onChange={handlePageChange}
      />

      <SkillCategoryModal
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