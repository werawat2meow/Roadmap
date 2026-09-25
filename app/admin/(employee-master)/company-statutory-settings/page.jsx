"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import { swalError, swalSuccess } from "@/components/Swal";

import CompanyStatutorySearch from "./components/CompanyStatutorySearch";
import CompanyStatutorySummaryCards from "./components/CompanyStatutorySummaryCards";
import CompanyStatutoryTable from "./components/CompanyStatutoryTable";
import CompanyStatutoryModal from "./components/CompanyStatutoryModal";

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getApiMessage(payload, fallback) {
  return payload?.message || payload?.error || fallback;
}

export default function CompanyStatutorySettingsPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.company_statutory_settings.view");
  const canCreate = hasPermission(user, "ems.company_statutory_settings.create");
  const canEdit = hasPermission(user, "ems.company_statutory_settings.edit");
  const canDelete = hasPermission(user, "ems.company_statutory_settings.delete");

  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState();
  const [status, setStatus] = useState();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const fetchCompanies = useCallback(async () => {
    if (!canView) return;

    try {
      setCompanyLoading(true);

      const response = await fetch(
        "/api/admin/company-statutory-settings/companies?status=active&all=true",
        { method: "GET", cache: "no-store" }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload, "ไม่สามารถโหลด Company Master ได้")
        );
      }

      setCompanies(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("LOAD_COMPANY_STATUTORY_COMPANIES_ERROR:", error);
      swalError(error?.message || "ไม่สามารถโหลด Company Master ได้");
    } finally {
      setCompanyLoading(false);
    }
  }, [canView]);

  const fetchRows = useCallback(async () => {
    if (!canView) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) params.set("search", search.trim());
      if (companyId) params.set("company_id", companyId);
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/admin/company-statutory-settings?${params.toString()}`,
        { method: "GET", cache: "no-store" }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiMessage(
            payload,
            "ไม่สามารถโหลดทะเบียนภาษีและประกันสังคมบริษัทได้"
          )
        );
      }

      setRows(Array.isArray(payload?.data) ? payload.data : []);
      setSummary(payload?.summary || {});
      setTotal(Number(payload?.pagination?.total || 0));
    } catch (error) {
      console.error("LOAD_COMPANY_STATUTORY_SETTINGS_ERROR:", error);
      swalError(error?.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [canView, companyId, page, pageSize, search, status]);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [loadingUser, user, canView, router]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    fetchCompanies();
  }, [loadingUser, user, canView, fetchCompanies]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    const timer = setTimeout(fetchRows, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadingUser, user, canView, fetchRows, search]);

  const resetForm = () => {
    form.resetFields();
    form.setFieldsValue({
      company_id: undefined,
      sso_employer_account_no: "",
      sso_branch_no: "",
      wcf_registration_no: "",
      effective_from: dayjs(),
      effective_to: null,
      status: "active",
      remark: "",
    });
    setEditing(null);
    setViewMode(false);
  };

  const handleCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มทะเบียนภาษีและประกันสังคมบริษัท");
      return;
    }

    resetForm();
    setOpen(true);
  };

  const loadRecord = async (record, asView) => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/company-statutory-settings/${record.id}`,
        { method: "GET", cache: "no-store" }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload, "ไม่สามารถโหลดรายละเอียดทะเบียนบริษัทได้")
        );
      }

      resetForm();
      setEditing(payload.data);
      setViewMode(Boolean(asView));

      form.setFieldsValue({
        ...payload.data,
        effective_from: payload.data?.effective_from
          ? dayjs(payload.data.effective_from)
          : null,
        effective_to: payload.data?.effective_to
          ? dayjs(payload.data.effective_to)
          : null,
      });

      setOpen(true);
    } catch (error) {
      swalError(error?.message || "ไม่สามารถโหลดรายละเอียดทะเบียนบริษัทได้");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record) => {
    if (!canView) {
      swalError("คุณไม่มีสิทธิ์ดูทะเบียนบริษัท");
      return;
    }
    await loadRecord(record, true);
  };

  const handleEdit = async (record) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขทะเบียนบริษัท");
      return;
    }
    await loadRecord(record, false);
  };

  const handleClose = () => {
    if (saving) return;
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async (values) => {
    const isEdit = Boolean(editing);

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขทะเบียนบริษัท");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มทะเบียนบริษัท");
      return;
    }

    try {
      setSaving(true);

      const body = {
        company_id: values.company_id,
        sso_employer_account_no:
          String(values.sso_employer_account_no || "").trim() || null,
        sso_branch_no: String(values.sso_branch_no || "").trim() || null,
        wcf_registration_no:
          String(values.wcf_registration_no || "").trim() || null,
        effective_from: values.effective_from?.format("YYYY-MM-DD"),
        effective_to: values.effective_to
          ? values.effective_to.format("YYYY-MM-DD")
          : null,
        status: values.status || "active",
        remark: String(values.remark || "").trim() || null,
      };

      const response = await fetch(
        isEdit
          ? `/api/admin/company-statutory-settings/${editing.id}`
          : "/api/admin/company-statutory-settings",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload, "ไม่สามารถบันทึกทะเบียนบริษัทได้")
        );
      }

      await swalSuccess(
        payload?.message ||
          (isEdit
            ? "แก้ไขทะเบียนบริษัทเรียบร้อยแล้ว"
            : "เพิ่มทะเบียนบริษัทเรียบร้อยแล้ว")
      );

      setOpen(false);
      resetForm();
      await Promise.all([fetchRows(), fetchCompanies()]);
    } catch (error) {
      swalError(error?.message || "ไม่สามารถบันทึกทะเบียนบริษัทได้");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบทะเบียนบริษัท");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/company-statutory-settings/${record.id}`,
        { method: "DELETE" }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload, "ไม่สามารถลบทะเบียนบริษัทได้")
        );
      }

      await swalSuccess(payload?.message || "ลบทะเบียนบริษัทเรียบร้อยแล้ว");

      if (rows.length === 1 && page > 1) {
        setPage((current) => Math.max(current - 1, 1));
        return;
      }

      await fetchRows();
    } catch (error) {
      swalError(error?.message || "ไม่สามารถลบทะเบียนบริษัทได้");
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="ทะเบียนภาษีและประกันสังคมบริษัท"
            subtitle="Company Statutory Registration"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มทะเบียนบริษัท"
            onCreate={handleCreate}
            onRefresh={fetchRows}
          />
          <PageInfoAlert description="ใช้กำหนดเลขบัญชีนายจ้างประกันสังคม เลขสาขาประกันสังคม และเลขทะเบียนกองทุนเงินทดแทนของแต่ละบริษัท โดย Tax ID และเลขสาขาภาษีอ่านจาก Company Master อัตโนมัติ รองรับ Effective Date เพื่อใช้กับพนักงานและ Payroll ตามช่วงเวลาที่ถูกต้อง" />
        </>
      }
      search={
        <CompanyStatutorySearch
          loading={loading}
          companyLoading={companyLoading}
          search={search}
          companies={companies}
          companyId={companyId}
          status={status}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
          onCompanyChange={(value) => {
            setPage(1);
            setCompanyId(value);
          }}
          onStatusChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          onRefresh={fetchRows}
        />
      }
      summary={<CompanyStatutorySummaryCards summary={summary} />}
      toolbar={null}
      table={
        <CompanyStatutoryTable
          data={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          onChange={(pagination) => {
            setPage(pagination.current);
            setPageSize(pagination.pageSize);
          }}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      }
      modal={
        <CompanyStatutoryModal
          open={open}
          form={form}
          editing={editing}
          viewMode={viewMode}
          saving={saving}
          companies={companies}
          companyLoading={companyLoading}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      }
    />
  );
}
