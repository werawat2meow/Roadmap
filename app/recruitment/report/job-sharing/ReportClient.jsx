'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, DatePicker, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import usePageGuard from '@/hooks/usePageGuard';
import { candidateStatusText, candidateStatusLabel } from '@/lib/recruitment/candidateStatus';
import { bangkokReportDate as bangkokDate } from '@/lib/recruitment/reportDate.mjs';

const { Title, Text } = Typography;
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
    setExporting(true); setExportError('');
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
      anchor.href = url; anchor.download = filename;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      // Allow the browser to start consuming the blob before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setExportError(err.message || 'ไม่สามารถส่งออก Excel ได้'); }
    finally { setExporting(false); }
  }
  useEffect(() => {
    if (isChecking || !canView) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
        const response = await fetch(`/recruitment/api/report/job-sharing${shareLinkId ? `/${shareLinkId}` : ''}?${params}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || data.error || 'ไม่สามารถโหลดรายงานได้');
        if (!controller.signal.aborted) setResult(data);
      } catch (err) {
        if (!controller.signal.aborted) { setError(err.message); setResult(null); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [filters, shareLinkId, isChecking, canView, reload]);
  if (isChecking) return <Card loading />;
  if (!canView) return null;

  const dateQuery = new URLSearchParams();
  if (filters.dateFrom) dateQuery.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) dateQuery.set('dateTo', filters.dateTo);
  const columns = shareLinkId ? [
    { title: 'ชื่อ–นามสกุลผู้สมัคร', key: 'name', render: (_, row) => [row.first_name, row.last_name].filter(Boolean).join(' ') || '-' },
    { title: 'วันที่สมัคร (เวลาไทย)', dataIndex: 'created_at', render: bangkokDate },
    { title: 'สถานะปัจจุบัน', dataIndex: 'status', render: value => <Tag>{candidateStatusLabel(value)}</Tag> },
    { title: 'จัดการ', key: 'action', render: (_, row) => <Link href={`/recruitment/candidate/${row.id}`}><Button size="small">ดูใบสมัคร</Button></Link> },
  ] : [
    { title: 'ผู้แชร์', dataIndex: 'user_name' },
    { title: 'ตำแหน่ง', dataIndex: 'position_name' },
    { title: 'บริษัท / สาขา', key: 'branch', render: (_, row) => `${row.company_name} / ${row.branch_name}` },
    { title: 'จำนวนใบสมัคร', dataIndex: 'application_count', align: 'right' },
    { title: 'จัดการ', key: 'action', render: (_, row) => <Link href={`/recruitment/report/job-sharing/${row.id}?${dateQuery}`}><Button size="small">ดู History</Button></Link> },
  ];
  const submit = values => setFilters({
    userId: values.userId || '', positionId: values.positionId || '', keyword: values.keyword || '', status: values.status ?? '',
    dateFrom: values.dateFrom?.format('YYYY-MM-DD') || '', dateTo: values.dateTo?.format('YYYY-MM-DD') || '',
    page: 1, pageSize: filters.pageSize,
  });
  return <div className="space-y-4 p-2 md:p-4">
    <div>
      {shareLinkId && <Link href={`/recruitment/report/job-sharing?${dateQuery}`}>← กลับรายงานสรุป</Link>}
      <Title level={3}>{shareLinkId ? 'History ผู้สมัครจากลิงก์' : 'รายงานการแชร์ประกาศงาน'}</Title>
      <Text type="secondary">นับตามวันที่สมัคร เวลาไทย · {shareLinkId ? 'แสดงสถานะปัจจุบันของใบสมัคร' : 'หนึ่งรายการต่อผู้แชร์และงานที่เปิดรับ'}</Text>
    </div>
    {shareLinkId && result?.link && <Card size="small">
      <Space wrap><Text strong>ผู้แชร์: {result.link.user_name}</Text><Text>ตำแหน่ง: {result.link.position_name}</Text>
        <Text>บริษัท/สาขา: {result.link.company_name} / {result.link.branch_name}</Text></Space>
    </Card>}
    <Card size="small">
      <Form form={form} layout="inline" onFinish={submit} initialValues={{ dateFrom: initialDates.dateFrom ? dayjs(initialDates.dateFrom) : null, dateTo: initialDates.dateTo ? dayjs(initialDates.dateTo) : null }}>
        <Space wrap align="start">
          {shareLinkId ? <>
            <Form.Item name="keyword" label="ผู้สมัคร"><Input placeholder="ชื่อหรือนามสกุล" maxLength={100} allowClear /></Form.Item>
            <Form.Item name="status" label="สถานะ"><Select style={{ width: 230 }} allowClear placeholder="ทั้งหมด" options={Object.entries(candidateStatusText).map(([value, label]) => ({ value: Number(value), label }))} /></Form.Item>
          </> : <>
            <Form.Item name="userId" label="ผู้แชร์"><Select style={{ width: 220 }} showSearch optionFilterProp="label" allowClear placeholder="ทั้งหมด" options={result?.options?.users || []} /></Form.Item>
            <Form.Item name="positionId" label="ตำแหน่ง"><Select style={{ width: 220 }} showSearch optionFilterProp="label" allowClear placeholder="ทั้งหมด" options={result?.options?.positions || []} /></Form.Item>
          </>}
          <Form.Item name="dateFrom" label="วันที่สมัครจาก"><DatePicker format="DD/MM/YYYY" /></Form.Item>
          <Form.Item name="dateTo" label="ถึง"><DatePicker format="DD/MM/YYYY" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>ค้นหา</Button>
          <Button onClick={() => { form.setFieldsValue({ userId: undefined, positionId: undefined, keyword: '', status: undefined, dateFrom: null, dateTo: null }); setFilters({ page: 1, pageSize: 20 }); }}>ล้างตัวกรอง</Button>
          <Button onClick={downloadExcel} loading={exporting} disabled={loading || !!error || !result}>Export Excel</Button>
        </Space>
      </Form>
    </Card>
    {error && <Alert type="error" showIcon title={error} action={<Button onClick={() => setReload(value => value + 1)}>ลองอีกครั้ง</Button>} />}
    {exportError && <Alert type="error" showIcon title={exportError} />}
    <Table rowKey="id" columns={columns} dataSource={loading ? [] : (result?.rows || [])} loading={loading} scroll={{ x: 850 }}
      pagination={{ current: filters.page, pageSize: filters.pageSize, total: result?.total || 0, showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100], showTotal: total => `ทั้งหมด ${total.toLocaleString()} รายการ`,
        onChange: (page, pageSize) => setFilters(old => ({ ...old, page: pageSize === old.pageSize ? page : 1, pageSize })) }} />
  </div>;
}
