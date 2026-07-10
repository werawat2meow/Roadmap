"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,SearchOutlined,ReloadOutlined,FileTextOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalError,swalSuccess,} from "@/app/components/Swal";

const mappingTypeOptions = [
  { value: "salary", label: "เงินเดือน" },
  { value: "ot", label: "ค่าล่วงเวลา / OT" },
  { value: "bonus", label: "โบนัส" },
  { value: "benefit", label: "สวัสดิการ" },
  { value: "allowance", label: "เงินเพิ่ม / Allowance" },
  { value: "deduction", label: "รายการหัก" },
  { value: "employer_contribution", label: "เงินสมทบนายจ้าง" },
];

const initialForm = {
  gl_code: "",
  gl_name: "",
  mapping_type: "salary",
  business_unit_id: "",
  cost_center_id: "",
  profit_center_id: "",
  status: "active",
  sort_order: 0,
};

export default function GlMappingsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.gl_mappings.view");
  const canCreate = hasPermission(user, "ems.gl_mappings.create");
  const canEdit = hasPermission(user, "ems.gl_mappings.edit");
  const canDelete = hasPermission(user, "ems.gl_mappings.delete");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [glMappings, setGlMappings] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [profitCenters, setProfitCenters] = useState([]);

  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingGlMapping, setEditingGlMapping] = useState(null);
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

  const loadBusinessUnits = async () => {
    const res = await fetch("/api/admin/business-units", {
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.error || "โหลด Business Unit ไม่สำเร็จ");
    }

    setBusinessUnits(result.data || []);
  };

  const loadCostCenters = async () => {
    const res = await fetch("/api/admin/cost-centers", {
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.error || "โหลด Cost Center ไม่สำเร็จ");
    }

    setCostCenters(result.data || []);
  };

  const loadProfitCenters = async () => {
    const res = await fetch("/api/admin/profit-centers", {
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.error || "โหลด Profit Center ไม่สำเร็จ");
    }

    setProfitCenters(result.data || []);
  };

  const loadGlMappings = async (keyword = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(`/api/admin/gl-mappings?${params.toString()}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "โหลด GL Mapping ไม่สำเร็จ");
      }

      setGlMappings(result.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "โหลด GL Mapping ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && user && canView) {
      Promise.all([
        loadBusinessUnits(),
        loadCostCenters(),
        loadProfitCenters(),
      ]).catch((err) => {
        console.error(err);
        swalError(err.message || "โหลด Master ไม่สำเร็จ");
      });

      loadGlMappings();
    }
  }, [loadingUser, user, canView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadingUser && user && canView) {
        loadGlMappings(search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setEditingGlMapping(null);
    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม GL Mapping");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข GL Mapping");
      return;
    }

    setEditingGlMapping(item);

    setForm({
      gl_code: item.gl_code || "",
      gl_name: item.gl_name || "",
      mapping_type: item.mapping_type || "salary",
      business_unit_id: item.business_unit_id || "",
      cost_center_id: item.cost_center_id || "",
      profit_center_id: item.profit_center_id || "",
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
      total: glMappings.length,
      active: glMappings.filter((x) => x.status === "active").length,
      inactive: glMappings.filter((x) => x.status === "inactive").length,
    };
  }, [glMappings]);
    const columns = [
    {
      title: "รหัส GL",
      dataIndex: "gl_code",
      width: 150,
    },
    {
      title: "ชื่อ GL",
      dataIndex: "gl_name",
    },
    {
      title: "ประเภท",
      dataIndex: "mapping_type",
      width: 180,
      render: (value) => {
        const item = mappingTypeOptions.find((x) => x.value === value);
        return item?.label || value || "-";
      },
    },
    {
      title: "Business Unit",
      dataIndex: "business_unit_name",
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">{value || "-"}</div>
          <div className="text-xs text-slate-400">
            {record.business_unit_code || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Cost Center",
      dataIndex: "cost_center_name",
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">{value || "-"}</div>
          <div className="text-xs text-slate-400">
            {record.cost_center_code || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Profit Center",
      dataIndex: "profit_center_name",
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">{value || "-"}</div>
          <div className="text-xs text-slate-400">
            {record.profit_center_code || ""}
          </div>
        </div>
      ),
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
              title="ลบ GL Mapping"
              description={`ต้องการลบ ${record.gl_code} - ${record.gl_name} ?`}
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
    const isEdit = !!editingGlMapping;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข GL Mapping");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม GL Mapping");
      return;
    }

    if (!form.gl_code.trim()) {
      swalError("กรุณากรอกรหัส GL");
      return;
    }

    if (!form.gl_name.trim()) {
      swalError("กรุณากรอกชื่อ GL");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/gl-mappings/${editingGlMapping.id}`
        : "/api/admin/gl-mappings";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gl_code: form.gl_code,
          gl_name: form.gl_name,
          mapping_type: form.mapping_type,
          business_unit_id: form.business_unit_id || null,
          cost_center_id: form.cost_center_id || null,
          profit_center_id: form.profit_center_id || null,
          status: form.status,
          sort_order: Number(form.sort_order || 0),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Save Failed");
      }

      swalSuccess(
        isEdit ? "แก้ไข GL Mapping สำเร็จ" : "เพิ่ม GL Mapping สำเร็จ"
      );

      handleCloseModal();
      await loadGlMappings(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ GL Mapping");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/gl-mappings/${item.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Delete Failed");
      }

      swalSuccess("ลบ GL Mapping สำเร็จ");
      await loadGlMappings(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    Promise.all([
      loadBusinessUnits(),
      loadCostCenters(),
      loadProfitCenters(),
    ]).catch((err) => {
      console.error(err);
      swalError(err.message || "โหลด Master ไม่สำเร็จ");
    });

    loadGlMappings(search);
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
              <FileTextOutlined />
              GL Mapping
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              จัดการผังบัญชีสำหรับ Payroll, Benefit, OT, Bonus และรายการบัญชีอื่น ๆ
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
                เพิ่ม GL Mapping
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
          placeholder="ค้นหา GL Code / GL Name / Business Unit / Cost Center / Profit Center"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={glMappings}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        open={openModal}
        title={editingGlMapping ? "แก้ไข GL Mapping" : "เพิ่ม GL Mapping"}
        width={820}
        destroyOnHidden
        onCancel={handleCloseModal}
        onOk={handleSave}
        okText={editingGlMapping ? "อัพเดท" : "บันทึก"}
        cancelText="ยกเลิก"
        confirmLoading={saving}
      >
        <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              รหัส GL
            </label>

            <Input
              value={form.gl_code}
              placeholder="เช่น 510100"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  gl_code: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              ชื่อ GL
            </label>

            <Input
              value={form.gl_name}
              placeholder="เช่น Salary Expense"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  gl_name: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              ประเภท Mapping
            </label>

            <Select
              style={{ width: "100%" }}
              value={form.mapping_type}
              options={mappingTypeOptions}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  mapping_type: value,
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

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Business Unit
            </label>

            <Select
              allowClear
              showSearch
              style={{ width: "100%" }}
              placeholder="เลือก Business Unit"
              value={form.business_unit_id || undefined}
              optionFilterProp="label"
              options={businessUnits.map((item) => ({
                value: item.id,
                label: `${item.business_unit_code} - ${item.business_unit_name}`,
              }))}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  business_unit_id: value || "",
                  cost_center_id: "",
                  profit_center_id: "",
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Cost Center
            </label>

            <Select
              allowClear
              showSearch
              style={{ width: "100%" }}
              placeholder="เลือก Cost Center"
              value={form.cost_center_id || undefined}
              optionFilterProp="label"
              options={costCenters
                .filter(
                  (item) =>
                    !form.business_unit_id ||
                    item.business_unit_id === form.business_unit_id
                )
                .map((item) => ({
                  value: item.id,
                  label: `${item.cost_center_code} - ${item.cost_center_name}`,
                }))}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  cost_center_id: value || "",
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Profit Center
            </label>

            <Select
              allowClear
              showSearch
              style={{ width: "100%" }}
              placeholder="เลือก Profit Center"
              value={form.profit_center_id || undefined}
              optionFilterProp="label"
              options={profitCenters
                .filter(
                  (item) =>
                    !form.business_unit_id ||
                    item.business_unit_id === form.business_unit_id
                )
                .map((item) => ({
                  value: item.id,
                  label: `${item.profit_center_code} - ${item.profit_center_name}`,
                }))}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  profit_center_id: value || "",
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