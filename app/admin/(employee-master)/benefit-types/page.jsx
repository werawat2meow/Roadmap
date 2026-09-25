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

import BenefitTypeSearch from "./components/BenefitTypeSearch";
import BenefitTypeSummaryCards from "./components/BenefitTypeSummaryCards";
import BenefitTypeTable from "./components/BenefitTypeTable";
import BenefitTypeModal from "./components/BenefitTypeModal";

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

export default function BenefitTypesPage() {
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
      "benefits.benefit_types.view"
    );

  const canCreate =
    hasPermission(
      user,
      "benefits.benefit_types.create"
    );

  const canEdit =
    hasPermission(
      user,
      "benefits.benefit_types.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "benefits.benefit_types.delete"
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

          if (
            status !==
              undefined &&
            status !==
              null
          ) {
            params.set(
              "status",
              status
                ? "active"
                : "inactive"
            );
          }

          const response =
            await fetch(
              `/api/admin/benefit-types?${params.toString()}`,
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
                "ไม่สามารถโหลดประเภทสวัสดิการได้"
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
              payload
                ?.pagination
                ?.total ||
                0
            )
          );
        } catch (error) {
          console.error(
            "LOAD_BENEFIT_TYPES_ERROR:",
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดประเภทสวัสดิการได้"
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
      category_code:
        "",

      category_name:
        "",

      description:
        "",

      sort_order:
        0,

      is_active:
        true,
    });

    setEditing(null);
    setViewMode(false);
  };

  const handleCreate = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มประเภทสวัสดิการ"
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
            `/api/admin/benefit-types/${record.id}`,
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
              "ไม่สามารถโหลดประเภทสวัสดิการได้"
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

          is_active:
            Boolean(
              payload.data
                ?.is_active
            ),
        });

        setOpen(true);
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถโหลดประเภทสวัสดิการได้"
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
          "คุณไม่มีสิทธิ์ดูประเภทสวัสดิการ"
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
          "คุณไม่มีสิทธิ์แก้ไขประเภทสวัสดิการ"
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
          "คุณไม่มีสิทธิ์แก้ไขประเภทสวัสดิการ"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มประเภทสวัสดิการ"
        );

        return;
      }

      try {
        setSaving(true);

        const body = {
          category_code:
            String(
              values
                .category_code ||
                ""
            )
              .trim()
              .toUpperCase(),

          category_name:
            String(
              values
                .category_name ||
                ""
            ).trim(),

          description:
            String(
              values
                .description ||
                ""
            ).trim() ||
            null,

          sort_order:
            Number(
              values
                .sort_order ||
                0
            ),

          is_active:
            Boolean(
              values
                .is_active
            ),
        };

        const response =
          await fetch(
            isEdit
              ? `/api/admin/benefit-types/${editing.id}`
              : "/api/admin/benefit-types",
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
              "ไม่สามารถบันทึกประเภทสวัสดิการได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            (isEdit
              ? "แก้ไขประเภทสวัสดิการเรียบร้อยแล้ว"
              : "เพิ่มประเภทสวัสดิการเรียบร้อยแล้ว")
        );

        handleClose();

        await fetchRows();
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถบันทึกประเภทสวัสดิการได้"
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
          "คุณไม่มีสิทธิ์ลบประเภทสวัสดิการ"
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/admin/benefit-types/${record.id}`,
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
              "ไม่สามารถลบประเภทสวัสดิการได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            "ลบประเภทสวัสดิการเรียบร้อยแล้ว"
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
            "ไม่สามารถลบประเภทสวัสดิการได้"
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
            title="ประเภทสวัสดิการ"
            subtitle="Benefit Types"
            loading={
              loading
            }
            canCreate={
              canCreate
            }
            createText="เพิ่มประเภทสวัสดิการ"
            onCreate={
              handleCreate
            }
            onRefresh={
              fetchRows
            }
          />

          <PageInfoAlert
            description="จัดการหมวดประเภทสวัสดิการที่ใช้เป็น Master ของ Benefit System เช่น สุขภาพ อาหาร ที่พัก การเดินทาง และสวัสดิการอื่น ๆ โดย Benefit Plan และ Policy Rule จะอ้างอิงข้อมูลจาก Master นี้"
          />
        </>
      }

      search={
        <BenefitTypeSearch
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
        <BenefitTypeSummaryCards
          summary={
            summary
          }
        />
      }

      toolbar={
        null
      }

      table={
        <BenefitTypeTable
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
        <BenefitTypeModal
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
