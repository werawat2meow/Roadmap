"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Form,
} from "antd";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import {
  hasPermission,
} from "@/lib/permissions";

import {
  swalError,
  swalSuccess,
} from "@/components/Swal";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "../components/common/PageInfoAlert";

import DeductionTypeSearch from "./components/DeductionTypeSearch";
import DeductionTypeSummaryCards from "./components/DeductionTypeSummaryCards";
import DeductionTypeTable from "./components/DeductionTypeTable";
import DeductionTypeModal from "./components/DeductionTypeModal";

async function readJsonResponse(
  response
) {
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

function normalizeSubmitValues(
  values
) {
  return {
    ...values,

    deduction_code:
      String(
        values.deduction_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    deduction_name:
      String(
        values.deduction_name ||
        ""
      ).trim(),

    description:
      String(
        values.description ||
        ""
      ).trim() ||
      null,

    remark:
      String(
        values.remark ||
        ""
      ).trim() ||
      null,

    default_amount:
      values.calculation_method ===
      "fixed"
        ? Number(
            values.default_amount ??
              0
          )
        : null,

    effective_date:
      values.effective_date
        ? values.effective_date.format(
            "YYYY-MM-DD"
          )
        : null,

    expire_date:
      values.expire_date
        ? values.expire_date.format(
            "YYYY-MM-DD"
          )
        : null,

    sort_order:
      Number(
        values.sort_order ||
        0
      ),
  };
}

export default function DeductionTypesPage() {
  const router =
    useRouter();

  const {
    user,
    loadingUser,
  } = useAuth();

  const [
    form,
  ] =
    Form.useForm();

  const canView =
    hasPermission(
      user,
      "ems.deduction_types.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.deduction_types.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.deduction_types.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "ems.deduction_types.delete"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState(null);

  const [
    rows,
    setRows,
  ] =
    useState([]);

  const [
    summary,
    setSummary,
  ] =
    useState({
      total: 0,
      active: 0,
      inactive: 0,
      statutory: 0,
    });

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    pageSize,
    setPageSize,
  ] =
    useState(20);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    companyId,
    setCompanyId,
  ] =
    useState();

  const [
    category,
    setCategory,
  ] =
    useState();

  const [
    status,
    setStatus,
  ] =
    useState();

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    mode,
    setMode,
  ] =
    useState(
      "create"
    );

  const [
    selected,
    setSelected,
  ] =
    useState(null);

  const loadData =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setLoading(
            true
          );

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(page)
          );

          params.set(
            "pageSize",
            String(pageSize)
          );

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (companyId) {
            params.set(
              "company_id",
              companyId
            );
          }

          if (category) {
            params.set(
              "deduction_category",
              category
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
              `/api/admin/deduction-types?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "ไม่สามารถโหลดประเภทรายการหัก"
            );
          }

          setRows(
            Array.isArray(
              json.data
            )
              ? json.data
              : []
          );

          setSummary(
            json.summary ||
              {
                total: 0,
                active: 0,
                inactive: 0,
                statutory: 0,
              }
          );

          setTotal(
            json.pagination
              ?.total ||
              0
          );
        } catch (error) {
          console.error(
            "LOAD_DEDUCTION_TYPES_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถโหลดประเภทรายการหัก"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        canView,
        page,
        pageSize,
        search,
        companyId,
        category,
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

    loadData();
  }, [
    loadingUser,
    user,
    canView,
    loadData,
  ]);

  function handleAdd() {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มประเภทรายการหัก"
      );
      return;
    }

    setSelected(null);
    setMode("create");
    setOpen(true);
  }

  async function loadDetail(
    record,
    nextMode
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/deduction-types/${record.id}`,
          {
            cache:
              "no-store",
          }
        );

      const json =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            "ไม่สามารถโหลดรายละเอียดประเภทรายการหัก"
        );
      }

      setSelected(
        json.data
      );

      setMode(
        nextMode
      );

      setOpen(
        true
      );
    } catch (error) {
      swalError(
        error.message
      );
    }
  }

  function handleView(
    record
  ) {
    loadDetail(
      record,
      "view"
    );
  }

  function handleEdit(
    record
  ) {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขประเภทรายการหัก"
      );
      return;
    }

    loadDetail(
      record,
      "edit"
    );
  }

  function handleClose() {
    setOpen(false);
    setSelected(null);
    setMode("create");
  }

  async function handleSave(
    values
  ) {
    if (
      mode === "view"
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      const payload =
        normalizeSubmitValues(
          values
        );

      const isEdit =
        mode === "edit";

      const response =
        await fetch(
          isEdit
            ? `/api/admin/deduction-types/${selected.id}`
            : "/api/admin/deduction-types",
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
                payload
              ),
          }
        );

      const json =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            "ไม่สามารถบันทึกประเภทรายการหัก"
        );
      }

      swalSuccess(
        json.message
      );

      handleClose();

      await loadData();
    } catch (error) {
      console.error(
        "SAVE_DEDUCTION_TYPE_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถบันทึกประเภทรายการหัก"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDelete(
    record
  ) {
    if (!canDelete) {
      swalError(
        "คุณไม่มีสิทธิ์ลบประเภทรายการหัก"
      );
      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/deduction-types/${record.id}`,
          {
            method:
              "DELETE",
          }
        );

      const json =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            "ไม่สามารถลบประเภทรายการหัก"
        );
      }

      swalSuccess(
        json.message
      );

      if (
        rows.length === 1 &&
        page > 1
      ) {
        setPage(
          page - 1
        );
      } else {
        await loadData();
      }
    } catch (error) {
      console.error(
        "DELETE_DEDUCTION_TYPE_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถลบประเภทรายการหัก"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  function handleTableChange(
    pagination
  ) {
    setPage(
      pagination.current ||
        1
    );

    setPageSize(
      pagination.pageSize ||
        20
    );
  }

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (
    !user ||
    !canView
  ) {
    return null;
  }

  return (
    <>
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="ประเภทรายการหัก"
              subtitle="Earning Types Management"
              loading={loading}
              canRefresh
              canCreate={
                canCreate
              }
              createText="เพิ่มประเภทรายการหัก"
              onRefresh={
                loadData
              }
              onCreate={
                handleAdd
              }
            />

            <PageInfoAlert
              description="ใช้กำหนดประเภทรายการหักสำหรับ Payroll เช่น ภาษี ประกันสังคม กองทุนสำรองเลี้ยงชีพ เงินกู้ และรายการขาด/ลา/มาสาย พร้อมกำหนดวิธีคำนวณและขอบเขตตามบริษัท"
            />
          </>
        }
        search={
          <DeductionTypeSearch
            search={search}
            companyId={
              companyId
            }
            category={
              category
            }
            status={status}
            loading={
              loading
            }
            onSearch={(
              value
            ) => {
              setPage(1);

              setSearch(
                String(
                  value ||
                  ""
                ).trim()
              );
            }}
            onCompanyChange={(
              value
            ) => {
              setPage(1);
              setCompanyId(
                value
              );
            }}
            onCategoryChange={(
              value
            ) => {
              setPage(1);
              setCategory(
                value
              );
            }}
            onStatusChange={(
              value
            ) => {
              setPage(1);
              setStatus(
                value
              );
            }}
          />
        }
        summary={
          <DeductionTypeSummaryCards
            summary={summary}
          />
        }
        table={
          <DeductionTypeTable
            dataSource={
              rows
            }
            loading={
              loading
            }
            deletingId={
              deletingId
            }
            page={page}
            pageSize={
              pageSize
            }
            total={total}
            canEdit={
              canEdit
            }
            canDelete={
              canDelete
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
            onChange={
              handleTableChange
            }
          />
        }
      />

      <DeductionTypeModal
        open={open}
        form={form}
        mode={mode}
        selected={
          selected
        }
        saving={
          saving
        }
        onCancel={
          handleClose
        }
        onFinish={
          handleSave
        }
      />
    </>
  );
}
