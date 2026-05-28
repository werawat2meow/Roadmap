"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Form,Input,InputNumber,Modal,Select,Space,Switch,Table,Tag,message,} from "antd";
import {TeamOutlined,PlusOutlined,EditOutlined,DeleteOutlined,ReloadOutlined,SyncOutlined,} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const MONTH_OPTIONS = [
  { label: "รายปี", value: "" },
  { label: "มกราคม", value: 1 },
  { label: "กุมภาพันธ์", value: 2 },
  { label: "มีนาคม", value: 3 },
  { label: "เมษายน", value: 4 },
  { label: "พฤษภาคม", value: 5 },
  { label: "มิถุนายน", value: 6 },
  { label: "กรกฎาคม", value: 7 },
  { label: "สิงหาคม", value: 8 },
  { label: "กันยายน", value: 9 },
  { label: "ตุลาคม", value: 10 },
  { label: "พฤศจิกายน", value: 11 },
  { label: "ธันวาคม", value: 12 },
];

function getMonthLabel(month) {
  if (month === 0 || month === null || month === undefined) return "รายปี";
  const found = MONTH_OPTIONS.find((item) => item.value === month);
  return found?.label || "รายปี";
}

export default function BenefitEntitlementsPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [benefits, setBenefits] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const canView = hasPermission(user, "benefit.entitlement.view") || hasPermission(user, "benefit.entitlement.manage");
  const canCreate = hasPermission(user, "benefit.entitlement.create") || hasPermission(user, "benefit.entitlement.manage");
  const canUpdate = hasPermission(user, "benefit.entitlement.update") || hasPermission(user, "benefit.entitlement.edit") || hasPermission(user, "benefit.entitlement.manage");
  const canDelete =
    hasPermission(user, "benefit.entitlement.delete") ||
    hasPermission(user, "benefit.entitlement.manage");

  const canGenerate =
    hasPermission(user, "benefit.entitlement.generate") ||
    hasPermission(user, "benefit.entitlement.manage");

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/entitlements", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(json.data || []);
      setEmployees(json.employees || []);
      setBenefits(json.benefits || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_ENTITLEMENTS_ERROR:", error);
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const handleGenerate = () => {
    const currentYear = new Date().getFullYear();

    Modal.confirm({
      title: "ยืนยัน Generate Entitlements",
      content: `ต้องการ Generate สิทธิ์สวัสดิการประจำปี ${currentYear} ตาม Benefit Rules ใช่หรือไม่?`,
      okText: "Generate",
      cancelText: "ยกเลิก",
      async onOk() {
        try {
          setGenerating(true);

          const res = await fetch("/api/benefits/entitlements/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year: currentYear }),
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "Generate Entitlements ไม่สำเร็จ");
          }

          message.success(
            `${json?.message || "Generate Entitlements สำเร็จ"} (${
              json?.generated || 0
            } รายการ)`
          );

          loadData();
        } catch (error) {
          console.error("GENERATE_ENTITLEMENTS_ERROR:", error);
          message.error(error.message || "Generate Entitlements ไม่สำเร็จ");
        } finally {
          setGenerating(false);
        }
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      entitlement_year: new Date().getFullYear(),
      entitlement_month: null,
      quota_amount: 0,
      used_amount: 0,
      remaining_amount: 0,
      quota_unit: "บาท",
      is_unlimited: false,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);

    form.setFieldsValue({
      employee_id: record.employee_id,
      benefit_id: record.benefit_id,
      entitlement_year: record.entitlement_year,
      entitlement_month: record.entitlement_month ?? null,
      quota_amount: record.quota_amount,
      used_amount: record.used_amount,
      remaining_amount: record.remaining_amount,
      quota_unit: record.quota_unit,
      is_unlimited: record.is_unlimited,
      is_active: record.is_active,
      remark: record.remark,
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const res = await fetch("/api/benefits/entitlements", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          ...values,
          entitlement_month: values.entitlement_month || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      message.success(editing ? "แก้ไขสิทธิ์สำเร็จ" : "เพิ่มสิทธิ์สำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;

      console.error("SAVE_BENEFIT_ENTITLEMENT_ERROR:", error);
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบสิทธิ์สวัสดิการ",
      content: `ต้องการลบสิทธิ์ของ "${
        record?.employees?.employee_code || "-"
      }" ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/entitlements?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบข้อมูลไม่สำเร็จ");
          }

          message.success("ลบสิทธิ์สำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_BENEFIT_ENTITLEMENT_ERROR:", error);
          message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "ปี",
        dataIndex: "entitlement_year",
        width: 100,
        fixed: "left",
      },
      {
        title: "รอบสิทธิ์",
        dataIndex: "entitlement_month",
        width: 140,
        fixed: "left",
        render: (value) =>
          value ? <Tag color="blue">{getMonthLabel(value)}</Tag> : <Tag>รายปี</Tag>,
      },
      {
        title: "พนักงาน",
        width: 260,
        fixed: "left",
        render: (_, record) => {
          const emp = record.employees;
          const name = `${emp?.first_name_th || ""} ${
            emp?.last_name_th || ""
          }`.trim();

          return (
            <div>
              <div className="font-semibold text-slate-800">{name || "-"}</div>
              <div className="text-xs text-slate-400">
                {emp?.employee_code || "-"}
              </div>
            </div>
          );
        },
      },
      {
        title: "สวัสดิการ",
        width: 240,
        render: (_, record) => record?.benefits?.benefit_name || "-",
      },
      {
        title: "Quota",
        width: 160,
        render: (_, record) =>
          record.is_unlimited
            ? "ไม่จำกัด"
            : `${Number(record.quota_amount || 0).toLocaleString()} ${
                record.quota_unit || ""
              }`,
      },
      {
        title: "ใช้ไป",
        width: 140,
        render: (_, record) =>
          `${Number(record.used_amount || 0).toLocaleString()} ${
            record.quota_unit || ""
          }`,
      },
      {
        title: "คงเหลือ",
        width: 140,
        render: (_, record) =>
          record.is_unlimited
            ? "ไม่จำกัด"
            : `${Number(record.remaining_amount || 0).toLocaleString()} ${
                record.quota_unit || ""
              }`,
      },
      {
        title: "สถานะ",
        dataIndex: "is_active",
        width: 120,
        render: (value) =>
          value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
      },
      {
        title: "หมายเหตุ",
        dataIndex: "remark",
        width: 260,
        render: (value) => value || "-",
      },
      {
        title: "จัดการ",
        width: 180,
        fixed: "right",
        render: (_, record) => (
          <Space>
            {canUpdate && (
              <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
                แก้ไข
              </Button>
            )}

            {canDelete && (
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                ลบ
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canUpdate, canDelete]
  );

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์ดูข้อมูล Benefit Entitlements
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        variant="borderless"
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-emerald-600" />
            <span className="text-lg font-bold text-slate-800">
              จัดการ Benefit Entitlements
            </span>
          </div>
        }
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>

            {canGenerate && (
              <Button
                icon={<SyncOutlined />}
                loading={generating}
                onClick={handleGenerate}
              >
                Generate Entitlements
              </Button>
            )}

            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                เพิ่มสิทธิ์พนักงาน
              </Button>
            )}
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1750 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title={editing ? "แก้ไข Entitlement" : "เพิ่ม Entitlement"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={850}
        forceRender
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              label="พนักงาน"
              name="employee_id"
              rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
            >
              <Select
                showSearch
                placeholder="เลือกพนักงาน"
                optionFilterProp="label"
                options={employees.map((item) => ({
                  label: `${item.employee_code} - ${item.first_name_th || ""} ${
                    item.last_name_th || ""
                  }`,
                  value: item.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="สวัสดิการ"
              name="benefit_id"
              rules={[{ required: true, message: "กรุณาเลือกสวัสดิการ" }]}
            >
              <Select
                showSearch
                placeholder="เลือกสวัสดิการ"
                optionFilterProp="label"
                options={benefits.map((item) => ({
                  label: `${item.benefit_code} - ${item.benefit_name}`,
                  value: item.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="ปีสิทธิ์"
              name="entitlement_year"
              rules={[{ required: true, message: "กรุณากรอกปีสิทธิ์" }]}
            >
              <InputNumber className="w-full" min={2020} max={2100} />
            </Form.Item>

            <Form.Item label="รอบสิทธิ์" name="entitlement_month">
              <Select
                allowClear
                placeholder="เลือกเดือน หรือเว้นว่างสำหรับรายปี"
                options={MONTH_OPTIONS}
              />
            </Form.Item>

            <Form.Item
              label="จำนวนสิทธิ์ทั้งหมด (Quota Amount)"
              name="quota_amount"
              tooltip="จำนวนสิทธิ์สูงสุดที่พนักงานได้รับในรอบนี้ เช่น 4 ตัว หรือ 1,000 บาท"
              extra="กรอกจำนวนสิทธิ์ที่พนักงานควรได้รับทั้งหมด"
            >
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>

            <Form.Item
              label="ใช้ไปแล้ว (Used Amount)"
              name="used_amount"
              tooltip="จำนวนที่พนักงานเบิกใช้ไปแล้วในรอบนี้ ระบบจะอัปเดตให้อัตโนมัติเมื่อมีการเบิก"
              extra="ปกติไม่ต้องกรอกเอง ระบบจะคำนวณให้"
            >
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>

            <Form.Item
              label="คงเหลือ (Remaining Amount)"
              name="remaining_amount"
              tooltip="จำนวนสิทธิ์ที่ยังเหลืออยู่ = จำนวนทั้งหมด - ใช้ไปแล้ว"
              extra="ควรเท่ากับ จำนวนทั้งหมด ลบ ใช้ไปแล้ว"
            >
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>

            <Form.Item
              label="หน่วยสิทธิ์ (Quota Unit)"
              name="quota_unit"
              tooltip="หน่วยของสิทธิ์ เช่น บาท ครั้ง วัน ตัว"
              extra="ระบุหน่วยให้ตรงกับประเภทสวัสดิการ เช่น ยูนิฟอร์ม → ตัว, ค่ารักษา → บาท"
            >
              <Input placeholder="เช่น บาท, ครั้ง, วัน, ตัว" />
            </Form.Item>

            <Form.Item
              label="ไม่จำกัดสิทธิ์"
              name="is_unlimited"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>

          <Form.Item label="หมายเหตุ" name="remark">
            <Input.TextArea rows={4} placeholder="หมายเหตุเพิ่มเติม" />
          </Form.Item>

          <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/*
HR_ADMIN / BENEFIT_ADMIN ได้ permission นี้ หรือใช้ benefit.entitlement.manage

*/