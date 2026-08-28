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

import PayrollFormulaSearch from "./components/PayrollFormulaSearch";
import PayrollFormulaSummaryCards from "./components/PayrollFormulaSummaryCards";
import PayrollFormulaTable from "./components/PayrollFormulaTable";
import PayrollFormulaModal from "./components/PayrollFormulaModal";

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

function cleanNullableText(
  value
) {
  const text =
    String(
      value || ""
    ).trim();

  return text || null;
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
    ...values,

    formula_code:
      String(
        values.formula_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    formula_name:
      String(
        values.formula_name ||
        ""
      ).trim(),

    description:
      cleanNullableText(
        values.description
      ),

    formula_expression:
      String(
        values.formula_expression ||
        ""
      ).trim(),

    calculation_order:
      Math.max(
        0,
        Number(
          values.calculation_order ||
          0
        )
      ),

    decimal_places:
      Math.min(
        6,
        Math.max(
          0,
          Number(
            values.decimal_places ??
            2
          )
        )
      ),

    minimum_amount:
      values.minimum_amount ===
        null ||
      values.minimum_amount ===
        undefined ||
      values.minimum_amount ===
        ""
        ? null
        : Number(
            values.minimum_amount
          ),

    maximum_amount:
      values.maximum_amount ===
        null ||
      values.maximum_amount ===
        undefined ||
      values.maximum_amount ===
        ""
        ? null
        : Number(
            values.maximum_amount
          ),

    effective_date:
      formatDateForApi(
        values.effective_date
      ),

    expire_date:
      formatDateForApi(
        values.expire_date
      ),

    sort_order:
      Math.max(
        0,
        Number(
          values.sort_order ||
          0
        )
      ),

    remark:
      cleanNullableText(
        values.remark
      ),
  };
}

/* =========================================================
   Component
========================================================= */

export default function PayrollFormulasPage() {
  const router =
    useRouter();

  /* =========================================================
     Permission + Company Scope
     ใช้ pattern เดียวกับหน้า Employee
  ========================================================= */

  const {
    user,

    loadingUser:
      authLoading,

    /* Permission */
    canView,
    canCreate,
    canEdit,
    canDelete,

    /* Permission + Scope */
    canEditRecord,
    canDeleteRecord,

  } =
    useScopedPermissions(
      "ems.payroll_formulas",
      {
        scopeType:
          "company",
      }
    );

  /* =========================================================
     Form
  ========================================================= */

  const [
    form,
  ] =
    Form.useForm();

  /* =========================================================
     Data
  ========================================================= */

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
      earning: 0,
      deduction: 0,
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

  /* =========================================================
     Filters
  ========================================================= */

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
    formulaType,
    setFormulaType,
  ] =
    useState();

  const [
    status,
    setStatus,
  ] =
    useState();

  /* =========================================================
     UI State
  ========================================================= */

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
    useState("create");

  const [
    selectedRecord,
    setSelectedRecord,
  ] =
    useState(null);

  /* =========================================================
     Load Data
  ========================================================= */

  const loadData =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setLoading(true);

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

          if (formulaType) {
            params.set(
              "formula_type",
              formulaType
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
              `/api/admin/payroll-formulas?${params.toString()}`,
              {
                cache: "no-store",
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
                "ไม่สามารถโหลดสูตรการคำนวณเงินเดือนได้"
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
                earning: 0,
                deduction: 0,
              }
          );

          setTotal(
            json.pagination
              ?.total ||
              0
          );
        } catch (error) {
          console.error(
            "LOAD_PAYROLL_FORMULAS_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถโหลดสูตรการคำนวณเงินเดือนได้"
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
        companyId,
        formulaType,
        status,
      ]
    );

  /* =========================================================
     Auth / Permission
  ========================================================= */

  useEffect(() => {
    if (authLoading) {
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

  /* =========================================================
     Create
  ========================================================= */

  function handleAdd() {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มสูตรการคำนวณเงินเดือน"
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

  /* =========================================================
     Load Detail
  ========================================================= */

  async function loadDetail(
    record,
    nextMode
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/payroll-formulas/${record.id}`,
          {
            cache: "no-store",
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
            "ไม่สามารถโหลดรายละเอียดสูตรได้"
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
        "LOAD_PAYROLL_FORMULA_DETAIL_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถโหลดรายละเอียดสูตรได้"
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
    const allowEdit =
      typeof canEditRecord ===
      "function"
        ? canEditRecord(
            record
          )
        : canEdit;

    if (!allowEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขสูตรของบริษัทนี้"
      );

      return;
    }

    if (
      record?.is_system ===
      true
    ) {
      swalError(
        "สูตรระบบไม่อนุญาตให้แก้ไข"
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

  /* =========================================================
     Save
  ========================================================= */

  async function handleSave(
    values
  ) {
    if (
      modalMode ===
      "view"
    ) {
      return;
    }

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
            ? `/api/admin/payroll-formulas/${selectedRecord.id}`
            : "/api/admin/payroll-formulas",
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
            "ไม่สามารถบันทึกสูตรการคำนวณเงินเดือนได้"
        );
      }

      swalSuccess(
        json.message
      );

      handleCloseModal();

      await loadData();
    } catch (error) {
      console.error(
        "SAVE_PAYROLL_FORMULA_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถบันทึกสูตรการคำนวณเงินเดือนได้"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     Delete
  ========================================================= */

  async function handleDelete(
    record
  ) {
    const allowDelete =
      typeof canDeleteRecord ===
      "function"
        ? canDeleteRecord(
            record
          )
        : canDelete;

    if (!allowDelete) {
      swalError(
        "คุณไม่มีสิทธิ์ลบสูตรของบริษัทนี้"
      );

      return;
    }

    if (
      record?.is_system ===
      true
    ) {
      swalError(
        "สูตรระบบไม่สามารถลบได้"
      );

      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/payroll-formulas/${record.id}`,
          {
            method: "DELETE",
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
            "ไม่สามารถลบสูตรการคำนวณเงินเดือนได้"
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
        "DELETE_PAYROLL_FORMULA_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถลบสูตรการคำนวณเงินเดือนได้"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =========================================================
     Pagination
  ========================================================= */

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

  /* =========================================================
     Render
  ========================================================= */

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
              title="สูตรการคำนวณเงินเดือน"
              subtitle="Payroll Formulas Management"
              loading={loading}
              canRefresh
              canCreate={
                canCreate
              }
              createText="เพิ่มสูตรคำนวณ"
              onRefresh={
                loadData
              }
              onCreate={
                handleAdd
              }
            />

            <PageInfoAlert
              description="ใช้กำหนดสูตรคำนวณ Payroll เช่น เงินเดือนตามวันทำงาน ค่าล่วงเวลา โบนัส หรือรายการหัก โดยสูตรจะอ้างอิงตัวแปรจากหน้า “ตัวแปรสูตรคำนวณ” และถูกจำกัดข้อมูลตาม Company Scope"
            />
          </>
        }

        search={
          <PayrollFormulaSearch
            search={search}
            companyId={
              companyId
            }
            formulaType={
              formulaType
            }
            status={status}
            loading={loading}
            onSearch={(
              value
            ) => {
              setPage(1);

              setSearch(
                String(
                  value || ""
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
            onFormulaTypeChange={(
              value
            ) => {
              setPage(1);

              setFormulaType(
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
          <PayrollFormulaSummaryCards
            summary={summary}
          />
        }

        table={
          <PayrollFormulaTable
            dataSource={rows}
            loading={loading}
            deletingId={
              deletingId
            }
            page={page}
            pageSize={
              pageSize
            }
            total={total}
            canEdit={canEdit}
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
            onChange={
              handleTableChange
            }
          />
        }
      />

      <PayrollFormulaModal
        open={
          modalOpen
        }
        form={form}
        mode={
          modalMode
        }
        selected={
          selectedRecord
        }
        saving={saving}
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
