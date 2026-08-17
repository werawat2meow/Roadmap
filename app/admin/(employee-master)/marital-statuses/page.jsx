"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import MaritalStatusSearch from "./components/MaritalStatusSearch";
import MaritalStatusSummaryCards from "./components/MaritalStatusSummaryCards";
import MaritalStatusTable from "./components/MaritalStatusTable";
import MaritalStatusModal from "./components/MaritalStatusModal";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

export default function MaritalStatusesPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const {user,loadingUser,} = useAuth();

  const canView = hasPermission(user,"ems.marital_statuses.view");
  const canCreate = hasPermission(user,"ems.marital_statuses.create");
  const canEdit = hasPermission(user,"ems.marital_statuses.edit");
  const canDelete = hasPermission(user,"ems.marital_statuses.delete");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] =useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] =useState();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const fetchMaritalStatuses =
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
          `/api/admin/marital-statuses?${params.toString()}`
        );

        const result =
          await res.json();

        if (!res.ok) {
          throw new Error(
            result.error ||
              "ไม่สามารถโหลดข้อมูลสถานภาพสมรสได้"
          );
        }

        setRows(
          result.data ?? []
        );

        setSummary(
          result.summary ?? {}
        );

        setTotal(
          result.pagination
            ?.total ?? 0
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

  /* =========================
      Auth Guard
  ========================= */

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [
    user,
    loadingUser,
    canView,
    router,
  ]);

  /* =========================
      Initial Load
  ========================= */

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchMaritalStatuses();
  }, [
    loadingUser,
    user,
    canView,
    fetchMaritalStatuses,
  ]);
    /* =========================
      Reset Form
  ========================= */

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

  /* =========================
      Create
  ========================= */

  const handleCreate = () => {
    resetForm();

    setOpen(true);
  };

  /* =========================
      View
  ========================= */

  const handleView = async (
    record
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/marital-statuses/${record.id}`
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

  /* =========================
      Edit
  ========================= */

  const handleEdit = async (
    record
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/marital-statuses/${record.id}`
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

  /* =========================
      Close
  ========================= */

  const handleClose = () => {
    setOpen(false);

    resetForm();
  };
    /* =========================
      Save
  ========================= */

  const handleSubmit = async (
    values
  ) => {
    try {
      setSaving(true);

      const isEdit =
        Boolean(editing);

      const url = isEdit
        ? `/api/admin/marital-statuses/${editing.id}`
        : "/api/admin/marital-statuses";

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

      await fetchMaritalStatuses();
    } catch (error) {
      swalError(
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
      Delete
  ========================= */

  const handleDelete = async (record) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/marital-statuses/${record.id}`,
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

      await fetchMaritalStatuses();
    } catch (error) {
      swalError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  };
    /* =========================
      Search
  ========================= */

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

  /* =========================
      Table
  ========================= */

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

  /* =========================
      Loading Guard
  ========================= */

  if (loadingUser) 
    return <LoadingOrb />;
  if (!user) 
    return null;
  if (!canView) 
    return null;
  
  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="สถานภาพสมรส"
            subtitle="Marital Status Management"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มสถานภาพสมรส"
            onCreate={handleCreate}
            onRefresh={
              fetchMaritalStatuses
            }
          />
          <PageInfoAlert description="จัดการข้อมูลสถานภาพสมรสของพนักงาน" />
        </>
      }

      search={
        <MaritalStatusSearch
          loading={loading}
          search={search}
          onSearch={handleSearch}
          status={status}
          onStatusChange={
            handleStatusChange
          }
          onRefresh={
            fetchMaritalStatuses
          }
        />
      }

      summary={
        <MaritalStatusSummaryCards
          summary={summary}
        />
      }

      toolbar={
        null
      }

      table={
        <MaritalStatusTable
          data={rows}
          loading={loading}

          page={page}
          pageSize={pageSize}
          total={total}

          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}

          onChange={handleTableChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      }

      modal={
        <MaritalStatusModal
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
