"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import { swalError, swalSuccess } from "@/components/Swal";

import EmployeeBankAccountSearch from "./components/EmployeeBankAccountSearch";
import EmployeeBankAccountTable from "./components/EmployeeBankAccountTable";
import EmployeeBankAccountModal from "./components/EmployeeBankAccountModal";

const API_URL = "/api/admin/employee-bank-accounts";
const DEFAULT_PAGE_SIZE = 20;

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function loadMasterRows(url) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        payload?.message ||
        "ไม่สามารถโหลดข้อมูล Master ได้"
    );
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

function dateForApi(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value?.format === "function") {
    return value.format("YYYY-MM-DD");
  }
  return null;
}

export default function EmployeeBankAccountsPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(
    user,
    "ems.employee_bank_accounts.view"
  );
  const canCreate = hasPermission(
    user,
    "ems.employee_bank_accounts.create"
  );
  const canEdit = hasPermission(
    user,
    "ems.employee_bank_accounts.edit"
  );
  const canDelete = hasPermission(
    user,
    "ems.employee_bank_accounts.delete"
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState();
  const [bankId, setBankId] = useState();
  const [status, setStatus] = useState();
  const [isPrimary, setIsPrimary] = useState();

  const [banks, setBanks] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState(false);

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

  const loadMasters = useCallback(async () => {
    if (!canView) return;

    try {
      const [bankRows, paymentRows] = await Promise.all([
        loadMasterRows(
          "/api/admin/banks?all=true&status=active"
        ),
        loadMasterRows(
          "/api/admin/payment-methods?all=true&status=active"
        ),
      ]);

      setBanks(bankRows);
      setPaymentMethods(paymentRows);
    } catch (error) {
      console.error(
        "LOAD_EMPLOYEE_BANK_ACCOUNT_MASTERS_ERROR:",
        error
      );

      await swalError(
        "โหลด Master ไม่สำเร็จ",
        error?.message || "ไม่สามารถโหลดข้อมูลได้"
      );
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

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (employeeId) {
        params.set("employee_id", employeeId);
      }

      if (bankId) {
        params.set("bank_id", bankId);
      }

      if (status) {
        params.set("status", status);
      }

      if (
        isPrimary !== undefined &&
        isPrimary !== null &&
        isPrimary !== ""
      ) {
        params.set("is_primary", String(isPrimary));
      }

      const response = await fetch(
        `${API_URL}?${params.toString()}`,
        { cache: "no-store" }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error ||
            payload?.detail ||
            "ไม่สามารถโหลดบัญชีธนาคารพนักงานได้"
        );
      }

      setRows(Array.isArray(payload.data) ? payload.data : []);
      setTotal(Number(payload?.pagination?.total || 0));
    } catch (error) {
      console.error(
        "LOAD_EMPLOYEE_BANK_ACCOUNTS_ERROR:",
        error
      );

      setRows([]);
      setTotal(0);

      await swalError(
        "โหลดข้อมูลไม่สำเร็จ",
        error?.message ||
          "ไม่สามารถโหลดบัญชีธนาคารพนักงานได้"
      );
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    page,
    pageSize,
    search,
    employeeId,
    bankId,
    status,
    isPrimary,
  ]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    loadMasters();
  }, [loadingUser, user, canView, loadMasters]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    fetchRows();
  }, [loadingUser, user, canView, fetchRows]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditing(null);
    setViewMode(false);
    // form.resetFields();
  }, [form]);

  const handleCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มบัญชีธนาคารพนักงาน");
      return;
    }

    setEditing(null);
    setViewMode(false);
    // form.resetFields();
    setOpen(true);
  };

  const handleView = (record) => {
    setEditing(record);
    setViewMode(true);
    setOpen(true);
  };

  const handleEdit = (record) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขบัญชีธนาคารพนักงาน");
      return;
    }

    setEditing(record);
    setViewMode(false);
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    const isEdit = Boolean(editing?.id);

    if (isEdit && !canEdit) {
      await swalError("คุณไม่มีสิทธิ์แก้ไขบัญชีธนาคารพนักงาน");
      return;
    }

    if (!isEdit && !canCreate) {
      await swalError("คุณไม่มีสิทธิ์เพิ่มบัญชีธนาคารพนักงาน");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        employee_id: values.employee_id || null,
        bank_id: values.bank_id || null,
        payment_method_id: values.payment_method_id || null,
        account_no: String(values.account_no || "").replace(/\D/g, "").trim(),
        account_name: String(values.account_name || "").trim(),
        branch_name:
          String(values.branch_name || "").trim() || null,
        is_primary: Boolean(values.is_primary),
        effective_date: dateForApi(values.effective_date),
        expire_date: dateForApi(values.expire_date),
        status: values.status || "active",
        remark: String(values.remark || "").trim() || null,
      };

      const response = await fetch(
        isEdit ? `${API_URL}/${editing.id}` : API_URL,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await readJsonResponse(response);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || result?.detail || "บันทึกข้อมูลไม่สำเร็จ"
        );
      }

      await swalSuccess(
        isEdit
          ? "แก้ไขบัญชีธนาคารพนักงานสำเร็จ"
          : "เพิ่มบัญชีธนาคารพนักงานสำเร็จ"
      );

      handleClose();
      await fetchRows();
    } catch (error) {
      console.error("SAVE_EMPLOYEE_BANK_ACCOUNT_ERROR:", error);

      await swalError(
        "บันทึกข้อมูลไม่สำเร็จ",
        error?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete) {
      await swalError("คุณไม่มีสิทธิ์ลบบัญชีธนาคารพนักงาน");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${record.id}`, {
        method: "DELETE",
      });

      const result = await readJsonResponse(response);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "ไม่สามารถลบบัญชีธนาคารพนักงานได้"
        );
      }

      await swalSuccess("ลบบัญชีธนาคารพนักงานสำเร็จ");

      if (rows.length === 1 && page > 1) {
        setPage((current) => Math.max(current - 1, 1));
        return;
      }

      await fetchRows();
    } catch (error) {
      console.error("DELETE_EMPLOYEE_BANK_ACCOUNT_ERROR:", error);

      await swalError(
        "ลบข้อมูลไม่สำเร็จ",
        error?.message || "ไม่สามารถลบข้อมูลได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE);
  };

  const handleResetFilters = () => {
    setPage(1);
    setSearch("");
    setEmployeeId(undefined);
    setBankId(undefined);
    setStatus(undefined);
    setIsPrimary(undefined);
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="บัญชีธนาคารพนักงาน"
            subtitle="Employee Bank Accounts"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มบัญชีธนาคาร"
            onCreate={handleCreate}
            onRefresh={fetchRows}
          />

          <PageInfoAlert
            description="จัดการบัญชีรับเงินเดือนของพนักงาน รองรับหลายบัญชีต่อพนักงาน กำหนดบัญชีหลัก ช่วงวันที่ใช้งาน และใช้ Permission + Employee Scope เป็นตัวควบคุมการเข้าถึงข้อมูล"
          />
        </>
      }
      search={
        <EmployeeBankAccountSearch
          loading={loading}
          search={search}
          employeeId={employeeId}
          bankId={bankId}
          status={status}
          isPrimary={isPrimary}
          banks={banks}
          onSearch={(value) => {
            setPage(1);
            setSearch(value || "");
          }}
          onEmployeeChange={(value) => {
            setPage(1);
            setEmployeeId(value || undefined);
          }}
          onBankChange={(value) => {
            setPage(1);
            setBankId(value || undefined);
          }}
          onStatusChange={(value) => {
            setPage(1);
            setStatus(value || undefined);
          }}
          onPrimaryChange={(value) => {
            setPage(1);
            setIsPrimary(value);
          }}
          onReset={handleResetFilters}
          onRefresh={fetchRows}
        />
      }
      summary={null}
      toolbar={null}
      table={
        <EmployeeBankAccountTable
          data={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          onChange={handleTableChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      }
      modal={
        <EmployeeBankAccountModal
          open={open}
          form={form}
          editing={editing}
          viewMode={viewMode}
          saving={saving}
          banks={banks}
          paymentMethods={paymentMethods}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      }
    />
  );
}
