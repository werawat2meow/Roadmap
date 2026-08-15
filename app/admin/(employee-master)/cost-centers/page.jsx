"use client";

import { useEffect, useMemo, useState , useRef } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,SearchOutlined,ReloadOutlined,FundProjectionScreenOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalConfirm,swalError,swalSuccess,} from "@/app/components/Swal";
import usePermissions from "@/hooks/usePermissions";


const initialForm = {
  cost_center_code: "",
  cost_center_name: "",
  business_unit_id: "",
  status: "active",
  sort_order: 0,
};

export default function CostCentersPage() {
  const isFirstLoad = useRef(true);
  const { user, loadingUser, canView, canCreate, canEdit, canDelete } = usePermissions("ems.cost_centers");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [costCenters, setCostCenters] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadBusinessUnits = async () => {
    try {
      const res = await fetch("/api/admin/business-units", {
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.error || "โหลด Business Unit ไม่สำเร็จ");
      }
      setBusinessUnits(result.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "โหลด Business Unit ไม่สำเร็จ");
    }
  };

  const loadCostCenters = async (keyword = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }
      const res = await fetch(`/api/admin/cost-centers?${params.toString()}`, {
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.error || "โหลด Cost Center ไม่สำเร็จ");
      }
      setCostCenters(result.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "โหลด Cost Center ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && user && canView) {
      loadBusinessUnits();
      loadCostCenters().finally(() => {
        isFirstLoad.current = false;
      });
    }
  }, [loadingUser, user, canView]);

  useEffect(() => {
    if (isFirstLoad.current) return;
    const timer = setTimeout(() => {
      if (!loadingUser && user && canView) {
        loadCostCenters(search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setEditingCostCenter(null);
    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Cost Center");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Cost Center");
      return;
    }
    setEditingCostCenter(item);
    setForm({
      cost_center_code: item.cost_center_code || "",
      cost_center_name: item.cost_center_name || "",
      business_unit_id: item.business_unit_id || "",
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
      total: costCenters.length,
      active: costCenters.filter((x) => x.status === "active").length,
      inactive: costCenters.filter((x) => x.status === "inactive").length,
    };
  }, [costCenters]);

  const columns = [
    {
      title: "รหัส",
      dataIndex: "cost_center_code",
      width: 160,
    },
    {
      title: "Cost Center",
      dataIndex: "cost_center_name",
    },
    {
      title: "Business Unit",
      dataIndex: "business_unit_name",
      render: (value, record) => (
        <div>
          <div className="font-medium text-slate-700">
            {value || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {record.business_unit_code || ""}
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
              title="ลบ Cost Center"
              description={`ต้องการลบ ${record.cost_center_name} ?`}
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
    const isEdit = !!editingCostCenter;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Cost Center");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Cost Center");
      return;
    }

    if (!form.cost_center_code.trim()) {
      swalError("กรุณากรอกรหัส Cost Center");
      return;
    }

    if (!form.cost_center_name.trim()) {
      swalError("กรุณากรอกชื่อ Cost Center");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/cost-centers/${editingCostCenter.id}`
        : "/api/admin/cost-centers";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cost_center_code: form.cost_center_code,
          cost_center_name: form.cost_center_name,
          business_unit_id: form.business_unit_id || null,
          status: form.status,
          sort_order: form.sort_order,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Save Failed");
      }

      swalSuccess(
        isEdit ? "แก้ไข Cost Center สำเร็จ" : "เพิ่ม Cost Center สำเร็จ"
      );

      handleCloseModal();
      await loadCostCenters(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Cost Center");
      return;
    }
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/cost-centers/${item.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Delete Failed");
      }

      swalSuccess("ลบ Cost Center สำเร็จ");
      await loadCostCenters(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadBusinessUnits();
    loadCostCenters(search);
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <FundProjectionScreenOutlined />
              Cost Center
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              จัดการ Cost Center สำหรับระบบบัญชี และ Payroll
            </p>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
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
                เพิ่ม Cost Center
              </Button>
            )}
          </Space>
        </div>
      </motion.div>

      {/* Summary */}
      <Row>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-slate-500 text-sm">
              ทั้งหมด
            </div>
            <div className="text-3xl font-bold mt-2">
              {summary.total}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div className="text-slate-500 text-sm">
              ใช้งาน
            </div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {summary.active}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div className="text-slate-500 text-sm">
              ไม่ใช้งาน
            </div>
            <div className="text-3xl font-bold text-red-500 mt-2">
              {summary.inactive}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="ค้นหา Cost Center..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={costCenters}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
          scroll={{
            x: 900,
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        open={openModal}
        title={
          editingCostCenter
            ? "แก้ไข Cost Center"
            : "เพิ่ม Cost Center"
        }
        width={700}
        destroyOnHidden
        onCancel={handleCloseModal}
        onOk={handleSave}
        okText={editingCostCenter ? "อัพเดท" : "บันทึก"}
        cancelText="ยกเลิก"
        confirmLoading={saving}
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              รหัส Cost Center
            </label>
            <Input
              value={form.cost_center_code}
              onChange={(e)=>
                setForm(prev=>({
                  ...prev,
                  cost_center_code:e.target.value.toUpperCase()
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              ชื่อ Cost Center
            </label>
            <Input
              value={form.cost_center_name}
              onChange={(e)=>
                setForm(prev=>({
                  ...prev,
                  cost_center_name:e.target.value
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Business Unit
            </label>
            <Select
              style={{ width:"100%" }}
              placeholder="เลือก Business Unit"

              value={form.business_unit_id || undefined}

              options={businessUnits.map(item=>({
                value:item.id,
                label:`${item.business_unit_code} - ${item.business_unit_name}`
              }))}

              onChange={(value)=>
                setForm(prev=>({
                  ...prev,
                  business_unit_id:value
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              สถานะ
            </label>
            <Select
              style={{ width:"100%" }}
              value={form.status}
              options={[
                {
                  value:"active",
                  label:"ใช้งาน"
                },
                {
                  value:"inactive",
                  label:"ไม่ใช้งาน"
                }
              ]}
              onChange={(value)=>
                setForm(prev=>({
                  ...prev,
                  status:value
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              ลำดับ
            </label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e)=>
                setForm(prev=>({
                  ...prev,
                  sort_order:Number(e.target.value)
                }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}