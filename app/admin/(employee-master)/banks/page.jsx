"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import BankSearch from "./components/BankSearch";
import BankSummaryCards from "./components/BankSummaryCards";
import BankTable from "./components/BankTable";
import BankModal from "./components/BankModal";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalSuccess,swalError,swalConfirm,} from "@/components/Swal";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

export default function BanksPage() {
  const [form] = Form.useForm();

  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user,"ems.banks.view");
  const canCreate = hasPermission(user,"ems.banks.create");
  const canEdit = hasPermission(user,"ems.banks.edit");
  const canDelete = hasPermission(user,"ems.banks.delete");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] =useState(false);
  const [search, setSearch] =useState("");
  const [status, setStatus] =useState("");
  const [supportsPayroll, setSupportsPayroll] =useState("");

  const [promptpaySupported,setPromptpaySupported,] = useState("");
  const [page, setPage] =useState(1);
  const [pageSize, setPageSize] =useState(20);
  const [total, setTotal] =useState(0);
  const [summary, setSummary] =useState({});
  const [banks, setBanks] =useState([]);
  const [openModal, setOpenModal] =useState(false);
  const [modalMode, setModalMode] =useState("add");
  const [selectedBank, setSelectedBank] =useState(null);

  async function loadBanks() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams({
          page,
          pageSize,
        });

      if (search)
        params.append("search", search);

      if (status)
        params.append("status", status);

      if (supportsPayroll !== "")
        params.append(
          "supports_payroll",
          supportsPayroll
        );

      if (promptpaySupported !== "")
        params.append(
          "promptpay_supported",
          promptpaySupported
        );

      const res = await fetch(
        `/api/admin/banks?${params}`
      );

      const result =await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setBanks(result.data || []);

      setSummary(
        result.summary || {}
      );

      setTotal(
        result.pagination?.total || 0
      );
    } catch (error) {
      swalError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, canView, loadingUser, router]);

  useEffect(() => {
    if (canView) {
      loadBanks();
    }
  }, [
    page,
    pageSize,
    search,
    status,
    supportsPayroll,
    promptpaySupported,
    canView,
  ]);

  function handleAdd() {
    form.resetFields();

    form.setFieldsValue({
      status: "active",
      sort_order: 0,
      promptpay_supported: true,
      supports_payroll: true,
      supports_bulk_transfer: true,
      supports_api: false,
      supports_promptpay_qr: false,
      branch_code_required: false,
      bank_file_format: "txt",
      bank_transfer_type: "batch",
    });

    setSelectedBank(null);
    setModalMode("add");
    setOpenModal(true);
  }

  async function handleView(record) {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/banks/${record.id}`
      );

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setSelectedBank(result.data);

      form.setFieldsValue(result.data);

      setModalMode("view");
      setOpenModal(true);
    } catch (error) {
      swalError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(record) {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/banks/${record.id}`
      );

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setSelectedBank(result.data);

      form.setFieldsValue(result.data);

      setModalMode("edit");
      setOpenModal(true);
    } catch (error) {
      swalError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(values) {
    try {
      setSaving(true);

      const isEdit =
        modalMode === "edit";

      const url = isEdit
        ? `/api/admin/banks/${selectedBank.id}`
        : "/api/admin/banks";

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

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      swalSuccess(result.message);

      setOpenModal(false);

      loadBanks();
    } catch (error) {
      swalError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/banks/${record.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      swalSuccess(result.message);
      loadBanks();
    } catch (error) {
      swalError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value) {
    setPage(1);
    setSearch(value);
  }

  function handleStatusChange(value) {
    setPage(1);
    setStatus(value || "");
  }

  function handleSupportsPayrollChange(
    value
  ) {
    setPage(1);
    setSupportsPayroll(value ?? "");
  }

  function handlePromptpayChange(value) {
    setPage(1);
    setPromptpaySupported(
      value ?? ""
    );
  }

  function handleTableChange(
    pagination
  ) {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  }

  function handleRefresh() {
    loadBanks();
  }

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <MasterLayout>
      <MasterPageHeader
        title="ธนาคาร"
        subtitle="Bank Management"
        createText="เพิ่มธนาคาร"
        onCreate={handleAdd}
        onRefresh={handleRefresh}
        canCreate={canCreate}
      />

      <PageInfoAlert description="จัดการข้อมูลหลัก (Master Data) ของธนาคารที่ใช้ในระบบ เช่น รหัสธนาคาร, ชื่อย่อ, SWIFT Code, ชื่อธนาคารภาษาไทย/อังกฤษ รวมถึงตั้งค่ารูปแบบไฟล์นำส่งเงินเดือน (Payroll File Format), ประเภทการโอน (Transfer Type), จำนวนหลักเลขบัญชี และการรองรับฟีเจอร์ต่างๆ เช่น Bulk Transfer, PromptPay, PromptPay QR หรือการเชื่อมต่อผ่าน API สำหรับใช้อ้างอิงตอนตั้งค่าบัญชีธนาคารของพนักงาน" />

      <BankSearch
        search={search}
        onSearch={handleSearch}
        status={status}
        onStatusChange={handleStatusChange}
        supportsPayroll={supportsPayroll}
        onSupportsPayrollChange={
          handleSupportsPayrollChange
        }
        promptpaySupported={
          promptpaySupported
        }
        onPromptpaySupportedChange={
          handlePromptpayChange
        }
      />

      <BankSummaryCards
        summary={summary}
      />

      <BankTable
        data={banks}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={handleTableChange}
        onView={
          canView
            ? handleView
            : undefined
        }
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
      
      <BankModal
        open={openModal}
        mode={modalMode}
        form={form}
        saving={saving}
        onSubmit={handleSave}
        onCancel={() => setOpenModal(false)}
      />
    </MasterLayout>
  );
}
