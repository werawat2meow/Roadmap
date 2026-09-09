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
  FileProtectOutlined,
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

import WorkPermitTypeSearch from "./components/WorkPermitTypeSearch";
import WorkPermitTypeSummaryCards from "./components/WorkPermitTypeSummaryCards";
import WorkPermitTypeTable from "./components/WorkPermitTypeTable";
import WorkPermitTypeModal from "./components/WorkPermitTypeModal";

import {
  getInitialValues,
} from "./components/WorkPermitTypeForm";

const API_URL =
  "/api/admin/work-permit-types";

const COMPANY_API_URL =
  "/api/admin/work-permit-types/companies";

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

    permit_code:
      record?.permit_code ||
      "",

    permit_name_th:
      record?.permit_name_th ||
      "",

    permit_name_en:
      record?.permit_name_en ||
      "",

    description:
      record?.description ||
      "",

    requires_valid_visa:
      record
        ?.requires_valid_visa !==
      false,

    is_renewable:
      record
        ?.is_renewable !==
      false,

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

    permit_code:
      String(
        values.permit_code ||
        ""
      )
        .trim()
        .toUpperCase(),

    permit_name_th:
      String(
        values.permit_name_th ||
        ""
      ).trim(),

    permit_name_en:
      String(
        values.permit_name_en ||
        ""
      ).trim() ||
      null,

    description:
      String(
        values.description ||
        ""
      ).trim() ||
      null,

    requires_valid_visa:
      Boolean(
        values.requires_valid_visa
      ),

    is_renewable:
      Boolean(
        values.is_renewable
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

export default function WorkPermitTypesPage() {
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
      "ems.work_permit_types",
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
    requiresValidVisa,
    setRequiresValidVisa,
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
            requiresValidVisa
          ) {
            params.set(
              "requires_valid_visa",
              requiresValidVisa
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
                "ไม่สามารถโหลดประเภทใบอนุญาตทำงานได้"
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
        requiresValidVisa,
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
        "คุณไม่มีสิทธิ์เพิ่มประเภทใบอนุญาตทำงาน"
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
        "คุณไม่มีสิทธิ์แก้ไขประเภทใบอนุญาตทำงาน"
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
          "คุณไม่มีสิทธิ์ลบประเภทใบอนุญาตทำงาน"
        );

        return;
      }

      const confirmed =
        await swalConfirm(
          `ต้องการลบประเภทใบอนุญาตทำงาน "${record.permit_code} - ${record.permit_name_th}" ใช่หรือไม่?`
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

  const handleRequiresValidVisaChange =
    (value) => {
      setRequiresValidVisa(
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
      setRequiresValidVisa("");
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
          description="คุณไม่มีสิทธิ์ดูหน้าประเภทใบอนุญาตทำงาน"
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
              <FileProtectOutlined className="text-blue-600" />
            }
            title="ประเภทใบอนุญาตทำงาน"
            subtitle="ตั้งค่า Work Permit Type สำหรับพนักงานต่างชาติ โดยควบคุม Permission และ Company Scope"
            loading={loading}
            canRefresh
            canCreate={
              canCreate
            }
            createText="เพิ่มประเภทใบอนุญาตทำงาน"
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
            title="Work Permit Type"
            description="Master นี้ใช้กำหนดประเภทใบอนุญาตทำงานและเงื่อนไขพื้นฐาน เช่น ต้องมี Visa ที่ยังใช้งานหรือไม่ ต่ออายุได้หรือไม่ และอายุเริ่มต้นของใบอนุญาต โดยข้อมูลใบอนุญาตจริงของพนักงานจะเชื่อมผ่าน Foreign Worker Profile ภายหลัง"
          />
        </>
      }
    >
      <div className="space-y-4">
        <WorkPermitTypeSearch
          search={search}
          companyId={
            companyId
          }
          requiresValidVisa={
            requiresValidVisa
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
          onRequiresValidVisaChange={
            handleRequiresValidVisaChange
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

        <WorkPermitTypeSummaryCards
          summary={
            summary
          }
          loading={
            loading
          }
        />

        <WorkPermitTypeTable
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

      <WorkPermitTypeModal
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
