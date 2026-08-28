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

import FormulaVariableSearch from "./components/FormulaVariableSearch";
import FormulaVariableSummaryCards from "./components/FormulaVariableSummaryCards";
import FormulaVariableTable from "./components/FormulaVariableTable";
import FormulaVariableModal from "./components/FormulaVariableModal";

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
    return JSON.parse(
      text
    );
  } catch {
    return {};
  }
}

function normalizeDefaultValue(
  dataType,
  value
) {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

  if (
    dataType ===
    "date"
  ) {
    return value?.format
      ? value.format(
          "YYYY-MM-DD"
        )
      : String(
          value
        );
  }

  if (
    dataType ===
      "number" ||
    dataType ===
      "integer"
  ) {
    return String(
      Number(
        value
      )
    );
  }

  if (
    dataType ===
    "boolean"
  ) {
    return String(
      value
    ).toLowerCase();
  }

  return String(
    value
  );
}

function normalizeSubmitValues(
  values
) {
  return {
    ...values,

    variable_code:
      String(
        values.variable_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    variable_name:
      String(
        values.variable_name ||
        ""
      ).trim(),

    description:
      String(
        values.description ||
        ""
      ).trim() ||
      null,

    source_key:
      String(
        values.source_key ||
        ""
      ).trim() ||
      null,

    default_value:
      normalizeDefaultValue(
        values.data_type,
        values.default_value
      ),

    remark:
      String(
        values.remark ||
        ""
      ).trim() ||
      null,

    sort_order:
      Number(
        values.sort_order ||
        0
      ),

    is_required:
      values.is_required ===
      true,
  };
}

/* =========================================================
   Component
========================================================= */

export default function FormulaVariablesPage() {
  const router =
    useRouter();

  const {
    user,
    loadingUser,
  } =
    useAuth();

  const [
    form,
  ] =
    Form.useForm();

  const canView =
    hasPermission(
      user,
      "ems.formula_variables.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.formula_variables.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.formula_variables.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "ems.formula_variables.delete"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    deletingId,
    setDeletingId,
  ] =
    useState(
      null
    );

  const [
    rows,
    setRows,
  ] =
    useState(
      []
    );

  const [
    summary,
    setSummary,
  ] =
    useState({
      total:
        0,

      active:
        0,

      system:
        0,

      custom:
        0,
    });

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    pageSize,
    setPageSize,
  ] =
    useState(
      20
    );

  const [
    total,
    setTotal,
  ] =
    useState(
      0
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    companyId,
    setCompanyId,
  ] =
    useState();

  const [
    dataType,
    setDataType,
  ] =
    useState();

  const [
    sourceType,
    setSourceType,
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
    useState(
      false
    );

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
    useState(
      null
    );

  /* =========================================================
     Load List
  ========================================================= */

  const loadData =
    useCallback(
      async () => {
        if (
          !canView
        ) {
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
            String(
              page
            )
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
            dataType
          ) {
            params.set(
              "data_type",
              dataType
            );
          }

          if (
            sourceType
          ) {
            params.set(
              "source_type",
              sourceType
            );
          }

          if (
            status
          ) {
            params.set(
              "status",
              status
            );
          }

          const response =
            await fetch(
              `/api/admin/formula-variables?${params.toString()}`,
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
                "ไม่สามารถโหลดตัวแปรสูตรคำนวณได้"
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
                total:
                  0,

                active:
                  0,

                system:
                  0,

                custom:
                  0,
              }
          );

          setTotal(
            json.pagination
              ?.total ||
              0
          );
        } catch (error) {
          console.error(
            "LOAD_FORMULA_VARIABLES_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถโหลดตัวแปรสูตรคำนวณได้"
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
        dataType,
        sourceType,
        status,
      ]
    );

  /* =========================================================
     Auth / Permission
  ========================================================= */

  useEffect(() => {
    if (
      loadingUser
    ) {
      return;
    }

    if (
      !user
    ) {
      router.replace(
        "/login"
      );

      return;
    }

    if (
      !canView
    ) {
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

  /* =========================================================
     Modal
  ========================================================= */

  function handleAdd() {
    if (
      !canCreate
    ) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มตัวแปรสูตรคำนวณ"
      );

      return;
    }

    setSelected(
      null
    );

    setMode(
      "create"
    );

    setOpen(
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
          `/api/admin/formula-variables/${record.id}`,
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
            "ไม่สามารถโหลดรายละเอียดตัวแปรสูตรคำนวณได้"
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
    if (
      !canEdit
    ) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขตัวแปรสูตรคำนวณ"
      );

      return;
    }

    loadDetail(
      record,
      "edit"
    );
  }

  function handleClose() {
    setOpen(
      false
    );

    setSelected(
      null
    );

    setMode(
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
      mode ===
      "view"
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
        mode ===
        "edit";

      const response =
        await fetch(
          isEdit
            ? `/api/admin/formula-variables/${selected.id}`
            : "/api/admin/formula-variables",
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
            "ไม่สามารถบันทึกตัวแปรสูตรคำนวณได้"
        );
      }

      swalSuccess(
        json.message
      );

      handleClose();

      await loadData();
    } catch (error) {
      console.error(
        "SAVE_FORMULA_VARIABLE_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถบันทึกตัวแปรสูตรคำนวณได้"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =========================================================
     Delete
  ========================================================= */

  async function handleDelete(
    record
  ) {
    if (
      !canDelete
    ) {
      swalError(
        "คุณไม่มีสิทธิ์ลบตัวแปรสูตรคำนวณ"
      );

      return;
    }

    if (
      record
        ?.is_system ===
      true
    ) {
      swalError(
        "ตัวแปรระบบไม่สามารถลบได้"
      );

      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/formula-variables/${record.id}`,
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
            "ไม่สามารถลบตัวแปรสูตรคำนวณได้"
        );
      }

      swalSuccess(
        json.message
      );

      if (
        rows.length ===
          1 &&
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
        "DELETE_FORMULA_VARIABLE_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถลบตัวแปรสูตรคำนวณได้"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =========================================================
     Table
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

  if (
    loadingUser
  ) {
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
        width:
          "100%",
        maxWidth:
          "100%",
        minWidth:
          0,
        overflowX:
          "hidden",
      }}
    >
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="ตัวแปรสูตรคำนวณ"
              subtitle="Formula Variables Management"
              loading={
                loading
              }
              canRefresh
              canCreate={
                canCreate
              }
              createText="เพิ่มตัวแปรสูตรคำนวณ"
              onRefresh={
                loadData
              }
              onCreate={
                handleAdd
              }
            />

            <PageInfoAlert
              description="ใช้กำหนดตัวแปรมาตรฐานสำหรับสูตร Payroll เช่น BASE_SALARY, WORK_DAYS, OT_HOURS และ GROSS_PAY โดยตัวแปรแต่ละรายการผูกกับ Company Scope และ Source Key สำหรับ Formula Engine"
            />
          </>
        }

        search={
          <FormulaVariableSearch
            search={
              search
            }
            companyId={
              companyId
            }
            dataType={
              dataType
            }
            sourceType={
              sourceType
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
              setPage(
                1
              );

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
              setPage(
                1
              );

              setCompanyId(
                value
              );
            }}
            onDataTypeChange={(
              value
            ) => {
              setPage(
                1
              );

              setDataType(
                value
              );
            }}
            onSourceTypeChange={(
              value
            ) => {
              setPage(
                1
              );

              setSourceType(
                value
              );
            }}
            onStatusChange={(
              value
            ) => {
              setPage(
                1
              );

              setStatus(
                value
              );
            }}
          />
        }

        summary={
          <FormulaVariableSummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <FormulaVariableTable
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

      <FormulaVariableModal
        open={
          open
        }
        form={
          form
        }
        mode={
          mode
        }
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
    </div>
  );
}
