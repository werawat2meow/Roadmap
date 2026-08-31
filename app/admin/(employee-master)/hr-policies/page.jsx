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

import HrPolicySearch from "./components/HrPolicySearch";
import HrPolicySummaryCards from "./components/HrPolicySummaryCards";
import HrPolicyTable from "./components/HrPolicyTable";
import HrPolicyModal from "./components/HrPolicyModal";

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

function formatDateForApi(value) {
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

function normalizeSubmitValues(
  values
) {
  return {
    company_id:
      values.company_id,

    policy_code:
      String(
        values.policy_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    policy_name:
      String(
        values.policy_name ||
        ""
      ).trim(),

    policy_category:
      values.policy_category ||
      "general",

    description:
      String(
        values.description ||
        ""
      ).trim() ||
      null,

    owner_department:
      String(
        values.owner_department ||
        ""
      ).trim() ||
      null,

    status:
      values.status ||
      "draft",

    effective_date:
      formatDateForApi(
        values.effective_date
      ),

    expire_date:
      formatDateForApi(
        values.expire_date
      ),

    is_mandatory:
      Boolean(
        values.is_mandatory
      ),

    version_title:
      String(
        values.version_title ||
        ""
      ).trim() ||
      null,

    content:
      String(
        values.content ||
        ""
      ).trim(),

    change_summary:
      String(
        values.change_summary ||
        ""
      ).trim() ||
      null,
  };
}

export default function HrPoliciesPage() {
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
      "policy.hr_policies",
      {
        scopeType:
          "company",
      }
    );

  const [
    form,
  ] = Form.useForm();

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
    mandatory: 0,
  });

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
    companyId,
    setCompanyId,
  ] = useState();

  const [
    category,
    setCategory,
  ] = useState();

  const [
    status,
    setStatus,
  ] = useState();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    modalMode,
    setModalMode,
  ] = useState("create");

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState(null);

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

          if (category) {
            params.set(
              "policy_category",
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
              `/api/admin/hr-policies?${params.toString()}`,
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
              "ไม่สามารถโหลดนโยบายบริษัทได้"
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
              published: 0,
              archived: 0,
              mandatory: 0,
            }
          );

          setTotal(
            json.pagination
              ?.total ||
            0
          );
        } catch (error) {
          console.error(
            "LOAD_HR_POLICIES_ERROR:",
            error
          );

          swalError(
            error.message ||
            "ไม่สามารถโหลดนโยบายบริษัทได้"
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
        category,
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
        "คุณไม่มีสิทธิ์เพิ่มนโยบายบริษัท"
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
          `/api/admin/hr-policies/${record.id}`,
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
          "ไม่สามารถโหลดรายละเอียดนโยบายได้"
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
        "LOAD_HR_POLICY_DETAIL_ERROR:",
        error
      );

      swalError(
        error.message ||
        "ไม่สามารถโหลดรายละเอียดนโยบายได้"
      );
    }
  }

  function handleView(record) {
    loadDetail(
      record,
      "view"
    );
  }

  function handleEdit(record) {
    const allowed =
      typeof canEditRecord ===
      "function"
        ? canEditRecord(record)
        : canEdit;

    if (!allowed) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขนโยบายของบริษัทนี้"
      );
      return;
    }

    loadDetail(
      record,
      "edit"
    );
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelectedRecord(null);
    setModalMode("create");
  }

  async function handleSave(values) {
    try {
      setSaving(true);

      const payload =
        normalizeSubmitValues(
          values
        );

      const isEdit =
        modalMode === "edit";

      const response =
        await fetch(
          isEdit
            ? `/api/admin/hr-policies/${selectedRecord.id}`
            : "/api/admin/hr-policies",
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
          "ไม่สามารถบันทึกนโยบายได้"
        );
      }

      await swalSuccess(
        json.message ||
        "บันทึกนโยบายเรียบร้อยแล้ว"
      );

      handleCloseModal();
      await loadData();
    } catch (error) {
      console.error(
        "SAVE_HR_POLICY_ERROR:",
        error
      );

      await swalError(
        "บันทึกนโยบายไม่สำเร็จ",
        error.message ||
        "ไม่สามารถบันทึกนโยบายได้"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const allowed =
      typeof canDeleteRecord ===
      "function"
        ? canDeleteRecord(record)
        : canDelete;

    if (!allowed) {
      swalError(
        "คุณไม่มีสิทธิ์ลบนโยบายของบริษัทนี้"
      );
      return;
    }

    if (
      record.status !== "draft"
    ) {
      swalError(
        "ลบได้เฉพาะนโยบายสถานะ Draft"
      );
      return;
    }

    try {
      setDeletingId(
        record.id
      );

      const response =
        await fetch(
          `/api/admin/hr-policies/${record.id}`,
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
          "ไม่สามารถลบนโยบายได้"
        );
      }

      await swalSuccess(
        json.message ||
        "ลบนโยบายเรียบร้อยแล้ว"
      );

      if (
        rows.length === 1 &&
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
        "DELETE_HR_POLICY_ERROR:",
        error
      );

      await swalError(
        "ลบนโยบายไม่สำเร็จ",
        error.message ||
        "ไม่สามารถลบนโยบายได้"
      );
    } finally {
      setDeletingId(null);
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
              title="นโยบายบริษัท"
              subtitle="Company HR Policies"
              loading={loading}
              canRefresh
              canCreate={canCreate}
              createText="เพิ่มนโยบาย"
              onRefresh={loadData}
              onCreate={handleCreate}
            />

            <PageInfoAlert
              description="จัดการนโยบายบริษัทตาม Company Scope พร้อม Version History, Effective Date และสถานะ Draft / Published / Archived เพื่อรองรับ Audit และการแก้ไขย้อนหลังอย่างเป็นระบบ"
            />
          </>
        }

        search={
          <HrPolicySearch
            search={search}
            companyId={companyId}
            category={category}
            status={status}
            loading={loading}
            onSearch={(value) => {
              setPage(1);
              setSearch(
                value || ""
              );
            }}
            onCompanyChange={(value) => {
              setPage(1);
              setCompanyId(value);
            }}
            onCategoryChange={(value) => {
              setPage(1);
              setCategory(value);
            }}
            onStatusChange={(value) => {
              setPage(1);
              setStatus(value);
            }}
          />
        }

        summary={
          <HrPolicySummaryCards
            summary={summary}
          />
        }

        table={
          <HrPolicyTable
            dataSource={rows}
            loading={loading}
            deletingId={deletingId}
            page={page}
            pageSize={pageSize}
            total={total}
            canEdit={canEdit}
            canDelete={canDelete}
            canEditRecord={
              canEditRecord
            }
            canDeleteRecord={
              canDeleteRecord
            }
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChange={(pagination) => {
              setPage(
                pagination?.current ||
                1
              );

              setPageSize(
                pagination?.pageSize ||
                20
              );
            }}
          />
        }
      />

      <HrPolicyModal
        open={modalOpen}
        form={form}
        mode={modalMode}
        selected={selectedRecord}
        saving={saving}
        onCancel={handleCloseModal}
        onFinish={handleSave}
      />
    </div>
  );
}
