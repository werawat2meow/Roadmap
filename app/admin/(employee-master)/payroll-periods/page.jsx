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

import PayrollPeriodSearch from "./components/PayrollPeriodSearch";
import PayrollPeriodSummaryCards from "./components/PayrollPeriodSummaryCards";
import PayrollPeriodTable from "./components/PayrollPeriodTable";
import PayrollPeriodModal from "./components/PayrollPeriodModal";

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

function cleanNullableText(
  value
) {
  const text =
    String(
      value || ""
    ).trim();

  return text || null;
}

function normalizeSubmitValues(
  values
) {
  return {
    ...values,

    period_code:
      String(
        values.period_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    period_name:
      String(
        values.period_name ||
        ""
      ).trim(),

    period_year:
      Number(
        values.period_year
      ),

    period_no:
      Number(
        values.period_no
      ),

    period_start_date:
      formatDateForApi(
        values
          .period_start_date
      ),

    period_end_date:
      formatDateForApi(
        values
          .period_end_date
      ),

    cutoff_start_date:
      formatDateForApi(
        values
          .cutoff_start_date
      ),

    cutoff_end_date:
      formatDateForApi(
        values
          .cutoff_end_date
      ),

    payment_date:
      formatDateForApi(
        values.payment_date
      ),

    remark:
      cleanNullableText(
        values.remark
      ),
  };
}

/* =========================================================
   Page
========================================================= */

export default function PayrollPeriodsPage() {
  const router = useRouter();

  /* =======================================================
     Permission + Company Scope
  ======================================================= */

  const {
    user,

    loadingUser: authLoading,

    canView,
    canCreate,
    canEdit,
    canDelete,

    canEditRecord,
    canDeleteRecord,
  } =
    useScopedPermissions(
      "ems.payroll_periods",
      {
        scopeType:
          "company",
      }
    );

  /* =======================================================
     Form
  ======================================================= */

  const [form,] = Form.useForm();

  /* =======================================================
     Data
  ======================================================= */

  const [rows,setRows] = useState([]);
  const [summary,setSummary] = useState({
    total: 0,
    draft: 0,
    open: 0,
    closed: 0,
    processed: 0,
  });

  const [page,setPage,] = useState(1);
  const [pageSize,setPageSize,] = useState(20);
  const [total,setTotal,] = useState(0);

  /* =======================================================
     Filters
  ======================================================= */

  const [search,setSearch] = useState("");
  const [companyId,setCompanyId,] = useState();
  const [payrollGroupId,setPayrollGroupId,] = useState();
  const [periodYear,setPeriodYear,] = useState();
  const [status,setStatus,] = useState();

  /* =======================================================
     UI
  ======================================================= */

  const [loading,setLoading] = useState(false);
  const [saving,setSaving,] = useState(false);
  const [deletingId,setDeletingId,] = useState(null);
  const [modalOpen,setModalOpen,] = useState(false);
  const [modalMode,setModalMode] = useState("create");
  const [selectedRecord,setSelectedRecord,] = useState(null);

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

          if (
            payrollGroupId
          ) {
            params.set(
              "payroll_group_id",
              payrollGroupId
            );
          }

          if (periodYear) {
            params.set(
              "period_year",
              String(
                periodYear
              )
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
              `/api/admin/payroll-periods?${params.toString()}`,
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
              "ไม่สามารถโหลดงวดเงินเดือนได้"
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
              draft: 0,
              open: 0,
              closed: 0,
              processed: 0,
            }
          );

          setTotal(
            json.pagination
              ?.total ||
            0
          );
        } catch (error) {
          console.error(
            "LOAD_PAYROLL_PERIODS_ERROR:",
            error
          );

          swalError(
            error.message ||
            "ไม่สามารถโหลดงวดเงินเดือนได้"
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
        payrollGroupId,
        periodYear,
        status,
      ]
    );

  /* =======================================================
     Auth
  ======================================================= */

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

  /* =======================================================
     Modal
  ======================================================= */

  function handleAdd() {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มงวดเงินเดือน"
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
          `/api/admin/payroll-periods/${record.id}`,
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
          "ไม่สามารถโหลดรายละเอียดงวดเงินเดือนได้"
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
        "LOAD_PAYROLL_PERIOD_DETAIL_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถโหลดรายละเอียดงวดเงินเดือนได้"
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
        "คุณไม่มีสิทธิ์แก้ไขงวดเงินเดือนของบริษัทนี้"
      );

      return;
    }

    if (
      record?.is_locked ===
      true
    ) {
      swalError(
        "งวดเงินเดือนนี้ถูก Lock แล้ว ไม่สามารถแก้ไขได้"
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
            ? `/api/admin/payroll-periods/${selectedRecord.id}`
            : "/api/admin/payroll-periods",
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
          "ไม่สามารถบันทึกงวดเงินเดือนได้"
        );
      }

      swalSuccess(
        json.message ||
        "บันทึกงวดเงินเดือนเรียบร้อยแล้ว"
      );

      handleCloseModal();

      await loadData();
    } catch (error) {
      console.error(
        "SAVE_PAYROLL_PERIOD_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถบันทึกงวดเงินเดือนได้"
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
    const allowDelete =
      typeof canDeleteRecord ===
      "function"
        ? canDeleteRecord(
            record
          )
        : canDelete;

    if (!allowDelete) {
      swalError(
        "คุณไม่มีสิทธิ์ลบงวดเงินเดือนของบริษัทนี้"
      );

      return;
    }

    if (
      record?.is_locked ===
      true
    ) {
      swalError(
        "งวดเงินเดือนนี้ถูก Lock แล้ว ไม่สามารถลบได้"
      );

      return;
    }

    if (
      record?.status !==
      "draft"
    ) {
      swalError(
        "ลบได้เฉพาะงวดเงินเดือนสถานะ Draft เท่านั้น"
      );

      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/payroll-periods/${record.id}`,
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
          "ไม่สามารถลบงวดเงินเดือนได้"
        );
      }

      swalSuccess(
        json.message ||
        "ลบงวดเงินเดือนเรียบร้อยแล้ว"
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
        "DELETE_PAYROLL_PERIOD_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถลบงวดเงินเดือนได้"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =======================================================
     Filters / Table
  ======================================================= */

  function handleSearch(
    value
  ) {
    setPage(1);
    setSearch(
      value || ""
    );
  }

  function handleCompanyChange(
    value
  ) {
    setPage(1);
    setCompanyId(
      value
    );

    /*
     * Group ต้องอยู่ใน Company
     * เมื่อเปลี่ยน Company ให้ reset Group
     */
    setPayrollGroupId(
      undefined
    );
  }

  function handleTableChange(
    pagination
  ) {
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
  }

  /* =======================================================
     Loading
  ======================================================= */

  if (authLoading) {
    return (
      <LoadingOrb />
    );
  }

  if (!user || !canView) {
    return null;
  }

  /* =======================================================
     Render
  ======================================================= */

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
              title="งวดเงินเดือน"
              subtitle="Payroll Periods Management"
              loading={
                loading
              }
              canRefresh
              canCreate={
                canCreate
              }
              createText="เพิ่มงวดเงินเดือน"
              onRefresh={
                loadData
              }
              onCreate={
                handleAdd
              }
            />

            <PageInfoAlert
              description="กำหนดช่วงงวด Payroll, Cut-off และวันที่จ่ายของแต่ละ Payroll Group โดยข้อมูลจะแสดงและจัดการได้ตาม Company Scope ของผู้ใช้งาน งวดที่ถูก Lock หรือประมวลผลแล้วควรรักษาไว้เพื่อ Audit"
            />
          </>
        }

        search={
          <PayrollPeriodSearch
            search={
              search
            }
            companyId={
              companyId
            }
            payrollGroupId={
              payrollGroupId
            }
            periodYear={
              periodYear
            }
            status={
              status
            }
            loading={
              loading
            }
            onSearch={
              handleSearch
            }
            onCompanyChange={
              handleCompanyChange
            }
            onPayrollGroupChange={(
              value
            ) => {
              setPage(1);
              setPayrollGroupId(
                value
              );
            }}
            onPeriodYearChange={(
              value
            ) => {
              setPage(1);
              setPeriodYear(
                value ||
                undefined
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
          <PayrollPeriodSummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <PayrollPeriodTable
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
            onChange={
              handleTableChange
            }
          />
        }
      />

      <PayrollPeriodModal
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
