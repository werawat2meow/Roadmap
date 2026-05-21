"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
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
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitUsagesPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [benefits, setBenefits] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [benefitFilter, setBenefitFilter] = useState("");

  const canView = hasPermission(user, "benefit.usage.view") || hasPermission(user, "benefit.usage.manage");
  const canCreate =hasPermission(user, "benefit.usage.create") || hasPermission(user, "benefit.usage.manage");
  const canEdit = hasPermission(user, "benefit.usage.edit") || hasPermission(user, "benefit.usage.manage");
  const canDelete = hasPermission(user, "benefit.usage.delete") || hasPermission(user, "benefit.usage.manage");

  const loadBenefits = async () => {
    try {
      const res = await fetch("/api/benefits/master?page=1&pageSize=100", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลด Benefit ไม่สำเร็จ");
      }

      setBenefits(json.data || []);
    } catch (error) {
      console.error("LOAD_BENEFITS_ERROR:", error);
      message.error(error.message || "โหลด Benefit ไม่สำเร็จ");
    }
  };

  const loadData = async ({
    nextPage = page,
    nextPageSize = pageSize,
    nextBenefitId = benefitFilter,
  } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(nextPageSize));

      if (nextBenefitId) {
        params.set("benefitId", nextBenefitId);
      }

      const res = await fetch(`/api/benefits/usages?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดประวัติการใช้สิทธิ์ไม่สำเร็จ");
      }

      setRows(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || nextPage);
      setPageSize(json.pageSize || nextPageSize);
    } catch (error) {
      console.error("LOAD_USAGE_ERROR:", error);
      message.error(error.message || "โหลดประวัติการใช้สิทธิ์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadBenefits();
      loadData({
        nextPage: 1,
        nextPageSize: 10,
        nextBenefitId: "",
      });
    }
  }, [canView]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      usage_date: dayjs(),
    });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      benefit_id: record.benefit_id,
      benefit_request_id: record.benefit_request_id || null,
      entitlement_id: record.entitlement_id || null,
      usage_date: record.usage_date ? dayjs(record.usage_date) : dayjs(),
      used_amount: record.used_amount,
      usage_unit: record.usage_unit,
      reference_no: record.reference_no,
      remark: record.remark,
    });
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        employee_id: values.employee_id,
        benefit_id: values.benefit_id,
        benefit_request_id: values.benefit_request_id || null,
        entitlement_id: values.entitlement_id || null,
        usage_date: values.usage_date
          ? values.usage_date.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        used_amount:
          values.used_amount !== undefined && values.used_amount !== null
            ? Number(values.used_amount)
            : null,
        usage_unit: values.usage_unit || null,
        reference_no: values.reference_no || null,
        remark: values.remark || null,
      };

      const url = editing
        ? `/api/benefits/usages/${editing.id}`
        : "/api/benefits/usages";

      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "บันทึกการใช้สิทธิ์ไม่สำเร็จ");
      }

      message.success("บันทึกการใช้สิทธิ์สำเร็จ");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error("SAVE_USAGE_ERROR:", error);
      message.error(error.message || "บันทึกการใช้สิทธิ์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบประวัติการใช้สิทธิ์",
      content: `ต้องการลบรายการ ${record.reference_no || record.id} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/usages/${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบประวัติการใช้สิทธิ์ไม่สำเร็จ");
          }

          message.success("ลบประวัติการใช้สิทธิ์สำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_USAGE_ERROR:", error);
          message.error(error.message || "ลบประวัติการใช้สิทธิ์ไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
    {
      title: "Employee",
      width: 240,
      render: (_, record) => {
        const emp = record?.employees;
        const fullName = `${emp?.first_name_th || ""} ${
          emp?.last_name_th || ""
        }`.trim();

        return (
          <div>
            <div className="font-semibold">{fullName || "-"}</div>
            <div className="text-xs text-slate-400">
              {emp?.employee_code || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Benefit",
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
      title: "Request No",
      width: 180,
      render: (_, record) => record?.benefit_requests?.request_no || "-",
    },
    {
      title: "Usage Date",
      dataIndex: "usage_date",
      width: 140,
      render: (value) => value || "-",
    },
    {
      title: "Used Amount",
      dataIndex: "used_amount",
      width: 150,
      render: (value, record) =>
        value ? (
          <Tag color="blue">
            {Number(value).toLocaleString()} {record.usage_unit || ""}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Reference No",
      dataIndex: "reference_no",
      width: 180,
      render: (value) => value || "-",
    },
    {
      title: "Remark",
      dataIndex: "remark",
      width: 260,
      render: (value) => value || "-",
    },
    {
      title: "Created",
      dataIndex: "created_at",
      width: 180,
      render: (value) =>
        value ? new Date(value).toLocaleString("th-TH") : "-",
    },
    {
      title: "Actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Edit
            </Button>
          )}

          {canDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์ดูประวัติการใช้สิทธิ์
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={<div className="text-lg font-bold">Benefit Usages</div>}
        extra={
          <Space wrap>
            <Select
              allowClear
              placeholder="Filter Benefit"
              style={{ width: 260 }}
              value={benefitFilter || undefined}
              onChange={(value) => {
                const nextValue = value || "";
                setBenefitFilter(nextValue);
                setPage(1);
                loadData({
                  nextPage: 1,
                  nextBenefitId: nextValue,
                });
              }}
              options={benefits.map((item) => ({
                label: `${item.benefit_code} - ${item.benefit_name}`,
                value: item.id,
              }))}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                loadData({
                  nextPage: page,
                  nextPageSize: pageSize,
                  nextBenefitId: benefitFilter,
                })
              }
            >
              Refresh
            </Button>

            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Add Usage
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
          scroll={{ x: 1700 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (value) => `ทั้งหมด ${value.toLocaleString()} รายการ`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
              loadData({
                nextPage,
                nextPageSize,
                nextBenefitId: benefitFilter,
              });
            },
          }}
        />
      </Card>

      <Modal
        title={editing ? "Edit Usage" : "Add Usage"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Employee ID"
            name="employee_id"
            rules={[{ required: true, message: "กรุณากรอก Employee ID" }]}
          >
            <Input placeholder="employee uuid" />
          </Form.Item>

          <Form.Item
            label="Benefit"
            name="benefit_id"
            rules={[{ required: true, message: "กรุณาเลือก Benefit" }]}
          >
            <Select
              showSearch
              placeholder="เลือก Benefit"
              optionFilterProp="label"
              options={benefits.map((item) => ({
                label: `${item.benefit_code} - ${item.benefit_name}`,
                value: item.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Benefit Request ID" name="benefit_request_id">
            <Input placeholder="request uuid (ถ้ามี)" />
          </Form.Item>

          <Form.Item label="Entitlement ID" name="entitlement_id">
            <Input placeholder="entitlement uuid (ถ้ามี)" />
          </Form.Item>

          <Form.Item
            label="Usage Date"
            name="usage_date"
            rules={[{ required: true, message: "กรุณาเลือกวันที่ใช้สิทธิ์" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Used Amount" name="used_amount">
            <InputNumber
              min={0}
              precision={2}
              style={{ width: "100%" }}
              placeholder="จำนวนที่ใช้"
            />
          </Form.Item>

          <Form.Item label="Usage Unit" name="usage_unit">
            <Input placeholder="บาท / วัน / ครั้ง" />
          </Form.Item>

          <Form.Item label="Reference No" name="reference_no">
            <Input placeholder="เลขอ้างอิง" />
          </Form.Item>

          <Form.Item label="Remark" name="remark">
            <Input.TextArea rows={4} placeholder="รายละเอียดเพิ่มเติม" />
          </Form.Item>

          <div className="flex justify-end">
            <Space>
              <Button
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>

              <Button type="primary" htmlType="submit" loading={saving}>
                Save
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

/*
  จัดการ permission สำหรับการใช้สิทธิ์ (Benefit Usage)
     ดูประวัติการใช้สิทธิ์และรายการที่ใช้ไปแล้ว (view)
     เพิ่มประวัติการใช้สิทธิ์และรายการที่ใช้ไปแล้ว (create)
     แก้ไขประวัติการใช้สิทธิ์และรายการที่ใช้ไปแล้ว (edit)
     ลบประวัติการใช้สิทธิ์และรายการที่ใช้ไปแล้ว (delete)
      
  benefit.usage.view
  benefit.usage.create
  benefit.usage.edit
  benefit.usage.delete
  benefit.usage.manage (มีได้ทุกอย่าง)


*/