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

import BenefitPlanSearch from "./components/BenefitPlanSearch";
import BenefitPlanSummaryCards from "./components/BenefitPlanSummaryCards";
import BenefitPlanTable from "./components/BenefitPlanTable";
import BenefitPlanModal from "./components/BenefitPlanModal";

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

export default function BenefitPlansPage() {
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
      "benefits.benefit_plans.view"
    );

  const canCreate =
    hasPermission(
      user,
      "benefits.benefit_plans.create"
    );

  const canEdit =
    hasPermission(
      user,
      "benefits.benefit_plans.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "benefits.benefit_plans.delete"
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
    categoryLoading,
    setCategoryLoading,
  ] = useState(false);

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    categories,
    setCategories,
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
    categoryId,
    setCategoryId,
  ] = useState();

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

  const fetchCategories =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setCategoryLoading(true);

          const response =
            await fetch(
              "/api/admin/benefit-plans/categories?status=active&all=true",
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

          setCategories(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );
        } catch (error) {
          console.error(
            "LOAD_BENEFIT_PLAN_CATEGORIES_ERROR:",
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดประเภทสวัสดิการได้"
          );
        } finally {
          setCategoryLoading(false);
        }
      },
      [canView]
    );

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
            categoryId
          ) {
            params.set(
              "category_id",
              categoryId
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
              `/api/admin/benefit-plans?${params.toString()}`,
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
                "ไม่สามารถโหลดแผนสวัสดิการได้"
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
            "LOAD_BENEFIT_PLANS_ERROR:",
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดแผนสวัสดิการได้"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        categoryId,
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

    fetchCategories();
  }, [
    loadingUser,
    user,
    canView,
    fetchCategories,
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
      category_id:
        undefined,

      benefit_code:
        "",

      benefit_name:
        "",

      description:
        "",

      benefit_type:
        "allowance",

      active_period:
        "monthly",

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
        "คุณไม่มีสิทธิ์เพิ่มแผนสวัสดิการ"
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
            `/api/admin/benefit-plans/${record.id}`,
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
              "ไม่สามารถโหลดแผนสวัสดิการได้"
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
            "ไม่สามารถโหลดแผนสวัสดิการได้"
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
          "คุณไม่มีสิทธิ์ดูแผนสวัสดิการ"
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
          "คุณไม่มีสิทธิ์แก้ไขแผนสวัสดิการ"
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
          "คุณไม่มีสิทธิ์แก้ไขแผนสวัสดิการ"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มแผนสวัสดิการ"
        );

        return;
      }

      try {
        setSaving(true);

        const body = {
          category_id:
            values
              .category_id,

          benefit_code:
            String(
              values
                .benefit_code ||
                ""
            )
              .trim()
              .toUpperCase(),

          benefit_name:
            String(
              values
                .benefit_name ||
                ""
            ).trim(),

          description:
            String(
              values
                .description ||
                ""
            ).trim() ||
            null,

          benefit_type:
            String(
              values
                .benefit_type ||
                "general"
            ).trim(),

          active_period:
            String(
              values
                .active_period ||
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
              ? `/api/admin/benefit-plans/${editing.id}`
              : "/api/admin/benefit-plans",
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
              "ไม่สามารถบันทึกแผนสวัสดิการได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            (isEdit
              ? "แก้ไขแผนสวัสดิการเรียบร้อยแล้ว"
              : "เพิ่มแผนสวัสดิการเรียบร้อยแล้ว")
        );

        handleClose();

        await fetchRows();
      } catch (error) {
        swalError(
          error?.message ||
            "ไม่สามารถบันทึกแผนสวัสดิการได้"
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
          "คุณไม่มีสิทธิ์ลบแผนสวัสดิการ"
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/admin/benefit-plans/${record.id}`,
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
              "ไม่สามารถลบแผนสวัสดิการได้"
            )
          );
        }

        await swalSuccess(
          payload?.message ||
            "ลบแผนสวัสดิการเรียบร้อยแล้ว"
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
            "ไม่สามารถลบแผนสวัสดิการได้"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleSearch =
    (
      value
    ) => {
      setPage(1);
      setSearch(value);
    };

  const handleCategoryChange =
    (
      value
    ) => {
      setPage(1);
      setCategoryId(value);
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
            title="แผนสวัสดิการ"
            subtitle="Benefit Plans"
            loading={
              loading
            }
            canCreate={
              canCreate
            }
            createText="เพิ่มแผนสวัสดิการ"
            onCreate={
              handleCreate
            }
            onRefresh={
              fetchRows
            }
          />

          <PageInfoAlert
            description="กำหนดรายการสวัสดิการที่องค์กรสามารถนำไปผูกกับ Policy Rules เช่น ค่าน้ำมัน ค่าโทรศัพท์ OC และประกันกลุ่ม โดยจำนวนเงิน วงเงิน และเงื่อนไขบริษัท/พนักงานให้กำหนดในกฎเกณฑ์สวัสดิการ เพื่อไม่ Hardcode เงื่อนไขไว้ที่ Plan Master"
          />
        </>
      }

      search={
        <BenefitPlanSearch
          loading={
            loading
          }
          categoryLoading={
            categoryLoading
          }
          search={
            search
          }
          categories={
            categories
          }
          categoryId={
            categoryId
          }
          status={
            status
          }
          onSearch={
            handleSearch
          }
          onCategoryChange={
            handleCategoryChange
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
        <BenefitPlanSummaryCards
          summary={
            summary
          }
        />
      }

      toolbar={
        null
      }

      table={
        <BenefitPlanTable
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
        <BenefitPlanModal
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
          categories={
            categories
          }
          categoryLoading={
            categoryLoading
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
