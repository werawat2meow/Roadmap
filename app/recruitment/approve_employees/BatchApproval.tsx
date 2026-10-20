'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Modal, Select, Space, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';

type ApplicantSummary = {
  application_id: string;
  first_name: string;
  last_name: string;
  position_name: string;
  start_date: string | null;
  status: number;
};
type Result = { application_id: string; success: boolean; employee_code?: string; message?: string; already_approved?: boolean };
type ApprovalRow = ApplicantSummary & { role_id?: string; result?: Result };
type Role = { id: string; role_name: string };

export default function BatchApproval({ selected, onComplete, onBusyChange }: {
  selected: ApplicantSummary[];
  onComplete: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [busy, setBusy] = useState(false);
  const [roleError, setRoleError] = useState('');
  const submitting = useRef(false);
  const failures = rows.filter(row => row.result && !row.result.success);
  const succeeded = rows.filter(row => row.result?.success).length;
  const hasResults = rows.some(row => row.result);

  async function loadRoles() {
    setLoadingRoles(true);
    setRoleError('');
    try {
      const response = await fetch('/recruitment/api/approve_employees/employee-master?type=roles', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.error || 'โหลด Role ไม่สำเร็จ');
      setRoles(body.data || []);
    } catch (error) {
      setRoleError(error instanceof Error ? error.message : 'โหลด Role ไม่สำเร็จ');
    } finally { setLoadingRoles(false); }
  }

  function openSummary() {
    if (!selected.length || selected.length > 20 || selected.some(row => row.status !== 17)) return;
    setRows(selected.map(row => ({ ...row })));
    setOpen(true);
    void loadRoles();
  }

  async function confirm(retry: boolean) {
    if (submitting.current) return;
    const pending = retry ? failures : rows.filter(row => !row.result?.success);
    if (!pending.length || pending.length > 20) return;
    if (pending.some(row => !row.role_id)) {
      message.warning('กรุณาเลือก Role ให้ครบทุกคนที่จะอนุมัติ');
      return;
    }
    submitting.current = true;
    setBusy(true);
    onBusyChange(true);
    let results: Result[];
    try {
      const response = await fetch('/recruitment/api/approve_employees/employee-master/batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pending.map(row => ({ application_id: row.application_id, role_id: row.role_id })) }),
      });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.results)) throw new Error(body.message || body.error || 'ไม่สามารถยืนยันผลได้ ลองเฉพาะรายการที่ยังไม่สำเร็จอีกครั้ง');
      results = pending.map(row => {
        const matching = body.results.filter((result: Result | null) => result?.application_id === row.application_id);
        if (matching.length === 1 && typeof matching[0].success === 'boolean') return matching[0];
        return {
          application_id: row.application_id, success: false, message: 'ผลรายการนี้ไม่สมบูรณ์ สามารถลองซ้ำเพื่อตรวจสอบผลได้',
        };
      });
    } catch (error) {
      results = pending.map(row => ({ application_id: row.application_id, success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถยืนยันผลได้ กรุณาลองอีกครั้ง',
      }));
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusyChange(false);
    }
    setRows(previous => previous.map(row => ({ ...row, result: results.find(result => result.application_id === row.application_id) || row.result })));
    onComplete();
  }

  return <>
    <Button type="primary" disabled={!selected.length || selected.length > 20 || busy} onClick={openSummary}>
      อนุมัติรายการที่เลือก ({selected.length}/20)
    </Button>
    <Modal title="ยืนยันอนุมัติเข้าฐานข้อมูลกลาง" open={open} width={960}
      closable={!busy} mask={{ closable: !busy }} keyboard={!busy}
      onCancel={() => { if (!submitting.current) setOpen(false); }}
      footer={<Space wrap>
        <Button disabled={busy} onClick={() => setOpen(false)}>ปิด</Button>
        {hasResults ? failures.length > 0 && <Button type="primary" loading={busy} disabled={loadingRoles || !!roleError}
          onClick={() => void confirm(true)}>ลองเฉพาะรายการล้มเหลว ({failures.length})</Button>
          : <Button type="primary" loading={busy} disabled={loadingRoles || !!roleError || rows.some(row => !row.role_id)}
            onClick={() => void confirm(false)}>ยืนยันอนุมัติ {rows.length} คน</Button>}
      </Space>}>
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Alert type="info" showIcon title="อนุมัติเฉพาะสถานะ 17 → 15"
          description="ใช้วันเริ่มงาน ตำแหน่ง และค่าจ้างที่บันทึกในใบสมัคร ระบบจะตรวจข้อมูลล่าสุดและสิทธิ์อีกครั้งก่อนอนุมัติแต่ละคน" />
        {roleError && <Alert type="error" title={roleError} action={<Button onClick={() => void loadRoles()}>โหลด Role อีกครั้ง</Button>} />}
        {!hasResults && <Select aria-label="กำหนด Role ให้ทุกรายการ" placeholder="กำหนด Role ให้ทุกรายการ (แก้แยกรายคนได้)"
          style={{ width: '100%' }} disabled={busy} loading={loadingRoles} showSearch optionFilterProp="label"
          options={roles.map(role => ({ value: role.id, label: role.role_name }))}
          onChange={value => setRows(previous => previous.map(row => ({ ...row, role_id: value })))} />}
        {hasResults && <Alert type={failures.length ? 'warning' : 'success'} role="status"
          title={`สำเร็จ ${succeeded} คน · ไม่สำเร็จ/ยังยืนยันผลไม่ได้ ${failures.length} คน`} />}
        <Table<ApprovalRow> size="small" rowKey="application_id" dataSource={rows} pagination={false} scroll={{ x: 760 }}
          columns={[
            { title: 'ผู้สมัคร', key: 'name', render: (_, row) => `${row.first_name} ${row.last_name}` },
            { title: 'ตำแหน่ง', dataIndex: 'position_name' },
            { title: 'วันเริ่มงาน', dataIndex: 'start_date', render: value => value ? dayjs(value).format('DD/MM/YYYY') : '-' },
            { title: 'Role', key: 'role', width: 200, render: (_, row) => <Select aria-label={`Role ของ ${row.first_name} ${row.last_name}`}
              value={row.role_id} placeholder="เลือก Role" style={{ width: '100%' }} disabled={busy || row.result?.success}
              loading={loadingRoles} showSearch optionFilterProp="label" options={roles.map(role => ({ value: role.id, label: role.role_name }))}
              onChange={value => setRows(previous => previous.map(item => item.application_id === row.application_id ? { ...item, role_id: value } : item))} /> },
            { title: 'ผลการอนุมัติ', key: 'result', width: 240, render: (_, row) => !row.result ? 'รอยืนยัน' : row.result.success
              ? <><Tag color="success">{row.result.already_approved ? 'อนุมัติแล้ว' : 'สำเร็จ'}</Tag>{row.result.employee_code}</>
              : <><Tag color="error">ไม่สำเร็จ</Tag><div>{row.result.message || 'ไม่สามารถยืนยันผลได้'}</div></> },
          ]} />
      </Space>
    </Modal>
  </>;
}
