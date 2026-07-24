"use client";

import { useEffect, useMemo, useState , useRef } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,SearchOutlined,ReloadOutlined,DollarOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalError,swalSuccess,} from "../../../components/Swal";

const initialForm = {
  profit_center_code: "",
  profit_center_name: "",
  business_unit_id: "",
  status: "active",
  sort_order: 0,
};

export default function ProfitCentersPage() {

  // #region   permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.profit_centers.view");
  const canCreate = hasPermission(user, "ems.profit_centers.create");
  const canEdit = hasPermission(user, "ems.profit_centers.edit");
  const canDelete = hasPermission(user, "ems.profit_centers.delete");

  // #endregion

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profitCenters, setProfitCenters] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingProfitCenter, setEditingProfitCenter] = useState(null);
  const [form, setForm] = useState(initialForm);
  const isFirstLoad = useRef(true);

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

  const loadBusinessUnits = async () => {
    try {
      const res = await fetch(
        "/api/admin/business-units",
        {
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result?.error ||
            "โหลด Business Unit ไม่สำเร็จ"
        );
      }

      setBusinessUnits(result.data || []);
    } catch (err) {
      swalError(err.message);
    }
  };

  const loadProfitCenters = async (
    keyword = ""
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(
        `/api/admin/profit-centers?${params}`,
        {
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result?.error ||
            "โหลด Profit Center ไม่สำเร็จ"
        );
      }

      setProfitCenters(result.data || []);
    } catch (err) {
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser || !user || !canView) return;
    if (isFirstLoad.current) {
      loadBusinessUnits();
    }
    const delay = isFirstLoad.current ? 0 : 300;
    isFirstLoad.current = false;
    const timer = setTimeout(() => {
      loadProfitCenters(search);
    }, delay);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setEditingProfitCenter(null);
    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่ม Profit Center"
      );
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไข Profit Center"
      );
      return;
    }

    setEditingProfitCenter(item);

    setForm({
      profit_center_code:
        item.profit_center_code || "",

      profit_center_name:
        item.profit_center_name || "",

      business_unit_id:
        item.business_unit_id || "",

      status: item.status || "active",

      sort_order:
        item.sort_order || 0,
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const summary = useMemo(() => {
    return {
      total: profitCenters.length,

      active: profitCenters.filter(
        (x) => x.status === "active"
      ).length,

      inactive: profitCenters.filter(
        (x) => x.status === "inactive"
      ).length,
    };
  }, [profitCenters]);

  const columns = [
    {
      title: "รหัส",
      dataIndex: "profit_center_code",
      width: 170,
    },
    {
      title: "Profit Center",
      dataIndex: "profit_center_name",
    },
    {
      title: "Business Unit",
      dataIndex: "business_unit_name",

      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.business_unit_name}
          </div>

          <div className="text-xs text-slate-400">
            {record.business_unit_code}
          </div>
        </div>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",

      width: 120,

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
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={!canEdit}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>

          <Tooltip title="ลบ">
            <Popconfirm
              title="ลบ Profit Center"
              description={`ต้องการลบ ${record.profit_center_name} ?`}
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

  /* =========================
      Save
  ========================= */

  const handleSave = async () => {
    const isEdit = !!editingProfitCenter;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Profit Center");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Profit Center");
      return;
    }

    if (!form.profit_center_code.trim()) {
      swalError("กรุณากรอกรหัส Profit Center");
      return;
    }

    if (!form.profit_center_name.trim()) {
      swalError("กรุณากรอกชื่อ Profit Center");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/profit-centers/${editingProfitCenter.id}`
        : "/api/admin/profit-centers";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profit_center_code: form.profit_center_code,
          profit_center_name: form.profit_center_name,
          business_unit_id: form.business_unit_id || null,
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
          ? "แก้ไข Profit Center สำเร็จ"
          : "เพิ่ม Profit Center สำเร็จ"
      );

      handleCloseModal();

      await loadProfitCenters(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
      Delete
  ========================= */

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Profit Center");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/profit-centers/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Delete Failed");
      }

      swalSuccess("ลบ Profit Center สำเร็จ");

      await loadProfitCenters(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      Refresh
  ========================= */

  const handleRefresh = () => {
    loadBusinessUnits();
    loadProfitCenters(search);
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
              <DollarOutlined />
              Profit Center
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              จัดการ Profit Center สำหรับโครงสร้างรายได้ กำไร และการวิเคราะห์ทางบัญชี
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
                เพิ่ม Profit Center
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
          placeholder="ค้นหา Profit Center..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={profitCenters}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        open={openModal}
        title={editingProfitCenter ? "แก้ไข Profit Center" : "เพิ่ม Profit Center"}
        width={700}
        destroyOnHidden
        onCancel={handleCloseModal}
        onOk={handleSave}
        okText={editingProfitCenter ? "อัพเดท" : "บันทึก"}
        cancelText="ยกเลิก"
        confirmLoading={saving}
      >
        <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              รหัส Profit Center
            </label>

            <Input
              value={form.profit_center_code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  profit_center_code: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              ชื่อ Profit Center
            </label>

            <Input
              value={form.profit_center_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  profit_center_name: e.target.value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Business Unit
            </label>

            <Select
              style={{ width: "100%" }}
              placeholder="เลือก Business Unit"
              value={form.business_unit_id || undefined}
              options={businessUnits.map((item) => ({
                value: item.id,
                label: `${item.business_unit_code} - ${item.business_unit_name}`,
              }))}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  business_unit_id: value,
                }))
              }
              allowClear
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">สถานะ</label>

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
            <label className="mb-2 block text-sm font-medium">ลำดับ</label>
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
