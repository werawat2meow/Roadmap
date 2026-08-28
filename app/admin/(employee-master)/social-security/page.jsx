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

import SocialSecuritySearch from "./components/SocialSecuritySearch";
import SocialSecuritySummaryCards from "./components/SocialSecuritySummaryCards";
import SocialSecurityTable from "./components/SocialSecurityTable";
import SocialSecurityModal from "./components/SocialSecurityModal";

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function formatDateForApi(
  value
) {
  if (!value) return null;

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

function optionalNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return Number(value);
}

function normalizeSubmitValues(
  values
) {
  return {
    company_id:
      values.company_id,

    setting_code:
      String(
        values.setting_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    setting_name:
      String(
        values.setting_name ||
        ""
      ).trim(),

    scheme_type:
      values.scheme_type ||
      "section_33",

    contribution_method:
      values.contribution_method ||
      "percentage",

    wage_base_min:
      Number(
        values.wage_base_min ||
        0
      ),

    wage_base_max:
      optionalNumber(
        values.wage_base_max
      ),

    employee_rate_percent:
      Number(
        values.employee_rate_percent ||
        0
      ),

    employer_rate_percent:
      Number(
        values.employer_rate_percent ||
        0
      ),

    employee_contribution_min:
      optionalNumber(
        values.employee_contribution_min
      ),

    employee_contribution_max:
      optionalNumber(
        values.employee_contribution_max
      ),

    employer_contribution_min:
      optionalNumber(
        values.employer_contribution_min
      ),

    employer_contribution_max:
      optionalNumber(
        values.employer_contribution_max
      ),

    fixed_employee_amount:
      optionalNumber(
        values.fixed_employee_amount
      ),

    fixed_employer_amount:
      optionalNumber(
        values.fixed_employer_amount
      ),

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
  };
}

export default function SocialSecurityPage() {
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
      "ems.social_security",
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
      section_33: 0,
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
    schemeType,
    setSchemeType,
  ] =
    useState();

  const [
    method,
    setMethod,
  ] =
    useState();

  const [
    status,
    setStatus,
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
    useState("create");

  const [
    selectedRecord,
    setSelectedRecord,
  ] =
    useState(null);

  const loadData =
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
                String(
                  pageSize
                ),
            });

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

          if (schemeType) {
            params.set(
              "scheme_type",
              schemeType
            );
          }

          if (method) {
            params.set(
              "contribution_method",
              method
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
              `/api/admin/social-security?${params.toString()}`,
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
              "ไม่สามารถโหลดข้อมูลประกันสังคมได้"
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
              section_33: 0,
            }
          );

          setTotal(
            json.pagination
              ?.total ||
            0
          );
        } catch (error) {
          console.error(
            "LOAD_SOCIAL_SECURITY_ERROR:",
            error
          );

          swalError(
            error.message ||
            "ไม่สามารถโหลดข้อมูลประกันสังคมได้"
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
        schemeType,
        method,
        status,
      ]
    );

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

  function handleCreate() {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มการตั้งค่าประกันสังคม"
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
          `/api/admin/social-security/${record.id}`,
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
          "ไม่สามารถโหลดรายละเอียดได้"
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
        "LOAD_SOCIAL_SECURITY_DETAIL_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถโหลดรายละเอียดได้"
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
        "คุณไม่มีสิทธิ์แก้ไขข้อมูลของบริษัทนี้"
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
            ? `/api/admin/social-security/${selectedRecord.id}`
            : "/api/admin/social-security",
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
          "ไม่สามารถบันทึกข้อมูลประกันสังคมได้"
        );
      }

      await swalSuccess(
        json.message ||
        "บันทึกข้อมูลประกันสังคมเรียบร้อยแล้ว"
      );

      handleCloseModal();
      await loadData();
    } catch (error) {
      console.error(
        "SAVE_SOCIAL_SECURITY_ERROR:",
        error
      );

      await swalError(
        "บันทึกข้อมูลประกันสังคมไม่สำเร็จ",
        error.message ||
        "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setSaving(false);
    }
  }

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
        "คุณไม่มีสิทธิ์ลบข้อมูลของบริษัทนี้"
      );
      return;
    }

    if (
      record.status !==
      "inactive"
    ) {
      swalError(
        "ลบได้เฉพาะรายการสถานะ Inactive"
      );
      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/social-security/${record.id}`,
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
          "ไม่สามารถลบข้อมูลประกันสังคมได้"
        );
      }

      await swalSuccess(
        json.message ||
        "ลบข้อมูลเรียบร้อยแล้ว"
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
        "DELETE_SOCIAL_SECURITY_ERROR:",
        error
      );

      await swalError(
        "ลบข้อมูลไม่สำเร็จ",
        error.message ||
        "ไม่สามารถลบข้อมูลได้"
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
              title="ประกันสังคม"
              subtitle="Social Security Settings"
              loading={
                loading
              }
              canRefresh
              canCreate={
                canCreate
              }
              createText="เพิ่มการตั้งค่า"
              onRefresh={
                loadData
              }
              onCreate={
                handleCreate
              }
            />

            <PageInfoAlert
              description="จัดการอัตราเงินสมทบและฐานค่าจ้างประกันสังคมแบบ Version ตาม Effective Date และ Company Scope เพื่อให้ Payroll Engine ใช้ค่าที่มีผลในแต่ละงวดโดยไม่ทับประวัติเดิม"
            />
          </>
        }

        search={
          <SocialSecuritySearch
            search={
              search
            }
            companyId={
              companyId
            }
            schemeType={
              schemeType
            }
            method={
              method
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
            onSchemeChange={(
              value
            ) => {
              setPage(1);
              setSchemeType(
                value
              );
            }}
            onMethodChange={(
              value
            ) => {
              setPage(1);
              setMethod(
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
          <SocialSecuritySummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <SocialSecurityTable
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

      <SocialSecurityModal
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
