"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,} from "antd";
import {DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined,WalletOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import {SortOrderField,StatusSelect,} from "@/app/components/forms";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalError,swalSuccess,} from "../../../components/Swal";

const initialForm = {
  payroll_type_code: "",
  payroll_type_name: "",
  description: "",
  default_payment_day: null,
  payment_frequency: "monthly",
  status: "active",
  sort_order: 0,
};

const frequencyLabels = {
  monthly: "รายเดือน",
  daily: "รายวัน",
  weekly: "รายสัปดาห์",
  biweekly: "ทุก 2 สัปดาห์",
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

  const canView = hasPermission(user,"ems.payroll_types.view");
  const canCreate = hasPermission(user,"ems.payroll_types.create");
  const canEdit = hasPermission(user,"ems.payroll_types.edit");
  const canDelete = hasPermission(user,"ems.payroll_types.delete");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [payrollTypes, setPayrollTypes] = useState([]);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [editingPayrollType, setEditingPayrollType] =
    useState(null);

  const [form, setForm] = useState(initialForm);

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
    loadingUser,
    user,
    canView,
    router,
  ]);

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
        {
          cache: "no-store",
        }
      );

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          result?.error ||
            "โหลดข้อมูล Payroll Type ไม่สำเร็จ"
        );
      }

      setPayrollTypes(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(
        "LOAD_PAYROLL_TYPES_ERROR:",
        err
      );

      setPayrollTypes([]);

      swalError(
        err.message ||
          "โหลดข้อมูล Payroll Type ไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser || !user || !canView) {
      return;
    }

    const timer = setTimeout(() => {
      loadPayrollTypes(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    search,
    loadingUser,
    user,
    canView,
  ]);

  const resetForm = () => {
    setEditingPayrollType(null);
    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่ม Payroll Type"
      );
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไข Payroll Type"
      );
      return;
    }

    setEditingPayrollType(item);

    setForm({
      payroll_type_code:
        item.payroll_type_code || "",

      payroll_type_name:
        item.payroll_type_name || "",

      description:
        item.description || "",

      default_payment_day:
        item.default_payment_day === null ||
        item.default_payment_day === undefined
          ? null
          : Number(item.default_payment_day),

      payment_frequency:
        item.payment_frequency || "monthly",

      status:
        item.status || "active",

      sort_order:
        Number(item.sort_order || 0),
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

      active: payrollTypes.filter(
        (item) => item.status === "active"
      ).length,

      inactive: payrollTypes.filter(
        (item) => item.status === "inactive"
      ).length,
    };
  }, [payrollTypes]);

  const handleRefresh = () => {
    loadPayrollTypes(search);
  };

  const columns = [
    {
      title: "รหัส",
      dataIndex: "payroll_type_code",
      width: 150,
      render: (value) => (
        <span className="font-semibold text-slate-700">
          {value || "-"}
        </span>
      ),
    },
    {
      title: "ประเภท Payroll",
      dataIndex: "payroll_type_name",
      width: 220,
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">
            {value || "-"}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {record.description || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "ความถี่การจ่าย",
      dataIndex: "payment_frequency",
      width: 150,
      render: (value) =>
        frequencyLabels[value] || value || "-",
    },
    {
      title: "วันจ่ายเริ่มต้น",
      dataIndex: "default_payment_day",
      width: 140,
      align: "center",
      render: (value) =>
        value ? `วันที่ ${value}` : "-",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 110,
      align: "center",
      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "green"
              : "red"
          }
        >
          {value === "active"
            ? "ใช้งาน"
            : "ไม่ใช้งาน"}
        </Tag>
      ),
    },
    {
      title: "ลำดับ",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "จัดการ",
      width: 130,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  handleOpenEdit(record)
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <Popconfirm
                title="ลบ Payroll Type"
                description={`ต้องการลบ ${record.payroll_type_name} ใช่หรือไม่?`}
                okText="ลบ"
                cancelText="ยกเลิก"
                okButtonProps={{
                  danger: true,
                }}
                onConfirm={() =>
                  handleDelete(record)
                }
              >
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
    const validateForm = () => {
    if (!form.payroll_type_code.trim()) {
      swalError("กรุณากรอกรหัส Payroll Type");
      return false;
    }

    if (!form.payroll_type_name.trim()) {
      swalError("กรุณากรอกชื่อ Payroll Type");
      return false;
    }

    if (
      ![
        "monthly",
        "daily",
        "weekly",
        "biweekly",
      ].includes(form.payment_frequency)
    ) {
      swalError("ความถี่การจ่ายไม่ถูกต้อง");
      return false;
    }

    const paymentDay =
      form.default_payment_day === "" ||
      form.default_payment_day === null ||
      form.default_payment_day === undefined
        ? null
        : Number(form.default_payment_day);

    if (
      paymentDay !== null &&
      (
        !Number.isInteger(paymentDay) ||
        paymentDay < 1 ||
        paymentDay > 31
      )
    ) {
      swalError(
        "วันจ่ายเริ่มต้นต้องอยู่ระหว่างวันที่ 1 ถึง 31"
      );
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const paymentDay =
      form.default_payment_day === "" ||
      form.default_payment_day === null ||
      form.default_payment_day === undefined
        ? null
        : Number(form.default_payment_day);

    return {
      payroll_type_code:
        form.payroll_type_code
          .trim()
          .toUpperCase(),

      payroll_type_name:
        form.payroll_type_name.trim(),

      description:
        form.description.trim() || null,

      default_payment_day:
        paymentDay,

      payment_frequency:
        form.payment_frequency || "monthly",

      status:
        form.status || "active",

      sort_order:
        Number(form.sort_order || 0),
    };
  };

  const handleSave = async () => {
    const isEdit = Boolean(editingPayrollType);

    if (isEdit && !canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไข Payroll Type"
      );
      return;
    }

    if (!isEdit && !canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่ม Payroll Type"
      );
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/payroll-types/${editingPayrollType.id}`
        : "/api/admin/payroll-types";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          buildPayload()
        ),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          result?.error ||
            "บันทึก Payroll Type ไม่สำเร็จ"
        );
      }

      swalSuccess(
        isEdit
          ? "แก้ไข Payroll Type สำเร็จ"
          : "เพิ่ม Payroll Type สำเร็จ"
      );

      handleCloseModal();

      await loadPayrollTypes(search);
    } catch (err) {
      console.error(
        "SAVE_PAYROLL_TYPE_ERROR:",
        err
      );

      swalError(
        err.message ||
          "เกิดข้อผิดพลาดในการบันทึก Payroll Type"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError(
        "คุณไม่มีสิทธิ์ลบ Payroll Type"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/payroll-types/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          result?.error ||
            "ลบ Payroll Type ไม่สำเร็จ"
        );
      }

      swalSuccess(
        "ลบ Payroll Type สำเร็จ"
      );

      await loadPayrollTypes(search);
    } catch (err) {
      console.error(
        "DELETE_PAYROLL_TYPE_ERROR:",
        err
      );

      swalError(
        err.message ||
          "เกิดข้อผิดพลาดในการลบ Payroll Type"
      );
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
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <WalletOutlined />
              Payroll Type
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              จัดการประเภท Payroll ความถี่การจ่าย และวันจ่ายเริ่มต้น
            </p>
          </div>

          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={handleRefresh}
            >
              Refresh
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreate}
              >
                เพิ่ม Payroll Type
              </Button>
            )}
          </Space>
        </div>
      </motion.div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-sm text-slate-500">
              ทั้งหมด
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-800">
              {summary.total}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div className="text-sm text-slate-500">
              ใช้งาน
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {summary.active}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div className="text-sm text-slate-500">
              ไม่ใช้งาน
            </div>

            <div className="mt-2 text-3xl font-bold text-red-500">
              {summary.inactive}
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="ค้นหารหัส / ชื่อ Payroll Type / รายละเอียด"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={payrollTypes}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total) =>
              `ทั้งหมด ${total} รายการ`,
          }}
          scroll={{
            x: 1050,
          }}
        />
      </Card>

      <Modal
        open={openModal}
        title={
          editingPayrollType
            ? "แก้ไข Payroll Type"
            : "เพิ่ม Payroll Type"
        }
        width={760}
        destroyOnHidden
        mask={!saving}
        keyboard={!saving}
        onCancel={handleCloseModal}
        onOk={handleSave}
        okText={
          editingPayrollType
            ? "อัปเดต"
            : "บันทึก"
        }
        cancelText="ยกเลิก"
        confirmLoading={saving}
      >
        <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              รหัส Payroll Type
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <Input
              value={
                form.payroll_type_code
              }
              placeholder="เช่น MONTHLY"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  payroll_type_code:
                    e.target.value
                      .toUpperCase(),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ชื่อ Payroll Type
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <Input
              value={
                form.payroll_type_name
              }
              placeholder="เช่น รายเดือน"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  payroll_type_name:
                    e.target.value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              รายละเอียด
            </label>

            <Input.TextArea
              rows={3}
              value={form.description}
              placeholder="รายละเอียดประเภท Payroll"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description:
                    e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ความถี่การจ่าย
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <Select
              className="w-full"
              value={
                form.payment_frequency
              }
              options={[
                {
                  value: "monthly",
                  label: "รายเดือน",
                },
                {
                  value: "daily",
                  label: "รายวัน",
                },
                {
                  value: "weekly",
                  label: "รายสัปดาห์",
                },
                {
                  value: "biweekly",
                  label: "ทุก 2 สัปดาห์",
                },
              ]}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  payment_frequency:
                    value,
                  default_payment_day:
                    value === "monthly"
                      ? prev.default_payment_day
                      : null,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              วันจ่ายเริ่มต้น
            </label>

            <Input
              type="number"
              min={1}
              max={31}
              disabled={
                form.payment_frequency !==
                "monthly"
              }
              value={
                form.payment_frequency ===
                "monthly"
                  ? form.default_payment_day ??
                    ""
                  : ""
              }
              placeholder="เช่น 25"
              onChange={(e) => {
                const nextValue =
                  e.target.value;

                setForm((prev) => ({
                  ...prev,
                  default_payment_day:
                    nextValue === ""
                      ? null
                      : Number(
                          nextValue
                        ),
                }));
              }}
            />
          </div>

          <StatusSelect
            value={form.status}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                status: value,
              }))
            }
          />

          <SortOrderField
            value={form.sort_order}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                sort_order:
                  Number(value || 0),
              }))
            }
          />
        </div>
      </Modal>
    </div>
  );
}