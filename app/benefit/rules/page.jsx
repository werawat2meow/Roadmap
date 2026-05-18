"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Form,Input,InputNumber,Modal,Select,Space,Switch,Table,Tag,message,} from "antd";
import {SafetyCertificateOutlined,PlusOutlined,EditOutlined,DeleteOutlined,ReloadOutlined,} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const POSITION_LEVELS = [
  "P1", "P2", "P3", "P4", "P5", "P6",
  "P7", "P8", "P9", "P10", "P11", "P12",
];

export default function BenefitRulesPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const canView = hasPermission(user, "benefit.rule.view") || hasPermission(user, "benefit.rule.manage");
  const canCreate = hasPermission(user, "benefit.rule.create") || hasPermission(user, "benefit.rule.manage");
  const canUpdate = hasPermission(user, "benefit.rule.update") || hasPermission(user, "benefit.rule.manage");
  const canDelete = hasPermission(user, "benefit.rule.delete") || hasPermission(user, "benefit.rule.manage");

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/rules", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(json.data || []);
      setBenefits(json.benefits || []);
      setEmployeeStatuses(json.employeeStatuses || []);
      setEmploymentTypes(json.employmentTypes || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_RULES_ERROR:", error);
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      rule_year: new Date().getFullYear(),
      min_service_months: 0,
      quota_frequency: "yearly",
      is_unlimited: false,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      benefit_id: record.benefit_id,
      rule_year: record.rule_year,
      position_level: record.position_level,
      employee_status_id: record.employee_status_id,
      employment_type_id: record.employment_type_id,
      min_service_months: record.min_service_months,
      max_service_months: record.max_service_months,
      quota_amount: record.quota_amount,
      quota_unit: record.quota_unit,
      quota_frequency: record.quota_frequency,
      discount_percent: record.discount_percent,
      is_unlimited: record.is_unlimited,
      rule_note: record.rule_note,
      is_active: record.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/benefits/rules", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editing?.id,
          ...values,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      message.success(editing ? "แก้ไข Rule สำเร็จ" : "เพิ่ม Rule สำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;

      console.error("SAVE_BENEFIT_RULE_ERROR:", error);
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบ Benefit Rule",
      content: `ต้องการลบ Rule ของ "${record?.benefits?.benefit_name || "-"}" ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/rules?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบข้อมูลไม่สำเร็จ");
          }

          message.success("ลบ Rule สำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_BENEFIT_RULE_ERROR:", error);
          message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "ปี",
        dataIndex: "rule_year",
        width: 100,
        fixed: "left",
      },
      {
        title: "สวัสดิการ",
        width: 240,
        fixed: "left",
        render: (_, record) => record?.benefits?.benefit_name || "-",
      },
      {
        title: "ระดับ",
        dataIndex: "position_level",
        width: 120,
        render: (value) => value || "ทุกระดับ",
      },
      {
        title: "สถานะพนักงาน",
        width: 180,
        render: (_, record) => record?.employee_statuses?.status_name || "ทุกสถานะ",
      },
      {
        title: "ประเภทการจ้าง",
        width: 180,
        render: (_, record) => record?.employment_types?.type_name || "ทุกประเภท",
      },
      {
        title: "อายุงาน",
        width: 180,
        render: (_, record) => {
          const min = record.min_service_months ?? 0;
          const max = record.max_service_months;

          if (max) return `${min} - ${max} เดือน`;
          return `ตั้งแต่ ${min} เดือน`;
        },
      },
      {
        title: "Quota",
        width: 180,
        render: (_, record) => {
          if (record.is_unlimited) return "ไม่จำกัด";

          if (record.quota_amount) {
            return `${Number(record.quota_amount).toLocaleString()} ${
              record.quota_unit || ""
            }`;
          }

          if (record.discount_percent) {
            return `${record.discount_percent}%`;
          }

          return "-";
        },
      },
      {
        title: "รอบ",
        dataIndex: "quota_frequency",
        width: 120,
      },
      {
        title: "สถานะ",
        dataIndex: "is_active",
        width: 120,
        render: (value) =>
          value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
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
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดูข้อมูล Benefit Rules</p>
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
            <SafetyCertificateOutlined className="text-emerald-600" />
            <span className="text-lg font-bold text-slate-800">
              จัดการ Benefit Rules
            </span>
          </div>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>

            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                เพิ่ม Rule
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
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title={editing ? "แก้ไข Benefit Rule" : "เพิ่ม Benefit Rule"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={850}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
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
              name="rule_year"
              rules={[{ required: true, message: "กรุณากรอกปีสิทธิ์" }]}
            >
              <InputNumber className="w-full" min={2020} max={2100} />
            </Form.Item>

            <Form.Item label="ระดับพนักงาน" name="position_level">
              <Select
                allowClear
                placeholder="ทุกระดับ"
                options={POSITION_LEVELS.map((level) => ({
                  label: level,
                  value: level,
                }))}
              />
            </Form.Item>

            <Form.Item label="สถานะพนักงาน" name="employee_status_id">
              <Select
                allowClear
                placeholder="ทุกสถานะ"
                options={employeeStatuses.map((item) => ({
                  label: item.status_name,
                  value: item.id,
                }))}
              />
            </Form.Item>

            <Form.Item label="ประเภทการจ้าง" name="employment_type_id">
              <Select
                allowClear
                placeholder="ทุกประเภท"
                options={employmentTypes.map((item) => ({
                  label: item.type_name,
                  value: item.id,
                }))}
              />
            </Form.Item>

            <Form.Item label="รอบการใช้สิทธิ์" name="quota_frequency">
              <Select
                allowClear
                options={[
                  { label: "รายปี", value: "yearly" },
                  { label: "รายเดือน", value: "monthly" },
                  { label: "รายวัน", value: "daily" },
                  { label: "ครั้งเดียว", value: "once" },
                ]}
              />
            </Form.Item>

            <Form.Item label="อายุงานขั้นต่ำ (เดือน)" name="min_service_months">
              <InputNumber className="w-full" min={0} />
            </Form.Item>

            <Form.Item label="อายุงานสูงสุด (เดือน)" name="max_service_months">
              <InputNumber className="w-full" min={0} />
            </Form.Item>

            <Form.Item label="Quota Amount" name="quota_amount">
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>

            <Form.Item label="Quota Unit" name="quota_unit">
              <Input placeholder="เช่น บาท, ครั้ง, วัน" />
            </Form.Item>

            <Form.Item label="Discount Percent" name="discount_percent">
              <InputNumber className="w-full" min={0} max={100} precision={2} />
            </Form.Item>

            <Form.Item label="ไม่จำกัดสิทธิ์" name="is_unlimited" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <Form.Item label="หมายเหตุ Rule" name="rule_note">
            <Input.TextArea rows={4} placeholder="รายละเอียดเงื่อนไขเพิ่มเติม" />
          </Form.Item>

          <Form.Item label="เปิดใช้งาน" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}