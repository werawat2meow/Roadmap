"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import {SkillSearch,SkillTable,SkillPagination,SkillModal,} from "./components";

export default function SkillsPage() {
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
  const initialLoaded = useRef(false);

  const canView = hasPermission(user,"ems.skills.view");
  const canCreate = hasPermission(user,"ems.skills.create");
  const canEdit = hasPermission(user,"ems.skills.edit");
  const canDelete = hasPermission(user,"ems.skills.delete");

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
        `/api/admin/skills?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            "โหลดข้อมูล Skill ไม่สำเร็จ"
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
          "โหลดข้อมูล Skill ไม่สำเร็จ"
      );

    } finally {
      setLoading(false);
    }
  };

  const checkedRef = useRef(false);

  useEffect(() => {
    if (loadingUser) return;

    if (checkedRef.current) return;
    checkedRef.current = true;

    if (!user) {
      router.replace("/login");
      return;
    }
  }, [loadingUser, user, router]);
  
  useEffect(() => {
    if (loadingUser) return;
    if (!canView) return;

    if (initialLoaded.current) return;

    initialLoaded.current = true;

    loadData(
      pagination.page,
      pagination.pageSize,
      filters.search,
      filters.status
    );
  }, [loadingUser, canView]);

  /* ===========================================
   * Search
   * =========================================== */

  const handleSearch = ({
    search,
    status,
  }) => {
    const nextFilters = {
      search,
      status,
    };

    setFilters(nextFilters);

    loadData(
      1,
      pagination.pageSize,
      search,
      status
    );
  };

  /* ===========================================
   * Pagination
   * =========================================== */

  const handlePageChange = (
    page,
    pageSize
  ) => {
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

    if (loadingUser) {
    return <LoadingOrb />;
  }

  if (!user || !canView) {
    return null;
  }

  return (
    <Card
      title="Skills"
      extra={
        canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            เพิ่ม Skill
          </Button>
        )
      }
    >
      <SkillSearch
        loading={loading}
        filters={filters}
        onSearch={handleSearch}
      />

      <SkillTable
        loading={loading}
        data={data}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
      />

      <SkillPagination
        pagination={pagination}
        onChange={handlePageChange}
      />

      <SkillModal
        open={modalOpen}
        item={editingItem}
        loading={loading}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleSaveSuccess}
      />
    </Card>
  );
}