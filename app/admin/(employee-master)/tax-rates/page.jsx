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

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import {
  swalError,
  swalSuccess,
} from "@/components/Swal";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import TaxRateSearch from "./components/TaxRateSearch";
import TaxRateSummaryCards from "./components/TaxRateSummaryCards";
import TaxRateTable from "./components/TaxRateTable";
import TaxRateModal from "./components/TaxRateModal";

/* =========================================================
   Helpers
========================================================= */

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

function formatDateForApi(
  value
) {
  if (!value) {
    return null;
  }

  if (
    typeof value.format ===
    "function"
  ) {
    return value.format(
      "YYYY-MM-DD"
    );
  }

  return String(value);
}

function normalizeSubmitValues(
  values
) {
  return {
    company_id:
      values.company_id,

    tax_rate_code:
      String(
        values.tax_rate_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    tax_rate_name:
      String(
        values.tax_rate_name ||
        ""
      ).trim(),

    tax_year:
      Number(
        values.tax_year
      ),

    calculation_method:
      values.calculation_method ||
      "progressive",

    effective_date:
      formatDateForApi(
        values.effective_date
      ),

    expire_date:
      formatDateForApi(
        values.expire_date
      ),

    status:
      values.status ||
      "active",

    is_default:
      Boolean(
        values.is_default
      ),

    remark:
      String(
        values.remark ||
        ""
      ).trim() ||
      null,

    brackets:
      Array.isArray(
        values.brackets
      )
        ? values.brackets.map(
            (item) => ({
              income_min:
                Number(
                  item
                    ?.income_min ??
                  0
                ),

              income_max:
                item
                  ?.income_max ===
                  null ||
                item
                  ?.income_max ===
                  undefined ||
                item
                  ?.income_max ===
                  ""
                  ? null
                  : Number(
                      item
                        .income_max
                    ),

              tax_rate_percent:
                Number(
                  item
                    ?.tax_rate_percent ??
                  0
                ),
            })
          )
        : [],
  };
}

/* =========================================================
   Page
========================================================= */

export default function TaxRatesPage() {
  const router =
    useRouter();

  const {
    user,

    loadingUser:
      authLoading,

    canView,
    canCreate,
    canEdit,
    canDelete,

    canEditRecord,
    canDeleteRecord,
  } =
    useScopedPermissions(
      "ems.tax_rates",
      {
        scopeType:
          "company",
      }
    );

  const [
    form,
  ] =
    Form.useForm();

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
      default: 0,
      progressive: 0,
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
    taxYear,
    setTaxYear,
  ] =
    useState();

  const [
    calculationMethod,
    setCalculationMethod,
  ] =
    useState();

  const [
    status,
    setStatus,
  ] =
    useState();

  const [
    isDefault,
    setIsDefault,
  ] =
    useState();

  const [
    loading,
    setLoading,
  ] =
    useState(false);

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
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    modalMode,
    setModalMode,
  ] =
    useState(
      "create"
    );

  const [
    selectedRecord,
    setSelectedRecord,
  ] =
    useState(null);

  /* =======================================================
     Load
  ======================================================= */

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
            String(
              pageSize
            )
          );

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (
            companyId
          ) {
            params.set(
              "company_id",
              companyId
            );
          }

          if (taxYear) {
            params.set(
              "tax_year",
              String(
                taxYear
              )
            );
          }

          if (
            calculationMethod
          ) {
            params.set(
              "calculation_method",
              calculationMethod
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          if (
            isDefault ===
              "true" ||
            isDefault ===
              "false"
          ) {
            params.set(
              "is_default",
              isDefault
            );
          }

          const response =
            await fetch(
              `/api/admin/tax-rates?${params.toString()}`,
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
              "ไม่สามารถโหลดอัตราภาษีได้"
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
              default: 0,
              progressive: 0,
            }
          );

          setTotal(
            json.pagination
              ?.total ||
            0
          );
        } catch (error) {
          console.error(
            "LOAD_TAX_RATES_ERROR:",
            error
          );

          swalError(
            error.message ||
            "ไม่สามารถโหลดอัตราภาษีได้"
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
        taxYear,
        calculationMethod,
        status,
        isDefault,
      ]
    );

  /* =======================================================
     Auth
  ======================================================= */

  useEffect(() => {
    if (
      authLoading
    ) {
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
    authLoading,
    user,
    canView,
    router,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    loadData();
  }, [
    authLoading,
    user,
    canView,
    loadData,
  ]);

  /* =======================================================
     Modal
  ======================================================= */

  function handleCreate() {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มอัตราภาษี"
      );

      return;
    }

    setSelectedRecord(
      null
    );

    setModalMode(
      "create"
    );

    setModalOpen(
      true
    );
  }

  async function loadDetail(
    record,
    nextMode
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/tax-rates/${record.id}`,
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
          "ไม่สามารถโหลดรายละเอียดอัตราภาษีได้"
        );
      }

      setSelectedRecord(
        json.data
      );

      setModalMode(
        nextMode
      );

      setModalOpen(
        true
      );
    } catch (error) {
      console.error(
        "LOAD_TAX_RATE_DETAIL_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถโหลดรายละเอียดอัตราภาษีได้"
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
    const allowed =
      typeof canEditRecord ===
      "function"
        ? canEditRecord(
            record
          )
        : canEdit;

    if (!allowed) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขอัตราภาษีของบริษัทนี้"
      );

      return;
    }

    loadDetail(
      record,
      "edit"
    );
  }

  function handleCloseModal() {
    setModalOpen(
      false
    );

    setSelectedRecord(
      null
    );

    setModalMode(
      "create"
    );
  }

  /* =======================================================
     Save
  ======================================================= */

  async function handleSave(
    values
  ) {
    try {
      setSaving(true);

      const payload =
        normalizeSubmitValues(
          values
        );

      const isEdit =
        modalMode ===
        "edit";

      const response =
        await fetch(
          isEdit
            ? `/api/admin/tax-rates/${selectedRecord.id}`
            : "/api/admin/tax-rates",
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
          "ไม่สามารถบันทึกอัตราภาษีได้"
        );
      }

      await swalSuccess(
        json.message ||
        "บันทึกอัตราภาษีเรียบร้อยแล้ว"
      );

      handleCloseModal();

      await loadData();
    } catch (error) {
      console.error(
        "SAVE_TAX_RATE_ERROR:",
        error
      );

      await swalError(
        "บันทึกอัตราภาษีไม่สำเร็จ",
        error.message ||
        "ไม่สามารถบันทึกอัตราภาษีได้"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     Delete
  ======================================================= */

  async function handleDelete(
    record
  ) {
    const allowed =
      typeof canDeleteRecord ===
      "function"
        ? canDeleteRecord(
            record
          )
        : canDelete;

    if (!allowed) {
      swalError(
        "คุณไม่มีสิทธิ์ลบอัตราภาษีของบริษัทนี้"
      );

      return;
    }

    if (
      record.status !==
      "inactive"
    ) {
      swalError(
        "ลบได้เฉพาะชุดอัตราภาษีสถานะ Inactive"
      );

      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/tax-rates/${record.id}`,
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
          "ไม่สามารถลบอัตราภาษีได้"
        );
      }

      await swalSuccess(
        json.message ||
        "ลบอัตราภาษีเรียบร้อยแล้ว"
      );

      if (
        rows.length ===
          1 &&
        page > 1
      ) {
        setPage(
          page - 1
        );

        return;
      }

      await loadData();
    } catch (error) {
      console.error(
        "DELETE_TAX_RATE_ERROR:",
        error
      );

      await swalError(
        "ลบอัตราภาษีไม่สำเร็จ",
        error.message ||
        "ไม่สามารถลบอัตราภาษีได้"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  if (authLoading) {
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
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
      }}
    >
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="อัตราภาษี"
              subtitle="Tax Rates Management"
              loading={
                loading
              }
              canRefresh
              canCreate={
                canCreate
              }
              createText="เพิ่มอัตราภาษี"
              onRefresh={
                loadData
              }
              onCreate={
                handleCreate
              }
            />

            <PageInfoAlert
              description="จัดการชุดอัตราภาษีตาม Company Scope โดยแยกเป็น Version ตามปีและ Effective Date รองรับ Progressive Tax Brackets และ Flat Rate เพื่อให้ Payroll Engine เลือกชุดที่มีผลโดยไม่ทับประวัติเดิม"
            />
          </>
        }

        search={
          <TaxRateSearch
            search={
              search
            }
            companyId={
              companyId
            }
            taxYear={
              taxYear
            }
            calculationMethod={
              calculationMethod
            }
            status={
              status
            }
            isDefault={
              isDefault
            }
            loading={
              loading
            }
            onSearch={(
              value
            ) => {
              setPage(1);
              setSearch(
                value || ""
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
            onTaxYearChange={(
              value
            ) => {
              setPage(1);
              setTaxYear(
                value ||
                undefined
              );
            }}
            onCalculationMethodChange={(
              value
            ) => {
              setPage(1);
              setCalculationMethod(
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
            onDefaultChange={(
              value
            ) => {
              setPage(1);
              setIsDefault(
                value
              );
            }}
          />
        }

        summary={
          <TaxRateSummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <TaxRateTable
            dataSource={
              rows
            }
            loading={
              loading
            }
            deletingId={
              deletingId
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
            canEdit={
              canEdit
            }
            canDelete={
              canDelete
            }
            canEditRecord={
              canEditRecord
            }
            canDeleteRecord={
              canDeleteRecord
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
            onChange={(
              pagination
            ) => {
              setPage(
                pagination
                  ?.current ||
                1
              );

              setPageSize(
                pagination
                  ?.pageSize ||
                20
              );
            }}
          />
        }
      />

      <TaxRateModal
        open={
          modalOpen
        }
        form={
          form
        }
        mode={
          modalMode
        }
        selected={
          selectedRecord
        }
        saving={
          saving
        }
        onCancel={
          handleCloseModal
        }
        onFinish={
          handleSave
        }
      />
    </div>
  );
}
