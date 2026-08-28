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
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import PayrollRunSearch from "./components/PayrollRunSearch";
import PayrollRunSummaryCards from "./components/PayrollRunSummaryCards";
import PayrollRunTable from "./components/PayrollRunTable";
import PayrollRunModal from "./components/PayrollRunModal";
import PayrollRunItemsDrawer from "./components/PayrollRunItemsDrawer";

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

function normalizeSubmitValues(
  values
) {
  return {
    company_id:
      values.company_id,

    payroll_period_id:
      values.payroll_period_id,

    run_code:
      String(
        values.run_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    run_name:
      String(
        values.run_name ||
        ""
      ).trim(),

    run_type:
      values.run_type ||
      "regular",

    remark:
      String(
        values.remark ||
        ""
      ).trim() ||
      null,
  };
}

/* =========================================================
   Page
========================================================= */

export default function PayrollRunsPage() {
  const router =
    useRouter();

  /* =======================================================
     Permission + Company Scope
  ======================================================= */

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
      "ems.payroll_runs",
      {
        scopeType:
          "company",
      }
    );

  const [
    form,
  ] =
    Form.useForm();

  /* =======================================================
     Data
  ======================================================= */

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
      draft: 0,
      prepared: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      net_total: 0,
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

  /* =======================================================
     Filters
  ======================================================= */

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
    payrollPeriodId,
    setPayrollPeriodId,
  ] =
    useState();

  const [
    runType,
    setRunType,
  ] =
    useState();

  const [
    status,
    setStatus,
  ] =
    useState();

  /* =======================================================
     UI State
  ======================================================= */

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
    actionLoadingId,
    setActionLoadingId,
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

  const [
    itemsOpen,
    setItemsOpen,
  ] =
    useState(false);

  const [
    itemsRun,
    setItemsRun,
  ] =
    useState(null);

  /* =======================================================
     Load List
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

          if (
            payrollPeriodId
          ) {
            params.set(
              "payroll_period_id",
              payrollPeriodId
            );
          }

          if (runType) {
            params.set(
              "run_type",
              runType
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
              `/api/admin/payroll-runs?${params.toString()}`,
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
              "ไม่สามารถโหลด Payroll Run ได้"
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
              prepared: 0,
              processing: 0,
              completed: 0,
              cancelled: 0,
              net_total: 0,
            }
          );

          setTotal(
            json.pagination
              ?.total ||
            0
          );
        } catch (error) {
          console.error(
            "LOAD_PAYROLL_RUNS_ERROR:",
            error
          );

          swalError(
            error.message ||
            "ไม่สามารถโหลด Payroll Run ได้"
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
        payrollPeriodId,
        runType,
        status,
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
     Detail / Modal
  ======================================================= */

  async function loadDetail(
    record,
    nextMode
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/payroll-runs/${record.id}`,
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
          "ไม่สามารถโหลดรายละเอียด Payroll Run ได้"
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
        "LOAD_PAYROLL_RUN_DETAIL_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถโหลดรายละเอียด Payroll Run ได้"
      );
    }
  }

  function handleCreate() {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์สร้าง Payroll Run"
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
        "คุณไม่มีสิทธิ์แก้ไข Payroll Run ของบริษัทนี้"
      );

      return;
    }

    if (
      record.status !==
      "draft"
    ) {
      swalError(
        "แก้ไขได้เฉพาะ Payroll Run สถานะ Draft"
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
            ? `/api/admin/payroll-runs/${selectedRecord.id}`
            : "/api/admin/payroll-runs",
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
          "ไม่สามารถบันทึก Payroll Run ได้"
        );
      }

      await swalSuccess(
        json.message ||
        "บันทึก Payroll Run เรียบร้อยแล้ว"
      );

      handleCloseModal();

      await loadData();
    } catch (error) {
      console.error(
        "SAVE_PAYROLL_RUN_ERROR:",
        error
      );

      await swalError(
        "บันทึก Payroll Run ไม่สำเร็จ",
        error.message ||
        "ไม่สามารถบันทึก Payroll Run ได้"
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
        "คุณไม่มีสิทธิ์ลบ Payroll Run ของบริษัทนี้"
      );

      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/payroll-runs/${record.id}`,
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
          "ไม่สามารถลบ Payroll Run ได้"
        );
      }

      await swalSuccess(
        json.message ||
        "ลบ Payroll Run เรียบร้อยแล้ว"
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
        "DELETE_PAYROLL_RUN_ERROR:",
        error
      );

      await swalError(
        "ลบ Payroll Run ไม่สำเร็จ",
        error.message ||
        "ไม่สามารถลบ Payroll Run ได้"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =======================================================
     Prepare
  ======================================================= */

  async function handlePrepare(
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
        "คุณไม่มีสิทธิ์ Prepare Payroll Run ของบริษัทนี้"
      );

      return;
    }

    const confirmed =
      await swalConfirm({
        title:
          "เตรียมข้อมูล Payroll Run?",

        text:
          "ระบบจะ Snapshot พนักงานและ Employee Compensation ของ Payroll Group ในงวดนี้ และ Lock งวดเงินเดือน",

        confirmButtonText:
          "Prepare",

        cancelButtonText:
          "ยกเลิก",

        icon:
          "warning",
      });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/payroll-runs/${record.id}/prepare`,
          {
            method:
              "POST",
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
          "ไม่สามารถ Prepare Payroll Run ได้"
        );
      }

      await swalSuccess(
        json.message ||
        "Prepare Payroll Run เรียบร้อยแล้ว"
      );

      await loadData();
    } catch (error) {
      console.error(
        "PREPARE_PAYROLL_RUN_ERROR:",
        error
      );

      await swalError(
        "Prepare Payroll Run ไม่สำเร็จ",
        error.message ||
        "ไม่สามารถ Prepare Payroll Run ได้"
      );
    } finally {
      setActionLoadingId(
        null
      );
    }
  }

  /* =======================================================
     Process
  ======================================================= */

  async function handleProcess(
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
        "คุณไม่มีสิทธิ์ประมวลผล Payroll Run ของบริษัทนี้"
      );

      return;
    }

    const confirmed =
      await swalConfirm({
        title:
          "ประมวลผลเงินเดือน?",

        text:
          "ระบบจะคำนวณจาก Employee Snapshot ของ Run นี้ กรุณาตรวจสอบข้อมูลก่อนดำเนินการ",

        confirmButtonText:
          "ประมวลผล",

        cancelButtonText:
          "ยกเลิก",

        icon:
          "warning",
      });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/payroll-runs/${record.id}/process`,
          {
            method:
              "POST",
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
          "ไม่สามารถประมวลผล Payroll Run ได้"
        );
      }

      await swalSuccess(
        json.message ||
        "ประมวลผล Payroll Run เรียบร้อยแล้ว"
      );

      await loadData();

      setItemsRun(
        record
      );

      setItemsOpen(
        true
      );
    } catch (error) {
      console.error(
        "PROCESS_PAYROLL_RUN_ERROR:",
        error
      );

      await swalError(
        "ประมวลผล Payroll Run ไม่สำเร็จ",
        error.message ||
        "ไม่สามารถประมวลผล Payroll Run ได้"
      );
    } finally {
      setActionLoadingId(
        null
      );
    }
  }

  /* =======================================================
     Run Items
  ======================================================= */

  function handleViewItems(
    record
  ) {
    setItemsRun(
      record
    );

    setItemsOpen(
      true
    );
  }

  /* =======================================================
     Filters
  ======================================================= */

  function handleCompanyChange(
    value
  ) {
    setPage(1);

    setCompanyId(
      value
    );

    setPayrollPeriodId(
      undefined
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

  if (
    !user ||
    !canView
  ) {
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
              title="ประมวลผลเงินเดือน"
              subtitle="Payroll Runs Management"
              loading={
                loading
              }
              canRefresh
              canCreate={
                canCreate
              }
              createText="สร้าง Payroll Run"
              onRefresh={
                loadData
              }
              onCreate={
                handleCreate
              }
            />

            <PageInfoAlert
              description="Payroll Run ใช้ Company Scope และผูกกับ Payroll Period โดย Workflow คือ Draft → Prepare Employee Snapshot → Process → Completed งวด Regular ที่ประมวลผลสำเร็จจะเปลี่ยน Payroll Period เป็น Processed"
            />
          </>
        }

        search={
          <PayrollRunSearch
            search={
              search
            }
            companyId={
              companyId
            }
            payrollPeriodId={
              payrollPeriodId
            }
            runType={
              runType
            }
            status={
              status
            }
            loading={
              loading
            }
            onSearch={(
              value
            ) => {
              setPage(1);
              setSearch(
                value ||
                ""
              );
            }}
            onCompanyChange={
              handleCompanyChange
            }
            onPeriodChange={(
              value
            ) => {
              setPage(1);
              setPayrollPeriodId(
                value
              );
            }}
            onRunTypeChange={(
              value
            ) => {
              setPage(1);
              setRunType(
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
          <PayrollRunSummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <PayrollRunTable
            dataSource={
              rows
            }
            loading={
              loading
            }
            actionLoadingId={
              actionLoadingId
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
            onPrepare={
              handlePrepare
            }
            onProcess={
              handleProcess
            }
            onViewItems={
              handleViewItems
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

      <PayrollRunModal
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

      <PayrollRunItemsDrawer
        open={
          itemsOpen
        }
        run={
          itemsRun
        }
        onClose={() => {
          setItemsOpen(
            false
          );

          setItemsRun(
            null
          );
        }}
      />
    </div>
  );
}
