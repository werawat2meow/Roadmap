"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber,
  Modal, Result, Row, Select, Space, Statistic, Table, Tag, Typography, message,
} from "antd";
import {
  DeleteOutlined, EditOutlined, NumberOutlined, PlusOutlined,
  ReloadOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";

const { Title, Text } = Typography;

const GROUP_OPTIONS = [
  { value: "tax", label: "ภาษี" },
  { value: "social_security", label: "ประกันสังคม" },
  { value: "workmen_compensation", label: "กองทุนเงินทดแทน" },
  { value: "other", label: "อื่น ๆ" },
];

const VALUE_TYPE_OPTIONS = [
  { value: "number", label: "ตัวเลข" },
  { value: "percentage", label: "เปอร์เซ็นต์" },
  { value: "currency", label: "จำนวนเงิน" },
  { value: "text", label: "ข้อความ" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
];

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function apiError(payload, fallback) {
  return payload?.error || payload?.message || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
}

function formatValue(record) {
  if (record?.value_type === "text") return record?.value_text || "-";
  const value = Number(record?.value_numeric);
  if (!Number.isFinite(value)) return "-";
  if (record?.value_type === "percentage") {
    return `${value.toLocaleString("th-TH", { maximumFractionDigits: 4 })}%`;
  }
  if (record?.value_type === "currency") {
    return `${value.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${record?.unit || "บาท"}`;
  }
  return `${value.toLocaleString("th-TH", { maximumFractionDigits: 4 })}${
    record?.unit ? ` ${record.unit}` : ""
  }`;
}

export default function StatutorySettingsPage() {
  const { user, loadingUser } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const canView = hasPermission(user, "ems.statutory_settings.view");
  const canCreate = hasPermission(user, "ems.statutory_settings.create");
  const canEdit = hasPermission(user, "ems.statutory_settings.edit");
  const canDelete = hasPermission(user, "ems.statutory_settings.delete");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [group, setGroup] = useState();
  const [status, setStatus] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const valueType = Form.useWatch("value_type", form);

  const loadData = useCallback(async () => {
    if (!canView) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) params.set("search", search.trim());
      if (group) params.set("setting_group", group);
      if (status) params.set("status", status);

      const res = await fetch(
        `/api/admin/statutory-settings?${params.toString()}`,
        { cache: "no-store" }
      );

      const json = await readJsonResponse(res);

      if (!res.ok) {
        throw new Error(apiError(json, "ไม่สามารถโหลดค่าคงที่ได้"));
      }

      setRows(Array.isArray(json.data) ? json.data : []);
      setSummary(json.summary || {});
      setTotal(Number(json.pagination?.total || 0));
    } catch (error) {
      console.error("LOAD_STATUTORY_SETTINGS_ERROR:", error);
      messageApi.error(error?.message || "ไม่สามารถโหลดค่าคงที่ได้");
    } finally {
      setLoading(false);
    }
  }, [canView, group, messageApi, page, pageSize, search, status]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadingUser, user, canView, loadData, search]);

  const openCreate = () => {
    if (!canCreate) {
      messageApi.error("คุณไม่มีสิทธิ์เพิ่มค่าคงที่");
      return;
    }

    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      setting_group: "tax",
      value_type: "number",
      effective_from: dayjs(),
      effective_to: null,
      status: "active",
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    if (!canEdit) {
      messageApi.error("คุณไม่มีสิทธิ์แก้ไขค่าคงที่");
      return;
    }

    setEditing(record);
    form.setFieldsValue({
      ...record,
      value_numeric:
        record.value_numeric === null || record.value_numeric === undefined
          ? null
          : Number(record.value_numeric),
      effective_from: record.effective_from ? dayjs(record.effective_from) : null,
      effective_to: record.effective_to ? dayjs(record.effective_to) : null,
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const body = {
        ...values,
        setting_code: String(values.setting_code || "").trim().toUpperCase(),
        setting_name_th: String(values.setting_name_th || "").trim(),
        setting_name_en: String(values.setting_name_en || "").trim() || null,
        value_numeric: values.value_type === "text" ? null : values.value_numeric,
        value_text:
          values.value_type === "text"
            ? String(values.value_text || "").trim()
            : null,
        unit: String(values.unit || "").trim() || null,
        effective_from: values.effective_from?.format("YYYY-MM-DD"),
        effective_to: values.effective_to
          ? values.effective_to.format("YYYY-MM-DD")
          : null,
        description: String(values.description || "").trim() || null,
      };

      const res = await fetch(
        editing
          ? `/api/admin/statutory-settings/${editing.id}`
          : "/api/admin/statutory-settings",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await readJsonResponse(res);

      if (!res.ok) {
        throw new Error(apiError(json, "ไม่สามารถบันทึกข้อมูลได้"));
      }

      messageApi.success(
        editing ? "แก้ไขค่าคงที่เรียบร้อยแล้ว" : "เพิ่มค่าคงที่เรียบร้อยแล้ว"
      );

      setOpen(false);
      setEditing(null);
      form.resetFields();

      await loadData();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("SAVE_STATUTORY_SETTING_ERROR:", error);
      messageApi.error(error?.message || "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  const remove = (record) => {
    if (!canDelete) {
      messageApi.error("คุณไม่มีสิทธิ์ลบค่าคงที่");
      return;
    }

    Modal.confirm({
      title: "ยืนยันการลบค่าคงที่",
      content: `${record.setting_code} - ${record.setting_name_th}`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          setDeletingId(record.id);

          const res = await fetch(
            `/api/admin/statutory-settings/${record.id}`,
            { method: "DELETE" }
          );

          const json = await readJsonResponse(res);

          if (!res.ok) {
            throw new Error(apiError(json, "ไม่สามารถลบข้อมูลได้"));
          }

          messageApi.success("ลบค่าคงที่เรียบร้อยแล้ว");
          await loadData();
        } catch (error) {
          console.error("DELETE_STATUTORY_SETTING_ERROR:", error);
          messageApi.error(error?.message || "ไม่สามารถลบข้อมูลได้");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: "รหัส",
        dataIndex: "setting_code",
        width: 210,
        render: (value) => <Text strong>{value || "-"}</Text>,
      },
      {
        title: "รายการค่าคงที่",
        dataIndex: "setting_name_th",
        width: 300,
        render: (value, record) => (
          <div>
            <div className="font-medium text-slate-800">{value || "-"}</div>
            {record.setting_name_en ? (
              <div className="mt-1 text-xs text-slate-400">
                {record.setting_name_en}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: "กลุ่ม",
        dataIndex: "setting_group",
        width: 180,
        render: (value) => {
          const option = GROUP_OPTIONS.find((item) => item.value === value);
          const color =
            value === "tax"
              ? "blue"
              : value === "social_security"
                ? "green"
                : value === "workmen_compensation"
                  ? "gold"
                  : "default";

          return <Tag color={color}>{option?.label || value || "-"}</Tag>;
        },
      },
      {
        title: "ค่า",
        key: "value",
        width: 190,
        render: (_, record) => <Text strong>{formatValue(record)}</Text>,
      },
      {
        title: "มีผลตั้งแต่",
        dataIndex: "effective_from",
        width: 130,
        render: formatDate,
      },
      {
        title: "มีผลถึง",
        dataIndex: "effective_to",
        width: 130,
        render: formatDate,
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        width: 110,
        render: (value) => (
          <Tag color={value === "active" ? "success" : "default"}>
            {value === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
          </Tag>
        ),
      },
      {
        title: "จัดการ",
        key: "actions",
        width: 120,
        fixed: "right",
        render: (_, record) => (
          <Space>
            {canEdit ? (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            ) : null}

            {canDelete ? (
              <Button
                type="text"
                danger
                loading={deletingId === record.id}
                icon={<DeleteOutlined />}
                onClick={() => remove(record)}
              />
            ) : null}
          </Space>
        ),
      },
    ],
    [canDelete, canEdit, deletingId]
  );

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;

  if (!canView) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="คุณไม่มีสิทธิ์ใช้งานส่วนค่าคงที่ภาษีและประกันสังคม"
      />
    );
  }

  return (
    <>
      {contextHolder}

      <div className="flex flex-col gap-5 p-4 md:p-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Space size={12}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
                <NumberOutlined />
              </div>
              <div>
                <Title level={3} className="!mb-1">
                  ค่าคงที่ภาษีและประกันสังคม
                </Title>
                <Text type="secondary">
                  จัดการค่าที่ใช้คำนวณภาษี ประกันสังคม และกองทุนตามช่วงวันที่มีผล
                </Text>
              </div>
            </Space>

            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                รีเฟรช
              </Button>
              {canCreate ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  เพิ่มค่าคงที่
                </Button>
              ) : null}
            </Space>
          </div>
        </Card>

        <Alert
          showIcon
          type="info"
          message="ใช้ Effective Date แทนการ Hardcode ตัวเลขใน Source Code"
          description="เมื่ออัตราหรือเพดานเปลี่ยน ให้สร้างช่วงวันที่ใหม่ เพื่อรองรับประวัติและ Payroll ย้อนหลัง"
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card><Statistic title="ทั้งหมด" value={summary.total || 0} /></Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card><Statistic title="ใช้งาน" value={summary.active || 0} /></Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card><Statistic title="กลุ่มภาษี" value={summary.tax || 0} /></Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="กลุ่มประกันสังคม"
                value={summary.social_security || 0}
              />
            </Card>
          </Col>
        </Row>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <Row gutter={[12, 12]} className="mb-4">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="ค้นหารหัสหรือชื่อค่าคงที่"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </Col>

            <Col xs={24} sm={12} lg={7}>
              <Select
                allowClear
                className="w-full"
                placeholder="ทุกกลุ่ม"
                options={GROUP_OPTIONS}
                value={group}
                onChange={(value) => {
                  setGroup(value);
                  setPage(1);
                }}
              />
            </Col>

            <Col xs={24} sm={12} lg={7}>
              <Select
                allowClear
                className="w-full"
                placeholder="ทุกสถานะ"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
            </Col>
          </Row>

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            scroll={{ x: 1350 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [20, 50, 100],
              showTotal: (value) => `ทั้งหมด ${value} รายการ`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPageSize !== pageSize ? 1 : nextPage);
                setPageSize(nextPageSize);
              },
            }}
          />
        </Card>
      </div>

      <Modal
        open={open}
        title={editing ? "แก้ไขค่าคงที่" : "เพิ่มค่าคงที่"}
        width={820}
        destroyOnHidden
        maskClosable={!saving}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" disabled={saving} onClick={closeModal}>
            ยกเลิก
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={save}>
            บันทึก
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" disabled={saving}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="setting_group"
                label="กลุ่ม"
                rules={[{ required: true, message: "กรุณาเลือกกลุ่ม" }]}
              >
                <Select options={GROUP_OPTIONS} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="setting_code"
                label="รหัสค่าคงที่"
                extra="เช่น SSO_EMPLOYEE_RATE"
                rules={[
                  { required: true, message: "กรุณากรอกรหัสค่าคงที่" },
                  {
                    pattern: /^[A-Za-z0-9_.-]+$/,
                    message: "ใช้ได้เฉพาะ A-Z, 0-9, _, . และ -",
                  },
                ]}
              >
                <Input
                  maxLength={100}
                  disabled={Boolean(editing)}
                  onChange={(event) => {
                    form.setFieldValue(
                      "setting_code",
                      event.target.value.toUpperCase().replace(/\s+/g, "_")
                    );
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="setting_name_th"
                label="ชื่อค่าคงที่"
                rules={[{ required: true, message: "กรุณากรอกชื่อค่าคงที่" }]}
              >
                <Input maxLength={200} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="setting_name_en" label="ชื่อภาษาอังกฤษ">
                <Input maxLength={200} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="value_type"
                label="ชนิดค่า"
                rules={[{ required: true, message: "กรุณาเลือกชนิดค่า" }]}
              >
                <Select options={VALUE_TYPE_OPTIONS} />
              </Form.Item>
            </Col>

            {valueType === "text" ? (
              <Col xs={24} md={16}>
                <Form.Item
                  name="value_text"
                  label="ค่า"
                  rules={[{ required: true, message: "กรุณากรอกค่า" }]}
                >
                  <Input maxLength={500} />
                </Form.Item>
              </Col>
            ) : (
              <>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="value_numeric"
                    label="ค่า"
                    rules={[{ required: true, message: "กรุณากรอกค่า" }]}
                  >
                    <InputNumber
                      className="w-full"
                      precision={4}
                      min={valueType === "percentage" ? 0 : undefined}
                      max={valueType === "percentage" ? 100 : undefined}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="unit" label="หน่วย">
                    <Input placeholder="เช่น บาท, เดือน" maxLength={50} />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col xs={24} md={8}>
              <Form.Item
                name="effective_from"
                label="มีผลตั้งแต่"
                rules={[{ required: true, message: "กรุณาเลือกวันที่เริ่มมีผล" }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="effective_to"
                label="มีผลถึง"
                dependencies={["effective_from"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const from = getFieldValue("effective_from");
                      if (!value || !from || !value.isBefore(from, "day")) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม")
                      );
                    },
                  }),
                ]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="status"
                label="สถานะ"
                rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
              >
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="description" label="รายละเอียด">
                <Input.TextArea rows={3} maxLength={1000} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
