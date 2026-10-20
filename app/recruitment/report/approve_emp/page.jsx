"use client";

import { useEffect, useState } from "react";
import { Input, Select, Space, Table, Tag, Typography, message } from "antd";
import AntIcon from "@/components/AntIcon";
import LoadingOrb from "@/app/components/LoadingOrb";
import ExportEmploymentContractButton from "@/app/recruitment/components/pdf/employment-contract/ExportEmploymentContractButton";
import usePageGuard from "@/hooks/usePageGuard";

const { Search } = Input;
const { Title, Text } = Typography;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const showValue = (value) => value || "-";

export default function ApprovedEmployeeReportPage() {

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.report.approve.emp",
    unauthorizedRedirect: "/recruitment",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    keyword: "",
    page: 1,
    pageSize: 20,
  });

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
      width: 190,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <Space orientation="vertical" size={4}>
        <ExportEmploymentContractButton
          id={row.id}
          size="small"
          onSaved={(signerId, signatureType) => setData(current => current.map(item => item.id === row.id ? { ...item, contract_signer_id: signerId, employer_signature_type: signatureType } : item))}
          autoExport={Boolean(row.contract_number)}
          signerId={row.contract_signer_id}
          employerSignatureType={row.employer_signature_type}
        />
        {canEdit && <ExportEmploymentContractButton
          id={row.id} size="small" type="default" saveOnly
          buttonText="อัปเดตผู้ลงนาม"
          signerId={row.contract_signer_id}
          employerSignatureType={row.employer_signature_type}
          onSaved={(signerId, signatureType) => setData(current => current.map(item => item.id === row.id ? { ...item, contract_signer_id: signerId, employer_signature_type: signatureType } : item))}
        />}
        </Space>
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
                setFilters((current) => ({
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
                  setFilters((current) => ({ ...current, pageSize, page: 1 }))
                }
              />
            </Space>
          </div>
        </div>

        <div className="overflow-hidden">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={loading}
            scroll={{ x: 1600 }}
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
                setFilters((current) => ({ ...current, page })),
            }}
            locale={{ emptyText: "ไม่พบข้อมูลพนักงานที่อนุมัติแล้ว" }}
          />
        </div>
      </section>
    </div>
  );
}
