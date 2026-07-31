"use client";

import { useEffect, useMemo, useState } from "react";
import { Form,Alert  } from "antd";
import { WalletOutlined , InfoCircleOutlined  } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import { swalError, swalSuccess } from "../../../components/Swal";

import PayrollTypeSearch from "./components/PayrollTypeSearch";
import PayrollTypeSummaryCards from "./components/PayrollTypeSummaryCards";
import PayrollTypeTable from "./components/PayrollTypeTable";
import PayrollTypeModal from "./components/PayrollTypeModal";

const initialForm = {
  payroll_type_code: "",
  payroll_type_name: "",
  description: "",
  payment_frequency: "monthly",
  default_payment_day: null,
  cutoff_end_day: null,
  payment_offset_month: 0,
  status: "active",
  sort_order: 0,
};

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function PayrollTypesPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.payroll_types.view");
  const canCreate = hasPermission(user, "ems.payroll_types.create");
  const canEdit = hasPermission(user, "ems.payroll_types.edit");
  const canDelete = hasPermission(user, "ems.payroll_types.delete");

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [payrollTypes, setPayrollTypes] = useState([]);
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingPayrollType, setEditingPayrollType] = useState(null);

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

  const loadPayrollTypes = async (keyword = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const queryString = params.toString();

      const res = await fetch(
        queryString
          ? `/api/admin/payroll-types?${queryString}`
          : "/api/admin/payroll-types",
        { cache: "no-store" }
      );

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          result?.error || "โหลดข้อมูล Payroll Type ไม่สำเร็จ"
        );
      }

      setPayrollTypes(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("LOAD_PAYROLL_TYPES_ERROR:", err);

      setPayrollTypes([]);

      swalError(err.message || "โหลดข้อมูล Payroll Type ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    const timer = setTimeout(() => {
      loadPayrollTypes(search);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setEditingPayrollType(null);
    form.resetFields();
    form.setFieldsValue(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Payroll Type");
      return;
    }

    setEditingPayrollType(null);
    form.resetFields();
    form.setFieldsValue(initialForm);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Payroll Type");
      return;
    }

    setEditingPayrollType(item);

    form.setFieldsValue({
      payroll_type_code: item.payroll_type_code || "",
      payroll_type_name: item.payroll_type_name || "",
      description: item.description || "",
      payment_frequency: item.payment_frequency || "monthly",
      default_payment_day:
        item.default_payment_day === null ||
        item.default_payment_day === undefined
          ? null
          : Number(item.default_payment_day),
      cutoff_end_day:
        item.cutoff_end_day === null || item.cutoff_end_day === undefined
          ? null
          : Number(item.cutoff_end_day),
      payment_offset_month: Number(item.payment_offset_month || 0),
      status: item.status || "active",
      sort_order: Number(item.sort_order || 0),
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    resetForm();
    setOpenModal(false);
  };

  const summary = useMemo(() => {
    return {
      total: payrollTypes.length,
      active: payrollTypes.filter((item) => item.status === "active").length,
      inactive: payrollTypes.filter((item) => item.status === "inactive")
        .length,
    };
  }, [payrollTypes]);

  const handleRefresh = () => {
    loadPayrollTypes(search);
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const payload = {
        ...values,
        payroll_type_code: (values.payroll_type_code || "")
          .trim()
          .toUpperCase(),
        payroll_type_name: (values.payroll_type_name || "").trim(),
        description: values.description || null,
        default_payment_day:
          values.default_payment_day === "" ||
          values.default_payment_day === undefined
            ? null
            : Number(values.default_payment_day),
        cutoff_end_day:
          values.cutoff_end_day === "" || values.cutoff_end_day === undefined
            ? null
            : Number(values.cutoff_end_day),
        payment_offset_month: Number(values.payment_offset_month || 0),
        sort_order: Number(values.sort_order || 0),
      };

      const isEdit = Boolean(editingPayrollType);

      const res = await fetch(
        isEdit
          ? `/api/admin/payroll-types/${editingPayrollType.id}`
          : "/api/admin/payroll-types",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          result?.error ||
            (isEdit
              ? "อัปเดต Payroll Type ไม่สำเร็จ"
              : "เพิ่ม Payroll Type ไม่สำเร็จ")
        );
      }

      swalSuccess(
        isEdit ? "อัปเดต Payroll Type สำเร็จ" : "เพิ่ม Payroll Type สำเร็จ"
      );

      setOpenModal(false);
      resetForm();
      loadPayrollTypes(search);
    } catch (err) {
      console.error("SAVE_PAYROLL_TYPE_ERROR:", err);

      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก Payroll Type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Payroll Type");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/payroll-types/${record.id}`, {
        method: "DELETE",
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "ลบ Payroll Type ไม่สำเร็จ");
      }

      swalSuccess("ลบ Payroll Type สำเร็จ");

      loadPayrollTypes(search);
    } catch (err) {
      console.error("DELETE_PAYROLL_TYPE_ERROR:", err);

      swalError(err.message || "เกิดข้อผิดพลาดในการลบ Payroll Type");
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return <LoadingOrb />;
  }

  if (!user || !canView) {
    return null;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
          <WalletOutlined />
          Payroll Type
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          จัดการประเภท Payroll ความถี่การจ่าย วันตัดรอบ และวันจ่ายเริ่มต้น
        </p>

      </motion.div>
        <Alert
          className="mt-4 rounded-2xl"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          closable
          title="เกี่ยวกับหน้านี้"
          description="หน้านี้ใช้กำหนด 'รอบการจ่ายเงินเดือน' เช่น รายเดือน, ราย 15 วัน หรือรายสัปดาห์ พร้อมตั้งค่าวันตัดรอบ (cutoff date) และวันจ่ายเริ่มต้น (default payment date) ของแต่ละรอบ ข้อมูลจากหน้านี้จะถูกใช้อ้างอิงตอนรัน Payroll จริงในแต่ละกลุ่มพนักงาน"
        />

      <PayrollTypeSummaryCards summary={summary} />

      <PayrollTypeSearch
        search={search}
        setSearch={setSearch}
        loading={loading}
        canCreate={canCreate}
        onRefresh={handleRefresh}
        onCreate={handleOpenCreate}
      />

      <PayrollTypeTable
        loading={loading}
        payrollTypes={payrollTypes}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <PayrollTypeModal
        open={openModal}
        editingPayrollType={editingPayrollType}
        form={form}
        saving={saving}
        onCancel={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}