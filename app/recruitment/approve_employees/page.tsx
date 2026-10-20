'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from "next/navigation";
import {
  Table,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import AntIcon from '@/components/AntIcon';
import LoadingOrb from "@/app/components/LoadingOrb";
import RecruitmentBreadcrumb from "@/app/recruitment/components/RecruitmentBreadcrumb";
import usePageGuard from "@/hooks/usePageGuard";
import styles from './page.module.css';
import BatchApproval from './BatchApproval';
import ExportEmploymentContractButton from '@/app/recruitment/components/pdf/employment-contract/ExportEmploymentContractButton';

const { Text, Title } = Typography;

const pageSizeOptions = [10, 20, 50, 100];

// ---- constants / enums ----
const STATUS = {
  PENDING: 10,
  WAIT_HR: 12,
  WAIT_DELAY: 13,
  NO_SHOW: 14,
  APPROVED: 15,
  PENDING_START_WORK: 17,
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
  [STATUS.NO_SHOW]: 'ไม่มาเริ่มงาน',
  [STATUS.APPROVED]: 'อัพเดตเข้าฐานข้อมูลกลาง',
  [STATUS.PENDING_START_WORK]: 'รอเริ่มงาน',
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
  interview_round: number | null;
  interview_datetime: string | null;
  start_date: string | null;
  status: number;
}

interface Filters {
  keyword: string;
  status?: number;
  position_id?: string;
  start_date_from?: string;
  start_date_to?: string;
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
  const [keywordInput, setKeywordInput] = useState('');
  const [batchBusy, setBatchBusy] = useState(false);
  const [selection, setSelection] = useState<{ filterKey: string; ids: string[] }>({ filterKey: '', ids: [] });
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    status: undefined,
    position_id: undefined,
    page: 1,
    pageSize: 20,
  });

  const activeFilterCount = [
    filters.keyword,
    filters.status,
    filters.position_id,
    filters.start_date_from || filters.start_date_to,
  ].filter(Boolean).length;

  const filterKey = JSON.stringify(filters);
  const selectedApplicants = selection.filterKey === filterKey
    ? data.filter(row => selection.ids.includes(row.application_id) && (row.status === STATUS.PENDING_START_WORK || row.status === STATUS.APPROVED))
    : [];

  const actionableCount = useMemo(
    () =>
      data.filter((item) =>
        ([STATUS.WAIT_HR, STATUS.WAIT_DELAY, STATUS.NO_SHOW, STATUS.PENDING_START_WORK] as number[]).includes(item.status)
      ).length,
    [data]
  );

  const positionCount = useMemo(
    () => new Set(data.map((item) => item.position_name).filter(Boolean)).size,
    [data]
  );

  const resetFilters = () => {
    setKeywordInput('');
    setFilters((prev) => ({
      ...prev,
      keyword: '',
      status: undefined,
      position_id: undefined,
      start_date_from: undefined,
      start_date_to: undefined,
      page: 1,
    }));
  };

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

  const fetchData = async (signal: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(filters.page));
      params.append('pageSize', String(filters.pageSize));
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.status) params.append('status', String(filters.status));
      if (filters.position_id) params.append('position_id', filters.position_id);
      if (filters.start_date_from) params.append('start_date_from', filters.start_date_from);
      if (filters.start_date_to) params.append('start_date_to', filters.start_date_to);

      const res = await fetch(
        `/recruitment/api/approve_employees?${params.toString()}`,
        { cache: 'no-store', signal }
      );

      if (!res.ok) {
        message.error('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
        return;
      }

      const json = await res.json();
      if (signal.aborted) return;
      if (json.success) {
        setData(json.data);
        setTotal(json.total);
      } else {
        message.error(json.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      if (signal.aborted) return;
      console.error(err);
      message.error('เกิดข้อผิดพลาด');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  const columns: ColumnsType<Applicant> = [
    {
      title: '#',
      key: 'row_number',
      width: 68,
      align: 'center',
      render: (_, __, index) => (
        <span className={styles.rowNumber}>
          {(filters.page - 1) * filters.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'ชื่อผู้สมัคร',
      key: 'full_name',
      render: (_, row) => {
        const fullName = `${row.first_name} ${row.last_name}`.trim();
        const initials = `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`;

        return (
          <div className={styles.candidateCell}>
            <span className={styles.avatar}>{initials || '—'}</span>
            <div>
              <div className={styles.candidateName}>{fullName || 'ไม่ระบุชื่อ'}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'ตำแหน่ง',
      dataIndex: 'position_name',
      key: 'position_name',
      render: (value: string) => (
        <span className={styles.positionPill}>{value || 'ไม่ระบุตำแหน่ง'}</span>
      ),
    },
    {
      title: 'รอบสัมภาษณ์',
      dataIndex: 'interview_round',
      key: 'interview_round',
      width: 120,
      align: 'center',
      render: (value: number | null) => value ?? '-',
    },
    {
      title: 'วันสัมภาษณ์',
      dataIndex: 'interview_datetime',
      key: 'interview_datetime',
      width: 180,
      render: (value: string | null) => {
        if (!value) return <span className={styles.mutedValue}>ยังไม่กำหนด</span>;

        const date = new Date(value);
        return (
          <div className={styles.dateCell}>
            <AntIcon name="CalendarOutlined" />
            <div>
              <strong>{date.toLocaleDateString('th-TH')}</strong>
              <span>{date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'วันเริ่มงาน',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 150,
      render: (value: string | null) => value
        ? dayjs(value).format('DD/MM/YYYY')
        : <span className={styles.mutedValue}>-</span>,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: number) => (
        <Tag color={STATUS_COLOR[status] || 'default'} className={styles.statusTag}>
          <span className={styles.statusDot} />
          {STATUS_TEXT[status] || status}
        </Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_, row) => (
        <Space size={6} className={styles.actions}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              aria-label="ดูรายละเอียด"
              className={styles.viewButton}
              icon={<AntIcon name="EyeOutlined" />}
              onClick={() => router.push(`/recruitment/candidate/candidate_history/${row.application_id}/detail`)}
            />
          </Tooltip>

          {([STATUS.WAIT_HR, STATUS.WAIT_DELAY, STATUS.NO_SHOW, STATUS.PENDING_START_WORK] as number[]).includes(row.status) && (
            <Tooltip title="อัปเดตสถานะ">
              <Button
                aria-label="อัปเดตสถานะ"
                className={styles.editButton}
                icon={<AntIcon name="EditOutlined" />}
                onClick={() => router.push(`/recruitment/approve_employees/${row.application_id}/edit`)}
              />
            </Tooltip>
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
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [filters]);

  useEffect(() => {
    if (!isChecking && !canEdit) {
      router.replace("/recruitment/approve_employees");
    }
  }, [isChecking, canEdit, router]);

  // ⬇️ early return มาอยู่หลังสุด หลังจาก hooks ทั้งหมดถูกเรียกแล้ว
  if (isChecking) return <LoadingOrb />;
  if (!canEdit) return null;

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <RecruitmentBreadcrumb
          className={styles.breadcrumb}
          items={[{ label: 'อนุมัติพนักงาน' }]}
        />

        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <div className={styles.heroIcon}>
              <AntIcon name="UserAddOutlined" />
            </div>
            <div>
              <p className={styles.eyebrow}>RECRUITMENT WORKSPACE</p>
              <h1>อนุมัติพนักงาน</h1>
              <p>ตรวจสอบข้อมูลและจัดการสถานะผู้สมัครก่อนเริ่มงาน</p>
            </div>
          </div>
          <div className={styles.heroBadge}>
            <span className={styles.liveDot} />
            พร้อมดำเนินการ {actionableCount} รายการในหน้านี้
          </div>
        </section>

        <section className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.blueIcon}`}>
              <AntIcon name="TeamOutlined" />
            </span>
            <div><strong>{total.toLocaleString()}</strong><span>ผู้สมัครตามตัวกรอง</span></div>
          </div>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.greenIcon}`}>
              <AntIcon name="CheckCircleOutlined" />
            </span>
            <div><strong>{actionableCount}</strong><span>พร้อมดำเนินการในหน้านี้</span></div>
          </div>
          <div className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.orangeIcon}`}>
              <AntIcon name="ApartmentOutlined" />
            </span>
            <div><strong>{positionCount}</strong><span>ตำแหน่งงานในหน้านี้</span></div>
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <div>
              <Title level={4} className={styles.cardTitle}>รายการผู้สมัครรออนุมัติ</Title>
              <Text className={styles.cardSubtitle}>ค้นหา ตรวจสอบ และอัปเดตข้อมูลการเริ่มงาน</Text>
            </div>
            <Space wrap>
              <ExportEmploymentContractButton id={selectedApplicants[0]?.application_id ?? ""}
                ids={selectedApplicants.map(row => row.application_id)}
                disabled={batchBusy || !selectedApplicants.length}
                buttonText={`Export สัญญา (${selectedApplicants.length})`} />
              <BatchApproval selected={selectedApplicants.filter(row => row.status === STATUS.PENDING_START_WORK)} onBusyChange={setBatchBusy}
                onComplete={() => {
                  setSelection({ filterKey: '', ids: [] });
                  setFilters(previous => ({ ...previous }));
                }} />
            <div className={styles.resultBadge}>
              <AntIcon name="TeamOutlined" />
              {total.toLocaleString()} รายการ
            </div>
            </Space>
          </div>

          <div className={styles.filterPanel}>
            <div className={styles.filterHeading}>
              <div>
                <AntIcon name="FilterOutlined" />
                <span>ตัวกรอง</span>
                {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
              </div>
              {activeFilterCount > 0 && (
                <Button type="link" icon={<AntIcon name="ReloadOutlined" />} onClick={resetFilters}>
                  ล้างตัวกรอง
                </Button>
              )}
            </div>

            <div className={styles.filters}>
              <Input
                allowClear
                placeholder="ค้นหาชื่อผู้สมัคร"
                value={keywordInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setKeywordInput(value);
                  if (!value) {
                    setFilters((prev) => ({ ...prev, keyword: '', page: 1 }));
                  }
                }}
                onPressEnter={() =>
                  setFilters((prev) => ({
                    ...prev,
                    keyword: keywordInput.trim(),
                    page: 1,
                  }))
                }
                suffix={
                  <Button
                    type="text"
                    aria-label="ค้นหาผู้สมัคร"
                    className={styles.searchButton}
                    icon={<AntIcon name="SearchOutlined" />}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        keyword: keywordInput.trim(),
                        page: 1,
                      }))
                    }
                  />
                }
              />
              <Select
                allowClear
                showSearch
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
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
              <Select
                allowClear
                showSearch
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
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
              <DatePicker.RangePicker
                aria-label="ช่วงวันเริ่มงาน"
                placeholder={['วันเริ่มงาน ตั้งแต่', 'ถึงวันที่']}
                format="DD/MM/YYYY"
                allowEmpty={[true, true]}
                value={[
                  filters.start_date_from ? dayjs(filters.start_date_from) : null,
                  filters.start_date_to ? dayjs(filters.start_date_to) : null,
                ]}
                onChange={(dates) => setFilters((prev) => ({
                  ...prev,
                  start_date_from: dates?.[0]?.format('YYYY-MM-DD'),
                  start_date_to: dates?.[1]?.format('YYYY-MM-DD'),
                  page: 1,
                }))}
              />
              <div className={styles.pageSizeControl}>
                <Text>แสดง</Text>
                <Select
                  value={filters.pageSize}
                  options={pageSizeOptions.map((n) => ({ value: n, label: `${n} รายการ` }))}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, pageSize: value, page: 1 }))
                  }
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
          <Table
            className={styles.table}
            rowKey="application_id"
            rowSelection={{
              selectedRowKeys: selectedApplicants.map(row => row.application_id),
              onChange: (keys) => {
                if (keys.length > 20) message.warning('เลือกได้ครั้งละไม่เกิน 20 คน');
                setSelection({ filterKey, ids: keys.slice(0, 20).map(String) });
              },
              getCheckboxProps: (row) => ({
                disabled: batchBusy || (row.status !== STATUS.PENDING_START_WORK && row.status !== STATUS.APPROVED) ||
                  (selectedApplicants.length >= 20 && !selectedApplicants.some(item => item.application_id === row.application_id)),
                'aria-label': `เลือก ${row.first_name} ${row.last_name}`,
              }),
            }}
            loading={loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: 1190 }}
            locale={{ emptyText: 'ไม่พบผู้สมัครที่ตรงกับตัวกรอง' }}
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
            }}
          />
          </div>
        </section>
      </div>
    </main>
  );
}
