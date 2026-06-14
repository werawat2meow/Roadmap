'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabaseClient";
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
} from 'antd';
import { SearchOutlined, ExclamationCircleFilled } from '@ant-design/icons';

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
  const [reloadKey, setReloadKey] = useState(0);

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
    setPage(1);
  }, [search, pageSize]);

  // Fetch data
  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      const pattern = `%${search.toLowerCase()}%`;

      let countQuery = supabase
        .from('v_recruit_job_open_list')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('v_recruit_job_open_list')
        .select('*')
        .order('id', { ascending: false })
        .range(from, to);

      if (search) {
        countQuery = countQuery.ilike('search_text', pattern);
        dataQuery = dataQuery.ilike('search_text', pattern);
      }

      const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

      if (!alive) return;

      if (countRes.error) {
        console.error(countRes.error);
        Modal.error({ title: 'เกิดข้อผิดพลาด', content: countRes.error.message });
        setLoading(false);
        return;
      }

      if (dataRes.error) {
        console.error(dataRes.error);
        Modal.error({ title: 'เกิดข้อผิดพลาด', content: dataRes.error.message });
        setLoading(false);
        return;
      }

      setCount(countRes.count ?? 0);
      setRows(dataRes.data ?? []);
      setLoading(false);
    }

    loadData();
    return () => { alive = false; };
  }, [search, from, to, reloadKey]);

  function showDeleteConfirm(row) {
    confirm({
      title: 'ยืนยันการลบข้อมูล',
      icon: <ExclamationCircleFilled />,
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
      title: 'No.',
      key: 'no',
      width: 60,
      render: (_, __, index) => (
        <Text strong>{from + index + 1}</Text>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'branch_name',
      key: 'branch_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'Departments',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'Divisions',
      dataIndex: 'division_name',
      key: 'division_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'Units',
      dataIndex: 'unit_name',
      key: 'unit_name',
      render: (val) => val ?? '-',
    },
    {
      title: 'Positions',
      key: 'position',
      render: (_, row) => (
        <>
          <Text strong>{row.position_name ?? '-'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.position_level ?? '-'}
          </Text>
        </>
      ),
    },
    {
      title: 'Opening',
      dataIndex: 'opening_count',
      key: 'opening_count',
      width: 90,
      render: (val) => val ?? 0,
    },
    {
      title: 'Start - End',
      key: 'date_range',
      render: (_, row) => `${fmtDate(row.start_date)} - ${fmtDate(row.end_date)}`,
    },
    {
      title: 'Urgent',
      dataIndex: 'urgent',
      key: 'urgent',
      width: 90,
      render: (val) =>
        val ? (
          <Tag color="red">ด่วน</Tag>
        ) : (
          <Tag color="green">ไม่ด่วน</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val, row) => (
        <Switch
          checked={!!val}
          disabled={busyId === row.id}
          onChange={() => toggleStatus(row)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 130,
      render: (_, row) => (
        <Space size="small">
          <Link href={`/recruitment/setting/job_openings/${row.id}/edit`}>
            <Button type="primary" size="small">
              อัปเดต
            </Button>
          </Link>
          <Button
            danger
            size="small"
            loading={busyId === row.id}
            onClick={() => showDeleteConfirm(row)}
          >
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Recruit Job Open
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            รายการเปิดรับสมัครงาน
          </Text>
        </div>

        <Space wrap>
          <Space size="small">
            <Text style={{ fontSize: 13, color: '#475569' }}>แสดง</Text>
            <Select
              value={pageSize}
              onChange={(val) => setPageSize(val)}
              style={{ width: 110 }}
              options={pageSizeOptions.map((n) => ({
                value: n,
                label: `${n} rows`,
              }))}
            />
          </Space>

          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="ค้นหา branch / department / position ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 320, borderRadius: 10 }}
            allowClear
          />
        </Space>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: count,
          onChange: (p) => setPage(p),
          showTotal: (total, [start, end]) =>
            `${start} - ${end} จาก ${total} รายการ`,
          showSizeChanger: false,
          style: { padding: '12px 20px' },
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