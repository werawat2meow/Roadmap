"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Form,
} from "antd";

import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import {
  swalError,
  swalSuccess,
} from "@/components/Swal";

import TaxResidencyStatusSearch from "./components/TaxResidencyStatusSearch";
import TaxResidencyStatusSummaryCards from "./components/TaxResidencyStatusSummaryCards";
import TaxResidencyStatusTable from "./components/TaxResidencyStatusTable";
import TaxResidencyStatusModal from "./components/TaxResidencyStatusModal";

async function readJsonResponse(response) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getApiMessage(
  payload,
  fallback
) {
  return (
    payload?.message ||
    payload?.error ||
    fallback
  );
}

export default function TaxResidencyStatusPage() {
  const router =
    useRouter();

  const [form] =
    Form.useForm();

  const {
    user,
    loadingUser,
  } = useAuth();

  const canView =
    hasPermission(
      user,
      "ems.tax_residency.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.tax_residency.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.tax_residency.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "ems.tax_residency.delete"
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({});

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(20);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(null);

  const [
    viewMode,
    setViewMode,
  ] = useState(false);

  const fetchRows =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setLoading(true);

          const params =
            new URLSearchParams({
              page:
                String(page),

              pageSize:
                String(pageSize),
            });

          if (
            search.trim()
          ) {
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

          const response =
            await fetch(
              `/api/admin/tax-residency-status?${params.toString()}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const payload =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                payload,
                "ไม่สามารถโหลดสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
              )
            );
          }

          setRows(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );

          setSummary(
            payload?.summary ||
              {}
          );

          setTotal(
            Number(
              payload?.pagination
                ?.total ||
                0
            )
          );
        } catch (error) {
          console.error(
            "LOAD_TAX_RESIDENCY_STATUS_ERROR:",
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        page,
        pageSize,
        search,
        status,
      ]
    );

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (!canView) {
      router.replace(
        "/admin"
      );
    }
  }, [
    loadingUser,
    user,
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

    const timer =
      setTimeout(
        fetchRows,
        search ? 300 : 0
      );

    return () =>
      clearTimeout(
        timer
      );
  }, [
    loadingUser,
    user,
    canView,
    fetchRows,
    search,
  ]);

  const resetForm = () => {
    form.resetFields();

    form.setFieldsValue({
      residency_code:
        "",

      residency_name_th:
        "",

      residency_name_en:
        "",

      sort_order:
        0,

      status:
        "active",

      remark:
        "",
    });

    setEditing(null);
    setViewMode(false);
  };

  const handleCreate = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษี"
      );

      return;
    }

    resetForm();
    setOpen(true);
  };

  const loadRecord =
    async (
      record,
      asView
    ) => {
      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/admin/tax-residency-status/${record.id}`,
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        const payload =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiMessage(
              payload,
              "ไม่สามารถโหลดสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
            )
          );
        }

        resetForm();

        setEditing(
          payload.data
        );

        setViewMode(
          Boolean(
            asView
          )
        );

        form.setFieldsValue({
          ...payload.data,

          sort_order:
            Number(
              payload.data
                ?.sort_order ||
                0
            ),
        });

        setOpen(true);
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถโหลดสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleView =
    async (
      record
    ) => {
      if (!canView) {
        swalError(
          "คุณไม่มีสิทธิ์ดูสถานะผู้มีถิ่นที่อยู่ทางภาษี"
        );

        return;
      }

      await loadRecord(
        record,
        true
      );
    };

  const handleEdit =
    async (
      record
    ) => {
      if (!canEdit) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษี"
        );

        return;
      }

      await loadRecord(
        record,
        false
      );
    };

  const handleClose = () => {
    if (saving) {
      return;
    }

    setOpen(false);
    resetForm();
  };

  const handleSubmit =
    async (
      values
    ) => {
      const isEdit =
        Boolean(
          editing
        );

      if (
        isEdit &&
        !canEdit
      ) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษี"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษี"
        );

        return;
      }

      try {
        setSaving(true);

        const body = {
          residency_code:
            String(
              values
                .residency_code ||
                ""
            )
              .trim()
              .toLowerCase(),

          residency_name_th:
            String(
              values
                .residency_name_th ||
                ""
            ).trim(),

          residency_name_en:
            String(
              values
                .residency_name_en ||
                ""
            ).trim() ||
            null,

          sort_order:
            Number(
              values
                .sort_order ||
                0
            ),

          status:
            values.status ||
            "active",

          remark:
            String(
              values.remark ||
                ""
            ).trim() ||
            null,
        };

        const response =
          await fetch(
            isEdit
              ? `/api/admin/tax-residency-status/${editing.id}`
              : "/api/admin/tax-residency-status",
            {
              method:
                isEdit
                  ? "PATCH"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  body
                ),
            }
          );

        const payload =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiMessage(
              payload,
              "ไม่สามารถบันทึกสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            (isEdit
              ? "แก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษีเรียบร้อยแล้ว"
              : "เพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษีเรียบร้อยแล้ว")
        );

        handleClose();

        await fetchRows();
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถบันทึกสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDelete =
    async (
      record
    ) => {
      if (!canDelete) {
        swalError(
          "คุณไม่มีสิทธิ์ลบสถานะผู้มีถิ่นที่อยู่ทางภาษี"
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/admin/tax-residency-status/${record.id}`,
            {
              method:
                "DELETE",
            }
          );

        const payload =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiMessage(
              payload,
              "ไม่สามารถลบสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            "ลบสถานะผู้มีถิ่นที่อยู่ทางภาษีเรียบร้อยแล้ว"
        );

        if (
          rows.length ===
            1 &&
          page > 1
        ) {
          setPage(
            (current) =>
              Math.max(
                current -
                  1,
                1
              )
          );

          return;
        }

        await fetchRows();
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถลบสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleSearch = (
    value
  ) => {
    setPage(1);
    setSearch(value);
  };

  const handleStatusChange =
    (
      value
    ) => {
      setPage(1);
      setStatus(value);
    };

  const handleTableChange =
    (
      pagination
    ) => {
      setPage(
        pagination.current
      );

      setPageSize(
        pagination.pageSize
      );
    };

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (!user) {
    return null;
  }

  if (!canView) {
    return null;
  }

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="สถานะผู้มีถิ่นที่อยู่ทางภาษี"
            subtitle="Tax Residency Status"
            loading={
              loading
            }
            canCreate={
              canCreate
            }
            createText="เพิ่มสถานะ"
            onCreate={
              handleCreate
            }
            onRefresh={
              fetchRows
            }
          />

          <PageInfoAlert
            description="ใช้กำหนด Master สถานะผู้มีถิ่นที่อยู่ทางภาษีสำหรับ Employee Tax Profile เช่น ผู้มีถิ่นที่อยู่ทางภาษี และผู้ไม่มีถิ่นที่อยู่ทางภาษี โดยเก็บเป็น Master เพื่อให้ Employee Form และ Payroll ใช้ค่าเดียวกัน"
          />
        </>
      }

      search={
        <TaxResidencyStatusSearch
          loading={
            loading
          }
          search={
            search
          }
          status={
            status
          }
          onSearch={
            handleSearch
          }
          onStatusChange={
            handleStatusChange
          }
          onRefresh={
            fetchRows
          }
        />
      }

      summary={
        <TaxResidencyStatusSummaryCards
          summary={
            summary
          }
        />
      }

      toolbar={
        null
      }

      table={
        <TaxResidencyStatusTable
          data={
            rows
          }
          loading={
            loading
          }

          page={
            page
          }
          pageSize={
            pageSize
          }
          total={
            total
          }

          canView={
            canView
          }
          canEdit={
            canEdit
          }
          canDelete={
            canDelete
          }

          onChange={
            handleTableChange
          }
          onView={
            handleView
          }
          onEdit={
            handleEdit
          }
          onDelete={
            handleDelete
          }
        />
      }

      modal={
        <TaxResidencyStatusModal
          open={
            open
          }
          form={
            form
          }
          editing={
            editing
          }
          viewMode={
            viewMode
          }
          saving={
            saving
          }
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
