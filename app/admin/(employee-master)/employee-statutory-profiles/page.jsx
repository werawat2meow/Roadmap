"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Card,
  Form,
  Result,
  Spin,
  Typography,
} from "antd";

import {
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import useScopedPermissions from "@/hooks/useScopedPermissions";
import { hasPermission } from "@/lib/permissions";
import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import EmployeeStatutoryProfileSearch from "./components/EmployeeStatutoryProfileSearch";
import EmployeeStatutoryProfileSummaryCards from "./components/EmployeeStatutoryProfileSummaryCards";
import EmployeeStatutoryProfileTable from "./components/EmployeeStatutoryProfileTable";
import EmployeeStatutoryProfileModal from "./components/EmployeeStatutoryProfileModal";

const { Title, Text } = Typography;

const MODULE = "ems.employee_statutory_profiles";
const DEFAULT_PAGE_SIZE = 20;
const EMPLOYEE_OPTION_PAGE_SIZE = 20;

const DEFAULT_VALUES = {
  employee_id: undefined,
  tax_identity_type: "citizen_id",
  tax_identification_no: "",
  tax_filing_form_code: "PND91",
  tax_withholding_company_id: undefined,
  tax_resident_status: "resident",
  social_security_registered: false,
  social_security_no: "",
  insured_type: "section_33",
  social_security_company_id: undefined,
  same_tax_as_payroll_company: false,
  same_sso_as_payroll_company: false,
  effective_from: dayjs(),
  effective_to: null,
  status: "active",
  remark: "",
};


function mergeEmployeeRows(...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const item of group || []) {
      if (!item?.id) continue;
      map.set(String(item.id), item);
    }
  }

  return [...map.values()];
}

function cleanNullable(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function toApiDate(value) {
  if (!value) return null;
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD") : null;
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: text,
    };
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      cell = "";

      if (row.some((value) => String(value || "").trim())) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => String(value || "").trim())) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((item) =>
    String(item || "")
      .replace(/^\uFEFF/, "")
      .trim()
  );

  return rows.slice(1).map((values) => {
    const result = {};
    headers.forEach((header, index) => {
      result[header] = values[index] ?? "";
    });
    return result;
  });
}


async function downloadResponseFile(response, fallbackFileName) {
  if (!response.ok) {
    const json = await safeJson(response);
    throw new Error(json?.error || "ดาวน์โหลดไฟล์ไม่สำเร็จ");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const matched = contentDisposition.match(/filename="([^"]+)"/i);
  const fileName = matched?.[1] || fallbackFileName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function mapRecordToForm(record) {
  if (!record) return { ...DEFAULT_VALUES };

  const payrollCompanyMasterId = record?.employees?.payroll_companies?.company_id;

  return {
    employee_id: record.employee_id || undefined,
    tax_identity_type: record.tax_identity_type || "citizen_id",
    tax_identification_no: record.tax_identification_no || "",
    tax_filing_form_code: record.tax_filing_form_code || "",
    tax_withholding_company_id: record.tax_withholding_company_id || undefined,
    tax_resident_status: record.tax_resident_status || "resident",
    social_security_registered: Boolean(record.social_security_registered),
    social_security_no: record.social_security_no || "",
    insured_type: record.insured_type || "section_33",
    social_security_company_id: record.social_security_company_id || undefined,
    same_tax_as_payroll_company: Boolean(
      payrollCompanyMasterId &&
        record.tax_withholding_company_id === payrollCompanyMasterId
    ),
    same_sso_as_payroll_company: Boolean(
      payrollCompanyMasterId &&
        record.social_security_company_id === payrollCompanyMasterId
    ),
    effective_from: record.effective_from ? dayjs(record.effective_from) : dayjs(),
    effective_to: record.effective_to ? dayjs(record.effective_to) : null,
    status: record.status || "active",
    remark: record.remark || "",
  };
}

export default function EmployeeStatutoryProfilesPage() {
  const [form] = Form.useForm();
  const importInputRef = useRef(null);
  const employeeOptionRequestRef = useRef(0);
  const employeeOptionLoadingRef = useRef(false);

  const {
    user,
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useScopedPermissions(MODULE, {
    scopeType: "employee",
  });

  const canImport = useMemo(
    () => hasPermission(user, `${MODULE}.import`),
    [user]
  );

  const canExport = useMemo(
    () => hasPermission(user, `${MODULE}.export`),
    [user]
  );

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    taxConfigured: 0,
    socialSecurityConfigured: 0,
  });

  const [masters, setMasters] = useState({
    employees: [],
    companies: [],
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [identityType, setIdentityType] = useState("");
  const [socialRegistered, setSocialRegistered] = useState("");
  const [taxCompanyId, setTaxCompanyId] = useState("");
  const [ssoCompanyId, setSsoCompanyId] = useState("");

  const [loading, setLoading] = useState(false);
  const [employeeOptionsLoading, setEmployeeOptionsLoading] = useState(false);
  const [employeeOptionsPage, setEmployeeOptionsPage] = useState(1);
  const [employeeOptionsTotalPages, setEmployeeOptionsTotalPages] = useState(1);
  const [employeeKeyword, setEmployeeKeyword] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const loadMasters = useCallback(
    async ({
      employeeSearch = "",
      employeePage = 1,
      append = false,
      fallbackEmployee = null,
    } = {}) => {
      if (!canView) return;

      const requestId =
        employeeOptionRequestRef.current + 1;

      employeeOptionRequestRef.current = requestId;
      employeeOptionLoadingRef.current = true;

      try {
        setEmployeeOptionsLoading(true);

        const normalizedSearch = String(employeeSearch || "").trim();
        const nextPage = Math.max(Number(employeePage) || 1, 1);

        const params = new URLSearchParams({
          masters: "true",
          employee_page: String(nextPage),
          employee_page_size: String(EMPLOYEE_OPTION_PAGE_SIZE),
          include_companies: nextPage === 1 ? "true" : "false",
        });

        if (normalizedSearch) {
          params.set("employee_search", normalizedSearch);
        }

        const response = await fetch(
          `/api/admin/employee-statutory-profiles?${params.toString()}`,
          { cache: "no-store" }
        );

        const json = await safeJson(response);
        if (!response.ok) {
          throw new Error(json?.error || "ไม่สามารถโหลด Master Data ได้");
        }

        if (requestId !== employeeOptionRequestRef.current) {
          return;
        }

        const nextEmployees = json?.data?.employees || [];
        const pagination = json?.data?.employeePagination || {};

        setMasters((current) => ({
          employees: append
            ? mergeEmployeeRows(
                fallbackEmployee ? [fallbackEmployee] : [],
                current.employees,
                nextEmployees
              )
            : mergeEmployeeRows(
                fallbackEmployee ? [fallbackEmployee] : [],
                nextEmployees
              ),
          companies:
            json?.data?.companies?.length > 0
              ? json.data.companies
              : current.companies,
        }));

        setEmployeeKeyword(normalizedSearch);
        setEmployeeOptionsPage(Number(pagination.page || nextPage));
        setEmployeeOptionsTotalPages(
          Math.max(Number(pagination.totalPages || 1), 1)
        );
      } catch (error) {
        console.error("LOAD_STATUTORY_MASTERS_ERROR:", error);
        swalError(error?.message || "ไม่สามารถโหลด Master Data ได้");
      } finally {
        if (requestId === employeeOptionRequestRef.current) {
          employeeOptionLoadingRef.current = false;
          setEmployeeOptionsLoading(false);
        }
      }
    },
    [canView]
  );

  const handleEmployeeSearch = useCallback(
    (keyword = "") => {
      loadMasters({
        employeeSearch: keyword,
        employeePage: 1,
        append: false,
        fallbackEmployee: selectedRecord?.employees || null,
      });
    },
    [loadMasters, selectedRecord]
  );

  const handleEmployeePopupScroll = useCallback(
    (event) => {
      const target = event?.currentTarget;
      if (
        !target ||
        employeeOptionsLoading ||
        employeeOptionLoadingRef.current
      ) {
        return;
      }

      const distanceToBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (distanceToBottom > 40) return;
      if (employeeOptionsPage >= employeeOptionsTotalPages) return;

      loadMasters({
        employeeSearch: employeeKeyword,
        employeePage: employeeOptionsPage + 1,
        append: true,
        fallbackEmployee: selectedRecord?.employees || null,
      });
    },
    [
      employeeKeyword,
      employeeOptionsLoading,
      employeeOptionsPage,
      employeeOptionsTotalPages,
      loadMasters,
      selectedRecord,
    ]
  );

  const loadData = useCallback(async () => {
    if (!canView) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        include_summary: "true",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status) params.set("status", status);
      if (identityType) params.set("tax_identity_type", identityType);
      if (socialRegistered) {
        params.set("social_security_registered", socialRegistered);
      }
      if (taxCompanyId) {
        params.set("tax_withholding_company_id", taxCompanyId);
      }
      if (ssoCompanyId) {
        params.set("social_security_company_id", ssoCompanyId);
      }

      const response = await fetch(
        `/api/admin/employee-statutory-profiles?${params.toString()}`,
        { cache: "no-store" }
      );

      const json = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          json?.error || "ไม่สามารถโหลดข้อมูลภาษีและประกันสังคมพนักงานได้"
        );
      }

      setRows(json?.data || []);
      setTotal(Number(json?.pagination?.total || 0));
      setSummary({
        total: Number(json?.summary?.total || 0),
        active: Number(json?.summary?.active || 0),
        taxConfigured: Number(json?.summary?.taxConfigured || 0),
        socialSecurityConfigured: Number(
          json?.summary?.socialSecurityConfigured || 0
        ),
      });
    } catch (error) {
      console.error("LOAD_EMPLOYEE_STATUTORY_PROFILES_ERROR:", error);
      swalError(error?.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    page,
    pageSize,
    debouncedSearch,
    status,
    identityType,
    socialRegistered,
    taxCompanyId,
    ssoCompanyId,
  ]);

  useEffect(() => {
    if (!loadingUser && canView) {
      loadData();
      loadMasters({
        employeeSearch: "",
        employeePage: 1,
        append: false,
      });
    }
  }, [loadingUser, canView, loadData, loadMasters]);

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setSelectedRecord(null);
    setModalMode("create");
    form.resetFields();
  }

  async function openCreate() {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลภาษีและประกันสังคมพนักงาน");
      return;
    }

    setSelectedRecord(null);
    setModalMode("create");
    form.setFieldsValue({ ...DEFAULT_VALUES });
    setModalOpen(true);
    await loadMasters({
      employeeSearch: "",
      employeePage: 1,
      append: false,
    });
  }

  async function openRecord(record, mode) {
    if (mode === "edit" && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลภาษีและประกันสังคมพนักงาน");
      return;
    }

    setSelectedRecord(record);
    setModalMode(mode);

    const selectedEmployee = record?.employees;
    const nextEmployees = selectedEmployee
      ? [
          selectedEmployee,
          ...masters.employees.filter((item) => item.id !== selectedEmployee.id),
        ]
      : masters.employees;

    setMasters((current) => ({
      ...current,
      employees: nextEmployees,
    }));

    form.setFieldsValue(mapRecordToForm(record));
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      const isEdit = modalMode === "edit" && selectedRecord?.id;

      if (isEdit && !canEdit) {
        swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
        return;
      }

      if (!isEdit && !canCreate) {
        swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูล");
        return;
      }

      const payload = {
        employee_id: values.employee_id,
        tax_identity_type: values.tax_identity_type,
        tax_identification_no: cleanNullable(values.tax_identification_no),
        tax_filing_form_code: cleanNullable(values.tax_filing_form_code),
        tax_withholding_company_id: values.tax_withholding_company_id || null,
        tax_resident_status: values.tax_resident_status || "resident",
        social_security_registered: Boolean(values.social_security_registered),
        social_security_no: cleanNullable(values.social_security_no),
        insured_type: values.insured_type || null,
        social_security_company_id: values.social_security_company_id || null,
        effective_from: toApiDate(values.effective_from),
        effective_to: toApiDate(values.effective_to),
        status: values.status || "active",
        remark: cleanNullable(values.remark),
      };

      setSaving(true);

      const response = await fetch(
        isEdit
          ? `/api/admin/employee-statutory-profiles/${selectedRecord.id}`
          : "/api/admin/employee-statutory-profiles",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await safeJson(response);

      if (!response.ok) {
        throw new Error(json?.error || json?.detail || "บันทึกข้อมูลไม่สำเร็จ");
      }

      swalSuccess(
        isEdit
          ? "แก้ไขข้อมูลภาษีและประกันสังคมเรียบร้อยแล้ว"
          : "เพิ่มข้อมูลภาษีและประกันสังคมเรียบร้อยแล้ว"
      );

      closeModal();
      await loadData();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("SAVE_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
      swalError(error?.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(record) {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ปิดใช้งานข้อมูล");
      return;
    }

    const confirmed = await swalConfirm(
      "ต้องการปิดใช้งานข้อมูลภาษีและประกันสังคมรายการนี้ใช่หรือไม่? ระบบจะเก็บประวัติไว้และไม่ Hard Delete"
    );

    if (!confirmed) return;

    try {
      setDeactivatingId(record.id);

      const response = await fetch(
        `/api/admin/employee-statutory-profiles/${record.id}`,
        { method: "DELETE" }
      );

      const json = await safeJson(response);
      if (!response.ok) {
        throw new Error(json?.error || "ปิดใช้งานข้อมูลไม่สำเร็จ");
      }

      swalSuccess("ปิดใช้งานข้อมูลเรียบร้อยแล้ว");
      await loadData();
    } catch (error) {
      console.error("DEACTIVATE_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
      swalError(error?.message || "ปิดใช้งานข้อมูลไม่สำเร็จ");
    } finally {
      setDeactivatingId(null);
    }
  }

  async function handleExport() {
    if (!canExport) {
      swalError("คุณไม่มีสิทธิ์ Export ข้อมูล");
      return;
    }

    try {
      setExporting(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status) params.set("status", status);
      if (identityType) params.set("tax_identity_type", identityType);
      if (socialRegistered) {
        params.set("social_security_registered", socialRegistered);
      }
      if (taxCompanyId) {
        params.set("tax_withholding_company_id", taxCompanyId);
      }
      if (ssoCompanyId) {
        params.set("social_security_company_id", ssoCompanyId);
      }

      const response = await fetch(
        `/api/admin/employee-statutory-profiles/export?${params.toString()}`,
        { cache: "no-store" }
      );

      await downloadResponseFile(
        response,
        "employee-statutory-profiles.csv"
      );
    } catch (error) {
      console.error("EXPORT_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
      swalError(error?.message || "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadTemplate() {
    if (!canImport) {
      swalError("คุณไม่มีสิทธิ์ดาวน์โหลด Import Template");
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/employee-statutory-profiles/template",
        { cache: "no-store" }
      );

      await downloadResponseFile(
        response,
        "employee-statutory-profiles-template.csv"
      );
    } catch (error) {
      console.error("DOWNLOAD_STATUTORY_TEMPLATE_ERROR:", error);
      swalError(error?.message || "ดาวน์โหลด Template ไม่สำเร็จ");
    }
  }

  async function handleImportFile(file) {
    if (!canImport) {
      swalError("คุณไม่มีสิทธิ์ Import ข้อมูล");
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const parsedRows = parseCsv(text);

      if (!parsedRows.length) {
        throw new Error("ไม่พบข้อมูลใน CSV หรือรูปแบบ Header ไม่ถูกต้อง");
      }

      const response = await fetch("/api/admin/employee-statutory-profiles/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const json = await safeJson(response);

      if (!response.ok) {
        throw new Error(json?.error || "Import ไม่สำเร็จ");
      }

      const result = json?.data || {};

      if (Number(result.failed || 0) > 0) {
        const preview = (result.errors || [])
          .slice(0, 5)
          .map((item) => `แถว ${item.row}: ${item.error}`)
          .join("\n");

        swalError(
          `${json?.message || "Import บางรายการไม่สำเร็จ"}${
            preview ? `\n${preview}` : ""
          }`
        );
      } else {
        swalSuccess(json?.message || "Import สำเร็จ");
      }

      await loadData();
    } catch (error) {
      console.error("IMPORT_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
      swalError(error?.message || "Import ไม่สำเร็จ");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  if (!canView) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="คุณไม่มีสิทธิ์ดูข้อมูลภาษีและประกันสังคมพนักงาน"
      />
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
            <SafetyCertificateOutlined />
          </div>
          <div className="min-w-0">
            <Title level={3} className="!mb-0">
              ภาษีและประกันสังคมพนักงาน
            </Title>
            <Text type="secondary">
              Employee Statutory Profile · Tax Identity · บริษัทนำส่งภาษี · บริษัทประกันสังคม
            </Text>
          </div>
        </div>
      </div>

      <Alert
        showIcon
        type="info"
        className="mb-4"
        title="รองรับหลาย Legal Entity แบบ Enterprise"
        description="บริษัทที่พนักงานทำงาน, บริษัทเงินเดือน, บริษัทนำส่งภาษี และบริษัทขึ้นทะเบียนประกันสังคมสามารถเป็นคนละบริษัทกันได้ โดยการมองเห็นและแก้ไขพนักงานถูกควบคุมด้วย Employee Organization Scope"
      />

      <div className="mb-4">
        <EmployeeStatutoryProfileSummaryCards summary={summary} loading={loading} />
      </div>

      <Card className="mb-4">
        <EmployeeStatutoryProfileSearch
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          identityType={identityType}
          onIdentityTypeChange={(value) => {
            setIdentityType(value);
            setPage(1);
          }}
          socialRegistered={socialRegistered}
          onSocialRegisteredChange={(value) => {
            setSocialRegistered(value);
            setPage(1);
          }}
          taxCompanyId={taxCompanyId}
          onTaxCompanyIdChange={(value) => {
            setTaxCompanyId(value);
            setPage(1);
          }}
          ssoCompanyId={ssoCompanyId}
          onSsoCompanyIdChange={(value) => {
            setSsoCompanyId(value);
            setPage(1);
          }}
          companies={masters.companies}
          onCreate={openCreate}
          onRefresh={loadData}
          onImport={() => importInputRef.current?.click()}
          onDownloadTemplate={handleDownloadTemplate}
          onExport={handleExport}
          canCreate={canCreate}
          canImport={canImport}
          canExport={canExport}
          loading={loading || exporting || importing}
        />

        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleImportFile(file);
          }}
        />
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <EmployeeStatutoryProfileTable
          dataSource={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(nextPage, nextPageSize) => {
            setPage(nextPageSize !== pageSize ? 1 : nextPage);
            setPageSize(nextPageSize);
          }}
          onView={(record) => openRecord(record, "view")}
          onEdit={(record) => openRecord(record, "edit")}
          onDeactivate={handleDeactivate}
          canEdit={canEdit}
          canDelete={canDelete}
          deactivatingId={deactivatingId}
        />
      </Card>

      <EmployeeStatutoryProfileModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        saving={saving}
        employees={masters.employees}
        companies={masters.companies}
        employeeLoading={employeeOptionsLoading}
        onEmployeeSearch={handleEmployeeSearch}
        onEmployeePopupScroll={handleEmployeePopupScroll}
        onCancel={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}
