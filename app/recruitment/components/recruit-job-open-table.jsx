'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  Switch,
  Modal,
  Space,
  Typography,
  message,
} from 'antd';
import AntIcon from '@/components/AntIcon';

import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const { Title, Text } = Typography;
const { confirm } = Modal;

const pageSizeOptions = [10, 20, 50, 100];

function fmtDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

export default function RecruitJobOpenTable() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState(null);
  const [copyingId, setCopyingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [branchFilter, setBranchFilter] = useState();
  const [departmentFilter, setDepartmentFilter] = useState();
  const [divisionFilter, setDivisionFilter] = useState();
  const [unitFilter, setUnitFilter] = useState();

  const [branchOptions, setBranchOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  const { isChecking, canView, canEdit, canDelete } = usePageGuard({
    module: "recruitment.job.openings",
    unauthorizedRedirect: "/recruitment",
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 on search/pageSize change
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timeoutId);
  }, [
    search,
    pageSize,
    branchFilter,
    departmentFilter,
    divisionFilter,
    unitFilter,
  ]);

  // Fetch data
  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      const pattern = `%${search.toLowerCase()}%`;

      const params = new URLSearchParams({
          page,
          pageSize,
      });

      if (search)
          params.append("search", search);

      if (branchFilter)
          params.append("branch_id", branchFilter);

      if (departmentFilter)
          params.append("department_id", departmentFilter);

      if (divisionFilter)
          params.append("division_id", divisionFilter);

      if (unitFilter)
          params.append("unit_id", unitFilter);

      const response = await fetch(
          `/recruitment/api/job_openings?${params.toString()}`
      );

      const result = await response.json();

      setRows(result.rows ?? []);
      setCount(result.total ?? 0);
      setLoading(false);
    }

    loadData();
    return () => { alive = false; };
  }, [
    search,
    branchFilter,
    departmentFilter,
    divisionFilter,
    unitFilter,
    from,
    to,
    page,
    pageSize,
    reloadKey,
  ]);

  async function loadFilters() {
    const response = await fetch(
        "/recruitment/api/job_openings/filters"
    );

    const result = await response.json();
    const data = result.data;
    
    setBranchOptions(data.branches ?? []);
    setDepartmentOptions(data.departments ?? []);
    setDivisionOptions(data.divisions ?? []);
    setUnitOptions(data.units ?? []);
    
}

  useEffect(() => {
    const timeoutId = window.setTimeout(loadFilters, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function copyShareUrl(row) {
    setCopyingId(row.id);
    try {
      const response = await fetch('/recruitment/api/job-share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_open_id: row.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'ไม่สามารถสร้างลิงก์ได้');
      const url = result.data.url;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        message.success('คัดลอก URL แล้ว');
      } catch {
        Modal.info({
          title: 'คัดลอกลิงก์ด้วยตนเอง',
          content: <div><p>เลือกข้อความด้านล่างแล้วคัดลอกเพื่อนำไปแชร์</p>
            <Input.TextArea readOnly value={url} autoSize onFocus={(event) => event.target.select()} aria-label="Share URL" />
          </div>,
          okText: 'ปิด',
        });
      }
    } catch (error) {
      message.error(error.message || 'ไม่สามารถสร้างลิงก์ได้');
    } finally {
      setCopyingId(null);
    }
  }

  function showDeleteConfirm(row) {
    confirm({
      title: 'ยืนยันการลบข้อมูล',
      icon: <AntIcon name="ExclamationCircleFilled" />,
      content: (
        <>
          ต้องการลบรายการนี้หรือไม่
          <br />
          <Text strong>
            {row.position_name ?? '-'} / {row.branch_name ?? '-'}
          </Text>
        </>
      ),
      okText: 'ลบข้อมูล',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: () => handleDelete(row),
    });
  }

  async function handleDelete(row) {
    setBusyId(row.id);
    try {
      const response = await fetch(
        `/recruitment/api/job_openings/${row.id}`,
        { method: 'DELETE' }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
    } catch (error) {
      Modal.error({ title: 'เกิดข้อผิดพลาด', content: error.message });
      setBusyId(null);
      return;
    }

    setBusyId(null);
    setReloadKey((k) => k + 1);
  }

  async function toggleStatus(row) {
    const nextStatus = !row.status;
    setBusyId(row.id);
    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? { ...item, status: nextStatus }
          : item
      )
    );
    try {
      const response = await fetch(
        `/recruitment/api/job_openings/${row.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
    } catch (error) {
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, status: row.status }
            : item
        )
      );
      alert(error.message);
    }
    setBusyId(null);
  }

  const columns = [
    {
      title: 'ลำดับ',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_, __, index) => <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">{from + index + 1}</span>,
    },
    {
      title: 'บริษัท / สังกัด',
      dataIndex: 'branch_name',
      key: 'branch_name',
      render: (val) => val ? <Tag color="cyan" style={{ borderRadius: 999, margin: 0, padding: '2px 10px' }}>{val}</Tag> : '-',
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'แผนก',
      dataIndex: 'division_name',
      key: 'division_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'หน่วยงาน',
      dataIndex: 'unit_name',
      key: 'unit_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'ตำแหน่งงาน',
      key: 'position',
      render: (_, row) => (
        <div className="min-w-40">
          <Text strong style={{ color: '#0f172a' }}>{row.position_name ?? '-'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.position_level ?? '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'อัตรา',
      dataIndex: 'opening_count',
      key: 'opening_count',
      width: 90,
      align: 'center',
      render: (val) => <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{val ?? 0}</span>,
    },
    {
      title: 'ช่วงรับสมัคร',
      key: 'date_range',
      render: (_, row) => <div className="min-w-44 text-sm"><div className="flex items-center gap-1.5 text-slate-700"><AntIcon name="CalendarOutlined" className="text-slate-400" />{fmtDate(row.start_date)}</div><div className="ml-5 mt-1 text-xs text-slate-400">ถึง {fmtDate(row.end_date)}</div></div>,
    },
    {
      title: 'ความเร่งด่วน',
      dataIndex: 'urgent',
      key: 'urgent',
      width: 90,
      render: (val) =>
        val ? (
          <Tag color="red" style={{ borderRadius: 999, margin: 0 }}>เร่งด่วน</Tag>
        ) : (
          <Tag style={{ borderRadius: 999, margin: 0, color: '#64748b', background: '#f1f5f9', borderColor: '#e2e8f0' }}>ปกติ</Tag>
        ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (val, row) => (
        canEdit ? (
          <div className="flex min-w-24 items-center justify-center gap-2"><Switch checked={!!val} disabled={busyId === row.id} onChange={() => toggleStatus(row)} size="small" /><span className={`text-xs font-medium ${val ? 'text-emerald-700' : 'text-slate-400'}`}>{val ? 'เปิดรับ' : 'ปิดรับ'}</span></div>
        ) : (
          <Tag color={val ? 'green' : 'default'} style={{ borderRadius: 999 }}>{val ? 'เปิดรับ' : 'ปิดรับ'}</Tag>
        )
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 250,
      render: (_, row) => (
        <Space size="small" wrap>
          {canView && (
            <Button size="small" icon={<AntIcon name="LinkOutlined" />} loading={copyingId === row.id}
              disabled={!row.status || (copyingId !== null && copyingId !== row.id)}
              onClick={() => copyShareUrl(row)} style={{ borderRadius: 8 }}>
              คัดลอกลิงก์
            </Button>
          )}
          { canEdit && (
            <Link href={`/recruitment/setting/job_openings/${row.id}/edit`}>
              <Button type="primary" size="small" icon={<AntIcon name="EditOutlined" />} style={{ background: '#059669', borderRadius: 8 }}>
                แก้ไข
              </Button>
            </Link>
          )}
          { canDelete && (
            <Button
              danger
              size="small"
              loading={busyId === row.id}
              onClick={() => showDeleteConfirm(row)}
              icon={<AntIcon name="DeleteOutlined" />}
              style={{ borderRadius: 8 }}
            >
              ลบ
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><AntIcon name="UnorderedListOutlined" /></span>
            <div>
              <Title level={4} style={{ margin: 0, color: '#0f172a' }}>รายการรับสมัครงาน</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>ค้นหา กรอง และจัดการประกาศรับสมัครงานทั้งหมด</Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{count} รายการ</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><AntIcon name="FilterOutlined" className="text-emerald-600" />ตัวกรองข้อมูล</div>
          <Space wrap size={[10, 10]}>
            <Select
              value={pageSize}
              onChange={(val) => setPageSize(val)}
              style={{ width: 130 }}
              size="large"
              options={pageSizeOptions.map((n) => ({
                value: n,
                label: `${n} รายการ`,
              }))}
            />

            <Select
              allowClear
              showSearch
              placeholder="บริษัท / สังกัด"
              optionFilterProp="label"
              value={branchFilter}
              onChange={setBranchFilter}
              className="w-full sm:w-[220px]"
              size="large"
              options={branchOptions.map(item => ({
                value: item.id,
                label: item.branch_name,
              }))}
            />

            <Select
              allowClear
              showSearch
              placeholder="ฝ่าย"
              optionFilterProp="label"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              className="w-full sm:w-[200px]"
              size="large"
              options={departmentOptions.map(item => ({
                value: item.id,
                label: item.department_name,
              }))}
            />

            <Select
              allowClear
              showSearch
              placeholder="แผนก"
              optionFilterProp="label"
              value={divisionFilter}
              onChange={setDivisionFilter}
              className="w-full sm:w-[200px]"
              size="large"
              options={divisionOptions.map(item => ({
                value: item.id,
                label: item.division_name,
              }))}
            />

            <Select
              allowClear
              showSearch
              placeholder="หน่วยงาน"
              optionFilterProp="label"
              value={unitFilter}
              onChange={setUnitFilter}
              className="w-full sm:w-[200px]"
              size="large"
              options={unitOptions.map(item => ({
                value: item.id,
                label: item.unit_name,
              }))}
            />

            <Input
              prefix={<AntIcon name="SearchOutlined" style={{ color: '#94a3b8' }} />}
              placeholder="ค้นหาตำแหน่งงาน"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full sm:w-[300px]"
              size="large"
              style={{ borderRadius: 12 }}
              allowClear
            />
          </Space>
        </div>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/80 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr:hover>td]:bg-emerald-50/40"
        pagination={{
          current: page,
          pageSize,
          total: count,
          onChange: (p) => setPage(p),
          showTotal: (total, [start, end]) =>
            `${start} - ${end} จาก ${total} รายการ`,
          showSizeChanger: false,
          style: { padding: '16px 20px' },
        }}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: 'ไม่พบข้อมูล',
        }}
        style={{ margin: 0 }}
      />
    </div>
  );
}
