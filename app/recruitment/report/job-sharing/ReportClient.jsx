'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, DatePicker, Empty, Form, Input, Select, Table, Tag } from 'antd';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  History,
  RotateCcw,
  Search,
  Share2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import dayjs from 'dayjs';
import usePageGuard from '@/hooks/usePageGuard';
import { candidateStatusText, candidateStatusLabel } from '@/lib/recruitment/candidateStatus';
import { bangkokReportDate as bangkokDate } from '@/lib/recruitment/reportDate.mjs';
import styles from './report.module.css';

const numberFormatter = new Intl.NumberFormat('th-TH');

function StatCard({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcon} ${styles[tone]}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statDetail}>{detail}</p>
      </div>
    </div>
  );
}

export default function ReportClient({ shareLinkId = null, initialDates = {} }) {
  const { isChecking, canView } = usePageGuard({ module: 'recruitment.report.job.sharing', unauthorizedRedirect: '/recruitment' });
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ ...initialDates, page: 1, pageSize: 20 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function downloadExcel() {
    setExporting(true);
    setExportError('');
    try {
      // Export the applied filters represented by the table, not unsaved form edits.
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (!['page', 'pageSize'].includes(key) && value !== '' && value !== null && value !== undefined) params.set(key, String(value));
      }
      const response = await fetch(`/recruitment/api/report/job-sharing${shareLinkId ? `/${shareLinkId}` : ''}/export?${params}`, { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'ไม่สามารถส่งออก Excel ได้');
      }
      if (!response.headers.get('content-type')?.includes('spreadsheetml.sheet')) throw new Error('รูปแบบไฟล์ตอบกลับไม่ถูกต้อง');
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.match(/filename="([a-zA-Z0-9_.-]+)"/)?.[1] || 'job-sharing.xlsx';
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Allow the browser to start consuming the blob before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setExportError(err.message || 'ไม่สามารถส่งออก Excel ได้');
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (isChecking || !canView) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
          if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
        }
        const response = await fetch(`/recruitment/api/report/job-sharing${shareLinkId ? `/${shareLinkId}` : ''}?${params}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || data.error || 'ไม่สามารถโหลดรายงานได้');
        if (!controller.signal.aborted) setResult(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
          setResult(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [filters, shareLinkId, isChecking, canView, reload]);

  const dateQuery = new URLSearchParams();
  if (filters.dateFrom) dateQuery.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) dateQuery.set('dateTo', filters.dateTo);

  const columns = shareLinkId ? [
    {
      title: 'ผู้สมัคร',
      key: 'name',
      width: 260,
      render: (_, row) => (
        <div className={styles.personCell}>
          <span className={styles.avatar}><UserRound size={17} /></span>
          <div>
            <p className={styles.primaryCell}>{[row.first_name, row.last_name].filter(Boolean).join(' ') || '-'}</p>
            <p className={styles.secondaryCell}>รหัส {String(row.id).slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'วันที่สมัคร (เวลาไทย)',
      dataIndex: 'created_at',
      width: 210,
      render: value => <span className={styles.dateCell}><CalendarDays size={16} />{bangkokDate(value)}</span>,
    },
    {
      title: 'สถานะปัจจุบัน',
      dataIndex: 'status',
      width: 180,
      render: value => <Tag className={styles.statusTag}>{candidateStatusLabel(value)}</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 132,
      align: 'right',
      render: (_, row) => (
        <Link className={styles.rowAction} href={`/recruitment/candidate/${row.id}`}>
          <Eye size={16} /> ดูใบสมัคร
        </Link>
      ),
    },
  ] : [
    {
      title: 'ผู้แชร์',
      dataIndex: 'user_name',
      width: 230,
      render: value => (
        <div className={styles.personCell}>
          <span className={`${styles.avatar} ${styles.avatarPurple}`}><UserRound size={17} /></span>
          <p className={styles.primaryCell}>{value || '-'}</p>
        </div>
      ),
    },
    {
      title: 'ตำแหน่งงาน',
      dataIndex: 'position_name',
      width: 230,
      render: value => <span className={styles.positionCell}><BriefcaseBusiness size={16} />{value || '-'}</span>,
    },
    {
      title: 'บริษัท / สาขา',
      key: 'branch',
      width: 280,
      render: (_, row) => (
        <div className={styles.companyCell}>
          <Building2 size={17} />
          <div>
            <p className={styles.primaryCell}>{row.company_name || '-'}</p>
            <p className={styles.secondaryCell}>{row.branch_name || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'ใบสมัคร',
      dataIndex: 'application_count',
      width: 130,
      align: 'center',
      render: value => <span className={styles.countBadge}>{numberFormatter.format(value || 0)}</span>,
    },
    {
      title: '',
      key: 'action',
      width: 142,
      align: 'right',
      render: (_, row) => (
        <Link className={styles.rowAction} href={`/recruitment/report/job-sharing/${row.id}?${dateQuery}`}>
          <History size={16} /> ดูประวัติ
        </Link>
      ),
    },
  ];

  const submit = values => setFilters({
    userId: values.userId || '',
    positionId: values.positionId || '',
    keyword: values.keyword || '',
    status: values.status ?? '',
    dateFrom: values.dateFrom?.format('YYYY-MM-DD') || '',
    dateTo: values.dateTo?.format('YYYY-MM-DD') || '',
    page: 1,
    pageSize: filters.pageSize,
  });

  const clearFilters = () => {
    form.setFieldsValue({ userId: undefined, positionId: undefined, keyword: '', status: undefined, dateFrom: null, dateTo: null });
    setFilters({ page: 1, pageSize: 20 });
  };

  const appliedFilterCount = ['userId', 'positionId', 'keyword', 'status', 'dateFrom', 'dateTo']
    .filter(key => filters[key] !== '' && filters[key] !== null && filters[key] !== undefined).length;
  const pageApplications = useMemo(
    () => (result?.rows || []).reduce((sum, row) => sum + (Number(row.application_count) || 0), 0),
    [result?.rows],
  );
  const totalText = loading ? '—' : numberFormatter.format(result?.total || 0);

  if (isChecking) return <div className={styles.loadingShell} />;
  if (!canView) return null;

  return (
    <div className={styles.report}>
      <section className={styles.hero}>
        <div className={styles.heroGlowOne} />
        <div className={styles.heroGlowTwo} />
        <div className={styles.heroContent}>
          {shareLinkId && (
            <Link className={styles.backLink} href={`/recruitment/report/job-sharing?${dateQuery}`}>
              <ArrowLeft size={16} /> กลับหน้ารายงานสรุป
            </Link>
          )}
          <div className={styles.eyebrow}><Share2 size={15} /> Recruitment insights</div>
          <h1 className={styles.title}>{shareLinkId ? 'ประวัติผู้สมัครจากลิงก์' : 'รายงานการแชร์ประกาศงาน'}</h1>
          <p className={styles.subtitle}>
            {shareLinkId
              ? 'ติดตามผู้สมัครที่เข้ามาผ่านลิงก์นี้ พร้อมวันที่สมัครและสถานะล่าสุด'
              : 'ดูภาพรวมประสิทธิภาพของแต่ละลิงก์ ผู้แชร์ และตำแหน่งงานในที่เดียว'}
          </p>
        </div>
        <div className={styles.heroIcon}><FileSpreadsheet size={34} strokeWidth={1.7} /></div>
      </section>

      {shareLinkId && result?.link && (
        <section className={styles.linkSummary}>
          <div className={styles.linkSummaryIcon}><Share2 size={21} /></div>
          <div className={styles.linkSummaryItem}>
            <span>ผู้แชร์</span><strong>{result.link.user_name}</strong>
          </div>
          <div className={styles.linkSummaryItem}>
            <span>ตำแหน่ง</span><strong>{result.link.position_name}</strong>
          </div>
          <div className={styles.linkSummaryItem}>
            <span>บริษัท / สาขา</span><strong>{result.link.company_name} / {result.link.branch_name}</strong>
          </div>
        </section>
      )}

      <section className={styles.statsGrid}>
        {shareLinkId ? (
          <>
            <StatCard icon={UsersRound} label="ผู้สมัครทั้งหมด" value={totalText} detail="ตามตัวกรองที่เลือก" tone="blue" />
            <StatCard icon={FileSpreadsheet} label="รายการในหน้านี้" value={loading ? '—' : numberFormatter.format(result?.rows?.length || 0)} detail={`หน้า ${filters.page}`} tone="purple" />
            <StatCard icon={CalendarDays} label="ช่วงวันที่" value={filters.dateFrom || filters.dateTo ? 'กำหนดแล้ว' : 'ทั้งหมด'} detail={filters.dateFrom || filters.dateTo ? `${filters.dateFrom || 'เริ่มต้น'} – ${filters.dateTo || 'ปัจจุบัน'}` : 'ไม่จำกัดช่วงเวลา'} tone="orange" />
          </>
        ) : (
          <>
            <StatCard icon={Share2} label="ลิงก์ที่พบ" value={totalText} detail="ตามตัวกรองที่เลือก" tone="blue" />
            <StatCard icon={UsersRound} label="ผู้แชร์ทั้งหมด" value={loading ? '—' : numberFormatter.format(result?.options?.users?.length || 0)} detail="ผู้แชร์ที่มีสิทธิ์แสดงผล" tone="purple" />
            <StatCard icon={BriefcaseBusiness} label="ตำแหน่งงาน" value={loading ? '—' : numberFormatter.format(result?.options?.positions?.length || 0)} detail="ตำแหน่งที่มีการแชร์" tone="orange" />
            <StatCard icon={FileSpreadsheet} label="ใบสมัครในหน้านี้" value={loading ? '—' : numberFormatter.format(pageApplications)} detail={`จากลิงก์ในหน้า ${filters.page}`} tone="green" />
          </>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}><Filter size={18} /> ตัวกรองรายงาน</div>
            <p className={styles.panelDescription}>เลือกข้อมูลที่ต้องการเพื่อค้นหาและส่งออกรายงาน</p>
          </div>
          {appliedFilterCount > 0 && <span className={styles.filterCount}>ใช้งาน {appliedFilterCount} ตัวกรอง</span>}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{
            dateFrom: initialDates.dateFrom ? dayjs(initialDates.dateFrom) : null,
            dateTo: initialDates.dateTo ? dayjs(initialDates.dateTo) : null,
          }}
          className={styles.filterForm}
        >
          <div className={styles.filterGrid}>
            {shareLinkId ? (
              <>
                <Form.Item name="keyword" label="ชื่อผู้สมัคร">
                  <Input prefix={<Search size={16} />} placeholder="ค้นหาชื่อหรือนามสกุล" maxLength={100} allowClear />
                </Form.Item>
                <Form.Item name="status" label="สถานะใบสมัคร">
                  <Select allowClear placeholder="ทุกสถานะ" options={Object.entries(candidateStatusText).map(([value, label]) => ({ value: Number(value), label }))} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="userId" label="ผู้แชร์">
                  <Select showSearch optionFilterProp="label" allowClear placeholder="ผู้แชร์ทั้งหมด" options={result?.options?.users || []} />
                </Form.Item>
                <Form.Item name="positionId" label="ตำแหน่งงาน">
                  <Select showSearch optionFilterProp="label" allowClear placeholder="ตำแหน่งทั้งหมด" options={result?.options?.positions || []} />
                </Form.Item>
              </>
            )}
            <Form.Item name="dateFrom" label="วันที่สมัครตั้งแต่">
              <DatePicker format="DD/MM/YYYY" placeholder="วัน / เดือน / ปี" className="w-full" />
            </Form.Item>
            <Form.Item name="dateTo" label="จนถึงวันที่">
              <DatePicker format="DD/MM/YYYY" placeholder="วัน / เดือน / ปี" className="w-full" />
            </Form.Item>
          </div>
          <div className={styles.filterActions}>
            <Button icon={<RotateCcw size={16} />} onClick={clearFilters}>ล้างตัวกรอง</Button>
            <Button type="primary" htmlType="submit" icon={<Search size={16} />} loading={loading}>ค้นหารายงาน</Button>
          </div>
        </Form>
      </section>

      {error && <Alert type="error" showIcon title={error} action={<Button onClick={() => setReload(value => value + 1)}>ลองอีกครั้ง</Button>} />}
      {exportError && <Alert type="error" showIcon title={exportError} closable onClose={() => setExportError('')} />}

      <section className={styles.panel}>
        <div className={styles.tableHeader}>
          <div>
            <div className={styles.panelTitle}>{shareLinkId ? <History size={18} /> : <Share2 size={18} />} {shareLinkId ? 'รายการผู้สมัคร' : 'รายการแชร์ประกาศ'}</div>
            <p className={styles.panelDescription}>พบทั้งหมด {totalText} รายการ · อ้างอิงวันที่และเวลาในประเทศไทย</p>
          </div>
          <Button
            className={styles.exportButton}
            icon={<Download size={17} />}
            onClick={downloadExcel}
            loading={exporting}
            disabled={loading || !!error || !result}
          >
            Export Excel
          </Button>
        </div>
        <Table
          className={styles.reportTable}
          rowKey="id"
          columns={columns}
          dataSource={loading ? [] : (result?.rows || [])}
          loading={loading}
          scroll={{ x: 900 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบข้อมูลตามตัวกรองที่เลือก" /> }}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: result?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: total => `ทั้งหมด ${numberFormatter.format(total)} รายการ`,
            onChange: (page, pageSize) => setFilters(old => ({ ...old, page: pageSize === old.pageSize ? page : 1, pageSize })),
          }}
        />
      </section>
    </div>
  );
}
