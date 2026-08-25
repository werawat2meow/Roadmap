"use client";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import EmployeeCompensationSummaryCards from "./components/EmployeeCompensationSummaryCards";
import EmployeeCompensationModal, {
  compensationToForm,
} from "./components/EmployeeCompensationModal";
import CompensationDetailDrawer from "./components/CompensationDetailDrawer";
import CompensationAdjustmentModal, {
  adjustmentToPayload,
} from "./components/CompensationAdjustmentModal";
import ApprovalLogDrawer from "./components/ApprovalLogDrawer";
import {
  employeeName,
  formatDate,
  formatMoney,
  getAdjustmentTypeLabel,
  normalizeApiRows,
  readJsonResponse,
  statusMeta,
} from "./components/compensationUi";

const { Title, Text } = Typography;

async function fetchJson(url, options) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || "Request failed");
  }
  return payload;
}

async function loadMasterOptions(url, mapper) {
  try {
    const payload = await fetchJson(url);
    return normalizeApiRows(payload).map(mapper).filter(Boolean);
  } catch (error) {
    console.error("loadMasterOptions:", url, error);
    return [];
  }
}

export default function EmployeeCompensationsPage() {
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.employee_compensations.view");
  const canCreate = hasPermission(user, "ems.employee_compensations.create");
  const canEdit = hasPermission(user, "ems.employee_compensations.edit");
  const canDelete = hasPermission(user, "ems.employee_compensations.delete");
  const canAdjust = hasPermission(user, "ems.employee_compensations.adjust");
  const canApprove = hasPermission(user, "ems.employee_compensations.approve");

  const [activeTab, setActiveTab] = useState("compensations");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ current: 0, pending: 0, draft: 0, approved: 0 });

  const [compensations, setCompensations] = useState([]);
  const [compPage, setCompPage] = useState(1);
  const [compPageSize, setCompPageSize] = useState(20);
  const [compTotal, setCompTotal] = useState(0);
  const [compSearch, setCompSearch] = useState("");
  const [compStatus, setCompStatus] = useState("");
  const [currentOnly, setCurrentOnly] = useState(true);

  const [adjustments, setAdjustments] = useState([]);
  const [adjPage, setAdjPage] = useState(1);
  const [adjPageSize, setAdjPageSize] = useState(20);
  const [adjTotal, setAdjTotal] = useState(0);
  const [adjSearch, setAdjSearch] = useState("");
  const [adjStatus, setAdjStatus] = useState("");
  const [adjType, setAdjType] = useState("");

  const [salaryComponents, setSalaryComponents] = useState([]);

  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compModalMode, setCompModalMode] = useState("create");
  const [editingCompensation, setEditingCompensation] = useState(null);
  const [compSaving, setCompSaving] = useState(false);
  const [compForm] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [savingComponents, setSavingComponents] = useState(false);

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);
  const [adjustmentEmployee, setAdjustmentEmployee] = useState(null);
  const [currentCompensationForAdjustment, setCurrentCompensationForAdjustment] = useState(null);
  const [adjustmentForm] = Form.useForm();

  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logAdjustment, setLogAdjustment] = useState(null);
  const [approvalLogs, setApprovalLogs] = useState([]);

  const loadCompensations = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(compPage),
        pageSize: String(compPageSize),
        current_only: String(currentOnly),
      });
      if (compSearch.trim()) params.set("search", compSearch.trim());
      if (compStatus) params.set("status", compStatus);

      const payload = await fetchJson(`/api/admin/employee-compensations?${params}`);
      setCompensations(payload.data || []);
      setCompTotal(Number(payload?.pagination?.total || 0));
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [canView, compPage, compPageSize, compSearch, compStatus, currentOnly]);

  const loadAdjustments = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(adjPage),
        pageSize: String(adjPageSize),
      });
      if (adjSearch.trim()) params.set("search", adjSearch.trim());
      if (adjStatus) params.set("status", adjStatus);
      if (adjType) params.set("adjustment_type", adjType);

      const payload = await fetchJson(
        `/api/admin/employee-compensation-adjustments?${params}`
      );
      setAdjustments(payload.data || []);
      setAdjTotal(Number(payload?.pagination?.total || 0));
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [canView, adjPage, adjPageSize, adjSearch, adjStatus, adjType]);

  const loadStats = useCallback(async () => {
    if (!canView) return;
    try {
      const [current, pending, draft, approved] = await Promise.all([
        fetchJson("/api/admin/employee-compensations?page=1&pageSize=1&current_only=true"),
        fetchJson("/api/admin/employee-compensation-adjustments?page=1&pageSize=1&status=pending"),
        fetchJson("/api/admin/employee-compensation-adjustments?page=1&pageSize=1&status=draft"),
        fetchJson("/api/admin/employee-compensation-adjustments?page=1&pageSize=1&status=approved"),
      ]);
      setStats({
        current: Number(current?.pagination?.total || 0),
        pending: Number(pending?.pagination?.total || 0),
        draft: Number(draft?.pagination?.total || 0),
        approved: Number(approved?.pagination?.total || 0),
      });
    } catch (error) {
      console.error("load compensation stats:", error);
    }
  }, [canView]);

  useEffect(() => {
    if (!user || !canView) return;
    loadCompensations();
  }, [user, canView, loadCompensations]);

  useEffect(() => {
    if (!user || !canView) return;
    loadAdjustments();
  }, [user, canView, loadAdjustments]);

  useEffect(() => {
    if (!user || !canView) return;
    loadStats();
  }, [user, canView, loadStats]);

  useEffect(() => {
    if (!user || !canView) return;

    loadMasterOptions(
      "/api/admin/salary-components?all=true&status=active",
      (item) =>
        item?.id
          ? {
              value: item.id,
              label:
                [item.component_code, item.component_name || item.name]
                  .filter(Boolean)
                  .join(" - ") || item.id,
            }
          : null
    ).then((components) => {
      setSalaryComponents(components);
    });
  }, [user, canView]);

  const refreshAll = async () => {
    await Promise.all([loadCompensations(), loadAdjustments(), loadStats()]);
  };

  const openCreateCompensation = () => {
    compForm.resetFields();
    compForm.setFieldsValue({
      currency_code: "THB",
      status: "active",
      effective_from: dayjs(),
    });
    setEditingCompensation(null);
    setCompModalMode("create");
    setCompModalOpen(true);
  };

  const openEditCompensation = (record) => {
    compForm.setFieldsValue(compensationToForm(record));
    setEditingCompensation(record);
    setCompModalMode("edit");
    setCompModalOpen(true);
  };

  const submitCompensation = async (values) => {
    setCompSaving(true);
    try {
      const payload = {
        ...values,
        effective_from: values.effective_from
          ? dayjs(values.effective_from).format("YYYY-MM-DD")
          : null,
        effective_to: values.effective_to
          ? dayjs(values.effective_to).format("YYYY-MM-DD")
          : null,
      };

      if (compModalMode === "edit" && editingCompensation) {
        await fetchJson(`/api/admin/employee-compensations/${editingCompensation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("บันทึกข้อมูลค่าตอบแทนเรียบร้อยแล้ว");
      } else {
        await fetchJson("/api/admin/employee-compensations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("สร้างเงินเดือนเริ่มต้นเรียบร้อยแล้ว");
      }

      setCompModalOpen(false);
      await refreshAll();
    } catch (error) {
      message.error(error.message);
    } finally {
      setCompSaving(false);
    }
  };

  const openDetail = async (record) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailRecord(null);
    try {
      const payload = await fetchJson(`/api/admin/employee-compensations/${record.id}`);
      setDetailRecord(payload.data || null);
    } catch (error) {
      message.error(error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveComponents = async (components) => {
    if (!detailRecord?.id) return;
    setSavingComponents(true);
    try {
      await fetchJson(`/api/admin/employee-compensations/${detailRecord.id}/components`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components }),
      });
      message.success("บันทึก Compensation Components เรียบร้อยแล้ว");
      await openDetail(detailRecord);
    } catch (error) {
      message.error(error.message);
    } finally {
      setSavingComponents(false);
    }
  };

  const loadCurrentCompensationForEmployee = async (employeeId) => {
    setCurrentCompensationForAdjustment(null);
    if (!employeeId) return null;
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1",
        current_only: "true",
        employee_id: employeeId,
      });
      const payload = await fetchJson(`/api/admin/employee-compensations?${params}`);
      const current = payload?.data?.[0] || null;
      setCurrentCompensationForAdjustment(current);
      return current;
    } catch (error) {
      message.error(error.message);
      return null;
    }
  };

  const openAdjustment = async (compensation = null) => {
    adjustmentForm.resetFields();
    const employee = compensation?.employee || null;
    setAdjustmentEmployee(employee);
    setCurrentCompensationForAdjustment(compensation || null);
    adjustmentForm.setFieldsValue({
      employee_id: compensation?.employee_id || undefined,
      adjustment_type: "merit",
      effective_date: dayjs().add(1, "month").startOf("month"),
    });
    setAdjustmentModalOpen(true);
  };

  const submitAdjustment = async (values) => {
    setAdjustmentSaving(true);
    try {
      await fetchJson("/api/admin/employee-compensation-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustmentToPayload(values)),
      });
      message.success("สร้าง Salary Adjustment เรียบร้อยแล้ว");
      setAdjustmentModalOpen(false);
      setActiveTab("adjustments");
      await refreshAll();
    } catch (error) {
      message.error(error.message);
    } finally {
      setAdjustmentSaving(false);
    }
  };

  const workflowAction = (record, action) => {
    const isReject = action === "reject";
    let inputValue = "";

    Modal.confirm({
      title:
        action === "submit"
          ? "ส่งรายการเพื่ออนุมัติ?"
          : action === "approve"
            ? "อนุมัติการปรับเงินเดือน?"
            : "Reject รายการปรับเงินเดือน?",
      content: isReject ? (
        <Input.TextArea
          rows={3}
          placeholder="กรุณาระบุเหตุผลที่ Reject"
          onChange={(event) => {
            inputValue = event.target.value;
          }}
        />
      ) : (
        <Text type="secondary">
          {record.employee?.employee_code} - {employeeName(record.employee)} • {formatMoney(record.proposed_salary, record.currency_code)}
        </Text>
      ),
      okText: action === "approve" ? "อนุมัติ" : action === "reject" ? "Reject" : "ส่งอนุมัติ",
      okButtonProps: { danger: isReject },
      onOk: async () => {
        if (isReject && !inputValue.trim()) {
          message.error("กรุณาระบุเหตุผลที่ Reject");
          throw new Error("reason_required");
        }
        try {
          const body = isReject ? { reason: inputValue.trim() } : {};
          await fetchJson(
            `/api/admin/employee-compensation-adjustments/${record.id}/${action}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          message.success(
            action === "approve"
              ? "อนุมัติเรียบร้อยแล้ว"
              : action === "reject"
                ? "Reject เรียบร้อยแล้ว"
                : "ส่งอนุมัติเรียบร้อยแล้ว"
          );
          await refreshAll();
        } catch (error) {
          if (error.message !== "reason_required") message.error(error.message);
          throw error;
        }
      },
    });
  };

  const openApprovalLogs = async (record) => {
    setLogAdjustment(record);
    setApprovalLogs([]);
    setLogDrawerOpen(true);
    setLogLoading(true);
    try {
      const [detail, logs] = await Promise.all([
        fetchJson(`/api/admin/employee-compensation-adjustments/${record.id}`),
        fetchJson(`/api/admin/employee-compensation-adjustments/${record.id}/logs`),
      ]);
      setLogAdjustment(detail.data || record);
      setApprovalLogs(logs.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLogLoading(false);
    }
  };

  const compensationColumns = useMemo(
    () => [
      {
        title: "พนักงาน",
        key: "employee",
        fixed: "left",
        width: 260,
        render: (_, record) => (
          <div>
            <div className="font-medium text-slate-800">
              {record.employee?.employee_code || "-"}
            </div>
            <div className="text-sm text-slate-500">
              {employeeName(record.employee)}
            </div>
          </div>
        ),
      },
      {
        title: "เงินเดือนฐาน",
        dataIndex: "base_salary",
        width: 160,
        render: (value, record) => (
          <strong>{formatMoney(value, record.currency_code)}</strong>
        ),
      },
      {
        title: "Salary Structure",
        width: 200,
        render: (_, record) => record.salary_structure?.name || "-",
      },
      {
        title: "Salary Band",
        width: 170,
        render: (_, record) =>
          record.position_level_band?.band_name ||
          record.position_level_band?.band_code ||
          "-",
      },
      {
        title: "มีผลตั้งแต่",
        dataIndex: "effective_from",
        width: 140,
        render: formatDate,
      },
      {
        title: "สิ้นสุด",
        dataIndex: "effective_to",
        width: 130,
        render: formatDate,
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        width: 120,
        render: (value) => {
          const meta = statusMeta(value);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "จัดการ",
        key: "actions",
        fixed: "right",
        width: 250,
        render: (_, record) => (
          <Space wrap>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
              ดู
            </Button>
            {canEdit && (
              <Button size="small" icon={<EditOutlined />} onClick={() => openEditCompensation(record)}>
                แก้ไข
              </Button>
            )}
            {canAdjust && record.status === "active" && !record.effective_to && (
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => openAdjustment(record)}
              >
                ปรับเงินเดือน
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canEdit, canAdjust]
  );

  const adjustmentColumns = useMemo(
    () => [
      {
        title: "พนักงาน",
        width: 250,
        fixed: "left",
        render: (_, record) => (
          <div>
            <div className="font-medium">{record.employee?.employee_code || "-"}</div>
            <div className="text-sm text-slate-500">{employeeName(record.employee)}</div>
          </div>
        ),
      },
      {
        title: "ประเภท",
        dataIndex: "adjustment_type",
        width: 180,
        render: getAdjustmentTypeLabel,
      },
      {
        title: "เงินเดือนเดิม",
        dataIndex: "current_salary",
        width: 150,
        render: (value, record) => formatMoney(value, record.currency_code),
      },
      {
        title: "ปรับ",
        width: 170,
        render: (_, record) => (
          <div>
            <div>{formatMoney(record.adjustment_amount, record.currency_code)}</div>
            <div className="text-xs text-slate-500">
              {record.adjustment_percent == null
                ? "-"
                : `${Number(record.adjustment_percent).toFixed(2)}%`}
            </div>
          </div>
        ),
      },
      {
        title: "เงินเดือนใหม่",
        dataIndex: "proposed_salary",
        width: 160,
        render: (value, record) => <strong>{formatMoney(value, record.currency_code)}</strong>,
      },
      {
        title: "วันที่มีผล",
        dataIndex: "effective_date",
        width: 140,
        render: formatDate,
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        width: 120,
        render: (value) => {
          const meta = statusMeta(value);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Workflow",
        key: "workflow",
        fixed: "right",
        width: 290,
        render: (_, record) => (
          <Space wrap>
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => openApprovalLogs(record)}
            >
              Log
            </Button>
            {canAdjust && record.status === "draft" && (
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={() => workflowAction(record, "submit")}
              >
                ส่งอนุมัติ
              </Button>
            )}
            {canApprove && record.status === "pending" && (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => workflowAction(record, "approve")}
                >
                  อนุมัติ
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => workflowAction(record, "reject")}
                >
                  Reject
                </Button>
              </>
            )}
          </Space>
        ),
      },
    ],
    [canAdjust, canApprove]
  );

  if (loadingUser) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-slate-500">
        กำลังโหลดสิทธิ์ผู้ใช้งาน...
      </div>
    );
  }

  if (!user || !canView) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          showIcon
          title="คุณไม่มีสิทธิ์เข้าถึงค่าตอบแทนพนักงาน"
          description="ต้องมี Permission ems.employee_compensations.view"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Space className="mb-2">
                <Tag color="blue">PAYROLL SETUP</Tag>
                <Tag color="purple">ENTERPRISE COMPENSATION</Tag>
              </Space>
              <Title level={2} className="!mb-1">
                ค่าตอบแทนพนักงาน
              </Title>
              <Text type="secondary">
                เงินเดือนจริง • Compensation Components • Salary Adjustment • Approval Trail
                โดย Backend บังคับ Permission + Employee Scope
              </Text>
            </div>

            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>
                Refresh
              </Button>
              {canAdjust && (
                <Button icon={<DollarOutlined />} onClick={() => openAdjustment()}>
                  สร้าง Salary Adjustment
                </Button>
              )}
              {canCreate && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCompensation}>
                  กำหนดเงินเดือนเริ่มต้น
                </Button>
              )}
            </Space>
          </div>
        </Card>

        <EmployeeCompensationSummaryCards stats={stats} />

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "compensations",
                label: "โครงสร้างเงินเดือนพนักงาน",
                children: (
                  <>
                    <Row gutter={[12, 12]} className="mb-4">
                      <Col xs={24} md={10} xl={8}>
                        <Input.Search
                          allowClear
                          placeholder="ค้นหารหัส / ชื่อพนักงาน"
                          onSearch={(value) => {
                            setCompPage(1);
                            setCompSearch(value);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={6} xl={4}>
                        <Select
                          allowClear
                          className="w-full"
                          placeholder="สถานะ"
                          value={compStatus || undefined}
                          onChange={(value) => {
                            setCompPage(1);
                            setCompStatus(value || "");
                          }}
                          options={[
                            { value: "draft", label: "ฉบับร่าง" },
                            { value: "active", label: "ใช้งาน" },
                            { value: "inactive", label: "สิ้นสุด" },
                            { value: "cancelled", label: "ยกเลิก" },
                          ]}
                        />
                      </Col>
                      <Col xs={24} md={8} xl={5} className="flex items-center">
                        <Checkbox
                          checked={currentOnly}
                          onChange={(event) => {
                            setCompPage(1);
                            setCurrentOnly(event.target.checked);
                          }}
                        >
                          แสดงเฉพาะเงินเดือนปัจจุบัน
                        </Checkbox>
                      </Col>
                    </Row>

                    <Table
                      rowKey="id"
                      loading={loading}
                      dataSource={compensations}
                      columns={compensationColumns}
                      scroll={{ x: 1500 }}
                      pagination={{
                        current: compPage,
                        pageSize: compPageSize,
                        total: compTotal,
                        showSizeChanger: true,
                        showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                        onChange: (page, pageSize) => {
                          setCompPage(pageSize !== compPageSize ? 1 : page);
                          setCompPageSize(pageSize);
                        },
                      }}
                    />
                  </>
                ),
              },
              {
                key: "adjustments",
                label: "Salary Adjustments / Approval",
                children: (
                  <>
                    <Row gutter={[12, 12]} className="mb-4">
                      <Col xs={24} md={8}>
                        <Input.Search
                          allowClear
                          placeholder="ค้นหารหัส / ชื่อพนักงาน"
                          onSearch={(value) => {
                            setAdjPage(1);
                            setAdjSearch(value);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={5}>
                        <Select
                          allowClear
                          className="w-full"
                          placeholder="สถานะ Workflow"
                          value={adjStatus || undefined}
                          onChange={(value) => {
                            setAdjPage(1);
                            setAdjStatus(value || "");
                          }}
                          options={[
                            { value: "draft", label: "ฉบับร่าง" },
                            { value: "pending", label: "รออนุมัติ" },
                            { value: "approved", label: "อนุมัติแล้ว" },
                            { value: "rejected", label: "ไม่อนุมัติ" },
                            { value: "cancelled", label: "ยกเลิก" },
                          ]}
                        />
                      </Col>
                      <Col xs={24} md={6}>
                        <Select
                          allowClear
                          className="w-full"
                          placeholder="ประเภทการปรับ"
                          value={adjType || undefined}
                          onChange={(value) => {
                            setAdjPage(1);
                            setAdjType(value || "");
                          }}
                          options={[
                            { value: "annual_increment", label: "Annual Increment" },
                            { value: "merit", label: "Merit" },
                            { value: "promotion", label: "Promotion" },
                            { value: "market_adjustment", label: "Market Adjustment" },
                            { value: "salary_review", label: "Salary Review" },
                            { value: "special_adjustment", label: "Special Adjustment" },
                            { value: "correction", label: "Correction" },
                          ]}
                        />
                      </Col>
                    </Row>

                    <Table
                      rowKey="id"
                      loading={loading}
                      dataSource={adjustments}
                      columns={adjustmentColumns}
                      scroll={{ x: 1500 }}
                      pagination={{
                        current: adjPage,
                        pageSize: adjPageSize,
                        total: adjTotal,
                        showSizeChanger: true,
                        showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                        onChange: (page, pageSize) => {
                          setAdjPage(pageSize !== adjPageSize ? 1 : page);
                          setAdjPageSize(pageSize);
                        },
                      }}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <EmployeeCompensationModal
        open={compModalOpen}
        mode={compModalMode}
        saving={compSaving}
        form={compForm}
        onCancel={() => setCompModalOpen(false)}
        onSubmit={submitCompensation}
      />

      <CompensationDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        savingComponents={savingComponents}
        record={detailRecord}
        salaryComponents={salaryComponents}
        canEdit={canEdit}
        onClose={() => setDetailOpen(false)}
        onSaveComponents={saveComponents}
      />

      <CompensationAdjustmentModal
        open={adjustmentModalOpen}
        saving={adjustmentSaving}
        form={adjustmentForm}
        currentCompensation={currentCompensationForAdjustment}
        initialEmployee={adjustmentEmployee}
        onEmployeeChange={async (employeeId, employee) => {
          setAdjustmentEmployee(employee);
          await loadCurrentCompensationForEmployee(employeeId);
        }}
        onCancel={() => setAdjustmentModalOpen(false)}
        onSubmit={submitAdjustment}
      />

      <ApprovalLogDrawer
        open={logDrawerOpen}
        loading={logLoading}
        adjustment={logAdjustment}
        logs={approvalLogs}
        onClose={() => setLogDrawerOpen(false)}
      />
    </div>
  );
}
