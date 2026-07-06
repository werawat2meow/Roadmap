"use client";

import { useEffect, useState } from "react";
import {Card,Table,Button,Space,Input,Select,Tag,message,Drawer,Form,InputNumber,Switch,Popconfirm,Tooltip,Typography,Alert,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,ReloadOutlined,InfoCircleOutlined,QuestionCircleOutlined,} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const { Text } = Typography;

const currentYear = new Date().getFullYear();

const defaultForm = {
  benefit_id: null,
  policy_code: "",
  policy_name: "",
  rule_year: currentYear,
  position_level: null,
  min_service_months: 0,
  max_service_months: null,
  min_age: null,
  max_age: null,
  quota_amount: 0,
  quota_unit: "amount",
  quota_frequency: "yearly",
  priority: 100,
  probation_required: false,
  is_unlimited: false,
  is_active: true,
};


const FieldTip = ({ text }) => (
  <Tooltip title={text}>
    <QuestionCircleOutlined className="ml-1 cursor-pointer text-slate-400 hover:text-blue-500" />
  </Tooltip>
);

export default function BenefitPoliciesPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [benefits, setBenefits] = useState([]);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState(currentYear);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const canView = hasPermission(user, "benefit.policy.view") || hasPermission(user, "benefit.policy.manage");
  const canCreate = hasPermission(user, "benefit.policy.create") || hasPermission(user, "benefit.policy.manage");
  const canUpdate = hasPermission(user, "benefit.policy.update") || hasPermission(user, "benefit.policy.edit") || hasPermission(user, "benefit.policy.manage");
  const canDelete = hasPermission(user, "benefit.policy.delete") || hasPermission(user, "benefit.policy.manage");

  const loadBenefits = async () => {
    try {
      const res = await fetch("/api/benefits/master?page=1&pageSize=100", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "โหลด Benefit ไม่สำเร็จ");
      setBenefits(json.data || []);
    } catch (error) {
      message.error(error?.message || "โหลด Benefit ไม่สำเร็จ");
    }
  };

  const loadData = async (nextSearch = search, nextYear = year) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (nextSearch) params.set("search", nextSearch);
      if (nextYear) params.set("year", String(nextYear));
      const res = await fetch(`/api/benefits/policies?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "โหลด Policy ไม่สำเร็จ");
      setRows(json.data || []);
    } catch (error) {
      message.error(error?.message || "โหลด Policy ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadBenefits();
      loadData("", currentYear);
    }
  }, [canView]);

  const handleAdd = () => {
    setEditingRow(null);
    form.setFieldsValue(defaultForm);
    setDrawerOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRow(record);
    form.setFieldsValue({
      benefit_id: record.benefit_id || null,
      policy_code: record.policy_code || "",
      policy_name: record.policy_name || "",
      rule_year: record.rule_year || currentYear,
      position_level: record.position_level || null,
      min_service_months: record.min_service_months ?? 0,
      max_service_months: record.max_service_months ?? null,
      min_age: record.min_age ?? null,
      max_age: record.max_age ?? null,
      quota_amount: Number(record.quota_amount || 0),
      quota_unit: record.quota_unit || "amount",
      quota_frequency: record.quota_frequency || "yearly",
      priority: record.priority ?? 100,
      probation_required: Boolean(record.probation_required),
      is_unlimited: Boolean(record.is_unlimited),
      is_active: Boolean(record.is_active),
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = { ...values, id: editingRow?.id };
      const res = await fetch("/api/benefits/policies", {
        method: editingRow ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "บันทึก Policy ไม่สำเร็จ");
      message.success(json?.message || "บันทึกสำเร็จ");
      setDrawerOpen(false);
      setEditingRow(null);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "บันทึก Policy ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      const res = await fetch(`/api/benefits/policies?id=${record.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "ลบ Policy ไม่สำเร็จ");
      message.success(json?.message || "ลบสำเร็จ");
      loadData();
    } catch (error) {
      message.error(error?.message || "ลบ Policy ไม่สำเร็จ");
    }
  };

  const columns = [
    {
      title: (
        <Tooltip title="รหัสกฎสิทธิ์ประโยชน์ ใช้อ้างอิงในระบบ">
          Policy Code <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      dataIndex: "policy_code",
      width: 170,
      fixed: "left",
      render: (value) => (
        <Text code className="text-xs">
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "Policy Name",
      dataIndex: "policy_name",
      width: 240,
      render: (value) => value || "-",
    },
    {
      title: (
        <Tooltip title="ประเภทสิทธิ์ประโยชน์ที่ Policy นี้ผูกอยู่">
          Benefit <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      width: 260,
      render: (_, record) => (
        <div>
          <div className="font-semibold">
            {record?.benefits?.benefit_name || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {record?.benefits?.benefit_code || "-"}
          </div>
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="ปีที่กฎนี้มีผลบังคับใช้">
          Year <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      dataIndex: "rule_year",
      width: 90,
    },
    {
      title: (
        <Tooltip title="ระดับตำแหน่งที่ได้รับสิทธิ์ ถ้าแสดง 'ทุก Level' หมายถึงใช้ได้กับทุกตำแหน่ง">
          Position <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      dataIndex: "position_level",
      width: 130,
      render: (value) =>
        value ? (
          <Tag color="blue">{value}</Tag>
        ) : (
          <Text type="secondary" className="text-xs">
            ทุก Level
          </Text>
        ),
    },
    {
      title: (
        <Tooltip title="ช่วงอายุงาน (เดือน) ที่พนักงานต้องมีเพื่อรับสิทธิ์นี้ เช่น '3 - 24 เดือน' หรือ '6+ เดือน' (ไม่จำกัดสูงสุด)">
          Service <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      width: 160,
      render: (_, record) => {
        const min = record.min_service_months ?? 0;
        const max = record.max_service_months;
        if (max === null || max === undefined) return `${min}+ เดือน`;
        return `${min} - ${max} เดือน`;
      },
    },
    {
      title: (
        <Tooltip title="ช่วงอายุของพนักงาน (ปี) ที่ได้รับสิทธิ์ ถ้าแสดง '-' หมายถึงไม่จำกัดอายุ">
          Age <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      width: 140,
      render: (_, record) => {
        if (!record.min_age && !record.max_age)
          return <Text type="secondary">-</Text>;
        if (record.min_age && !record.max_age)
          return `${record.min_age}+ ปี`;
        if (!record.min_age && record.max_age)
          return `ไม่เกิน ${record.max_age} ปี`;
        return `${record.min_age} - ${record.max_age} ปี`;
      },
    },
    {
      title: (
        <Tooltip title="วงเงิน/จำนวนสิทธิ์ที่ได้รับต่อรอบ เช่น 5,000 บาท / 10 วัน / 3 ครั้ง หรือ 'Unlimited' ไม่จำกัด">
          Quota <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      width: 180,
      render: (_, record) =>
        record.is_unlimited ? (
          <Tag color="green">Unlimited</Tag>
        ) : (
          <span>
            {Number(record.quota_amount || 0).toLocaleString()}{" "}
            <Text type="secondary" className="text-xs">
              {record.quota_unit || "amount"}
            </Text>
          </span>
        ),
    },
    {
      title: (
        <Tooltip title="รอบการรีเซ็ตสิทธิ์: Yearly = รายปี, Monthly = รายเดือน, Once = ได้รับครั้งเดียว">
          Frequency <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      dataIndex: "quota_frequency",
      width: 120,
      render: (value) => {
        const map = { yearly: "รายปี", monthly: "รายเดือน", once: "ครั้งเดียว" };
        return (
          <Tooltip title={map[value] || value}>
            <Tag>{value || "yearly"}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: (
        <Tooltip title="ลำดับความสำคัญของ Policy ตัวเลขน้อย = ใช้ก่อน เมื่อพนักงานตรงหลายเงื่อนไขพร้อมกัน">
          Priority <InfoCircleOutlined className="ml-1 text-slate-400" />
        </Tooltip>
      ),
      dataIndex: "priority",
      width: 100,
      render: (value) => (
        <Tag color={value <= 50 ? "orange" : "default"}>{value}</Tag>
      ),
    },
    {
      title: "Status",
      width: 110,
      render: (_, record) => (
        <Tooltip
          title={
            record.is_active
              ? "Policy นี้เปิดใช้งานอยู่"
              : "Policy นี้ถูกปิดการใช้งาน พนักงานจะไม่ได้รับสิทธิ์"
          }
        >
          <Tag color={record.is_active ? "green" : "red"}>
            {record.is_active ? "Active" : "Inactive"}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canUpdate && (
            <Tooltip title="แก้ไข Policy">
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="ยืนยันลบ Policy?"
              description={
                <span>
                  ต้องการลบ{" "}
                  <strong>{record.policy_name || record.policy_code}</strong>{" "}
                  ใช่หรือไม่?
                  <br />
                  <Text type="danger" className="text-xs">
                    การลบจะไม่สามารถกู้คืนได้
                  </Text>
                </span>
              }
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Tooltip title="ลบ Policy">
                <Button danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ============================================================
  // No permission
  // ============================================================
  if (!canView) {
    return (
      <div className="p-6">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดู Policy Rules</p>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Main
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <Space orientation="vertical" size={0}>
            <div className="text-lg font-bold">Benefit Policy Rules</div>
            <Text type="secondary" className="text-xs font-normal">
              กฎเงื่อนไขการได้รับสิทธิ์ประโยชน์ของพนักงาน — กำหนดว่าใครได้รับอะไร
              เท่าไหร่ และเมื่อใด
            </Text>
          </Space>
        }
        extra={
          <Space wrap>
            <Tooltip title="โหลดข้อมูลใหม่">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadData(search, year)}
              >
                Refresh
              </Button>
            </Tooltip>
            {canCreate && (
              <Tooltip title="สร้าง Policy ใหม่สำหรับกำหนดเงื่อนไขสิทธิ์ประโยชน์">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Policy
                </Button>
              </Tooltip>
            )}
          </Space>
        }
      >
        {/* ── Guide banner ── */}
        <Alert
          className="mb-4"
          type="info"
          showIcon
          title="แต่ละ Policy คือชุดเงื่อนไข (อายุงาน, ระดับตำแหน่ง, อายุ) ที่กำหนดว่าพนักงานจะได้รับสิทธิ์ประโยชน์ประเภทใด วงเงินเท่าไหร่ และรีเซ็ตทุกรอบไหน"
        />

        {/* ── Filters ── */}
        <Space className="mb-4" wrap>
          <Input.Search
            placeholder="ค้นหาด้วย Policy Code หรือ Policy Name"
            allowClear
            style={{ width: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(value) => {
              setSearch(value || "");
              loadData(value || "", year);
            }}
          />
          <Tooltip title="กรองตามปีที่กฎมีผลบังคับใช้">
            <Select
              style={{ width: 140 }}
              value={year}
              onChange={(value) => {
                setYear(value);
                loadData(search, value);
              }}
              options={[
                { label: `ปี ${currentYear - 1}`, value: currentYear - 1 },
                { label: `ปี ${currentYear} (ปัจจุบัน)`, value: currentYear },
                { label: `ปี ${currentYear + 1}`, value: currentYear + 1 },
              ]}
            />
          </Tooltip>
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1700 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} Policy`,
          }}
        />
      </Card>

      {/* ============================================================ */}
      {/* Drawer — Add / Edit                                          */}
      {/* ============================================================ */}
      <Drawer
        title={
          <Space orientation="vertical" size={0}>
            <span>{editingRow ? "แก้ไข Policy" : "เพิ่ม Policy ใหม่"}</span>
            <Text type="secondary" className="text-xs font-normal">
              {editingRow
                ? `กำลังแก้ไข: ${editingRow.policy_code || editingRow.policy_name}`
                : "กรอกข้อมูลเงื่อนไขสิทธิ์ประโยชน์ใหม่"}
            </Text>
          </Space>
        }
        size="large"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>ยกเลิก</Button>
            <Button type="primary" loading={saving} onClick={handleSubmit}>
              บันทึก
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={defaultForm}>

          {/* ── Section: ข้อมูลพื้นฐาน ── */}
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-3 text-sm font-semibold text-slate-600">
              📋 ข้อมูลพื้นฐาน
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label={
                  <span>
                    Policy Code
                    <FieldTip text="รหัสอ้างอิงของ Policy ควรสั้น กระชับ และไม่ซ้ำกัน เช่น OPD-PERMANENT-2026" />
                  </span>
                }
                name="policy_code"
                rules={[{ required: true, message: "กรุณาระบุ Policy Code" }]}
              >
                <Input placeholder="เช่น OPD-PERMANENT-2026" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Policy Name
                    <FieldTip text="ชื่อ Policy ที่อธิบายเงื่อนไขให้เข้าใจง่าย เช่น OPD สำหรับพนักงานประจำ" />
                  </span>
                }
                name="policy_name"
                rules={[{ required: true, message: "กรุณาระบุ Policy Name" }]}
              >
                <Input placeholder="เช่น OPD สำหรับพนักงานประจำ" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Benefit
                    <FieldTip text="เลือกประเภทสิทธิ์ประโยชน์ที่ Policy นี้จะผูกเงื่อนไขด้วย" />
                  </span>
                }
                name="benefit_id"
                rules={[{ required: true, message: "กรุณาเลือก Benefit" }]}
              >
                <Select
                  showSearch
                  placeholder="เลือก Benefit"
                  optionFilterProp="label"
                  options={benefits.map((item) => ({
                    value: item.id,
                    label: `${item.benefit_code || "-"} - ${item.benefit_name || "-"}`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Rule Year
                    <FieldTip text="ปีที่กฎนี้มีผลบังคับใช้ แต่ละปีสามารถมีเงื่อนไขต่างกันได้" />
                  </span>
                }
                name="rule_year"
                rules={[{ required: true, message: "กรุณาระบุปี" }]}
              >
                <InputNumber className="w-full" min={2000} max={2100} />
              </Form.Item>
            </div>
          </div>

          {/* ── Section: เงื่อนไขผู้มีสิทธิ์ ── */}
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="mb-1 text-sm font-semibold text-blue-700">
              🎯 เงื่อนไขผู้มีสิทธิ์
            </div>
            <p className="mb-3 text-xs text-blue-500">
              พนักงานต้องตรงทุกเงื่อนไขที่กำหนดจึงจะได้รับสิทธิ์ ถ้าปล่อยว่างไว้ = ไม่จำกัด
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label={
                  <span>
                    Position Level
                    <FieldTip text="ระดับตำแหน่งที่ได้รับสิทธิ์ เช่น P1-P5 ถ้าไม่เลือก = ทุกระดับ" />
                  </span>
                }
                name="position_level"
              >
                <Select
                  allowClear
                  placeholder="ทุก Level (ไม่จำกัด)"
                  options={[
                    "P1","P2","P3","P4","P5","P6",
                    "P7","P8","P9","P10","P11","P12",
                  ].map((level) => ({ value: level, label: level }))}
                />
              </Form.Item>

              <div /> {/* spacer */}

              <Form.Item
                label={
                  <span>
                    Min Service Months
                    <FieldTip text="อายุงานขั้นต่ำ (เดือน) ที่ต้องมีก่อนได้รับสิทธิ์ เช่น 3 = ต้องผ่านทดลองงาน 3 เดือน" />
                  </span>
                }
                name="min_service_months"
                extra="เดือนขั้นต่ำ — ใส่ 0 หากไม่มีเงื่อนไขอายุงาน"
              >
                <Space.Compact className="w-full">
                  <InputNumber className="w-full" min={0} />
                  <Button disabled style={{ cursor: "default", color: "#666", background: "#fafafa" }}>เดือน</Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Max Service Months
                    <FieldTip text="อายุงานสูงสุด (เดือน) ถ้าปล่อยว่าง = ไม่จำกัดสูงสุด" />
                  </span>
                }
                name="max_service_months"
                extra="ปล่อยว่าง = ไม่จำกัดอายุงานสูงสุด"
              >
                <Space.Compact className="w-full">
                  <InputNumber className="w-full" min={0} placeholder="ไม่จำกัด" />
                  <Button disabled style={{ cursor: "default", color: "#666", background: "#fafafa" }}>เดือน</Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Min Age
                    <FieldTip text="อายุขั้นต่ำ (ปี) ของพนักงานที่ได้รับสิทธิ์ ถ้าปล่อยว่าง = ไม่จำกัด" />
                  </span>
                }
                name="min_age"
                extra="ปล่อยว่าง = ไม่จำกัดอายุขั้นต่ำ"
              >
                <Space.Compact className="w-full">
                  <InputNumber className="w-full" min={0} placeholder="ไม่จำกัด" />
                  <Button disabled style={{ cursor: "default", color: "#666", background: "#fafafa" }}>ปี</Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Max Age
                    <FieldTip text="อายุสูงสุด (ปี) ของพนักงานที่ได้รับสิทธิ์ ถ้าปล่อยว่าง = ไม่จำกัด" />
                  </span>
                }
                name="max_age"
                extra="ปล่อยว่าง = ไม่จำกัดอายุสูงสุด"
              >
                <Space.Compact className="w-full">
                  <InputNumber className="w-full" min={0} placeholder="ไม่จำกัด" />
                  <Button disabled style={{ cursor: "default", color: "#666", background: "#fafafa" }}>ปี</Button>
                </Space.Compact>
              </Form.Item>
            </div>
          </div>

          {/* ── Section: โควตาสิทธิ์ ── */}
          <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
            <div className="mb-1 text-sm font-semibold text-green-700">
              💰 โควตาสิทธิ์
            </div>
            <p className="mb-3 text-xs text-green-600">
              กำหนดจำนวนสิทธิ์ที่พนักงานจะได้รับต่อรอบ
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label={
                  <span>
                    Quota Unit
                    <FieldTip text="หน่วยของสิทธิ์: Amount = บาท, Day = วัน, Time = ครั้ง" />
                  </span>
                }
                name="quota_unit"
              >
                <Select
                  options={[
                    { label: "Amount / บาท — วงเงินค่าใช้จ่าย", value: "amount" },
                    { label: "Day / วัน — จำนวนวันลา", value: "day" },
                    { label: "Time / ครั้ง — จำนวนครั้งที่ใช้ได้", value: "time" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Quota Frequency
                    <FieldTip text="รอบการรีเซ็ตสิทธิ์: Yearly = รีเซ็ตทุกปี, Monthly = รีเซ็ตทุกเดือน, Once = ได้รับครั้งเดียวตลอดอายุงาน" />
                  </span>
                }
                name="quota_frequency"
              >
                <Select
                  options={[
                    { label: "Yearly — รีเซ็ตทุกปี", value: "yearly" },
                    { label: "Monthly — รีเซ็ตทุกเดือน", value: "monthly" },
                    { label: "Once — ครั้งเดียวตลอดอายุงาน", value: "once" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, next) =>
                  prev.is_unlimited !== next.is_unlimited
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("is_unlimited") ? (
                    <div className="col-span-2 rounded border border-green-200 bg-white p-3 text-sm text-green-700">
                      ✅ <strong>Unlimited</strong> — พนักงานได้รับสิทธิ์ไม่จำกัดจำนวน ไม่ต้องระบุ Quota Amount
                    </div>
                  ) : (
                    <Form.Item
                      label={
                        <span>
                          Quota Amount
                          <FieldTip text="จำนวนสิทธิ์ที่ได้รับต่อรอบ เช่น 5000 บาท หรือ 10 วัน ตามหน่วยที่เลือก" />
                        </span>
                      }
                      name="quota_amount"
                      extra="จำนวนตามหน่วยที่เลือกข้างต้น"
                    >
                      <InputNumber className="w-full" min={0} />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </div>
          </div>

          {/* ── Section: การตั้งค่าเพิ่มเติม ── */}
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-3 text-sm font-semibold text-slate-600">
              ⚙️ การตั้งค่าเพิ่มเติม
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label={
                  <span>
                    Priority
                    <FieldTip text="ลำดับความสำคัญ — ตัวเลขน้อยกว่า = ใช้ก่อน เมื่อพนักงานตรงเงื่อนไขหลาย Policy พร้อมกัน" />
                  </span>
                }
                name="priority"
                extra="ตัวเลขน้อย = สำคัญกว่า (ใช้ก่อน)"
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>

              <div /> {/* spacer */}

              <Form.Item
                label={
                  <span>
                    Probation Required
                    <FieldTip text="เปิด = พนักงานต้องผ่านทดลองงานก่อนจึงจะได้รับสิทธิ์นี้ / ปิด = ได้รับสิทธิ์ตั้งแต่วันเริ่มงาน" />
                  </span>
                }
                name="probation_required"
                valuePropName="checked"
                extra="เปิด = ต้องผ่านทดลองงานก่อน"
              >
                <Switch checkedChildren="ต้องผ่านทดลองงาน" unCheckedChildren="ไม่จำกัด" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Unlimited
                    <FieldTip text="เปิด = ไม่จำกัดโควตา พนักงานใช้สิทธิ์ได้ไม่อั้น (จะซ่อนช่อง Quota Amount)" />
                  </span>
                }
                name="is_unlimited"
                valuePropName="checked"
                extra="เปิด = ไม่จำกัดจำนวนสิทธิ์"
              >
                <Switch checkedChildren="Unlimited" unCheckedChildren="มีโควตา" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Active
                    <FieldTip text="ปิด = Policy นี้จะไม่ถูกนำไปคำนวณสิทธิ์ให้พนักงาน (เก็บไว้โดยไม่ใช้งาน)" />
                  </span>
                }
                name="is_active"
                valuePropName="checked"
                extra="ปิด = Policy ถูกพักการใช้งาน"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}