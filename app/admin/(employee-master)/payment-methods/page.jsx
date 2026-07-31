"use client";

import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PaymentMethodSearch from "./components/PaymentMethodSearch";
import PaymentMethodSummaryCards from "./components/PaymentMethodSummaryCards";
import PaymentMethodTable from "./components/PaymentMethodTable";
import PaymentMethodModal from "./components/PaymentMethodModal";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const {user,loadingUser,} = useAuth();
  const canView = hasPermission(user,"ems.payment_methods.view");
  const canCreate = hasPermission(user,"ems.payment_methods.create");
  const canEdit = hasPermission(user,"ems.payment_methods.edit");
  const canDelete = hasPermission(user,"ems.payment_methods.delete");
  const [loading, setLoading] =useState(false);
  const [saving, setSaving] =useState(false);
  const [rows, setRows] =useState([]);
  const [summary, setSummary] =useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =useState(20);
  const [total, setTotal] = useState(0);

  const [search, setSearch] =useState("");
  const [status, setStatus] =useState();
  const [paymentType,setPaymentType,] = useState();
  const [supportsPayroll,setSupportsPayroll,] = useState();
  const [supportsBenefit,setSupportsBenefit,] = useState();
  const [supportsExpense,setSupportsExpense,] = useState();
  const [open, setOpen] =useState(false);
  const [editing, setEditing] =useState(null);
  const [viewMode, setViewMode] =useState(false);
 
  const fetchPaymentMethods = useCallback(async () => {
      if (!canView) return;

      try {
        setLoading(true);

        const params =
          new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
          });

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status) {
          params.set(
            "status",
            status
          );
        }

        if (paymentType) {
          params.set(
            "payment_type",
            paymentType
          );
        }

        if (
          supportsPayroll !==
          undefined
        ) {
          params.set(
            "supports_payroll",
            String(
              supportsPayroll
            )
          );
        }

        if (
          supportsBenefit !==
          undefined
        ) {
          params.set(
            "supports_benefit",
            String(
              supportsBenefit
            )
          );
        }

        if (
          supportsExpense !==
          undefined
        ) {
          params.set(
            "supports_expense",
            String(
              supportsExpense
            )
          );
        }

        const res = await fetch(
          `/api/admin/payment-methods?${params.toString()}`
        );

        const result =
          await res.json();

        if (!res.ok) {
          throw new Error(
            result.error ||
              "ไม่สามารถโหลดข้อมูลได้"
          );
        }

        setRows(
          result.data ?? []
        );

        setSummary(
          result.summary ?? {}
        );

        setTotal(
          result.pagination
            ?.total ?? 0
        );
      } catch (error) {
        console.error(error);

        swalError(
          error.message
        );
      } finally {
        setLoading(false);
      }
    }, [
      canView,
      page,
      pageSize,
      search,
      status,
      paymentType,
      supportsPayroll,
      supportsBenefit,
      supportsExpense,
    ]);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [
    user,
    loadingUser,
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

    fetchPaymentMethods();
  }, [
    loadingUser,
    user,
    canView,
    fetchPaymentMethods,
  ]);

  const resetForm = () => {
    form.resetFields();

    form.setFieldsValue({
      payment_type: "bank_transfer",
      status: "active",

      bank_required: false,

      supports_payroll: true,
      supports_benefit: false,
      supports_expense: false,
      supports_vendor: false,

      require_account_name: true,
      require_account_number: true,
      require_promptpay_id: false,

      allow_multiple_accounts: false,
      qr_supported: false,
      api_supported: false,

      sort_order: 0,
    });

    setEditing(null);
    setViewMode(false);
  };

  const handleCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleView = (record) => {
    resetForm();

    setEditing(record);
    setViewMode(true);

    form.setFieldsValue(record);

    setOpen(true);
  };

  const handleEdit = (record) => {
    resetForm();

    setEditing(record);
    setViewMode(false);

    form.setFieldsValue(record);

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const isEdit = Boolean(editing);

      const url = isEdit
        ? `/api/admin/payment-methods/${editing.id}`
        : "/api/admin/payment-methods";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(values),
      });

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      await swalSuccess(
        isEdit
          ? "แก้ไขข้อมูลเรียบร้อย"
          : "เพิ่มข้อมูลเรียบร้อย"
      );
      handleClose();
      await fetchPaymentMethods();
    } catch (error) {
      console.error(error);

      swalError(
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed =
      await swalConfirm(
        "ยืนยันการลบ",
        `ต้องการลบ "${record.payment_method_name}" ใช่หรือไม่`
      );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/payment-methods/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            "ไม่สามารถลบข้อมูลได้"
        );
      }

      await swalSuccess(
        "ลบข้อมูลเรียบร้อย"
      );

      await fetchPaymentMethods();
    } catch (error) {
      console.error(error);

      swalError(
        error.message
      );
    }
  };
   
  const handleSearch = (value) => {
    setPage(1);
    setSearch(value);
  };

  const handleStatusChange = (value) => {
    setPage(1);
    setStatus(value);
  };

  const handlePaymentTypeChange = (value) => {
    setPage(1);
    setPaymentType(value);
  };

  const handleSupportsPayrollChange = (value) => {
    setPage(1);
    setSupportsPayroll(value);
  };

  const handleSupportsBenefitChange = (value) => {
    setPage(1);
    setSupportsBenefit(value);
  };

  const handleSupportsExpenseChange = (value) => {
    setPage(1);
    setSupportsExpense(value);
  };

  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setPageSize(
      pagination.pageSize
    );
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <MasterLayout
      header={
        <MasterPageHeader
          title="วิธีการจ่ายเงิน"
          subtitle="Payment Methods"
          loading={loading}
          canRefresh
          canCreate={canCreate}
          createText="เพิ่มวิธีการจ่ายเงิน"
          onRefresh={fetchPaymentMethods}
          onCreate={handleCreate}
        />
      }
      search={
        <PaymentMethodSearch
          loading={loading}
          search={search}
          onSearch={handleSearch}
          onRefresh={
            fetchPaymentMethods
          }
          status={status}
          onStatusChange={
            handleStatusChange
          }
          paymentType={
            paymentType
          }
          onPaymentTypeChange={
            handlePaymentTypeChange
          }
          supportsPayroll={
            supportsPayroll
          }
          onSupportsPayrollChange={
            handleSupportsPayrollChange
          }
          supportsBenefit={
            supportsBenefit
          }
          onSupportsBenefitChange={
            handleSupportsBenefitChange
          }
          supportsExpense={
            supportsExpense
          }
          onSupportsExpenseChange={
            handleSupportsExpenseChange
          }
        />
      }
      summary={
        <PaymentMethodSummaryCards
          summary={summary}
        />
      }
      toolbar={
       null
      }
      table={
        <PaymentMethodTable
          data={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={
            handleTableChange
          }
          onView={handleView}
          onEdit={
            canEdit
              ? handleEdit
              : undefined
          }
          onDelete={
            canDelete
              ? handleDelete
              : undefined
          }
        />
      }
      modal={
        <PaymentMethodModal
          open={open}
          form={form}
          editing={editing}
          viewMode={viewMode}
          saving={saving}
          onCancel={
            handleClose
          }
          onSubmit={
            handleSubmit
          }
        />
      }
    />
  );
}
