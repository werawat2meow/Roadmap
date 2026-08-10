"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import GenderSearch from "./components/GenderSearch";
import GenderSummaryCards from "./components/GenderSummaryCards";
import GenderTable from "./components/GenderTable";
import GenderModal from "./components/GenderModal";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

export default function GendersPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const {user,loadingUser,} = useAuth();

  const canView = hasPermission(user,"ems.genders.view");
  const canCreate = hasPermission(user,"ems.genders.create");
  const canEdit = hasPermission(user,"ems.genders.edit");
  const canDelete = hasPermission(user,"ems.genders.delete");

  const [loading, setLoading] =useState(false);
  const [saving, setSaving] =useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});

  const [page, setPage] =useState(1);
  const [pageSize, setPageSize] =useState(20);
  const [total, setTotal] =useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const fetchGenders =
    useCallback(async () => {
      if (!canView) return;

      try {
        setLoading(true);

        const params =
          new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
          });

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status) {
          params.set(
            "status",
            status
          );
        }

        const res = await fetch(
          `/api/admin/genders?${params.toString()}`
        );

        const result =
          await res.json();

        if (!res.ok) {
          throw new Error(
            result.error ||
            "ไม่สามารถโหลดข้อมูลเพศได้"
          );
        }

        setRows(
          result.data ?? []
        );

        setSummary(
          result.summary ?? {}
        );

        setTotal(
          result.pagination?.total ?? 0
        );
      } catch (error) {
        console.error(error);

        swalError(
          error.message
        );
      } finally {
        setLoading(false);
      }
    }, [
      canView,
      page,
      pageSize,
      search,
      status,
    ]);

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
  }, [
    user,
    loadingUser,
    canView,
    router,
  ]);

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchGenders();
  }, [
    loadingUser,
    user,
    canView,
    fetchGenders,
  ]);

  const resetForm = () => {
    form.resetFields();

    form.setFieldsValue({
      status: "active",
      sort_order: 0,
      is_default: false,
    });

    setEditing(null);
    setViewMode(false);
  };

  const handleCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleView = async (
    record
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/genders/${record.id}`
      );

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error
        );
      }

      resetForm();

      setEditing(result.data);

      setViewMode(true);

      form.setFieldsValue(
        result.data
      );

      setOpen(true);
    } catch (error) {
      swalError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (
    record
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/genders/${record.id}`
      );

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error
        );
      }

      resetForm();

      setEditing(result.data);

      setViewMode(false);

      form.setFieldsValue(
        result.data
      );

      setOpen(true);
    } catch (error) {
      swalError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async (
    values
  ) => {
    try {
      setSaving(true);

      const isEdit =
        Boolean(editing);

      const url = isEdit
        ? `/api/admin/genders/${editing.id}`
        : "/api/admin/genders";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          values
        ),
      });

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error
        );
      }

      await swalSuccess(
        result.message
      );

      handleClose();

      await fetchGenders();
    } catch (error) {
      swalError(
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    record
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/genders/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error
        );
      }

      await swalSuccess(
        result.message
      );

      await fetchGenders();
    } catch (error) {
      swalError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (value) => {
    setPage(1);
    setSearch(value);
  };

  const handleStatusChange = (
    value
  ) => {
    setPage(1);
    setStatus(value);
  };

  const handleTableChange = (
    pagination
  ) => {
    setPage(
      pagination.current
    );

    setPageSize(
      pagination.pageSize
    );
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView)return null;
  
  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="เพศ"
            subtitle="Gender Management"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มข้อมูลเพศ"
            onCreate={handleCreate}
            onRefresh={fetchGenders}
          />
          <PageInfoAlert description="เพศ (Gender) คือ การจำแนกบุคคลตามลักษณะทางเพศ ซึ่งมักใช้ในการจัดการข้อมูลพนักงานในองค์กร เพื่อให้สามารถระบุและจัดการข้อมูลได้อย่างถูกต้องและเหมาะสม" />
        </>
      }

      search={
        <GenderSearch
          loading={loading}
          search={search}
          onSearch={handleSearch}
          status={status}
          onStatusChange={
            handleStatusChange
          }
          onRefresh={fetchGenders}
        />
      }

      summary={
        <GenderSummaryCards
          summary={summary}
        />
      }

      toolbar={
        null
      }

      table={
        <GenderTable
          data={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={
            handleTableChange
          }
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
      }

      modal={
        <GenderModal
          open={open}
          form={form}
          editing={editing}
          viewMode={viewMode}
          saving={saving}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      }
    />
  );
}
