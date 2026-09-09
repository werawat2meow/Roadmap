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

import dayjs from "dayjs";

import {
  FileTextOutlined,
} from "@ant-design/icons";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";

import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";

import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import ForeignWorkerDocumentTypeSearch from "./components/ForeignWorkerDocumentTypeSearch";
import ForeignWorkerDocumentTypeSummaryCards from "./components/ForeignWorkerDocumentTypeSummaryCards";
import ForeignWorkerDocumentTypeTable from "./components/ForeignWorkerDocumentTypeTable";
import ForeignWorkerDocumentTypeModal from "./components/ForeignWorkerDocumentTypeModal";

import {
  getInitialValues,
} from "./components/ForeignWorkerDocumentTypeForm";

const API_URL =
  "/api/admin/foreign-worker-document-types";

const COMPANY_API_URL =
  "/api/admin/foreign-worker-document-types/companies";

const DEFAULT_PAGE_SIZE =
  20;

async function readJsonResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const text =
      await response.text();

    throw new Error(
      `API ตอบกลับไม่ใช่ JSON (${response.status}): ${text.slice(
        0,
        120
      )}`
    );
  }

  return response.json();
}

function mapCompanyOption(
  item
) {
  return {
    value:
      item.id,

    label:
      `${
        item.company_code ||
        "-"
      } - ${
        item.company_name_th ||
        item.company_name_en ||
        "-"
      }`,
  };
}

function normalizeRecordForForm(
  record
) {
  return {
    company_id:
      record?.company_id ||
      undefined,

    document_code:
      record?.document_code ||
      "",

    document_name_th:
      record?.document_name_th ||
      "",

    document_name_en:
      record?.document_name_en ||
      "",

    document_category:
      record?.document_category ||
      "other",

    description:
      record?.description ||
      "",

    requires_document_no:
      record
        ?.requires_document_no !==
      false,

    requires_issue_date:
      Boolean(
        record
          ?.requires_issue_date
      ),

    requires_expiry_date:
      Boolean(
        record
          ?.requires_expiry_date
      ),

    is_mandatory:
      Boolean(
        record
          ?.is_mandatory
      ),

    default_validity_days:
      record
        ?.default_validity_days ??
      null,

    effective_date:
      record
        ?.effective_date
        ? dayjs(
            record.effective_date
          )
        : dayjs(),

    expire_date:
      record
        ?.expire_date
        ? dayjs(
            record.expire_date
          )
        : null,

    status:
      record?.status ||
      "active",

    sort_order:
      Number(
        record?.sort_order ||
        0
      ),

    remark:
      record?.remark ||
      "",
  };
}

function buildPayload(
  values
) {
  return {
    company_id:
      values.company_id,

    document_code:
      String(
        values.document_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    document_name_th:
      String(
        values.document_name_th ||
        ""
      ).trim(),

    document_name_en:
      String(
        values.document_name_en ||
        ""
      ).trim() ||
      null,

    document_category:
      values.document_category ||
      "other",

    description:
      String(
        values.description ||
        ""
      ).trim() ||
      null,

    requires_document_no:
      Boolean(
        values.requires_document_no
      ),

    requires_issue_date:
      Boolean(
        values.requires_issue_date
      ),

    requires_expiry_date:
      Boolean(
        values.requires_expiry_date
      ),

    is_mandatory:
      Boolean(
        values.is_mandatory
      ),

    default_validity_days:
      values
        .default_validity_days
        ? Number(
            values.default_validity_days
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

    status:
      values.status ||
      "active",

    sort_order:
      Number(
        values.sort_order ||
        0
      ),

    remark:
      String(
        values.remark ||
        ""
      ).trim() ||
      null,
  };
}

export default function ForeignWorkerDocumentTypesPage() {
  const router =
    useRouter();

  const [form] =
    Form.useForm();

  /* =========================================================
     Permission + Company Scope
  ========================================================= */

  const {
    user,
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } =
    useScopedPermissions(
      "ems.foreign_worker_document_types",
      {
        scopeType:
          "company",
      }
    );

  /* =========================================================
     State
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
      inactive: 0,
    });

  const [
    companies,
    setCompanies,
  ] =
    useState([]);

  const [
    companyLoading,
    setCompanyLoading,
  ] =
    useState(false);

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
    page,
    setPage,
  ] =
    useState(1);

  const [
    pageSize,
    setPageSize,
  ] =
    useState(
      DEFAULT_PAGE_SIZE
    );

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
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    companyId,
    setCompanyId,
  ] =
    useState("");

  const [
    documentCategory,
    setDocumentCategory,
  ] =
    useState("");

  const [
    mandatory,
    setMandatory,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState("");

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
     Load Company Options
  ========================================================= */

  const loadCompanies =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setCompanyLoading(
            true
          );

          const response =
            await fetch(
              COMPANY_API_URL,
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

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลดบริษัทได้"
            );
          }

          setCompanies(
            (
              payload?.data ||
              []
            ).map(
              mapCompanyOption
            )
          );
        } catch (error) {
          console.error(
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดบริษัทได้"
          );
        } finally {
          setCompanyLoading(
            false
          );
        }
      },
      [canView]
    );

  /* =========================================================
     Load Rows
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
            String(
              pageSize
            )
          );

          if (
            debouncedSearch
          ) {
            params.set(
              "search",
              debouncedSearch
            );
          }

          if (companyId) {
            params.set(
              "company_id",
              companyId
            );
          }

          if (
            documentCategory
          ) {
            params.set(
              "document_category",
              documentCategory
            );
          }

          if (mandatory) {
            params.set(
              "is_mandatory",
              mandatory
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
              `${API_URL}?${params.toString()}`,
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

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลดประเภทเอกสารแรงงานต่างชาติได้"
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
              {
                total:
                  0,
                active:
                  0,
                inactive:
                  0,
              }
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
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดข้อมูลได้"
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
        debouncedSearch,
        companyId,
        documentCategory,
        mandatory,
        status,
      ]
    );

  /* =========================================================
     Effects
  ========================================================= */

  useEffect(() => {
    const timer =
      setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );

          setPage(1);
        },
        300
      );

    return () =>
      clearTimeout(
        timer
      );
  }, [search]);

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canView
    ) {
      return;
    }

    loadCompanies();
  }, [
    loadingUser,
    user,
    canView,
    loadCompanies,
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
     Sync Form After Modal Mounted

     AntD useForm ต้องเชื่อมกับ <Form form={form}> ก่อน
     จึงค่อย reset / setFieldsValue หลัง Modal เปิดแล้ว
  ========================================================= */

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    if (modalMode === "create") {
      form.resetFields();

      form.setFieldsValue({
        ...getInitialValues(),
        company_id:
          companyId || undefined,
        effective_date: dayjs(),
      });

      return;
    }

    if (selectedRecord) {
      form.resetFields();

      form.setFieldsValue(
        normalizeRecordForForm(
          selectedRecord
        )
      );
    }
  }, [
    modalOpen,
    modalMode,
    selectedRecord,
    companyId,
    form,
  ]);

  /* =========================================================
     Modal
  ========================================================= */

  const handleCreate = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มประเภทเอกสารแรงงานต่างชาติ"
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
  };

  const handleView = (
    record
  ) => {
    setSelectedRecord(
      record
    );

    setModalMode(
      "view"
    );

    setModalOpen(
      true
    );
  };

  const handleEdit = (
    record
  ) => {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขประเภทเอกสารแรงงานต่างชาติ"
      );

      return;
    }

    setSelectedRecord(
      record
    );

    setModalMode(
      "edit"
    );

    setModalOpen(
      true
    );
  };

  const handleCloseModal =
    () => {
      if (saving) {
        return;
      }

      setModalOpen(
        false
      );

      setSelectedRecord(
        null
      );

      setModalMode(
        "create"
      );

      form.resetFields();
    };

  const handleSubmit =
    async (values) => {
      const isEdit =
        modalMode ===
        "edit";

      if (
        isEdit &&
        !canEdit
      ) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขข้อมูล"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มข้อมูล"
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const url =
          isEdit
            ? `${API_URL}/${selectedRecord?.id}`
            : API_URL;

        const response =
          await fetch(
            url,
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
                  buildPayload(
                    values
                  )
                ),
            }
          );

        const payload =
          await readJsonResponse(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ||
              "ไม่สามารถบันทึกข้อมูลได้"
          );
        }

        swalSuccess(
          payload?.message ||
            (
              isEdit
                ? "แก้ไขข้อมูลสำเร็จ"
                : "เพิ่มข้อมูลสำเร็จ"
            )
        );

        setModalOpen(
          false
        );

        setSelectedRecord(
          null
        );

        setModalMode(
          "create"
        );

        form.resetFields();

        await loadData();
      } catch (error) {
        console.error(
          error
        );

        swalError(
          error?.message ||
            "ไม่สามารถบันทึกข้อมูลได้"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =========================================================
     Delete
  ========================================================= */

  const handleDelete =
    async (
      record
    ) => {
      if (!canDelete) {
        swalError(
          "คุณไม่มีสิทธิ์ลบประเภทเอกสารแรงงานต่างชาติ"
        );

        return;
      }

      const confirmed =
        await swalConfirm(
          `ต้องการลบประเภทเอกสาร "${record.document_code} - ${record.document_name_th}" ใช่หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          record.id
        );

        const response =
          await fetch(
            `${API_URL}/${record.id}`,
            {
              method:
                "DELETE",
            }
          );

        const payload =
          await readJsonResponse(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ||
              "ไม่สามารถลบข้อมูลได้"
          );
        }

        swalSuccess(
          payload?.message ||
            "ลบข้อมูลสำเร็จ"
        );

        if (
          rows.length ===
            1 &&
          page > 1
        ) {
          setPage(
            (
              value
            ) =>
              Math.max(
                value -
                  1,
                1
              )
          );
        } else {
          await loadData();
        }
      } catch (error) {
        console.error(
          error
        );

        swalError(
          error?.message ||
            "ไม่สามารถลบข้อมูลได้"
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /* =========================================================
     Filters / Pagination
  ========================================================= */

  const handleCompanyChange =
    (value) => {
      setCompanyId(
        value || ""
      );

      setPage(1);
    };

  const handleCategoryChange =
    (value) => {
      setDocumentCategory(
        value || ""
      );

      setPage(1);
    };

  const handleMandatoryChange =
    (value) => {
      setMandatory(
        value || ""
      );

      setPage(1);
    };

  const handleStatusChange =
    (value) => {
      setStatus(
        value || ""
      );

      setPage(1);
    };

  const handleClearFilters =
    () => {
      setSearch("");
      setDebouncedSearch("");
      setCompanyId("");
      setDocumentCategory("");
      setMandatory("");
      setStatus("");
      setPage(1);
    };

  const handleTableChange =
    (
      pagination
    ) => {
      const nextPage =
        pagination
          ?.current ||
        1;

      const nextPageSize =
        pagination
          ?.pageSize ||
        DEFAULT_PAGE_SIZE;

      if (
        nextPageSize !==
        pageSize
      ) {
        setPageSize(
          nextPageSize
        );

        setPage(1);

        return;
      }

      setPage(
        nextPage
      );
    };

  const handleRefresh =
    async () => {
      await Promise.all([
        loadCompanies(),
        loadData(),
      ]);
    };

  /* =========================================================
     Render
  ========================================================= */

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (!user) {
    return null;
  }

  if (!canView) {
    return (
      <MasterLayout>
        <PageInfoAlert
          type="error"
          title="ไม่มีสิทธิ์เข้าใช้งาน"
          description="คุณไม่มีสิทธิ์ดูหน้าประเภทเอกสารแรงงานต่างชาติ"
        />
      </MasterLayout>
    );
  }

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            icon={
              <FileTextOutlined className="text-blue-600" />
            }
            title="ประเภทเอกสารแรงงานต่างชาติ"
            subtitle="ตั้งค่า Foreign Worker Document Type โดยควบคุม Permission และ Company Scope"
            loading={loading}
            canRefresh
            canCreate={
              canCreate
            }
            createText="เพิ่มประเภทเอกสาร"
            onCreate={
              handleCreate
            }
            onRefresh={
              handleRefresh
            }
            onBack={() =>
              router.back()
            }
          />

          <PageInfoAlert
            title="Foreign Worker Document Type"
            description="Master นี้ใช้กำหนดชนิดเอกสารที่ต้องเก็บสำหรับแรงงานต่างชาติ เช่น Passport, Visa, Work Permit, MOU และเอกสารอื่น พร้อมกำหนดว่าแต่ละชนิดต้องมีเลขเอกสาร วันที่ออก วันหมดอายุ หรือเป็นเอกสารบังคับหรือไม่"
          />
        </>
      }
    >
      <div className="space-y-4">
        <ForeignWorkerDocumentTypeSearch
          search={search}
          companyId={
            companyId
          }
          documentCategory={
            documentCategory
          }
          mandatory={
            mandatory
          }
          status={
            status
          }
          companies={
            companies
          }
          companyLoading={
            companyLoading
          }
          loading={
            loading
          }
          onSearchChange={
            setSearch
          }
          onCompanyChange={
            handleCompanyChange
          }
          onCategoryChange={
            handleCategoryChange
          }
          onMandatoryChange={
            handleMandatoryChange
          }
          onStatusChange={
            handleStatusChange
          }
          onClear={
            handleClearFilters
          }
          onRefresh={
            handleRefresh
          }
        />

        <ForeignWorkerDocumentTypeSummaryCards
          summary={
            summary
          }
          loading={
            loading
          }
        />

        <ForeignWorkerDocumentTypeTable
          data={rows}
          loading={
            loading
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
          deletingId={
            deletingId
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
      </div>

      <ForeignWorkerDocumentTypeModal
        open={
          modalOpen
        }
        mode={
          modalMode
        }
        form={form}
        companies={
          companies
        }
        companyLoading={
          companyLoading
        }
        saving={
          saving
        }
        onCancel={
          handleCloseModal
        }
        onSubmit={
          handleSubmit
        }
      />
    </MasterLayout>
  );
}
