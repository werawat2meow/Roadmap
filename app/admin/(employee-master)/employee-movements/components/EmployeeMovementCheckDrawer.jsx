"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Divider, Drawer, Empty, Flex, Form, Input, Space, Spin, Tag, Typography, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
const { Text } = Typography;
async function request(url, options = {}) {
  const res = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.success === false) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}
export default function EmployeeMovementCheckDrawer({ employee, area, onClose, canManage, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [form] = Form.useForm();
  const title = area === "ASSET" ? "Company Assets · รายการทรัพย์สิน" : "Audit Management · กลุ่ม LINE ของพนักงาน";
  async function load() {
    if (!employee) return;
    setLoading(true);
    try {
      const j = await request(`/api/admin/employee-movements/check-items?employee_id=${encodeURIComponent(employee.id)}`);
      setItems((j.data || []).filter(x => x.area === area));
    } catch (e) { message.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { if (employee) load(); else setItems([]) }, [employee?.id, area]);
  async function add(values) {
    setBusy(true); try {
      await request('/api/admin/employee-movements/check-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_id: employee.id, area, item_name: values.item_name, notes: values.notes }) });
      form.resetFields(); await load(); onChanged?.(); message.success('เพิ่มรายการแล้ว');
    } catch (e) { message.error(e.message) } finally { setBusy(false) }
  }
  async function saveName(item) {
    const name = editingName.trim();
    if (!name) { message.warning("กรุณาระบุชื่อกลุ่ม LINE"); return; }
    setBusy(true);
    try {
      await request('/api/admin/employee-movements/check-items', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, item_name: name })
      });
      setEditingId(null); setEditingName(""); await load(); onChanged?.();
      message.success('บันทึกชื่อกลุ่ม LINE แล้ว');
    } catch (e) { message.error(e.message) } finally { setBusy(false) }
  }
  async function change(item) {
    setBusy(true); try {
      await request('/api/admin/employee-movements/check-items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, state: item.state === 'COMPLETED' ? 'PENDING' : 'COMPLETED', notes: item.notes }) });
      await load(); onChanged?.(); message.success('อัปเดตรายการแล้ว');
    } catch (e) { message.error(e.message) } finally { setBusy(false) }
  }
  const done = items.filter(x => x.state === 'COMPLETED').length;
  return <Drawer open={!!employee} onClose={onClose} size={540} title={title} destroyOnHidden>
    {employee && <>
      <div><Text strong>{employee.first_name_th} {employee.last_name_th}</Text> · {employee.employee_code}</div>
      <div style={{ margin: '12px 0' }}><Space><Tag color={done === items.length && items.length ? 'green' : 'orange'}>{done}/{items.length} เสร็จแล้ว</Tag><Button icon={<ReloadOutlined />} size="small" onClick={load}>รีเฟรช</Button></Space></div>
      <Alert type="info" showIcon title={area === 'ASSET' ? 'รายการทรัพย์สินที่ HR บันทึก ไม่เชื่อมระบบคลังทรัพย์สิน' : 'เพิ่มชื่อกลุ่ม LINE ที่ต้องตรวจสอบ แล้วติ๊กช่องเมื่อยืนยันว่าพนักงานอยู่ในกลุ่มนั้นจริง (ตรวจสอบด้วยตนเอง ไม่เชื่อม LINE API)'} style={{ marginBottom: 16 }} />
      <Spin spinning={loading}>
        {items.length === 0 ? <Empty description="ยังไม่มีรายการตรวจสอบ" /> : items.map(item => (
          <Flex key={item.id} justify="space-between" align="flex-start" gap={12} style={{ padding: '12px 0', borderBottom: '1px solid rgba(5,5,5,0.06)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Space wrap>
                {area === 'AUDIT' && <Checkbox aria-label={`อยู่ในกลุ่ม LINE ${item.item_name}`} checked={item.state === 'COMPLETED'} disabled={!canManage || busy} onChange={() => change(item)} />}
                <Text strong>{item.item_name}</Text>
                <Tag color={item.state === 'COMPLETED' ? 'green' : 'orange'}>{area === 'AUDIT' ? (item.state === 'COMPLETED' ? 'อยู่ในกลุ่ม LINE' : 'ยังไม่ยืนยัน') : (item.state === 'COMPLETED' ? 'เสร็จแล้ว' : 'ค้างดำเนินการ')}</Tag>
              </Space>
              {area === 'AUDIT' && editingId === item.id ? <Space.Compact style={{ width: '100%', margin: '8px 0' }}>
                <Input value={editingName} maxLength={150} onChange={e => setEditingName(e.target.value)} placeholder="ชื่อกลุ่ม LINE" />
                <Button type="primary" loading={busy} onClick={() => saveName(item)}>บันทึก</Button>
                <Button onClick={() => setEditingId(null)}>ยกเลิก</Button>
              </Space.Compact> : area === 'ASSET' ? <div>{item.notes || 'ไม่มีหมายเหตุ'}</div> : null}
              <div><Text type="secondary" style={{ fontSize: 12 }}>แก้ไขล่าสุด: {item.updated_at ? new Date(item.updated_at).toLocaleString('th-TH') : '-'}</Text></div>
            </div>
            {canManage && <div>
              {area === 'AUDIT' && <Button size="small" disabled={busy} onClick={() => { setEditingId(item.id); setEditingName(item.item_name) }}>แก้ชื่อกลุ่ม</Button>}
              {area === 'ASSET' && <Button size="small" disabled={busy} onClick={() => change(item)}>{item.state === 'COMPLETED' ? 'เปิดงานอีกครั้ง' : 'ทำเสร็จแล้ว'}</Button>}
            </div>}
          </Flex>
        ))}
      </Spin>
      {canManage && <><Divider>{area === 'AUDIT' ? 'เพิ่มชื่อกลุ่ม LINE' : 'เพิ่มรายการ'}</Divider><Form form={form} layout="vertical" onFinish={add}>
        <Form.Item label={area === 'AUDIT' ? 'ชื่อกลุ่ม LINE' : 'ชื่อรายการ'} name="item_name" rules={[{ required: true, message: 'กรุณาระบุรายการ' }]}><Input maxLength={150} placeholder={area === 'ASSET' ? 'เช่น คอมพิวเตอร์พนักงาน' : 'เช่น กลุ่ม HR Announcement'} /></Form.Item>
        {area === 'ASSET' && <Form.Item label="หมายเหตุ" name="notes"><Input.TextArea maxLength={1000} rows={2} /></Form.Item>}
        <Button loading={busy} type="primary" htmlType="submit" icon={<PlusOutlined />}>เพิ่มรายการ</Button>
      </Form></>}
    </>}
  </Drawer>;
}