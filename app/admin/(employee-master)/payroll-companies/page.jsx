"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,} from "antd";
import {BankOutlined,DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { CompanySelect, PayrollTypeSelect, } from "@/app/components/selectors";
import { SortOrderField,StatusSelect,} from "@/app/components/forms";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalError,swalSuccess,} from "../../../components/Swal";
import { formatThaiTaxId } from "@/lib/validators";

const initialForm = {
  payroll_company_code: "",
  payroll_company_name: "",
  company_id: "",
  social_security_no: "",
  status: "active",
  sort_order: 0,
  payroll_type_id: "",
  payment_day: null,
};

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function PayrollCompaniesPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.payroll_companies.view");
  const canCreate = hasPermission(user, "ems.payroll_companies.create");
  const canEdit = hasPermission(user, "ems.payroll_companies.edit");
  const canDelete = hasPermission(user, "ems.payroll_companies.delete");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payrollCompanies, setPayrollCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingPayrollCompany, setEditingPayrollCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
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

  const loadPayrollCompanies = async (keyword = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const query = params.toString();

      const res = await fetch(
        query
          ? `/api/admin/payroll-companies?${query}`
          : "/api/admin/payroll-companies",
        { cache: "no-store" }
      );

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "โหลด Payroll Company ไม่สำเร็จ");
      }

      setPayrollCompanies(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("LOAD_PAYROLL_COMPANIES_ERROR:", err);
      setPayrollCompanies([]);
      swalError(err.message || "โหลด Payroll Company ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    const timer = setTimeout(() => {
      loadPayrollCompanies(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setEditingPayrollCompany(null);
    setSelectedCompany(null);
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
      social_security_no: item.social_security_no || "",
      payroll_type_id: item.payroll_type_id || "",
      payment_frequency: item.payment_frequency || "",
      payment_day: item.payment_day === null || item.payment_day === undefined ? null : Number(item.payment_day),
      status: item.status || "active",
      sort_order: Number(item.sort_order || 0),
    });

    setSelectedCompany({
      id: item.company_id || "",
      company_code: item.company_code || "",
      company_name_th: item.company_name_th || item.company_name || "",
      company_name_en: item.company_name_en || "",
      tax_id: item.company_tax_id || "",
      branch_no: item.company_branch_no || "",
      address: item.company_address || "",
      province: item.company_province || "",
      district: item.company_district || "",
      subdistrict: item.company_subdistrict || "",
      postcode: item.company_postcode || "",
      phone: item.company_phone || "",
      email: item.company_email || "",
      website: item.company_website || "",
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
      total: payrollCompanies.length,
      active: payrollCompanies.filter((item) => item.status === "active").length,
      inactive: payrollCompanies.filter((item) => item.status === "inactive").length,
    };
  }, [payrollCompanies]);

  const handleSave = async () => {
    const isEdit = Boolean(editingPayrollCompany);

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Payroll Company");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Payroll Company");
      return;
    }

    const payrollCompanyCode = form.payroll_company_code.trim().toUpperCase();
    const payrollCompanyName = form.payroll_company_name.trim();

    if (!payrollCompanyCode) {
      swalError("กรุณากรอกรหัส Payroll Company");
      return;
    }

    if (!payrollCompanyName) {
      swalError("กรุณากรอกชื่อ Payroll Company");
      return;
    }

    if (!form.company_id) {
      swalError("กรุณาเลือก Company Master");
      return;
    }

    if (!form.payroll_type_id) {
      swalError("กรุณาเลือกประเภท Payroll");
      return;
    }

    if ( form.payment_day !== null && ( !Number.isInteger(Number(form.payment_day)) || Number(form.payment_day) < 1 || Number(form.payment_day) > 31 )) {
      swalError("วันที่จ่ายเงินเดือนต้องอยู่ระหว่าง 1 ถึง 31");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/payroll-companies/${editingPayrollCompany.id}`
        : "/api/admin/payroll-companies";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_company_code: payrollCompanyCode,
          payroll_company_name: payrollCompanyName,
          company_id: form.company_id,
          social_security_no: form.social_security_no.trim() || null,
          payroll_type_id: form.payroll_type_id,
          payment_day: form.payment_day === "" || form.payment_day === null ? null : Number(form.payment_day),
          status: form.status || "active",
          sort_order: Number(form.sort_order || 0),
        }),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "บันทึก Payroll Company ไม่สำเร็จ");
      }

      swalSuccess(
        isEdit ? "แก้ไข Payroll Company สำเร็จ" : "เพิ่ม Payroll Company สำเร็จ"
      );

      handleCloseModal();
      await loadPayrollCompanies(search);
    } catch (err) {
      console.error("SAVE_PAYROLL_COMPANY_ERROR:", err);
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

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "ลบ Payroll Company ไม่สำเร็จ");
      }

      swalSuccess("ลบ Payroll Company สำเร็จ");
      await loadPayrollCompanies(search);
    } catch (err) {
      console.error("DELETE_PAYROLL_COMPANY_ERROR:", err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPayrollCompanies(search);
  };

  const columns = [
    {
      title: "รหัส",
      dataIndex: "payroll_company_code",
      width: 160,
      render: (value) => (
        <span className="font-semibold text-slate-700">{value || "-"}</span>
      ),
    },
    {
      title: "Payroll Company",
      dataIndex: "payroll_company_name",
      width: 230,
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">
            {value || "-"}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {record.payroll_type_code
              ? `${record.payroll_type_code} - ${
                  record.payroll_type_name || ""
                }`
              : "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Company Master",
      dataIndex: "company_name",
      width: 260,
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">{value || "-"}</div>
          <div className="mt-1 text-xs text-slate-400">
            {record.company_code || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Tax ID",
      dataIndex: "company_tax_id",
      width: 180,
       render: (value) => value ? formatThaiTaxId(value) : "-",
    },
    {
      title: "ประกันสังคม",
      dataIndex: "social_security_no",
      width: 170,
      render: (value) => value || "-",
    },
    {
      title: "วันที่จ่าย",
      dataIndex: "payment_day",
      width: 110,
      align: "center",
      render: (value, record) => {
        if (record.payment_frequency !== "monthly") {
          return "-";
        }

        return value ? `วันที่ ${value}` : "-";
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 110,
      align: "center",
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
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <Popconfirm
                title="ลบ Payroll Company"
                description={`ต้องการลบ ${record.payroll_company_name} ใช่หรือไม่?`}
                okText="ลบ"
                cancelText="ยกเลิก"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(record)}
              >
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

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
              จัดการบริษัทผู้จ่ายเงินเดือน และเชื่อมข้อมูลนิติบุคคลจาก Company Master
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
                เพิ่ม Payroll Company
              </Button>
            )}
          </Space>
        </div>
      </motion.div>

      <Row gutter={[16, 16]}>
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
          placeholder="ค้นหา Payroll Company / Company Master / Tax ID"
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
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
          scroll={{ x: 1450 }}
        />
      </Card>

      <Modal
        open={openModal}
        title={
          editingPayrollCompany
            ? "แก้ไข Payroll Company"
            : "เพิ่ม Payroll Company"
        }
        width={900}
        destroyOnHidden
        mask={!saving}
        keyboard={!saving}
        onCancel={handleCloseModal}
        onOk={handleSave}
        okText={editingPayrollCompany ? "อัปเดต" : "บันทึก"}
        cancelText="ยกเลิก"
        confirmLoading={saving}
      >
        <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              รหัส Payroll Company
              <span className="ml-1 text-red-500">*</span>
            </label>

            <Input
              value={form.payroll_company_code}
              placeholder="เช่น PAY001"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  payroll_company_code: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ชื่อ Payroll Company
              <span className="ml-1 text-red-500">*</span>
            </label>

            <Input
              value={form.payroll_company_name}
              placeholder="เช่น Payroll Holding"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  payroll_company_name: e.target.value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Company Master
              <span className="ml-1 text-red-500">*</span>
            </label>

            <CompanySelect
              value={form.company_id}
              placeholder="เลือกบริษัท"
              onChange={(companyId, company) => {
                setForm((prev) => ({
                  ...prev,
                  company_id: companyId || "",
                }));

                setSelectedCompany(company || null);
              }}
            />
          </div>

          <div className="md:col-span-2">
            {selectedCompany ? (
              <Card
                size="small"
                className="rounded-2xl border-slate-200 bg-slate-50"
              >
                <div className="mb-4">
                  <div className="font-semibold text-slate-800">
                    ข้อมูลนิติบุคคลจาก Company Master
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    ข้อมูลนี้แสดงอย่างเดียว และแก้ไขได้จากหน้า Company Master
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-400">Company</div>
                    <div className="mt-1 font-semibold text-slate-700">
                      {selectedCompany.company_code || "-"} -{" "}
                      {selectedCompany.company_name_th || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Tax ID</div>
                    <div className="mt-1 text-slate-700">
                      {selectedCompany.tax_id ? formatThaiTaxId(selectedCompany.tax_id) : "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Branch No.</div>
                    <div className="mt-1 text-slate-700">
                      {selectedCompany.branch_no || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Phone</div>
                    <div className="mt-1 text-slate-700">
                      {selectedCompany.phone || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Email</div>
                    <div className="mt-1 break-all text-slate-700">
                      {selectedCompany.email || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Website</div>
                    <div className="mt-1 break-all text-slate-700">
                      {selectedCompany.website || "-"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs text-slate-400">Address</div>
                    <div className="mt-1 leading-6 text-slate-700">
                      {[
                        selectedCompany.address,
                        selectedCompany.subdistrict,
                        selectedCompany.district,
                        selectedCompany.province,
                        selectedCompany.postcode,
                      ]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
                เลือก Company Master เพื่อแสดงข้อมูลนิติบุคคล
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              เลขทะเบียนประกันสังคม
            </label>

            <Input
              value={form.social_security_no}
              maxLength={20}
              placeholder="เลขทะเบียนประกันสังคม"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  social_security_no: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 20),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ประเภท Payroll
            </label>

            <PayrollTypeSelect
              value={form.payroll_type_id}
              onChange={(payrollTypeId, payrollType) => {
                setForm((prev) => ({
                  ...prev,
                  payroll_type_id: payrollTypeId || "",
                  payment_frequency: payrollType?.payment_frequency || "",
                  payment_day: payrollType?.default_payment_day ?? null,
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
                sort_order: Number(value || 0),
              }))
            }
          />
        </div>
      </Modal>
    </div>
  );
}
