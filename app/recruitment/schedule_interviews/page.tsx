"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  App,
  Table,
  Button,
  Typography,
  Space,
  DatePicker,
  Select,
  Tag,
  Modal,
  InputNumber,
  message, } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RecruitJobInterview {
  id: string;
  interview_datetime: string;
  sort_order?: number;
  interview_type?: string;
  status?: number;
}

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  created_at: string;
  status: number;
  position_id: number;
  positions: {
    position_name: string;
  } | null;

  recruit_job_interviews?: RecruitJobInterview[];
}

const STATUS_MAP = {
  4: { label: 'นัดสัมภาษณ์', color: 'green' },
  5: { label: 'ยืนยันการสัมภาษณ์', color: 'green' },
  6: { label: 'เลื่อนการสัมภาษณ์', color: 'volcano' },
  8: { label: 'ส่งต่อการสัมภาษณ์', color: 'green' },
  9: { label: 'ผ่านการคัดเลือก', color: 'volcano' },
  11: { label: 'นัดวันเริ่มทำงาน', color: 'volcano' },
};

const pageSizeOptions = [
  { value: 10, label: '10 rows' },
  { value: 20, label: '20 rows' },
  { value: 30, label: '30 rows' },
  { value: 40, label: '40 rows' },
  { value: 50, label: '50 rows' },
  { value: 100, label: '100 rows' },
  { value: 'all', label: 'แสดงทั้งหมด' },
];

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, v]) => ({
  value: Number(value),
  label: v.label,
}));

function StatusTag({ value }: { value: number }) {
  const meta =
    STATUS_MAP[value as keyof typeof STATUS_MAP] ?? {
      label: value ?? "-",
      color: "default",
    };
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

export default function RecruitmentApplicationsPage() {

  const { message } = App.useApp();


  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Application[]>([]);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState(undefined);
  const [positionId, setPositionId] = useState(undefined);
  const [positionOptions, setPositionOptions] = useState([]);
  // const [dateRange, setDateRange] = useState(null);
  const [dateRange, setDateRange] = useState<Dayjs | null>(null);
  const [count, setCount] = useState(0);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [sortOrder, setSortOrder] = useState<number>(1);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  // const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number>();

  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? undefined : pageSize;
  const from = isAll ? 0 : (page - 1) * numericPageSize;

  // โหลดตัวเลือกตำแหน่งงาน (resource=positions) ครั้งเดียวตอน mount
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const res = await fetch(`/recruitment/api/schedule_interviews?resource=positions`);
        const json = await res.json();
        if (!json.error) {
          setPositionOptions(
            (json.data ?? []).map((p) => ({
              value: p.id,
              label: p.position_name,
            }))
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadPositions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      if (statusFilter) {
        params.set("status", String(statusFilter));
      }
      if (positionId) {
        params.set("position_id", String(positionId));
      }
      if (dateRange) {
        // ✅ ชื่อ param ต้องตรงกับ API: date_from / date_to
        params.set("date_from", dateRange.format("YYYY-MM-DD"));
        params.set("date_to", dateRange.format("YYYY-MM-DD"));
      }

      const res = await fetch(`/recruitment/api/schedule_interviews?${params.toString()}`);
      const json = await res.json();

      // ✅ API ไม่มี field success, ต้องเช็คจาก error แทน
      if (!json.error) {
        setRows(json.data ?? []);
        setCount(json.count ?? 0);
      } else {
        console.error(json.error);
        setRows([]);
        setCount(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ รวม logic reset page + fetch ให้ยิงครั้งเดียว ไม่ race กัน
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, positionId, dateRange, pageSize]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const columns = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 60,
        render: (_, __, index) => <Text strong>{from + index + 1}</Text>,
      },
      {
        title: 'Position',
        dataIndex: ['positions', 'position_name'],
        key: 'position_name',
        render: (value: string) => value || "-",
      },
      {
        title: 'Name',
        key: 'first_name',
        render: (_: any, record: Application) => `${record.first_name} ${record.last_name}`,
      },
      {
        title: 'Interview Date',
        dataIndex: 'recruit_job_interviews',
        key: 'interview_datetime',
        width: 170,
        render: (interviews: { interview_datetime: string }[]) => {
          if (!interviews?.length) return "-";

          const latest = [...interviews].sort(
            (a, b) =>
              new Date(b.interview_datetime).getTime() -
              new Date(a.interview_datetime).getTime()
          )[0];

          return dayjs(latest.interview_datetime).format("DD/MM/YYYY HH:mm");
        },
      },
      {
        title: 'Number of interview',
        dataIndex: 'recruit_job_interviews',
        key: 'interview_order',
        render: (interviews: { interview_order: number }[]) => {
          if (!interviews?.length) return "0";
          return interviews[0].interview_order || "0";
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 180,
        render: (value: number) => <StatusTag value={value} />,
      },
      {
        title: "Action",
        key: "action",
        width: 120,
        render: (_: any, record: Application) => (
          <Space>
            <Button onClick={() => openOrderModal(record)} > อัพเดตลำดับ </Button>
            <Link href={`/recruitment/schedule_interviews/${record.id}`}>
              <Button type="primary">
                View
              </Button>
            </Link>
            <Button
              type="primary"
              ghost
              onClick={() => openStatusModal(record)}
            >
              Update Status
            </Button>
          </Space>
        ),
      },
    ],
    [from]
  );

  const openOrderModal = async (record: Application) => {
    try {
      const interview =
        record.recruit_job_interviews?.length > 0
          ? [...record.recruit_job_interviews].sort(
              (a, b) =>
                new Date(b.interview_datetime).getTime() -
                new Date(a.interview_datetime).getTime()
            )[0]
          : null;

      if (!interview) {
        message.error("ไม่พบวันสัมภาษณ์");
        return;
      }

      const res = await fetch(
        `/recruitment/api/schedule_interviews/latest_order?datetime=${encodeURIComponent(
          interview.interview_datetime
        )}`
      );

      const json = await res.json();

      setSelectedApplication(record);
      setSortOrder((json.latest_order ?? 0) + 1);
      setOrderModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const saveSortOrder = async () => {
    if (!selectedApplication) return;

    try {
      const res = await fetch(
        "/recruitment/api/schedule_interviews/update_order",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: selectedApplication.id,
            sort_order: sortOrder,
          }),
        }
      );

      const json = await res.json();

      if (!json.error) {
        message.success("อัพเดตลำดับเรียบร้อย");
        setOrderModalOpen(false);
        loadData();
      } else {
        message.error(json.error);
      }
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาด");
    }
  };

  const openStatusModal = (record: Application) => {
    setSelectedApplication(record);
    setSelectedStatus(record.status);
    setStatusModalOpen(true);
  };

  const saveStatus = async () => {
    if (!selectedApplication) return;

    try {
      const res = await fetch(
        "/recruitment/api/schedule_interviews/update_status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: selectedApplication.id,
            status: selectedStatus,
          }),
        }
      );

      const json = await res.json();

      if (!json.error) {
        message.success("อัพเดตสถานะเรียบร้อย");
        setStatusModalOpen(false);
        loadData();
      } else {
        message.error(json.error);
      }
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <>
      <div className="h-full w-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Schedule Interviews</h1>
              <p className="mt-2 text-slate-500">รายการรอสัมภาษณ์</p>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 w-full">
          <div
            style={{
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}
          >
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
                <Title level={4} style={{ margin: 0 }}>Applications</Title>
              </div>
              <Space wrap>
                <Space size="small">
                  <Text style={{ fontSize: 13, color: '#475569' }}>แสดง</Text>
                  <Select
                    value={pageSize}
                    onChange={(val) => setPageSize(val)}
                    style={{ width: 130 }}
                    options={pageSizeOptions}
                  />
                </Space>
              </Space>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <Select
                allowClear
                placeholder="สถานะรายการ"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 200 }}
                options={STATUS_OPTIONS}
                suffixIcon={<SearchOutlined style={{ color: '#94a3b8' }} />}
              />
              <Select
                allowClear
                showSearch
                placeholder="ตำแหน่งงาน (Position)"
                value={positionId}
                onChange={(val) => setPositionId(val)}
                style={{ width: 240 }}
                options={positionOptions}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              {/* <RangePicker
                placeholder={['วันที่สมัคร (เริ่ม)', 'วันที่สมัคร (สิ้นสุด)']}
                value={dateRange}
                onChange={(val) => setDateRange(val)}
                style={{ width: 280 }}
              /> */}

              <DatePicker
                placeholder="วันที่เข้าสัมภาษณ์"
                value={dateRange}
                onChange={(val) => setDateRange(val)}
                style={{ width: 280 }}
              />
            </div>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={rows}
              loading={loading}
              pagination={
                isAll
                  ? false
                  : {
                      current: page,
                      pageSize: numericPageSize,
                      total: count,
                      onChange: (p) => setPage(p),
                      showTotal: (total, [start, end]) =>
                        `${start} - ${end} จาก ${total} รายการ`,
                      showSizeChanger: false,
                      style: { padding: '12px 20px' },
                    }
              }
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: 'ไม่พบข้อมูล' }}
              style={{ margin: 0 }}
            />
          </div>
        </div>
      </div>

      <Modal
        title="อัพเดตลำดับสัมภาษณ์"
        open={orderModalOpen}
        onCancel={() => setOrderModalOpen(false)}
        onOk={saveSortOrder}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <div>ลำดับสัมภาษณ์</div>

          <InputNumber
            min={1}
            value={sortOrder}
            onChange={(v) => setSortOrder(v ?? 1)}
            style={{ width: "100%" }}
          />
        </Space>
      </Modal>
      <Modal
        title="Update Status"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={saveStatus}
        okText="บันทึก"
      >
        <Select
          style={{ width: "100%" }}
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={STATUS_OPTIONS}
        />
      </Modal>
    </>
  );
}