"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const currentYear = new Date().getFullYear();

const defaultForm = {
  benefit_id: null,
  rule_year: currentYear,
  position_level: null,
  employee_status_id: null,
  quota_amount: 0,
  quota_unit: "amount",
  quota_frequency: "yearly",
  entitlement_period: "yearly",
  is_unlimited: false,
  is_active: true,
};

export default function BenefitMatrixPage() {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [year, setYear] = useState(currentYear);

  const loadMatrix = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/benefits/matrix?year=${year}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลด Benefit Matrix ไม่สำเร็จ");
      }

      setRows(json.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const safeJson = async (res) => {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("INVALID_JSON_RESPONSE:", {
        url: res.url,
        status: res.status,
        text: text.slice(0, 300),
      });

      return {
        success: false,
        data: [],
        error: "API Response ไม่ใช่ JSON",
      };
    }
  };

  const loadMasterData = async () => {
    try {
      const [benefitRes, statusRes] = await Promise.all([
        fetch("/api/benefits", {
          cache: "no-store",
        }),

        fetch("/api/admin/employee-statuses", {
          cache: "no-store",
        }),
      ]);

      const benefitJson = await safeJson(benefitRes);
      const statusJson = await safeJson(statusRes);

      if (benefitRes.ok) {
        setBenefits(benefitJson.data || []);
      } else {
        console.error(
          "LOAD_BENEFITS_ERROR:",
          benefitJson
        );
      }

      if (statusRes.ok) {
        setStatuses(statusJson.data || []);
      } else {
        console.error(
          "LOAD_EMPLOYEE_STATUSES_ERROR:",
          statusJson
        );
      }
    } catch (error) {
      console.error(
        "LOAD_MASTER_DATA_ERROR:",
        error
      );
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [year]);

  const handleAdd = () => {
    setEditing(null);
    form.setFieldsValue(defaultForm);
    setOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);

    form.setFieldsValue({
      benefit_id: record.benefit_id,
      rule_year: record.rule_year,
      position_level: record.position_level,
      employee_status_id: record.employee_status_id,
      quota_amount: Number(record.quota_amount || 0),
      quota_unit: record.quota_unit || "amount",
      quota_frequency: record.quota_frequency || "yearly",
      entitlement_period: record.entitlement_period || "yearly",
      is_unlimited: Boolean(record.is_unlimited),
      is_active: Boolean(record.is_active),
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const payload = {
        ...values,
        id: editing?.id,
      };

      const res = await fetch("/api/benefits/matrix", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "บันทึก Benefit Matrix ไม่สำเร็จ");
      }

      message.success(json.message || "บันทึกสำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadMatrix();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบ Benefit Matrix",
      content: `ต้องการลบ ${record?.benefits?.benefit_name || "รายการนี้"} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/matrix?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบ Benefit Matrix ไม่สำเร็จ");
          }

          message.success(json.message || "ลบสำเร็จ");
          loadMatrix();
        } catch (error) {
          message.error(error.message);
        }
      },
    });
  };

  const columns = [
    {
      title: "Benefit",
      key: "benefit",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record?.benefits?.benefit_name || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {record?.benefits?.benefit_code || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Year",
      dataIndex: "rule_year",
      width: 90,
    },
    {
      title: "Position Level",
      dataIndex: "position_level",
      width: 140,
      render: (value) => value || "ทุก Level",
    },
    {
      title: "Employee Status",
      key: "employee_status",
      width: 170,
      render: (_, record) => record?.employee_statuses?.status_name || "ทุกสถานะ",
    },
    {
      title: "Quota",
      key: "quota",
      width: 160,
      render: (_, record) =>
        record.is_unlimited ? (
          <Tag color="green">Unlimited</Tag>
        ) : (
          <span>
            {Number(record.quota_amount || 0).toLocaleString()}{" "}
            {record.quota_unit}
          </span>
        ),
    },
    {
      title: "Period",
      dataIndex: "entitlement_period",
      width: 120,
      render: (value) => <Tag>{value || "yearly"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 100,
      render: (value) =>
        value ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>,
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Card className="rounded-2xl shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Benefit Matrix
            </h1>
            <p className="text-sm text-slate-500">
              กำหนดสิทธิ์สวัสดิการตามปี, Level, สถานะพนักงาน และ Quota
            </p>
          </div>

          <Space>
            <InputNumber
              value={year}
              min={2000}
              max={2100}
              onChange={(value) => setYear(value || currentYear)}
            />

            <Button icon={<ReloadOutlined />} onClick={loadMatrix}>
              Refresh
            </Button>

            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Matrix
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editing ? "Edit Benefit Matrix" : "Add Benefit Matrix"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={720}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultForm}
          className="mt-4"
        >
          <Form.Item
            label="Benefit"
            name="benefit_id"
            rules={[{ required: true, message: "กรุณาเลือกสวัสดิการ" }]}
          >
            <Select
              showSearch
              placeholder="เลือก Benefit"
              optionFilterProp="label"
              options={benefits.map((item) => ({
                value: item.id,
                label: `${item.benefit_code || "-"} - ${
                  item.benefit_name || "-"
                }`,
              }))}
            />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="Rule Year"
              name="rule_year"
              rules={[{ required: true, message: "กรุณาระบุปี" }]}
            >
              <InputNumber className="w-full" min={2000} max={2100} />
            </Form.Item>

            <Form.Item label="Position Level" name="position_level">
              <Select
                allowClear
                placeholder="ทุก Level"
                options={[
                  { value: "P1", label: "P1" },
                  { value: "P2", label: "P2" },
                  { value: "P3", label: "P3" },
                  { value: "P4", label: "P4" },
                  { value: "P5", label: "P5" },
                  { value: "P6", label: "P6" },
                  { value: "P7", label: "P7" },
                  { value: "P8", label: "P8" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Employee Status" name="employee_status_id">
              <Select
                allowClear
                placeholder="ทุกสถานะ"
                options={statuses.map((item) => ({
                  value: item.id,
                  label: item.status_name || item.status_code || item.name,
                }))}
              />
            </Form.Item>

            <Form.Item label="Entitlement Period" name="entitlement_period">
              <Select
                options={[
                  { value: "yearly", label: "Yearly" },
                  { value: "monthly", label: "Monthly" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Quota Unit" name="quota_unit">
              <Select
                options={[
                  { value: "amount", label: "Amount / บาท" },
                  { value: "day", label: "Day / วัน" },
                  { value: "time", label: "Time / ครั้ง" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Quota Frequency" name="quota_frequency">
              <Select
                options={[
                  { value: "yearly", label: "Yearly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "once", label: "Once" },
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
                getFieldValue("is_unlimited") ? null : (
                  <Form.Item label="Quota Amount" name="quota_amount">
                    <InputNumber className="w-full" min={0} />
                  </Form.Item>
                )
              }
            </Form.Item>

            <Form.Item
              label="Unlimited"
              name="is_unlimited"
              valuePropName="checked"
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item label="Active" name="is_active" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}