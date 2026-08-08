"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Col,Input,Modal,Popconfirm,Row,Space,Table,Tag,Tooltip,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,SearchOutlined,BankOutlined,ReloadOutlined,} from "@ant-design/icons";
import { motion } from "framer-motion";
import {swalConfirm,swalError,swalSuccess,} from "@/app/components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";

export default function BusinessUnitsPage() {

  /* =========================
    Permission
  ========================= */
  // #region
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.business_units.view");
  const canCreate = hasPermission(user, "ems.business_units.create");
  const canEdit = hasPermission(user, "ems.business_units.edit");
  const canDelete = hasPermission(user, "ems.business_units.delete");

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
  // #endregion

  /* =========================
      States
  ========================= */
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingBusinessUnit, setEditingBusinessUnit] = useState(null);
  const [form, setForm] = useState({
    business_unit_code: "",
    business_unit_name: "",
    status: "active",
    sort_order: 0,
  });

  /* =========================
      Load Data
  ========================= */

  const loadBusinessUnits = async (keyword = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(
        `/api/admin/business-units?${params.toString()}`
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result?.error || "โหลดข้อมูลไม่สำเร็จ"
        );
      }

      setBusinessUnits(result.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadBusinessUnits();
    }
  }, [canView]);

  /* =========================
      Search
  ========================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canView) {
        loadBusinessUnits(search);
      }
    }, 300);

    return () => clearTimeout(timer);

  }, [search]);

  /* =========================
      Reset Form
  ========================= */

  const resetForm = () => {
    setEditingBusinessUnit(null);

    setForm({
      business_unit_code: "",
      business_unit_name: "",
      status: "active",
      sort_order: 0,
    });
  };

  /* =========================
      Open Create
  ========================= */

  const handleOpenCreate = () => {

    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูล");
      return;
    }

    resetForm();

    setOpenModal(true);

  };

  /* =========================
      Open Edit
  ========================= */

  const handleOpenEdit = (item) => {

    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }

    setEditingBusinessUnit(item);

    setForm({
      business_unit_code:
        item.business_unit_code || "",

      business_unit_name:
        item.business_unit_name || "",

      status:
        item.status || "active",

      sort_order:
        item.sort_order || 0,
    });

    setOpenModal(true);

  };

  /* =========================
      Close Modal
  ========================= */

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  /* =========================
      Summary
  ========================= */

  const summary = useMemo(() => {

    return {

      total:
        businessUnits.length,

      active:
        businessUnits.filter(
          (x) => x.status === "active"
        ).length,

      inactive:
        businessUnits.filter(
          (x) => x.status === "inactive"
        ).length,

    };

  }, [businessUnits]);

  /* =========================
      Columns
  ========================= */

  const columns = [
    {
      title: "Code",
      dataIndex: "business_unit_code",
      width: 160,
    },

    {
      title: "Business Unit",
      dataIndex: "business_unit_name",
    },

    {
      title: "Status",
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
          {value}
        </Tag>
      ),
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space>

          <Tooltip title="Edit">

            <Button
              icon={<EditOutlined />}
              onClick={() =>
                handleOpenEdit(record)
              }
            />

          </Tooltip>

          <Tooltip title="Delete">

            <Button
              danger
              icon={<DeleteOutlined />}
            />

          </Tooltip>

        </Space>
      ),
    },
  ];
    /* =========================
      Save
  ========================= */

  const handleSave = async () => {
    const isEdit = !!editingBusinessUnit;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูล");
      return;
    }

    if (!form.business_unit_code.trim()) {
      swalError("กรุณากรอกรหัส Business Unit");
      return;
    }

    if (!form.business_unit_name.trim()) {
      swalError("กรุณากรอกชื่อ Business Unit");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/business-units/${editingBusinessUnit.id}`
        : "/api/admin/business-units";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Save Failed");
      }

      swalSuccess(
        isEdit
          ? "แก้ไข Business Unit สำเร็จ"
          : "เพิ่ม Business Unit สำเร็จ"
      );

      handleCloseModal();

      await loadBusinessUnits(search);

    } catch (err) {
      console.error(err);
      swalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================
      Delete
  ========================= */

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูล");
      return;
    }

    const confirm = await swalConfirm({
      title: "ยืนยันการลบ",
      text: `ต้องการลบ ${item.business_unit_name} ใช่หรือไม่ ?`,
      confirmButtonText: "ลบข้อมูล",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/business-units/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Delete Failed");
      }

      swalSuccess("ลบ Business Unit สำเร็จ");

      await loadBusinessUnits(search);

    } catch (err) {
      console.error(err);
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      Table Columns
  ========================= */

  columns[4].render = (_, record) => (
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
          title="ลบ Business Unit"
          description={`ต้องการลบ ${record.business_unit_name} ?`}
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
  );

  /* =========================
      Refresh
  ========================= */

  const handleRefresh = () => {
    loadBusinessUnits(search);
  };
    if (!canView) {
    return null;
  }

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
              Business Unit
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              จัดการหน่วยธุรกิจ สำหรับโครงสร้างบัญชีและ Payroll Cost
            </p>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreate}
              >
                เพิ่ม Business Unit
              </Button>
            )}
          </Space>
        </div>
      </motion.div>

      <Row >
        <Col xs={24} md={8}>
          <Card className="rounded-3xl shadow-sm">
            <p className="text-sm text-slate-500">ทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {summary.total}
            </p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="rounded-3xl shadow-sm">
            <p className="text-sm text-slate-500">ใช้งาน</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {summary.active}
            </p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="rounded-3xl shadow-sm">
            <p className="text-sm text-slate-500">ไม่ใช้งาน</p>
            <p className="mt-2 text-3xl font-bold text-red-500">
              {summary.inactive}
            </p>
          </Card>
        </Col>
      </Row>

      <Card className="rounded-3xl shadow-sm">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="ค้นหา Business Unit Code / Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="large"
        />
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={businessUnits}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        open={openModal}
        title={editingBusinessUnit ? "แก้ไข Business Unit" : "เพิ่ม Business Unit"}
        onCancel={handleCloseModal}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editingBusinessUnit ? "อัพเดท" : "บันทึก"}
        cancelText="ยกเลิก"
        width={720}
        destroyOnHidden
      >
        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              รหัส Business Unit <span className="text-red-500">*</span>
            </label>

            <Input
              value={form.business_unit_code}
              placeholder="เช่น BU-HQ"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  business_unit_code: e.target.value.toUpperCase(),
                }))
              }
              size="large"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ชื่อ Business Unit <span className="text-red-500">*</span>
            </label>

            <Input
              value={form.business_unit_name}
              placeholder="เช่น Head Office"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  business_unit_name: e.target.value,
                }))
              }
              size="large"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              สถานะ
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ลำดับการแสดงผล
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
              size="large"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}