'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Table,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Radio,
  App,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const API_URL = '/recruitment/api/candidate_detail';

/**
 * ปรับ mapping นี้ให้ตรงกับค่า status จริงที่เก็บใน recruit_job_applications
 */
const STATUS_MAP = {
  1: { label: 'รอพิจารณา', color: 'default' },
  2: { label: 'HRD ส่งต่อ HRM', color: 'volcano' },
  3: { label: 'ผ่านการคัดเลือกเข้าสัมภาษณ์', color: 'blue' },
  4: { label: 'นัดสัมภาษณ์', color: 'green' },
  5: { label: 'ยืนยันการสัมภาษณ์', color: 'green' },
  6: { label: 'เลื่อนการสัมภาษณ์', color: 'volcano' },
  7: { label: 'ขาดการสัมภาษณ์', color: 'green' },
  8: { label: 'ส่งต่อการสัมภาษณ์', color: 'green' },
  9: { label: 'ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน', color: 'volcano' },
  16: { label: 'ยื่น Resume', color: 'default' },
  99: { label: 'backlist', color: 'red' },
  0: { label: 'ยกเลิก', color: 'red' },
};

// status ที่ต้องกรอกวันเวลานัดสัมภาษณ์ + ประเภทการสัมภาษณ์
const STATUS_CONFIRMED_INTERVIEW = 4;

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'onsite', label: 'Onsite (สัมภาษณ์ที่บริษัท)' },
  { value: 'online', label: 'Online (สัมภาษณ์ผ่านวิดีโอคอล)' },
  { value: 'phone', label: 'Phone (สัมภาษณ์ทางโทรศัพท์)' },
];

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, v]) => ({
  value: Number(value),
  label: v.label,
}));

const pageSizeOptions = [
  { value: 10, label: '10 rows' },
  { value: 20, label: '20 rows' },
  { value: 30, label: '30 rows' },
  { value: 40, label: '40 rows' },
  { value: 50, label: '50 rows' },
  { value: 100, label: '100 rows' },
  { value: 'all', label: 'แสดงทั้งหมด' },
];

function fmtDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

function StatusTag({ value }) {
  const meta = STATUS_MAP[value] ?? { label: value ?? '-', color: 'default' };
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

export default function CandidateDetailTable() {

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.candidate",
    unauthorizedRedirect: "/recruitment",
  });

  const { modal } = App.useApp();

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // filters
  const [statusFilter, setStatusFilter] = useState(undefined); // undefined = ทั้งหมด
  const [dateRange, setDateRange] = useState(null); // [dayjs, dayjs] | null
  const [positionId, setPositionId] = useState(undefined); // undefined = ทั้งหมด
  const [positionOptions, setPositionOptions] = useState([]);

  const [pageSize, setPageSize] = useState(10); // number | 'all'
  const [page, setPage] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState();
  const [updating, setUpdating] = useState(false);

  // interview fields (แสดงเมื่อ selectedStatus === STATUS_CONFIRMED_INTERVIEW)
  const [interviewDateTime, setInterviewDateTime] = useState(null); // dayjs | null
  const [interviewType, setInterviewType] = useState(); // 'onsite' | 'online' | 'phone'
  const [interviewErrors, setInterviewErrors] = useState({});

  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? undefined : pageSize;
  const from = isAll ? 0 : (page - 1) * numericPageSize;

  const requiresInterviewDetails = selectedStatus === STATUS_CONFIRMED_INTERVIEW;

  // Reset to page 1 when filters/pageSize change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateRange, positionId, pageSize]);

  // Load position options once (for the position_name filter) via API
  useEffect(() => {
    let alive = true;
    async function loadPositions() {
      try {
        const res = await fetch(`${API_URL}?resource=positions`);
        const json = await res.json();
        if (!alive) return;
        if (!res.ok) {
          console.error(json?.error);
          return;
        }
        setPositionOptions(
          (json.data ?? []).map((p) => ({ value: p.id, label: p.position_name }))
        );
      } catch (err) {
        console.error(err);
      }
    }
    loadPositions();
    return () => { alive = false; };
  }, []);

  // Fetch candidate list via API
  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (statusFilter !== undefined) {
          params.set('status', String(statusFilter));
        }
        if (positionId !== undefined) {
          params.set('position_id', String(positionId));
        }
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.set('date_from', dateRange[0].startOf('day').toISOString());
          params.set('date_to', dateRange[1].endOf('day').toISOString());
        }
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));

        const res = await fetch(`${API_URL}?${params.toString()}`);
        const json = await res.json();  

        if (!alive) return;

        if (!res.ok) {
          modal.error({ title: "เกิดข้อผิดพลาด", content: json?.error || "โหลดข้อมูลไม่สำเร็จ", });
        }

        setCount(json.count ?? 0);
        setRows(json.data ?? []);
      } catch (err) {
        if (!alive) return;
        console.error(err);
        modal.error({ title: 'เกิดข้อผิดพลาด', content: err.message });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, [statusFilter, dateRange, positionId, pageSize, page, reloadKey]);

  const columns = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 60,
        render: (_, __, index) => (
          <Text strong>{from + index + 1}</Text>
        ),
      },
      {
        title: 'Position',
        dataIndex: ['positions', 'position_name'],
        key: 'position_name',
        render: (_, row) => row.position_name ?? '-',
      },
      {
        title: 'Name',
        key: 'first_name',
        render: (_, row) =>
          [row.first_name, row.last_name].filter(Boolean).join(' ')|| '-',
      },
      {
        title:'Register Count',
        key: 'count_num',
        render: (_, row) => row.count_num ?? '0',
      },
      {
        title: 'Last Register Date',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
        render: (_, row) => fmtDateTime(row.created_at),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (val) => <StatusTag value={val} />,
      },
      {
        title: 'Action',
        key: 'action',
        width: 260,
        render: (_, row) => (
          <Space size="small">
            {canView && (
              <Link href={`/recruitment/candidate/candidate_history/${row.id}`}>
                <Button type="primary" size="small">ดูข้อมูลประวัติการสมัคร</Button>
              </Link>
            )}
          </Space>
        ),
      },
    ],
    [from, canView, canEdit]
  );

  function validateInterviewFields() {
    if (!requiresInterviewDetails) return true;

    const errors = {};
    if (!interviewDateTime) {
      errors.interviewDateTime = 'กรุณาระบุวันเวลานัดสัมภาษณ์';
    }
    if (!interviewType) {
      errors.interviewType = 'กรุณาเลือกประเภทการสัมภาษณ์';
    }
    setInterviewErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleUpdateStatus() {
    if (!selectedRow) return;

    if (!validateInterviewFields()) {
      return;
    }

    setUpdating(true);
    try {
      const body = {
        id: selectedRow.id,
        status: selectedStatus,
      };

      if (requiresInterviewDetails) {
        body.interview_datetime = interviewDateTime.toISOString();
        body.interview_type = interviewType;
      }

      const res = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        modal.error({
          title: "เกิดข้อผิดพลาด",
          content: json.error || "ไม่สามารถอัปเดตสถานะได้",
        });
        return;
      }

      modal.success({
        title: "สำเร็จ",
        content: "อัปเดตสถานะเรียบร้อย",
      });

      setStatusModalOpen(false);
      setSelectedRow(null);

      // Reload Table
      setReloadKey((k) => k + 1);

    } catch (err) {
      modal.error({
        title: "เกิดข้อผิดพลาด",
        content: err.message,
      });
    } finally {
      setUpdating(false);
    }
  }

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

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
            รายการสมัครงาน
          </Title>
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

      {/* Filters */}
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

        <RangePicker
          placeholder={['วันที่สมัคร (เริ่ม)', 'วันที่สมัคร (สิ้นสุด)']}
          value={dateRange}
          onChange={(val) => setDateRange(val)}
          style={{ width: 280 }}
        />
      </div>

      {/* Table */}
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
        locale={{
          emptyText: 'ไม่พบข้อมูล',
        }}
        style={{ margin: 0 }}
      />

      <Modal
        title="อัปเดตสถานะผู้สมัคร"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setStatusModalOpen(false)} > ยกเลิก </Button>,
          <Button
            key="save"
            type="primary"
            loading={updating}
            onClick={handleUpdateStatus}
          >
            อัปเดตสถานะ
          </Button>,
        ]}
      >
        <Space
          orientation="vertical"
          style={{ width: "100%" }}
          size="middle"
        >
          <Text strong> ผู้สมัคร {selectedRow ? `${selectedRow.first_name} ${selectedRow.last_name}` : "-"} </Text>

          <div>
            <Text strong>สถานะ</Text>
            <Select
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                // ถ้าเปลี่ยนออกจากสถานะยืนยันสัมภาษณ์ ให้เคลียร์ error เดิม
                if (val !== STATUS_CONFIRMED_INTERVIEW) {
                  setInterviewErrors({});
                }
              }}
              style={{ width: "100%", marginTop: 4 }}
              options={STATUS_OPTIONS}
            />
          </div>

          {requiresInterviewDetails && (
            <>
              <div>
                <Text strong>วันเวลานัดสัมภาษณ์</Text>
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  value={interviewDateTime}
                  onChange={(val) => {
                    setInterviewDateTime(val);
                    setInterviewErrors((prev) => ({ ...prev, interviewDateTime: undefined }));
                  }}
                  style={{ width: "100%", marginTop: 4 }}
                  status={interviewErrors.interviewDateTime ? 'error' : ''}
                  placeholder="เลือกวันและเวลา"
                />
                {interviewErrors.interviewDateTime && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {interviewErrors.interviewDateTime}
                  </Text>
                )}
              </div>

              <div>
                <Text strong>ประเภทการสัมภาษณ์</Text>
                <div style={{ marginTop: 4 }}>
                  <Radio.Group
                    value={interviewType}
                    onChange={(e) => {
                      setInterviewType(e.target.value);
                      setInterviewErrors((prev) => ({ ...prev, interviewType: undefined }));
                    }}
                    options={INTERVIEW_TYPE_OPTIONS}
                    optionType="button"
                    buttonStyle="solid"
                  />
                </div>
                {interviewErrors.interviewType && (
                  <Text type="danger" style={{ fontSize: 12, display: 'block' }}>
                    {interviewErrors.interviewType}
                  </Text>
                )}
              </div>
            </>
          )}
        </Space>
      </Modal>
    </div>
  );
}