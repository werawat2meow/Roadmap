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
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const ROLE_OPTIONS = [
  { label: "HR Admin", value: "HR_ADMIN" },
  { label: "Finance Admin", value: "FINANCE_ADMIN" },
  { label: "Benefit Admin", value: "BENEFIT_ADMIN" },
  { label: "Manager", value: "MANAGER" },
];

export default function BenefitWorkflowsPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [benefits, setBenefits] = useState([]);

  // ✅ รวม open + editing เป็น state เดียว → render ครั้งเดียว ไม่กระพริบ
  const [modalState, setModalState] = useState({ open: false, record: null });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [benefitFilter, setBenefitFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const canView =
    hasPermission(user, "benefit.workflow.view") ||
    hasPermission(user, "benefit.workflow.manage");
  const canCreate =
    hasPermission(user, "benefit.workflow.create") ||
    hasPermission(user, "benefit.workflow.manage");
  const canEdit =
    hasPermission(user, "benefit.workflow.edit") ||
    hasPermission(user, "benefit.workflow.manage");
  const canDelete =
    hasPermission(user, "benefit.workflow.delete") ||
    hasPermission(user, "benefit.workflow.manage");

  const loadBenefits = async () => {
    try {
      const res = await fetch("/api/benefits/master?page=1&pageSize=100", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "โหลด Benefit ไม่สำเร็จ");
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
    nextActive = activeFilter,
  } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(nextPageSize));
      if (nextBenefitId) params.set("benefitId", nextBenefitId);
      if (nextActive !== "") params.set("isActive", nextActive);

      const res = await fetch(`/api/benefits/workflows?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "โหลด Workflow ไม่สำเร็จ");

      setRows(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || nextPage);
      setPageSize(json.pageSize || nextPageSize);
    } catch (error) {
      console.error("LOAD_WORKFLOW_ERROR:", error);
      message.error(error.message || "โหลด Workflow ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadBenefits();
      loadData({ nextPage: 1, nextPageSize: 10, nextBenefitId: "", nextActive: "" });
    }
  }, [canView]);

  // ✅ set state ครั้งเดียว ไม่ trigger render หลายรอบ
  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ step_no: 1, is_required: true, is_active: true });
    setModalState({ open: true, record: null });
  };

  const openEdit = (record) => {
    form.resetFields();
    form.setFieldsValue({
      benefit_id: record.benefit_id,
      workflow_name: record.workflow_name,
      step_no: record.step_no,
      approver_role_code: record.approver_role_code || undefined,
      approver_user_id: record.approver_user_id || null,
      is_required: record.is_required,
      is_active: record.is_active,
    });
    setModalState({ open: true, record });
  };

  const closeModal = () => {
    setModalState({ open: false, record: null });
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const editing = modalState.record;

      const payload = {
        benefit_id: values.benefit_id,
        workflow_name: values.workflow_name,
        step_no: Number(values.step_no),
        approver_role_code: values.approver_role_code || null,
        approver_user_id: values.approver_user_id || null,
        is_required: values.is_required !== false,
        is_active: values.is_active !== false,
      };

      const url = editing
        ? `/api/benefits/workflows/${editing.id}`
        : "/api/benefits/workflows";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "บันทึก Workflow ไม่สำเร็จ");

      message.success("บันทึก Workflow สำเร็จ");
      closeModal();
      loadData();
    } catch (error) {
      console.error("SAVE_WORKFLOW_ERROR:", error);
      message.error(error.message || "บันทึก Workflow ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบ Workflow",
      content: `ต้องการลบ ${record.workflow_name} Step ${record.step_no} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/workflows/${record.id}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || "ลบ Workflow ไม่สำเร็จ");
          message.success("ลบ Workflow สำเร็จ");
          loadData();
        } catch (error) {
          console.error("DELETE_WORKFLOW_ERROR:", error);
          message.error(error.message || "ลบ Workflow ไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
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
      title: "Workflow Name",
      dataIndex: "workflow_name",
      width: 240,
    },
    {
      title: "Step",
      dataIndex: "step_no",
      width: 90,
      render: (value) => <Tag color="blue">Step {value}</Tag>,
    },
    {
      title: "Approver Role",
      dataIndex: "approver_role_code",
      width: 180,
      render: (value) => value || "-",
    },
    {
      title: "Required",
      dataIndex: "is_required",
      width: 120,
      render: (value) =>
        value ? <Tag color="green">Required</Tag> : <Tag>Optional</Tag>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 120,
      render: (value) =>
        value ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
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
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดู Workflow</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="text-lg font-bold">Benefit Approval Workflows</div>
        }
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
                  nextActive: activeFilter,
                });
              }}
              options={benefits.map((item) => ({
                label: `${item.benefit_code} - ${item.benefit_name}`,
                value: item.id,
              }))}
            />

            <Select
              allowClear
              placeholder="Status"
              style={{ width: 150 }}
              value={activeFilter || undefined}
              onChange={(value) => {
                const nextValue = value || "";
                setActiveFilter(nextValue);
                setPage(1);
                loadData({
                  nextPage: 1,
                  nextBenefitId: benefitFilter,
                  nextActive: nextValue,
                });
              }}
              options={[
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                loadData({
                  nextPage: page,
                  nextPageSize: pageSize,
                  nextBenefitId: benefitFilter,
                  nextActive: activeFilter,
                })
              }
            >
              Refresh
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
              >
                Add Workflow
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
          scroll={{ x: 1300 }}
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
                nextActive: activeFilter,
              });
            },
          }}
        />
      </Card>

      <Modal
        title={modalState.record ? "Edit Workflow" : "Add Workflow"}
        open={modalState.open}
        onCancel={closeModal}
        footer={null}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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

          <Form.Item
            label="Workflow Name"
            name="workflow_name"
            rules={[{ required: true, message: "กรุณากรอก Workflow Name" }]}
          >
            <Input placeholder="เช่น Benefit Request Approval" />
          </Form.Item>

          <Form.Item
            label="Step No"
            name="step_no"
            rules={[{ required: true, message: "กรุณากรอก Step No" }]}
          >
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Approver Role" name="approver_role_code">
            <Select
              allowClear
              placeholder="เลือก Role ผู้อนุมัติ"
              options={ROLE_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label="Required"
            name="is_required"
            valuePropName="checked"
          >
            <Switch checkedChildren="Required" unCheckedChildren="Optional" />
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end">
            <Space>
              <Button onClick={closeModal}>Cancel</Button>
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