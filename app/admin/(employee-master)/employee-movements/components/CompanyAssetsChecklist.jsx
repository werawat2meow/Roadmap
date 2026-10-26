"use client";

import { useState } from "react";
import { Button, DatePicker, Form, Input, Radio, Space, Spin, Typography, message } from "antd";
import { PlusOutlined, PrinterOutlined, ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export default function CompanyAssetsChecklist({ employee, items, loading, busy, canManage, onReload, onAdd, onChange }) {
  const [form] = Form.useForm();
  const [subject, setSubject] = useState("Company Assets");
  const [date, setDate] = useState(null);
  const [remarks, setRemarks] = useState("");
  const done = items.filter((item) => item.state === "COMPLETED").length;
  const pending = items.length - done;
  const name = [employee?.first_name_th, employee?.last_name_th].filter(Boolean).join(" ") || "-";
  const position = employee?.position_name_th || employee?.position_name || "";
  const level = employee?.position_level_name || employee?.level_name || "";

  async function add(values) {
    const ok = await onAdd(values);
    if (ok) form.resetFields();
  }

  function printReport() {
    const title = "Company Assets";
    const printDate = date?.format?.("DD/MM/YYYY") || new Date().toLocaleDateString("th-TH");
    const rows = items.map((item) => `
      <tr><td>${escapeHtml(item.item_name)}</td>
      <td class="mark">${item.state === "COMPLETED" ? "◉" : "◯"}</td>
      <td class="mark">${item.state !== "COMPLETED" ? "◉" : "◯"}</td></tr>`).join("");
    const popup = window.open("", "_blank", "width=900,height=950");
    if (!popup) { message.warning("กรุณาอนุญาตหน้าต่างป๊อปอัปเพื่อพิมพ์รายงาน"); return; }
    popup.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"/><title>${title}</title>
      <style>@page{size:A4;margin:17mm}body{font-family:Arial,'Tahoma',sans-serif;color:#222;margin:0;font-size:14px}h2{font-size:20px;margin:0 0 20px}.meta{margin-bottom:10px;line-height:2}table{border-collapse:collapse;width:100%;margin-top:15px}th,td{border:1px solid #bbb;padding:8px;text-align:left}th{background:#eee}.mark{width:16%;text-align:center;font-size:21px}.total{margin-top:22px;line-height:1.9;font-weight:bold}.blue{color:#2936aa}.green{color:#14843a}.red{color:#c8214b}.notes{margin-top:28px;white-space:pre-wrap;word-break:break-word}</style>
      </head><body><h2>♧ Company Assets</h2>
      <div class="meta">วันที่ : ${escapeHtml(printDate)}<br/>เรื่อง : ${escapeHtml(subject)}<br/>ชื่อ-สกุล : ${escapeHtml(name)}　ระดับ : ${escapeHtml(level)}　ตำแหน่ง : ${escapeHtml(position)}</div>
      <table><thead><tr><th>รายการ</th><th>ดำเนินการแล้ว</th><th style="color:#d32645">ยังไม่ได้ดำเนินการ</th></tr></thead><tbody>${rows || '<tr><td colspan="3">ยังไม่มีรายการ</td></tr>'}</tbody></table>
      <div class="total">รายการทั้งหมด : <span class="blue">${items.length}</span><br/>ดำเนินการแล้ว : <span class="green">${done}</span><br/>ยังไม่ได้ดำเนินการ : <span class="red">${pending}</span></div>
      <div class="notes"><b>หมายเหตุ :</b> ${escapeHtml(remarks)}</div></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div style={{ paddingBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 18 }}>Company Assets</Text>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onReload} disabled={loading}>รีเฟรช</Button>
          <Button icon={<PrinterOutlined />} onClick={printReport}>พิมพ์รายงาน</Button>
        </Space>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 12 }}>
        <label>วันที่<DatePicker value={date} onChange={setDate} format="DD/MM/YYYY" placeholder="วันที่รายงาน" style={{ display: "block", width: "100%", marginTop: 5 }} /></label>
        <label>เรื่อง<Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} style={{ marginTop: 5 }} /></label>
      </div>
      <div style={{ padding: "8px 0 16px", lineHeight: 1.9, fontSize: 13 }}>
        <b>ชื่อ-สกุล:</b> {name}　 <b>ระดับ:</b> {level || "-"}　 <b>ตำแหน่ง:</b> {position || "-"}
      </div>
      <Spin spinning={loading}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440, fontSize: 13 }}>
            <thead><tr style={{ background: "#f0f0f0" }}>
              <th style={cellStyle}>รายการ</th>
              <th style={{ ...cellStyle, width: 105, textAlign: "center" }}>ดำเนินการแล้ว</th>
              <th style={{ ...cellStyle, width: 125, textAlign: "center", color: "#d32045" }}>ยังไม่ได้ดำเนินการ</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}><b>{item.item_name}</b>{item.notes ? <div style={{ fontSize: 11, color: "#697586" }}>{item.notes}</div> : null}</td>
                  <td colSpan={2} style={{ ...cellStyle, padding: 0 }}>
                    <Radio.Group
                      aria-label={`สถานะ ${item.item_name}`}
                      value={item.state}
                      onChange={(e) => onChange(item, e.target.value)}
                      disabled={!canManage || busy}
                      style={{ display: "grid", gridTemplateColumns: "105px 125px", justifyItems: "center", alignItems: "center", minHeight: 42 }}
                    >
                      <Radio value="COMPLETED" style={{ marginInlineEnd: 0 }} />
                      <Radio value="PENDING" style={{ marginInlineEnd: 0 }} />
                    </Radio.Group>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={3} style={{ ...cellStyle, textAlign: "center", color: "#888", padding: 20 }}>ยังไม่มีรายการ Company Assets</td></tr>}
            </tbody>
          </table>
        </div>
      </Spin>
      <div style={{ marginTop: 18, lineHeight: 1.8, fontWeight: 700 }}>
        <div>รายการทั้งหมด : <span style={{ color: "#303fba" }}>{items.length}</span></div>
        <div>ดำเนินการแล้ว : <span style={{ color: "#149243" }}>{done}</span></div>
        <div>ยังไม่ได้ดำเนินการ : <span style={{ color: "#d32045" }}>{pending}</span></div>
      </div>
      <label style={{ display: "block", marginTop: 14 }}>หมายเหตุ<Input.TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={1000} placeholder="หมายเหตุสำหรับรายงาน (ไม่บันทึกลงฐานข้อมูล)" style={{ marginTop: 6 }} /></label>
      {canManage && <Form form={form} layout="vertical" onFinish={add} style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
        <Form.Item label="เพิ่มรายการ Company Assets" name="item_name" rules={[{ required: true, message: "กรุณาระบุชื่อรายการ" }]}><Input maxLength={150} placeholder="ระบุรายการทรัพย์สิน / รายการตรวจสอบ" /></Form.Item>
        <Form.Item label="รายละเอียด (ถ้ามี)" name="notes"><Input.TextArea rows={2} maxLength={1000} /></Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={busy}>เพิ่มรายการ</Button>
      </Form>}
      <Text type="secondary" style={{ display: "block", marginTop: 14, fontSize: 11 }}>สถานะและรายการบันทึกผ่านระบบเดิม ส่วนวันที่ เรื่อง และหมายเหตุท้ายรายงานใช้สำหรับพิมพ์ครั้งนี้เท่านั้น</Text>
    </div>
  );
}

const cellStyle = { border: "1px solid #d9d9d9", padding: "9px 10px", verticalAlign: "middle" };
