"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import AntIcon from "@/components/AntIcon";
import LoadingOrb from "@/app/components/LoadingOrb";
import ExportEmploymentContractButton from "@/app/recruitment/components/pdf/employment-contract/ExportEmploymentContractButton";
import DepartmentPresentationExport from "@/app/recruitment/components/DepartmentPresentationExport";
import ExecutivePresentationExport from "@/app/recruitment/components/ExecutivePresentationExport";
import usePageGuard from "@/hooks/usePageGuard";

const { Search } = Input;
const { Title, Text } = Typography;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MAX_BATCH_SIZE = 20;
const EMPTY_FILTER_OPTIONS = {
  companies: [],
  branches: [],
  departments: [],
  divisions: [],
  units: [],
  positions: [],
};
const REPORT_FILTER_FIELDS = [
  "company_id",
  "branch_id",
  "department_id",
  "division_id",
  "unit_id",
  "position_id",
];

const showValue = (value) => value || "-";

export default function ApprovedEmployeeReportPage() {

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.report.approve.emp",
    unauthorizedRedirect: "/recruitment",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [selectedIds, setSelectedIds] = useState([]);
  const [presentingDepartment, setPresentingDepartment] = useState(false);
  const [presentingExecutive, setPresentingExecutive] = useState(false);
  const departmentPresentationRef = useRef(null);
  const executivePresentationRef = useRef(null);
  const [filters, setFilters] = useState({
    keyword: "",
    page: 1,
    pageSize: 20,
  });

  const selectedRows = useMemo(
    () => data.filter((row) => selectedIds.includes(String(row.id))),
    [data, selectedIds],
  );
  const visibleBranches = useMemo(
    () => filterOptions.branches.filter(
      (item) => !filters.company_id || String(item.company_id) === String(filters.company_id),
    ),
    [filterOptions.branches, filters.company_id],
  );
  const visibleDepartments = useMemo(
    () => filterOptions.departments.filter(
      (item) => !filters.branch_id || item.branch_ids?.map(String).includes(String(filters.branch_id)),
    ),
    [filterOptions.departments, filters.branch_id],
  );
  const visibleDivisions = useMemo(
    () => filterOptions.divisions.filter(
      (item) => !filters.department_id || String(item.department_id) === String(filters.department_id),
    ),
    [filterOptions.divisions, filters.department_id],
  );
  const visibleUnits = useMemo(
    () => filterOptions.units.filter(
      (item) => !filters.division_id || String(item.division_id) === String(filters.division_id),
    ),
    [filterOptions.units, filters.division_id],
  );
  const visiblePositions = useMemo(
    () => filterOptions.positions.filter(
      (item) => !filters.unit_id || item.unit_ids?.map(String).includes(String(filters.unit_id)),
    ),
    [filterOptions.positions, filters.unit_id],
  );

  const updateFilters = (updater) => {
    setSelectedIds([]);
    setFilters(updater);
  };

  useEffect(() => {
    if (isChecking || !canView) return undefined;

    const controller = new AbortController();
    fetch("/recruitment/api/report/approve_emp/filters", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "ไม่สามารถโหลดตัวกรองได้");
        }
        setFilterOptions({ ...EMPTY_FILTER_OPTIONS, ...result.data });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          message.error(error.message || "ไม่สามารถโหลดตัวกรองได้");
        }
      });

    return () => controller.abort();
  }, [canView, isChecking]);

  useEffect(() => {
    if (isChecking || !canView) return undefined;

    const controller = new AbortController();

    async function fetchReport() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(filters.page),
          pageSize: String(filters.pageSize),
        });

        if (filters.keyword) params.set("keyword", filters.keyword);
        REPORT_FILTER_FIELDS.forEach((field) => {
          if (filters[field]) params.set(field, filters[field]);
        });

        const response = await fetch(
          `/recruitment/api/report/approve_emp?${params.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "ไม่สามารถดึงข้อมูลรายงานได้");
        }

        setData(result.data || []);
        setTotal(result.total || 0);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          message.error(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchReport();
    return () => controller.abort();
  }, [canView, filters, isChecking]);

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  const updateOrganizationFilter = (field, value) => {
    const hierarchy = [
      "company_id",
      "branch_id",
      "department_id",
      "division_id",
      "unit_id",
      "position_id",
    ];
    const fieldIndex = hierarchy.indexOf(field);
    updateFilters((current) => {
      const next = { ...current, [field]: value, page: 1 };
      hierarchy.slice(fieldIndex + 1).forEach((childField) => {
        next[childField] = undefined;
      });
      return next;
    });
  };

  const loadPresentationBatch = async (type) => {
    if (!selectedIds.length) return [];

    const results = await Promise.all(
      selectedIds.map(async (applicationId) => {
        try {
          const response = await fetch(
            `/recruitment/api/report/approve_emp/${encodeURIComponent(applicationId)}/presentation/${type}`,
            { cache: "no-store" },
          );
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.message || "ไม่สามารถโหลดข้อมูล Presentation ได้");
          }
          return { success: true, data: result.data };
        } catch (error) {
          console.error(error);
          return {
            success: false,
            message: error.message || "ไม่สามารถโหลดข้อมูล Presentation ได้",
          };
        }
      }),
    );

    const successful = results.filter((item) => item.success).map((item) => item.data);
    const failedCount = results.length - successful.length;
    if (failedCount) {
      message.warning(`โหลด Presentation สำเร็จ ${successful.length} คน ไม่สำเร็จ ${failedCount} คน`);
    }
    if (!successful.length) throw new Error("ไม่สามารถโหลดข้อมูลพนักงานที่เลือกได้");
    return successful;
  };

  const handlePresentToDepartment = async () => {
    if (presentingDepartment || !selectedIds.length) return;

    setPresentingDepartment(true);
    try {
      const presentationData = await loadPresentationBatch("department");
      departmentPresentationRef.current?.openPreview(presentationData);
    } catch (error) {
      console.error(error);
      message.error(
        error.message || "ไม่สามารถโหลดข้อมูล Present to Department ได้"
      );
    } finally {
      setPresentingDepartment(false);
    }
  };

  const handlePresentToExecutive = async () => {
    if (presentingExecutive || !selectedIds.length) return;

    setPresentingExecutive(true);
    try {
      const presentationData = await loadPresentationBatch("executive");
      executivePresentationRef.current?.openPreview(presentationData);
    } catch (error) {
      console.error(error);
      message.error(
        error.message || "ไม่สามารถโหลดข้อมูล Present to Executive ได้"
      );
    } finally {
      setPresentingExecutive(false);
    }
  };

  const columns = [
    {
      title: "รหัสพนักงาน",
      dataIndex: "emp_code",
      key: "emp_code",
      width: 130,
      fixed: "left",
      render: (value) =>
        value ? (
          <Tag color="blue" variant="filled" className="!m-0 !rounded-lg !px-2.5 !py-1 font-medium">
            {value}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "employee_name",
      key: "employee_name",
      width: 220,
      fixed: "left",
      render: (value) => (
        <span className="font-medium text-slate-800">{showValue(value)}</span>
      ),
    },
    {
      title: "ตำแหน่ง",
      key: "position",
      width: 240,
      render: (_, row) => {
        const level = [row.position_level_code, row.position_level_name]
          .filter(Boolean)
          .join(" - ");
        if (!row.position_name && !level) return null;

        return (
          <div className="leading-6">
            {row.position_name && (
              <div className="font-medium text-slate-800">{row.position_name}</div>
            )}
            {level && <div className="text-xs text-slate-500">({level})</div>}
          </div>
        );
      },
    },
    {
      title: "บริษัท",
      dataIndex: "company_name",
      key: "company_name",
      width: 200,
      render: showValue,
    },
    {
      title: "สาขา/แผนก/ฝ่าย/หน่วยงาน",
      key: "organization",
      width: 360,
      render: (_, row) => {
        const organization = [
          row.branch_name,
          row.division_name,
          row.department_name,
          row.unit_name,
        ].filter(Boolean);

        if (organization.length === 0) return "-";

        return (
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-700">
            {organization.map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-slate-300">/</span>}
                <span>{item}</span>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "อนุมัติโดย",
      dataIndex: "approver_name",
      key: "approver_name",
      width: 190,
      render: (value) =>
        value ? (
          <Space size={8}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <AntIcon name="CheckOutlined" className="text-xs" />
            </span>
            <span>{value}</span>
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "วันที่เริ่มงาน",
      dataIndex: "hire_date",
      key: "hire_date",
      width: 140,
      align: "center",
      render: (value) => {
        if (!value) return "-";

        const formattedDate = new Intl.DateTimeFormat("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`));

        return (
          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
            {formattedDate}
          </span>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        canEdit ? <ExportEmploymentContractButton
            id={row.id} size="small" type="default" saveOnly
            buttonText="อัปเดตผู้ลงนาม"
            signerId={row.contract_signer_id}
            employerSignatureType={row.employer_signature_type}
            onSaved={(signerId, signatureType) => setData(current => current.map(item => item.id === row.id ? { ...item, contract_signer_id: signerId, employer_signature_type: signatureType } : item))}
          /> : "-"
      ),
    },
  ];

  return (
    <div className="min-h-full w-full p-3 md:p-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 px-5 py-6 text-white shadow-lg shadow-blue-950/10 md:px-8 md:py-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-blue-300/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm md:h-14 md:w-14">
              <AntIcon name="FileDoneOutlined" className="text-2xl md:text-3xl" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-300/20">
                  อนุมัติแล้ว
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight md:text-3xl">
                รายงานการอนุมัติพนักงานเข้าทำงาน
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100/80 md:text-base">
                ตรวจสอบรายชื่อและข้อมูลสังกัดของพนักงานที่ผ่านการอนุมัติเข้าทำงาน
              </p>
            </div>
          </div>

          <div className="flex min-w-44 items-center gap-3 self-stretch rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur-sm md:self-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <AntIcon name="TeamOutlined" className="text-xl" />
            </div>
            <div>
              <div className="text-xs text-blue-100/70">รายการทั้งหมด</div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">
                {total.toLocaleString("th-TH")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div>
            <Title level={5} style={{ margin: 0 }}>
              รายชื่อพนักงานที่อนุมัติแล้ว
            </Title>
            <Text type="secondary" className="text-xs">
              ค้นหาและตรวจสอบข้อมูลพนักงานจากรายการทั้งหมด
            </Text>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Search
              allowClear
              className="w-full sm:!w-80"
              placeholder="ค้นหารหัสหรือชื่อพนักงาน"
              enterButton={<AntIcon name="SearchOutlined" />}
              onSearch={(keyword) =>
                updateFilters((current) => ({
                  ...current,
                  keyword: keyword.trim(),
                  page: 1,
                }))
              }
            />

            <Space className="justify-between sm:justify-start">
              <Text type="secondary" className="whitespace-nowrap">
                แสดงต่อหน้า
              </Text>
              <Select
                value={filters.pageSize}
                className="w-28"
                options={PAGE_SIZE_OPTIONS.map((value) => ({
                  value,
                  label: `${value} รายการ`,
                }))}
                onChange={(pageSize) =>
                  updateFilters((current) => ({ ...current, pageSize, page: 1 }))
                }
              />
            </Space>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Select allowClear showSearch placeholder="บริษัท" value={filters.company_id}
              optionFilterProp="label"
              options={filterOptions.companies.map((item) => ({ value: item.id, label: item.company_name_th }))}
              onChange={(value) => updateOrganizationFilter("company_id", value)} />
            <Select allowClear showSearch placeholder="สาขา" value={filters.branch_id}
              optionFilterProp="label"
              options={visibleBranches.map((item) => ({ value: item.id, label: item.branch_name }))}
              onChange={(value) => updateOrganizationFilter("branch_id", value)} />
            <Select allowClear showSearch placeholder="แผนก" value={filters.department_id}
              optionFilterProp="label"
              options={visibleDepartments.map((item) => ({ value: item.id, label: item.department_name }))}
              onChange={(value) => updateOrganizationFilter("department_id", value)} />
            <Select allowClear showSearch placeholder="ฝ่าย" value={filters.division_id}
              optionFilterProp="label"
              options={visibleDivisions.map((item) => ({ value: item.id, label: item.division_name }))}
              onChange={(value) => updateOrganizationFilter("division_id", value)} />
            <Select allowClear showSearch placeholder="หน่วยงาน" value={filters.unit_id}
              optionFilterProp="label"
              options={visibleUnits.map((item) => ({ value: item.id, label: item.unit_name }))}
              onChange={(value) => updateOrganizationFilter("unit_id", value)} />
            <Select allowClear showSearch placeholder="ตำแหน่ง" value={filters.position_id}
              optionFilterProp="label"
              options={visiblePositions.map((item) => ({ value: item.id, label: item.position_name }))}
              onChange={(value) => updateOrganizationFilter("position_id", value)} />
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Text type="secondary">
              เลือกแล้ว {selectedIds.length} คน (สูงสุด {MAX_BATCH_SIZE} คน)
            </Text>
            <Space wrap>
              <Button type="primary" className="!bg-violet-600 hover:!bg-violet-700"
                icon={<AntIcon name="FundProjectionScreenOutlined" />}
                loading={presentingExecutive}
                disabled={!selectedIds.length || presentingDepartment}
                onClick={handlePresentToExecutive}>
                Present to Executive ({selectedIds.length})
              </Button>
              <Button type="primary" icon={<AntIcon name="PictureOutlined" />}
                loading={presentingDepartment}
                disabled={!selectedIds.length || presentingExecutive}
                onClick={handlePresentToDepartment}>
                Present to Department ({selectedIds.length})
              </Button>
              <ExportEmploymentContractButton
                id={selectedRows[0]?.id || ""}
                ids={selectedIds}
                disabled={!selectedIds.length || presentingDepartment || presentingExecutive}
                buttonText={`Export สัญญาทดลองงาน (${selectedIds.length})`}
                onSaved={(signerId, signatureType) => setData((current) => current.map((item) =>
                  selectedIds.includes(String(item.id))
                    ? { ...item, contract_signer_id: signerId, employer_signature_type: signatureType }
                    : item
                ))}
              />
            </Space>
          </div>
        </div>

        <div className="overflow-hidden">
          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => {
                if (keys.length > MAX_BATCH_SIZE) {
                  message.warning(`เลือกได้ครั้งละไม่เกิน ${MAX_BATCH_SIZE} คน`);
                }
                setSelectedIds(keys.slice(0, MAX_BATCH_SIZE).map(String));
              },
              getCheckboxProps: (row) => ({
                disabled: selectedIds.length >= MAX_BATCH_SIZE && !selectedIds.includes(String(row.id)),
                "aria-label": `เลือก ${row.employee_name || row.emp_code || "พนักงาน"}`,
              }),
            }}
            columns={columns}
            dataSource={data}
            loading={loading}
            scroll={{ x: 1630 }}
            rowClassName={(_, index) =>
              index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
            }
            className="[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-slate-700 [&_.ant-table-tbody>tr>td]:!py-4"
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total,
              showSizeChanger: false,
              showTotal: (count, range) =>
                `${range[0]}-${range[1]} จาก ${count} รายการ`,
              onChange: (page) =>
                updateFilters((current) => ({ ...current, page })),
            }}
            locale={{ emptyText: "ไม่พบข้อมูลพนักงานที่อนุมัติแล้ว" }}
          />
        </div>
      </section>

      <DepartmentPresentationExport ref={departmentPresentationRef} />
      <ExecutivePresentationExport ref={executivePresentationRef} />
    </div>
  );
}
