"use client";

import { useEffect, useMemo, useState } from "react";
import {Button,Card,Col,DatePicker,Divider,Form,Input,InputNumber,Modal,Popconfirm,Row,Select,Space,Switch,Table,Tag,message,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,ReloadOutlined,} from "@ant-design/icons";
import dayjs from "dayjs";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

const quotaUnits = [
  { label: "THB", value: "THB" },
  { label: "Days", value: "DAYS" },
  { label: "Times", value: "TIMES" },
  { label: "Percent", value: "PERCENT" },
];

const quotaFrequencies = [
  { label: "Yearly", value: "YEARLY" },
  { label: "Monthly", value: "MONTHLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "One Time", value: "ONE_TIME" },
];

const genders = [
  { label: "ไม่กำหนด", value: "" },
  { label: "ชาย", value: "MALE" },
  { label: "หญิง", value: "FEMALE" },
];

const positionLevels = [
  { label: "P2", value: "P2" },
  { label: "P3", value: "P3" },
  { label: "P4", value: "P4" },
  { label: "P5", value: "P5" },
  { label: "P6", value: "P6" },
  { label: "P7", value: "P7" },
  { label: "P8", value: "P8" },
  { label: "P9", value: "P9" },
  { label: "P10", value: "P10" },
  { label: "P11", value: "P11" },
  { label: "P12", value: "P12" },
];

export default function BenefitRulesPage() {
  const [form] = Form.useForm();
  const { user } = useAuth();

  const canCreate = hasPermission(user, "benefit.rule.create") || hasPermission(user, "benefit.rule.manage");
  const canUpdate = hasPermission(user, "benefit.rule.update") || hasPermission(user, "benefit.rule.manage");
  const canDelete = hasPermission(user, "benefit.rule.delete") || hasPermission(user, "benefit.rule.manage");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const [lookupsLoading, setLookupsLoading] = useState(false);

  const [benefits, setBenefits] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const currentYear = new Date().getFullYear();

  const loadData = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    keyword = search
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(`/api/admin/benefit/rules?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(data.data || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.total || 0,
      });
    } catch (error) {
      message.error(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookup = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "โหลด Lookup ไม่สำเร็จ");
    }

    return data.data || [];
  };

  const loadLookups = async () => {
    try {
      setLookupsLoading(true);

      const [
        benefitRows,
        policyRows,
        companyRows,
        branchRows,
        departmentRows,
        divisionRows,
        unitRows,
        positionRows,
        employmentTypeRows,
        employeeStatusRows,
      ] = await Promise.all([
        fetchLookup("/api/admin/benefit/masters?type=benefits"),
        fetchLookup("/api/admin/benefit/policies?page=1&pageSize=999"),
        fetchLookup("/api/admin/companies?page=1&pageSize=999"),
        fetchLookup("/api/admin/branches?page=1&pageSize=999"),
        fetchLookup("/api/admin/departments?page=1&pageSize=999"),
        fetchLookup("/api/admin/divisions?page=1&pageSize=999"),
        fetchLookup("/api/admin/units?page=1&pageSize=999"),
        fetchLookup("/api/admin/positions?page=1&pageSize=999"),
        fetchLookup("/api/admin/employment-types?page=1&pageSize=999"),
        fetchLookup("/api/admin/employee-statuses?page=1&pageSize=999"),
      ]);

      setBenefits(benefitRows);
      setPolicies(policyRows);
      setCompanies(companyRows);
      setBranches(branchRows);
      setDepartments(departmentRows);
      setDivisions(divisionRows);
      setUnits(unitRows);
      setPositions(positionRows);
      setEmploymentTypes(employmentTypeRows);
      setEmployeeStatuses(employeeStatusRows);
    } catch (error) {
      message.error(error.message || "โหลดข้อมูลอ้างอิงไม่สำเร็จ");
    } finally {
      setLookupsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, pagination.pageSize, "");
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, pagination.pageSize, search);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const benefitOptions = useMemo(() => {
    return benefits.map((item) => ({
      label: item.benefit_code
        ? `${item.benefit_code} - ${item.benefit_name}`
        : item.benefit_name,
      value: item.id,
    }));
  }, [benefits]);

  const policyOptions = useMemo(() => {
    return policies.map((item) => ({
      label: item.policy_code
        ? `${item.policy_code} - ${item.policy_name}`
        : item.policy_name,
      value: item.id,
    }));
  }, [policies]);

  const companyOptions = useMemo(() => {
    return companies.map((item) => ({
      label: item.company_name_th || item.company_name || item.name,
      value: item.id,
    }));
  }, [companies]);

  const branchOptions = useMemo(() => {
    return branches.map((item) => ({
      label: item.branch_name_th || item.branch_name || item.name,
      value: item.id,
    }));
  }, [branches]);

  const departmentOptions = useMemo(() => {
    return departments.map((item) => ({
      label: item.department_name_th || item.department_name || item.name,
      value: item.id,
    }));
  }, [departments]);

  const divisionOptions = useMemo(() => {
    return divisions.map((item) => ({
      label: item.division_name_th || item.division_name || item.name,
      value: item.id,
    }));
  }, [divisions]);

  const unitOptions = useMemo(() => {
    return units.map((item) => ({
      label: item.unit_name_th || item.unit_name || item.name,
      value: item.id,
    }));
  }, [units]);

  const positionOptions = useMemo(() => {
    return positions.map((item) => ({
      label: item.position_name_th || item.position_name || item.name,
      value: item.id,
    }));
  }, [positions]);

  const employmentTypeOptions = useMemo(() => {
    return employmentTypes.map((item) => ({
      label: item.type_name || item.employment_type_name || item.name,
      value: item.id,
    }));
  }, [employmentTypes]);

  const employeeStatusOptions = useMemo(() => {
    return employeeStatuses.map((item) => ({
      label: item.status_name || item.employee_status_name || item.name,
      value: item.id,
    }));
  }, [employeeStatuses]);
  const openCreate = () => {
    setEditingRow(null);
    form.resetFields();

    form.setFieldsValue({
      rule_year: currentYear,
      min_service_months: 0,
      max_service_months: null,
      quota_amount: 0,
      quota_unit: "THB",
      quota_frequency: "YEARLY",
      discount_percent: 0,
      is_unlimited: false,
      priority: 1,
      is_active: true,
      effective_from: null,
      effective_to: null,
    });

    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingRow(record);

    form.setFieldsValue({
      benefit_id: record.benefit_id,
      policy_id: record.policy_id,
      rule_code: record.rule_code,
      rule_name: record.rule_name,
      rule_description: record.rule_description,

      company_id: record.company_id,
      branch_id: record.branch_id,
      department_id: record.department_id,
      division_id: record.division_id,
      unit_id: record.unit_id,

      position_id: record.position_id,
      position_level_min: record.position_level_min,
      position_level_max: record.position_level_max,

      employment_type_id: record.employment_type_id,
      employee_status_id: record.employee_status_id,

      gender: record.gender || "",
      nationality: record.nationality,

      min_age: record.min_age,
      max_age: record.max_age,

      min_service_months: record.min_service_months ?? 0,
      max_service_months: record.max_service_months,

      quota_amount: record.quota_amount ?? 0,
      quota_unit: record.quota_unit || "THB",
      quota_frequency: record.quota_frequency || "YEARLY",
      discount_percent: record.discount_percent ?? 0,
      is_unlimited: record.is_unlimited ?? false,

      effective_from: record.effective_from ? dayjs(record.effective_from) : null,
      effective_to: record.effective_to ? dayjs(record.effective_to) : null,

      rule_year: record.rule_year || currentYear,
      priority: record.priority || 1,
      is_active: record.is_active ?? true,
    });

    setModalOpen(true);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/benefit/rules/${record.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "ลบข้อมูลไม่สำเร็จ");
      }

      message.success(data.message || "ลบข้อมูลสำเร็จ");
      loadData(1, pagination.pageSize, search);
    } catch (error) {
      message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const getBenefitName = (record) => {
    return (
      record?.benefits?.benefit_name ||
      benefits.find((item) => item.id === record.benefit_id)?.benefit_name ||
      "-"
    );
  };

  const getPolicyName = (record) => {
    return (
      record?.benefit_policies?.policy_name ||
      policies.find((item) => item.id === record.policy_id)?.policy_name ||
      "-"
    );
  };

  const columns = [
    {
      title: "Rule Code",
      dataIndex: "rule_code",
      width: 150,
      fixed: "left",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Rule Name",
      dataIndex: "rule_name",
      width: 220,
      fixed: "left",
    },
    {
      title: "Benefit",
      dataIndex: "benefit_id",
      width: 220,
      render: (_, record) => getBenefitName(record),
    },
    {
      title: "Policy",
      dataIndex: "policy_id",
      width: 220,
      render: (_, record) => getPolicyName(record),
    },
    {
      title: "Year",
      dataIndex: "rule_year",
      width: 90,
      align: "center",
    },
    {
      title: "Position Level",
      width: 160,
      render: (_, record) => {
        const min = record.position_level_min;
        const max = record.position_level_max;

        if (!min && !max) return "-";
        if (min && !max) return `${min}+`;
        if (!min && max) return `ถึง ${max}`;
        return `${min} - ${max}`;
      },
    },
    {
      title: "Service",
      width: 160,
      render: (_, record) => {
        const min = record.min_service_months ?? 0;
        const max = record.max_service_months;

        if (max === null || max === undefined) {
          return `${min}+ เดือน`;
        }

        return `${min} - ${max} เดือน`;
      },
    },
    {
      title: "Quota",
      width: 170,
      render: (_, record) => {
        if (record.is_unlimited) {
          return <Tag color="purple">Unlimited</Tag>;
        }

        return `${Number(record.quota_amount || 0).toLocaleString()} ${
          record.quota_unit || ""
        }`;
      },
    },
    {
      title: "Frequency",
      dataIndex: "quota_frequency",
      width: 130,
      render: (value) => <Tag>{value || "-"}</Tag>,
    },
    {
      title: "Discount",
      dataIndex: "discount_percent",
      width: 120,
      align: "right",
      render: (value) => `${Number(value || 0).toLocaleString()}%`,
    },
    {
      title: "Effective",
      width: 220,
      render: (_, record) => {
        const from = record.effective_from
          ? dayjs(record.effective_from).format("DD/MM/YYYY")
          : "-";

        const to = record.effective_to
          ? dayjs(record.effective_to).format("DD/MM/YYYY")
          : "-";

        return `${from} - ${to}`;
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      width: 100,
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 120,
      align: "center",
      render: (value) =>
        value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: "Action",
      width: 140,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space>
          {(canUpdate || !record.id) && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          )}

          {canDelete && (
            <Popconfirm
              title="ยืนยันการลบ?"
              description="ต้องการลบ Eligibility Rule นี้หรือไม่"
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

    const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (
        values.max_service_months !== null &&
        values.max_service_months !== undefined &&
        values.max_service_months < values.min_service_months
      ) {
        message.error("Max Service Months ต้องไม่น้อยกว่า Min Service Months");
        return;
      }

      if (
        values.max_age !== null &&
        values.max_age !== undefined &&
        values.max_age < values.min_age
      ) {
        message.error("Max Age ต้องไม่น้อยกว่า Min Age");
        return;
      }

      if (
        values.effective_from &&
        values.effective_to &&
        values.effective_to.isBefore(values.effective_from, "day")
      ) {
        message.error("Effective To ต้องไม่น้อยกว่า Effective From");
        return;
      }

      setSaving(true);

      const payload = {
        benefit_id: values.benefit_id,
        policy_id: values.policy_id || null,

        rule_code: values.rule_code,
        rule_name: values.rule_name,
        rule_description: values.rule_description || "",

        company_id: values.company_id || null,
        branch_id: values.branch_id || null,
        department_id: values.department_id || null,
        division_id: values.division_id || null,
        unit_id: values.unit_id || null,

        position_id: values.position_id || null,
        position_level_min: values.position_level_min || null,
        position_level_max: values.position_level_max || null,

        employment_type_id: values.employment_type_id || null,
        employee_status_id: values.employee_status_id || null,

        gender: values.gender || null,
        nationality: values.nationality || null,

        min_age:
          values.min_age === "" || values.min_age === undefined
            ? null
            : values.min_age,
        max_age:
          values.max_age === "" || values.max_age === undefined
            ? null
            : values.max_age,

        min_service_months: values.min_service_months || 0,
        max_service_months:
          values.max_service_months === "" ||
          values.max_service_months === undefined
            ? null
            : values.max_service_months,

        quota_amount: values.is_unlimited ? 0 : values.quota_amount || 0,
        quota_unit: values.quota_unit || "THB",
        quota_frequency: values.quota_frequency || "YEARLY",
        discount_percent: values.discount_percent || 0,
        is_unlimited: values.is_unlimited ?? false,

        effective_from: values.effective_from
          ? values.effective_from.format("YYYY-MM-DD")
          : null,
        effective_to: values.effective_to
          ? values.effective_to.format("YYYY-MM-DD")
          : null,

        rule_year: values.rule_year || currentYear,
        priority: values.priority || 1,
        is_active: values.is_active ?? true,
      };

      const url = editingRow
        ? `/api/admin/benefit/rules/${editingRow.id}`
        : "/api/admin/benefit/rules";

      const method = editingRow ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      message.success(data.message || "บันทึกข้อมูลสำเร็จ");
      setModalOpen(false);
      setEditingRow(null);
      form.resetFields();
      loadData(pagination.current, pagination.pageSize, search);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const unlimitedValue = Form.useWatch("is_unlimited", form);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-2xl font-bold text-slate-800">
            Eligibility Rules
          </div>
          <div className="text-sm text-slate-500">
            Master Setup สำหรับกำหนดเงื่อนไขสิทธิ์สวัสดิการ
          </div>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              loadData(pagination.current, pagination.pageSize, search)
            }
          >
            Refresh
          </Button>

          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Rule
            </Button>
          )}
        </Space>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <Input.Search
            allowClear
            placeholder="ค้นหา Rule Code / Rule Name / Level / Note"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(value) => loadData(1, pagination.pageSize, value)}
            className="max-w-md"
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            onChange: (page, pageSize) => loadData(page, pageSize, search),
          }}
          scroll={{ x: 1800 }}
        />
      </Card>

            <Modal
        title={editingRow ? "Edit Eligibility Rule" : "Add Eligibility Rule"}
        open={modalOpen}
        forceRender
        width={1100}
        onCancel={() => {
          setModalOpen(false);
          setEditingRow(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Divider titlePlacement="left">Rule Information</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Rule Code"
                name="rule_code"
                rules={[
                  { required: true, message: "กรุณากรอก Rule Code" },
                  {
                    pattern: /^[A-Za-z0-9_-]+$/,
                    message: "ใช้ได้เฉพาะตัวอักษร ตัวเลข _ และ -",
                  },
                ]}
              >
                <Input placeholder="เช่น RULE_MEDICAL_P7" />
              </Form.Item>
            </Col>

            <Col xs={24} md={16}>
              <Form.Item
                label="Rule Name"
                name="rule_name"
                rules={[{ required: true, message: "กรุณากรอก Rule Name" }]}
              >
                <Input placeholder="เช่น Medical Allowance for P7+" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Benefit"
                name="benefit_id"
                rules={[{ required: true, message: "กรุณาเลือก Benefit" }]}
              >
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="เลือก Benefit"
                  options={benefitOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Policy" name="policy_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="เลือก Policy"
                  options={policyOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Description" name="rule_description">
                <Input.TextArea rows={3} placeholder="รายละเอียด Rule" />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">Organization Conditions</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Company" name="company_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={companyOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Branch" name="branch_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={branchOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Department" name="department_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={departmentOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Division" name="division_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={divisionOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Unit" name="unit_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={unitOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">Employee Conditions</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Position" name="position_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={positionOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Position Level Min" name="position_level_min">
                <Select
                  allowClear
                  placeholder="เริ่มตั้งแต่ Level"
                  options={positionLevels}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Position Level Max"
                name="position_level_max"
                dependencies={["position_level_min"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const min = getFieldValue("position_level_min");

                      if (!min || !value) return Promise.resolve();

                      const minNo = Number(String(min).replace("P", ""));
                      const maxNo = Number(String(value).replace("P", ""));

                      if (maxNo < minNo) {
                        return Promise.reject(
                          new Error("Position Level Max ต้องไม่น้อยกว่า Min")
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select
                  allowClear
                  placeholder="ถึง Level"
                  options={positionLevels}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Employment Type" name="employment_type_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={employmentTypeOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Employee Status" name="employee_status_id">
                <Select
                  showSearch
                  allowClear
                  loading={lookupsLoading}
                  placeholder="ไม่กำหนด"
                  options={employeeStatusOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Gender" name="gender">
                <Select
                  allowClear
                  placeholder="ไม่กำหนด"
                  options={genders}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Nationality" name="nationality">
                <Input placeholder="เช่น THAI หรือไม่กำหนด" />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">Age & Service Conditions</Divider>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="Min Age" name="min_age">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Max Age"
                name="max_age"
                dependencies={["min_age"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minAge = getFieldValue("min_age");

                      if (
                        value === null ||
                        value === undefined ||
                        minAge === null ||
                        minAge === undefined
                      ) {
                        return Promise.resolve();
                      }

                      if (value < minAge) {
                        return Promise.reject(
                          new Error("Max Age ต้องไม่น้อยกว่า Min Age")
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Min Service Months"
                name="min_service_months"
                rules={[
                  { required: true, message: "กรุณากรอก Min Service Months" },
                ]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Max Service Months"
                name="max_service_months"
                dependencies={["min_service_months"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minService = getFieldValue("min_service_months");

                      if (value === null || value === undefined) {
                        return Promise.resolve();
                      }

                      if (value < minService) {
                        return Promise.reject(
                          new Error(
                            "Max Service Months ต้องไม่น้อยกว่า Min Service Months"
                          )
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">Quota & Discount</Divider>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                label="Unlimited"
                name="is_unlimited"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Quota Amount"
                name="quota_amount"
                rules={[
                  {
                    validator(_, value) {
                      if (unlimitedValue) return Promise.resolve();

                      if (value === null || value === undefined || value < 0) {
                        return Promise.reject(
                          new Error("กรุณากรอก Quota Amount")
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  disabled={unlimitedValue}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Quota Unit"
                name="quota_unit"
                rules={[{ required: true, message: "กรุณาเลือก Quota Unit" }]}
              >
                <Select options={quotaUnits} />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Quota Frequency"
                name="quota_frequency"
                rules={[
                  { required: true, message: "กรุณาเลือก Quota Frequency" },
                ]}
              >
                <Select options={quotaFrequencies} />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label="Discount Percent" name="discount_percent">
                <Space.Compact className="w-full">
                  <InputNumber min={0} max={100} className="w-full"/>
                  <Button disabled style={{ pointerEvents: 'none' }}>%</Button>
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">Effective & Control</Divider>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="Effective From" name="effective_from">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Effective To"
                name="effective_to"
                dependencies={["effective_from"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const from = getFieldValue("effective_from");

                      if (!from || !value) {
                        return Promise.resolve();
                      }

                      if (value.isBefore(from, "day")) {
                        return Promise.reject(
                          new Error(
                            "Effective To ต้องไม่น้อยกว่า Effective From"
                          )
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Rule Year"
                name="rule_year"
                rules={[{ required: true, message: "กรุณากรอก Rule Year" }]}
              >
                <InputNumber min={2000} max={2500} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label="Priority" name="priority">
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="Active"
                name="is_active"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}