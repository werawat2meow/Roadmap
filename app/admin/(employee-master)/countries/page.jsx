"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import CountrySearch from "./components/CountrySearch";
import CountrySummaryCards from "./components/CountrySummaryCards";
import CountryTable from "./components/CountryTable";
import CountryModal from "./components/CountryModal";
import {swalConfirm,swalError,swalSuccess,} from "@/components/Swal";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

export default function CountriesPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const {user,loadingUser,} = useAuth();
  const canView = hasPermission(user,"ems.countries.view");
  const canCreate = hasPermission(user,"ems.countries.create");
  const canEdit = hasPermission(user,"ems.countries.edit");
  const canDelete = hasPermission(user,"ems.countries.delete");

  // 

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] =useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState(false);


  const fetchCountries = useCallback(async () => {
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
        `/api/admin/countries?${params.toString()}`
      );

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถโหลดข้อมูลประเทศได้"
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
  }, [canView,page,pageSize,search,status,]);

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

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchCountries();
  }, [
    loadingUser,
    user,
    canView,
    fetchCountries,
  ]);

  const resetForm = () => {
    form.resetFields();

    form.setFieldsValue({
      status: "active",

      sort_order: 0,

      is_default: false,

      is_thailand: false,
    });

    setEditing(null);

    setViewMode(false);
  };

  const handleCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มประเทศ");
      return;
    }

    resetForm();
    setOpen(true);
  };

  const handleView = async (record) => {
    if (!canView) {
      swalError("คุณไม่มีสิทธิ์ดูข้อมูลประเทศ");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/countries/${record.id}`
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถโหลดข้อมูลประเทศได้"
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
        error.message ||
          "ไม่สามารถโหลดข้อมูลประเทศได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (record) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขประเทศ");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/countries/${record.id}`
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถโหลดข้อมูลประเทศได้"
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
        error.message ||
          "ไม่สามารถโหลดข้อมูลประเทศได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);

    resetForm();
  };
 
  const handleSubmit = async (values) => {
    const isEdit = Boolean(editing);

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขประเทศ");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มประเทศ");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/countries/${editing.id}`
        : "/api/admin/countries";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถบันทึกข้อมูลประเทศได้"
        );
      }

      await swalSuccess(
        result.message ||
          (isEdit
            ? "แก้ไขข้อมูลประเทศเรียบร้อยแล้ว"
            : "เพิ่มประเทศเรียบร้อยแล้ว")
      );

      handleClose();

      await fetchCountries();
    } catch (error) {
      swalError(
        error.message ||
          "ไม่สามารถบันทึกข้อมูลประเทศได้"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบประเทศ");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/countries/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถลบประเทศได้"
        );
      }

      await swalSuccess(
        result.message ||
          "ลบประเทศเรียบร้อยแล้ว"
      );

      // กรณีลบรายการสุดท้ายของหน้าปัจจุบัน
      if (
        rows.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            Math.max(
              current - 1,
              1
            )
        );
        return;
      }

      await fetchCountries();
    } catch (error) {
      swalError(
        error.message ||
          "ไม่สามารถลบประเทศได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setRows([]);
    setPage(1);
    setSearch(value);
  };

  const handleStatusChange = (
    value
  ) => {
    setPage(1);
    setStatus(value);
  };

  const handleTableChange = (pagination) => {
    setRows([]);
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  console.log("COUNTRY PERMISSIONS", {
  permissions: user?.permissions,
  canView,
  canCreate,
  canEdit,
  canDelete,
});

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;
  
  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="ประเทศ"
            subtitle="Country Management"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มประเทศ"
            onCreate={
              handleCreate
            }
            onRefresh={
              fetchCountries
            }
          />
          <PageInfoAlert description="หน้านี้ใช้กำหนดประเทศที่เกี่ยวข้องกับพนักงาน เช่น ประเทศที่พนักงานสัญชาติ หรือประเทศที่พนักงานทำงานอยู่" />
        </>
      }
      search={
        <CountrySearch
          loading={loading}
          search={search}
          onSearch={
            handleSearch
          }
          status={status}
          onStatusChange={
            handleStatusChange
          }
          onRefresh={
            fetchCountries
          }
        />
      }
      summary={
        <CountrySummaryCards
          summary={summary}
        />
      }
      toolbar={null}
      table={
        <CountryTable
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
        <CountryModal
          open={open}
          form={form}
          editing={editing}
          viewMode={viewMode}
          saving={saving}
          onCancel={
            handleClose
          }
          onSubmit={
            handleSubmit
          }
        />
      }
    />
  );
}