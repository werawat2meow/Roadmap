'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const { Search } = Input;

const pageSizeOptions = [10, 20, 50, 100];

// ---- constants / enums ----
const STATUS = {
  PENDING: 10,
  WAIT_HR: 12,
  WAIT_DELAY: 13,
  APPROVED: 15,
} as const;

const STATUS_COLOR: Record<number, string> = {
  [STATUS.PENDING]: 'orange',
  [STATUS.WAIT_HR]: 'blue',
  [STATUS.WAIT_DELAY]: 'purple',
  [STATUS.APPROVED]: 'green',
};

const STATUS_TEXT: Record<number, string> = {
  [STATUS.PENDING]: 'ผ่านการคัดเลือก',
  [STATUS.WAIT_HR]: 'นัดวันเริ่มทำงาน',
  [STATUS.WAIT_DELAY]: 'เลื่อนวันเริ่มทำงาน',
  [STATUS.APPROVED]: 'อัพเดตเข้าฐานข้อมูลกลาง',
};

// สร้าง options ของ Select สถานะจาก STATUS_TEXT โดยอัตโนมัติ
// เพิ่ม/แก้สถานะแค่ที่ STATUS กับ STATUS_TEXT ที่เดียว ไม่ต้องมาแก้ options ซ้ำ
const STATUS_OPTIONS = Object.entries(STATUS_TEXT).map(([value, label]) => ({
  value: Number(value),
  label,
}));

// ---- types ----
interface Position {
  id: string;
  position_name: string;
}

interface Applicant {
  application_id: string;
  first_name: string;
  last_name: string;
  position_name: string;
  interview_round: number;
  interview_datetime: string | null;
  status: number;
}

interface Filters {
  keyword: string;
  status?: number;
  position_id?: string;
  page: number;
  pageSize: number;
}

export default function WaitingApprovalPage() {
  const router = useRouter();

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.approve.emp",
    unauthorizedRedirect: "/recruitment",
  });

  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [data, setData] = useState<Applicant[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    status: undefined,
    position_id: undefined,
    page: 1,
    pageSize: 20,
  });

  // ⬇️ ย้ายฟังก์ชันเหล่านี้มาไว้ตรงนี้ ก่อน useEffect และก่อน early return
  const fetchPositions = async () => {
    try {
      const res = await fetch('/recruitment/api/approve_employees/positions', {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = await res.json();
      setPositions(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(filters.page));
      params.append('pageSize', String(filters.pageSize));
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.status) params.append('status', String(filters.status));
      if (filters.position_id) params.append('position_id', filters.position_id);

      const res = await fetch(
        `/recruitment/api/approve_employees?${params.toString()}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        message.error('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
        return;
      }

      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotal(json.total);
      } else {
        message.error(json.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      message.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Applicant> = [
    {
      title: 'ชื่อผู้สมัคร',
      key: 'full_name',
      render: (_, row) => `${row.first_name} ${row.last_name}`,
    },
    {
      title: 'ตำแหน่ง',
      dataIndex: 'position_name',
      key: 'position_name',
    },
    {
      title: 'รอบสัมภาษณ์',
      dataIndex: 'interview_round',
      key: 'interview_round',
      width: 120,
      align: 'center',
    },
    {
      title: 'วันสัมภาษณ์',
      dataIndex: 'interview_datetime',
      key: 'interview_datetime',
      width: 180,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString('th-TH') : '-',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: number) => (
        <Tag color={STATUS_COLOR[status] || 'default'}>
          {STATUS_TEXT[status] || status}
        </Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button
            type="default"
            onClick={() => router.push(`/recruitment/candidate/candidate_history/${row.application_id}/detail`)}
          >
            ดูรายละเอียด
          </Button>

          {([STATUS.WAIT_HR, STATUS.WAIT_DELAY] as number[]).includes(row.status) && (
            <Button
              type="primary"
              onClick={() => router.push(`/recruitment/approve_employees/${row.application_id}/edit`)}
            >
              อัปเดตสถานะ
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // ⬇️ useEffect ยังอยู่ตำแหน่งเดิม แต่ตอนนี้ fetchPositions/fetchData ถูก initialize แล้ว
  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (!isChecking && !canEdit) {
      router.replace("/recruitment/approve_employees");
    }
  }, [isChecking, canEdit, router]);

  // ⬇️ early return มาอยู่หลังสุด หลังจาก hooks ทั้งหมดถูกเรียกแล้ว
  if (isChecking || loading) return <LoadingOrb />;
  if (!canEdit) return null;

  return (
    <div className="h-full w-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center rounded-3xl bg-white p-6 shadow-sm">
          <div className="justify-self-center md:justify-self-start">
            <h1 className="text-2xl font-bold text-slate-800"> Approve Employees </h1>
          </div>
        </div>
      </div>
    
      <div className="p-4 md:p-6 w-full">
        <Card title="รายการผู้สมัครรออนุมัติเข้าทำงาน">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={6}>
              <Space size="small">
                <span style={{ fontSize: 13, color: '#475569' }}>แสดง</span>
                <Select
                  value={filters.pageSize}
                  style={{ width: 110 }}
                  options={pageSizeOptions.map((n) => ({
                    value: n,
                    label: `${n} rows`,
                  }))}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      pageSize: value,
                      page: 1,
                    }))
                  }
                />
              </Space>
            </Col>

            <Col xs={24} md={6}>
              <Search
                allowClear
                placeholder="ค้นหาชื่อผู้สมัคร"
                onSearch={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    keyword: value,
                    page: 1,
                  }))
                }
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="ตำแหน่ง"
                value={filters.position_id}
                options={positions.map((item) => ({
                  value: item.id,
                  label: item.position_name,
                }))}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    position_id: value,
                    page: 1,
                  }))
                }
              />
            </Col>

            <Col xs={24} md={6}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="สถานะ"
                value={filters.status}
                options={STATUS_OPTIONS}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value,
                    page: 1,
                  }))
                }
              />
            </Col>
          </Row>

          <Table
            rowKey="application_id"
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total,
              onChange: (newPage) =>
                setFilters((prev) => ({
                  ...prev,
                  page: newPage,
                })),
              showTotal: (total, [start, end]) =>
                `${start} - ${end} จาก ${total} รายการ`,
              showSizeChanger: false,
              style: { padding: '12px 20px' },
            }}
          />
        </Card>
      </div>
    </div>
  );
}