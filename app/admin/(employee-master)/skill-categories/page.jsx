"use client";

import { useEffect, useState } from "react";
import { Card, Button, message, Alert , Typography } from "antd";
import { PlusOutlined , InfoCircleOutlined } from "@ant-design/icons";
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
  const { Text } = Typography;
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

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [loadingUser, user, canView, router]);

  /* ===========================================
   * Search
   * =========================================== */

  const handleSearch = ({ search, status }) => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));

    setFilters({
      search,
      status,
    });
  };

  const handlePageChange = (page, pageSize) => {
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
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        closable
        title="เกี่ยวกับ Skill Categories"
        description={
          <Text type="secondary">
            Skill Categories คือหมวดหมู่ที่ใช้จัดกลุ่มทักษะ (Skills) ของพนักงาน
            เช่น ทักษะด้านเทคนิค ทักษะด้านการบริหาร หรือทักษะด้านภาษา
            เพื่อให้ง่ายต่อการจัดระเบียบและค้นหาทักษะเมื่อนำไปใช้ประเมินหรือกำหนดคุณสมบัติของพนักงานในแต่ละตำแหน่ง
          </Text>
        }
        style={{ marginBottom: 16 }}
      />

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