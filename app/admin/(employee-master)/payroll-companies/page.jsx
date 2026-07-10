"use client";
// ยังไม่เสร็จ ที Select ชื่อบริษัท แล้วให้แก้ได้เฉพาะ Address , Phone , Email   ทำเสร็จ refacter แล้วไปเชื่อม กับ Employee    เสร็จจาก Employee ไปที่ management-assignments
// ต้องกำหนดโครงสร้างผู้บริหารแบบ Tree / Org Chart ตาม P9 - P12 [ ดึงพนักงานเฉพาะ P9 - p12 (Management Level ไม่ต้องเลือก) (ต้องเช็คตำแหน่ง P9-P12 ที่จะทำการกำหนดสายบังคับบัญชาได้ ) ]
import { useEffect, useMemo, useState } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,} from "antd";

import {PlusOutlined,EditOutlined,DeleteOutlined,SearchOutlined,ReloadOutlined,BankOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import { swalError, swalSuccess } from "../../../components/Swal";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css'
import { isValidPhoneNumber } from 'react-phone-number-input'

const initialForm = {
  payroll_company_code: "",
  payroll_company_name: "",
  company_id: "",
  tax_id: "",
  social_security_no: "",
  address: "",
  phone: "",
  email: "",
  status: "active",
  sort_order: 0,
};

export default function PayrollCompaniesPage() {

  const router = useRouter();
  const { user, loadingUser } = useAuth();
  // #region Permission
  const canView = hasPermission(user, "ems.payroll_companies.view");
  const canCreate = hasPermission(user, "ems.payroll_companies.create");
  const canEdit = hasPermission(user, "ems.payroll_companies.edit");
  const canDelete = hasPermission(user, "ems.payroll_companies.delete");
  // #endregion 

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [payrollCompanies, setPayrollCompanies] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingPayrollCompany, setEditingPayrollCompany] = useState(null);
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
  }, [loadingUser, user, canView, router]);

  const loadCompanies = async () => {
    const res = await fetch("/api/admin/companies", {
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.error || "โหลดบริษัทไม่สำเร็จ");
    }
    setCompanies(result.data || []);
  };

  const loadPayrollCompanies = async (keyword = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(
        `/api/admin/payroll-companies?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "โหลด Payroll Company ไม่สำเร็จ");
      }

      setPayrollCompanies(result.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "โหลด Payroll Company ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && user && canView) {
      loadCompanies().catch((err) => {
        console.error(err);
        swalError(err.message || "โหลดบริษัทไม่สำเร็จ");
      });

      loadPayrollCompanies();
    }
  }, [loadingUser, user, canView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadingUser && user && canView) {
        loadPayrollCompanies(search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setEditingPayrollCompany(null);
    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Payroll Company");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Payroll Company");
      return;
    }

    setEditingPayrollCompany(item);

    setForm({
      payroll_company_code: item.payroll_company_code || "",
      payroll_company_name: item.payroll_company_name || "",
      company_id: item.company_id || "",
      tax_id: item.tax_id || "",
      social_security_no: item.social_security_no || "",
      address: item.address || "",
      phone: item.phone || "",
      email: item.email || "",
      status: item.status || "active",
      sort_order: item.sort_order || 0,
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const summary = useMemo(() => {
    return {
      total: payrollCompanies.length,
      active: payrollCompanies.filter((x) => x.status === "active").length,
      inactive: payrollCompanies.filter((x) => x.status === "inactive").length,
    };
  }, [payrollCompanies]);

    const columns = [
    {
      title: "รหัส",
      dataIndex: "payroll_company_code",
      width: 170,
    },
    {
      title: "Payroll Company",
      dataIndex: "payroll_company_name",
    },
    {
      title: "Company Master",
      dataIndex: "company_name",
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">{value || "-"}</div>
          <div className="text-xs text-slate-400">
            {record.company_code || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Tax ID",
      dataIndex: "tax_id",
      width: 160,
      render: (value) => value || "-",
    },
    {
      title: "ประกันสังคม",
      dataIndex: "social_security_no",
      width: 160,
      render: (value) => value || "-",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      render: (value) => (
        <Tag color={value === "active" ? "green" : "red"}>
          {value === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
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
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
              disabled={!canEdit}
            />
          </Tooltip>

          <Tooltip title="ลบ">
            <Popconfirm
              title="ลบ Payroll Company"
              description={`ต้องการลบ ${record.payroll_company_name} ?`}
              okText="ลบ"
              cancelText="ยกเลิก"
              onConfirm={() => handleDelete(record)}
            >
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                disabled={!canDelete}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleSave = async () => {
    const isEdit = !!editingPayrollCompany;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Payroll Company");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Payroll Company");
      return;
    }

    if (!form.payroll_company_code.trim()) {
      swalError("กรุณากรอกรหัส Payroll Company");
      return;
    }

    if (!form.payroll_company_name.trim()) {
      swalError("กรุณากรอกชื่อ Payroll Company");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      swalError("กรุณากรอก Email ให้ถูกต้อง");
      return;
    }

    if (form.phone && !isValidPhoneNumber(form.phone)) {
      swalError("เบอร์โทรศัพท์ไม่ถูกต้อง");
      return
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/payroll-companies/${editingPayrollCompany.id}`
        : "/api/admin/payroll-companies";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payroll_company_code: form.payroll_company_code,
          payroll_company_name: form.payroll_company_name,
          company_id: form.company_id || null,
          tax_id: form.tax_id || null,
          social_security_no: form.social_security_no || null,
          address: form.address || null,
          phone: form.phone || null,
          email: form.email || null,
          status: form.status,
          sort_order: Number(form.sort_order || 0),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Save Failed");
      }

      swalSuccess(
        isEdit
          ? "แก้ไข Payroll Company สำเร็จ"
          : "เพิ่ม Payroll Company สำเร็จ"
      );

      handleCloseModal();
      await loadPayrollCompanies(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Payroll Company");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/payroll-companies/${item.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Delete Failed");
      }

      swalSuccess("ลบ Payroll Company สำเร็จ");
      await loadPayrollCompanies(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCompanies().catch((err) => {
      console.error(err);
      swalError(err.message || "โหลดบริษัทไม่สำเร็จ");
    });

    loadPayrollCompanies(search);
  };
  
  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <BankOutlined />
              Payroll Company
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              จัดการบริษัทผู้จ่ายเงินเดือน สำหรับภาษี ภ.ง.ด.1 ประกันสังคม และ 50 ทวิ
            </p>
          </div>

          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreate}
              >
                เพิ่ม Payroll Company
              </Button>
            )}
          </Space>
        </div>
      </motion.div>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-sm text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-bold">{summary.total}</div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div className="text-sm text-slate-500">ใช้งาน</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {summary.active}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div className="text-sm text-slate-500">ไม่ใช้งาน</div>
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
          placeholder="ค้นหา Payroll Company / Tax ID / Company Master"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={payrollCompanies}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        open={openModal}
        title={
          editingPayrollCompany
            ? "แก้ไข Payroll Company"
            : "เพิ่ม Payroll Company"
        }
        width={820}
        destroyOnHidden
        onCancel={handleCloseModal}
        onOk={handleSave}
        okText={editingPayrollCompany ? "อัพเดท" : "บันทึก"}
        cancelText="ยกเลิก"
        confirmLoading={saving}
      >
        <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              รหัส Payroll Company
            </label>

            <Input
              value={form.payroll_company_code}
              placeholder="เช่น PAY-HOLDING"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  payroll_company_code: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              ชื่อ Payroll Company
            </label>

            <Input
              value={form.payroll_company_name}
              placeholder="เช่น Banana Holding Co.,Ltd."
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  payroll_company_name: e.target.value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Company Master
            </label>

            <Select
              allowClear
              showSearch
              style={{ width: "100%" }}
              placeholder="เลือกบริษัทจาก Company Master"
              value={form.company_id || undefined}
              optionFilterProp="label"
              options={companies.map((item) => ({
                value: item.id,
                label: `${item.company_code || ""} - ${item.company_name_th}`,
              }))}
              onChange={(value) => {
                const company = companies.find((c)=>c.id===value);
                setForm(prev=>({
                    ...prev,
                    company_id:value,
                    tax_id:company?.tax_id || "",
                    phone:company?.phone || "",
                    email:company?.email || "",
                    address:company?.address || ""
                }));
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tax ID
            </label>

            <Input
              value={form.tax_id}
              placeholder="เลขประจำตัวผู้เสียภาษี"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tax_id: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Social Security No.
            </label>

            <Input
              value={form.social_security_no}
              placeholder="เลขทะเบียนประกันสังคม"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  social_security_no: e.target.value.replace(/\D/g, "").slice(0, 20),
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Address
            </label>

            <Input.TextArea
              rows={3}
              value={form.address}
              placeholder="ที่อยู่บริษัทสำหรับเอกสารภาษี / Payroll"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Phone
            </label>

            <PhoneInput
              international
              defaultCountry="TH"
              countryCallingCodeEditable={false}
              value={form.phone}
              onChange={(value) => {
                // ตัดเลข 0 นำหน้าออกเสมอ (เผื่อกรณี edge case)
                const cleaned = value ? value.replace(/^(\+66)0/, '$1') : ''
                setForm(prev => ({ ...prev, phone: cleaned }))
              }}
              placeholder="08X-XXX-XXXX"
              className="phone-input-custom"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <Input
              value={form.email}
              placeholder="payroll@example.com"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              สถานะ
            </label>

            <Select
              style={{ width: "100%" }}
              value={form.status}
              options={[
                { value: "active", label: "ใช้งาน" },
                { value: "inactive", label: "ไม่ใช้งาน" },
              ]}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              ลำดับ
            </label>

            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value || 0),
                }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}