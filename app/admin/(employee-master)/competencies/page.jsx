"use client";

import { useEffect, useState } from "react";
import { Card, Button, message, Alert , Typography } from "antd";
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import {
  CompetencySearch,
  CompetencyTable,
  CompetencyPagination,
  CompetencyModal,
} from "./components";

export default function CompetenciesPage() {
  const { Text } = Typography;
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

  const canView = hasPermission(user,"ems.competencies.view");
  const canCreate = hasPermission(user,"ems.competencies.create");
  const canEdit = hasPermission(user,"ems.competencies.edit");
  const canDelete = hasPermission(user,"ems.competencies.delete");

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
        `/api/admin/competencies?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            "โหลดข้อมูล Competency ไม่สำเร็จ"
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

      message.error(
        err.message ||
          "โหลดข้อมูล Competency ไม่สำเร็จ"
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

  if (loadingUser) return <LoadingOrb />;
  
  if (!user || !canView) {
    return null;
  }
    return (
    <Card
      variant="borderless"
      title="Competencies"
      extra={
        canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            เพิ่ม Competency
          </Button>
        )
      }
    >

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        closable
        title="เกี่ยวกับ Competency"
        description={
          <Text type="secondary">
            Competency คือทักษะ ความรู้ หรือคุณสมบัติเฉพาะที่ใช้ประเมิน
            และกำหนดมาตรฐานของพนักงานในแต่ละตำแหน่งงาน
            คุณสามารถเพิ่ม แก้ไข หรือกำหนดประเภท Competency
            เพื่อนำไปใช้ในการประเมินผลงานและวางแผนพัฒนาบุคลากรได้ที่นี่
          </Text>
        }
        style={{ marginBottom: 16 }}
      />

      <CompetencySearch
        loading={loading}
        filters={filters}
        onSearch={handleSearch}
      />

      <CompetencyTable
        loading={loading}
        data={data}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
      />

      <CompetencyPagination
        pagination={pagination}
        onChange={handlePageChange}
      />

      <CompetencyModal
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