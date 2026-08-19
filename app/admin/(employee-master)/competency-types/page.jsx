"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import LoadingOrb from "@/app/components/LoadingOrb";
import { swalError } from "@/app/components/Swal";

import {
  CompetencyTypeSearch,
  CompetencyTypeTable,
  CompetencyTypePagination,
  CompetencyTypeModal,
} from "./components";

export default function CompetencyTypesPage() {
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

  const canView = hasPermission(user,"ems.competency_types.view");
  const canCreate = hasPermission(user,"ems.competency_types.create");
  const canEdit = hasPermission(user,"ems.competency_types.edit");
  const canDelete = hasPermission(user,"ems.competency_types.delete");

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
        `/api/admin/competency-types?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            "โหลดข้อมูล Competency Type ไม่สำเร็จ"
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
          "โหลดข้อมูล Competency Type ไม่สำเร็จ"
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

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    setModalOpen(true);
  };

  const reloadData = () => {
    loadData(
      pagination.page,
      pagination.pageSize,
      filters.search,
      filters.status
    );
  };

  const handleSaveSuccess = () => {
    setModalOpen(false);
    setEditingItem(null);

    reloadData();
  };

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
    <div className="space-y-4">
      <Card variant="borderless">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">
              Competency Types
            </h2>
            <p className="text-gray-500">
              จัดการประเภทของ Competency
            </p>
          </div>

          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              เพิ่ม Competency Type
            </Button>
          )}
        </div>
      </Card>

      <Card variant="borderless">
        <CompetencyTypeSearch
          filters={filters}
          onSearch={handleSearch}
        />
      </Card>

      <Card variant="borderless">
        <CompetencyTypeTable
          loading={loading}
          data={data}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDeleteSuccess={handleDeleteSuccess}
        />

        <CompetencyTypePagination
          pagination={pagination}
          onChange={handlePageChange}
        />
      </Card>

      <CompetencyTypeModal
        open={modalOpen}
        item={editingItem}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleSaveSuccess}
      />
    </div>
  );
}