"use client";

import { Button, Card, Space, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;
const CATEGORY_MAP = {
  salary: "เงินเดือน",
  allowance: "เงินเพิ่ม / เบี้ยเลี้ยง",
  overtime: "ค่าล่วงเวลา",
  bonus: "โบนัส",
  commission: "ค่าคอมมิชชั่น",
  incentive: "เงินจูงใจ",
  reimbursement: "เงินชดเชย / เบิกคืน",
  other: "อื่น ๆ",
};

function YesNoTag({ value }) {
  return <Tag color={value ? "green" : "default"}>{value ? "ใช่" : "ไม่"}</Tag>;
}

export default function EarningTypeTable({ loading = false, rows = [], pagination = {}, canEdit = false, canDelete = false, onView, onEdit, onDelete, onChange }) {
  const columns = [
    {
      title: "รหัส",
      dataIndex: "earning_type_code",
      width: 150,
      render: (value, record) => <div><Text strong>{value || "-"}</Text>{record.earning_type_name_en ? <div><Text type="secondary" className="text-xs">{record.earning_type_name_en}</Text></div> : null}</div>,
    },
    {
      title: "ชื่อประเภทเงินได้",
      dataIndex: "earning_type_name_th",
      width: 240,
      render: (value, record) => <div><Text>{value || "-"}</Text>{record.description ? <div className="max-w-[320px] truncate"><Text type="secondary" className="text-xs">{record.description}</Text></div> : null}</div>,
    },
    { title: "หมวด", dataIndex: "earning_category", width: 180, render: (value) => <Tag color="blue">{CATEGORY_MAP[value] || value || "-"}</Tag> },
    { title: "ภาษี", dataIndex: "is_taxable", align: "center", width: 90, render: (value) => <YesNoTag value={value} /> },
    { title: "ฐานประกันสังคม", dataIndex: "is_social_security_base", align: "center", width: 140, render: (value) => <YesNoTag value={value} /> },
    { title: "รายการประจำ", dataIndex: "is_recurring", align: "center", width: 120, render: (value) => <YesNoTag value={value} /> },
    { title: "Prorate", dataIndex: "is_proratable", align: "center", width: 100, render: (value) => <YesNoTag value={value} /> },
    { title: "ลำดับ", dataIndex: "sort_order", align: "center", width: 80 },
    { title: "สถานะ", dataIndex: "status", align: "center", width: 110, render: (value) => <Tag color={value === "active" ? "green" : "default"}>{value === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}</Tag> },
    {
      title: "จัดการ",
      fixed: "right",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="ดู"><Button type="text" icon={<EyeOutlined />} onClick={() => onView?.(record)} /></Tooltip>
          {canEdit ? <Tooltip title="แก้ไข"><Button type="text" icon={<EditOutlined />} onClick={() => onEdit?.(record)} /></Tooltip> : null}
          {canDelete ? <Tooltip title="ลบ"><Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete?.(record)} /></Tooltip> : null}
        </Space>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1400 }}
        pagination={{
          current: Number(pagination.page || 1),
          pageSize: Number(pagination.pageSize || 20),
          total: Number(pagination.total || 0),
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
        }}
        onChange={(nextPagination) => onChange?.({ current: nextPagination.current, pageSize: nextPagination.pageSize })}
      />
    </Card>
  );
}
