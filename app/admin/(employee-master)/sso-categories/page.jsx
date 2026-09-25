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

import SsoCategorySearch from "./components/SsoCategorySearch";
import SsoCategorySummaryCards from "./components/SsoCategorySummaryCards";
import SsoCategoryTable from "./components/SsoCategoryTable";
import SsoCategoryModal from "./components/SsoCategoryModal";

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getApiMessage(payload, fallback) {
  return (
    payload?.message ||
    payload?.error ||
    fallback
  );
}

export default function SsoCategoriesPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const {
    user,
    loadingUser,
  } = useAuth();

  const canView =
    hasPermission(
      user,
      "ems.sso_categories.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.sso_categories.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.sso_categories.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "ems.sso_categories.delete"
    );

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [rows, setRows] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(20);

  const [total, setTotal] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState();

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [viewMode, setViewMode] =
    useState(false);

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

          const response =
            await fetch(
              `/api/admin/sso-categories?${params.toString()}`,
              {
                method: "GET",
                cache: "no-store",
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
                "ไม่สามารถโหลดประเภทผู้ประกันตนได้"
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
                ?.total || 0
            )
          );
        } catch (error) {
          console.error(
            "LOAD_SSO_CATEGORIES_ERROR:",
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดประเภทผู้ประกันตนได้"
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
      clearTimeout(timer);
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

      category_name_th:
        "",

      category_name_en:
        "",

      section_no:
        null,

      requires_employer_registration:
        true,

      is_default:
        false,

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
        "คุณไม่มีสิทธิ์เพิ่มประเภทผู้ประกันตน"
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
            `/api/admin/sso-categories/${record.id}`,
            {
              method: "GET",
              cache: "no-store",
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
              "ไม่สามารถโหลดประเภทผู้ประกันตนได้"
            )
          );
        }

        resetForm();

        setEditing(
          payload.data
        );

        setViewMode(
          Boolean(asView)
        );

        form.setFieldsValue({
          ...payload.data,

          section_no:
            payload.data
              ?.section_no ??
            null,

          sort_order:
            Number(
              payload.data
                ?.sort_order ||
                0
            ),

          requires_employer_registration:
            Boolean(
              payload.data
                ?.requires_employer_registration
            ),

          is_default:
            Boolean(
              payload.data
                ?.is_default
            ),
        });

        setOpen(true);
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถโหลดประเภทผู้ประกันตนได้"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleView =
    async (record) => {
      if (!canView) {
        swalError(
          "คุณไม่มีสิทธิ์ดูประเภทผู้ประกันตน"
        );

        return;
      }

      await loadRecord(
        record,
        true
      );
    };

  const handleEdit =
    async (record) => {
      if (!canEdit) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขประเภทผู้ประกันตน"
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
    async (values) => {
      const isEdit =
        Boolean(editing);

      if (
        isEdit &&
        !canEdit
      ) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขประเภทผู้ประกันตน"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มประเภทผู้ประกันตน"
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
              .toLowerCase(),

          category_name_th:
            String(
              values
                .category_name_th ||
                ""
            ).trim(),

          category_name_en:
            String(
              values
                .category_name_en ||
                ""
            ).trim() ||
            null,

          section_no:
            values
              .section_no ===
              null ||
            values
              .section_no ===
              undefined ||
            values
              .section_no ===
              ""
              ? null
              : Number(
                  values
                    .section_no
                ),

          requires_employer_registration:
            Boolean(
              values
                .requires_employer_registration
            ),

          is_default:
            Boolean(
              values
                .is_default
            ),

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
              ? `/api/admin/sso-categories/${editing.id}`
              : "/api/admin/sso-categories",
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
              "ไม่สามารถบันทึกประเภทผู้ประกันตนได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            (isEdit
              ? "แก้ไขประเภทผู้ประกันตนเรียบร้อยแล้ว"
              : "เพิ่มประเภทผู้ประกันตนเรียบร้อยแล้ว")
        );

        handleClose();

        await fetchRows();
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถบันทึกประเภทผู้ประกันตนได้"
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDelete =
    async (record) => {
      if (!canDelete) {
        swalError(
          "คุณไม่มีสิทธิ์ลบประเภทผู้ประกันตน"
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/admin/sso-categories/${record.id}`,
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
              "ไม่สามารถลบประเภทผู้ประกันตนได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            "ลบประเภทผู้ประกันตนเรียบร้อยแล้ว"
        );

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

        await fetchRows();
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถลบประเภทผู้ประกันตนได้"
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
    (value) => {
      setPage(1);
      setStatus(value);
    };

  const handleTableChange =
    (pagination) => {
      setPage(
        pagination.current
      );

      setPageSize(
        pagination.pageSize
      );
    };

  if (loadingUser) {
    return <LoadingOrb />;
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
            title="ประเภทผู้ประกันตน"
            subtitle="Social Security Insured Categories"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มประเภทผู้ประกันตน"
            onCreate={
              handleCreate
            }
            onRefresh={
              fetchRows
            }
          />

          <PageInfoAlert
            description="ใช้กำหนดประเภทผู้ประกันตนสำหรับข้อมูลประกันสังคมของพนักงาน เช่น มาตรา 33, มาตรา 39 และมาตรา 40 โดยแยก Master ออกจาก Employee Form เพื่อให้ระบบนำไปใช้ซ้ำและควบคุมสถานะได้"
          />
        </>
      }

      search={
        <SsoCategorySearch
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
        <SsoCategorySummaryCards
          summary={
            summary
          }
        />
      }

      toolbar={null}

      table={
        <SsoCategoryTable
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
        <SsoCategoryModal
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
