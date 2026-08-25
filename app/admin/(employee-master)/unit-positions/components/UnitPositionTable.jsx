"use client";

import {
  Button,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

import StatusTag from "./StatusTag";

function numberTag(value, color) {
  return <Tag color={color}>{Number(value || 0)}</Tag>;
}

export default function UnitPositionTable({
  loading = false,
  rows = [],
  page = 1,
  pageSize = 20,
  total = 0,
  canEdit = false,
  canDelete = false,
  canGenerateSlots = false,
  deletingId = "",
  generatingId = "",
  onEdit,
  onDelete,
  onGenerateSlots,
  onPageChange,
}) {
  const columns = [
    {
      title: "#",
      width: 70,
      fixed: "left",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "สังกัด",
      key: "branch",
      width: 210,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">{row.branch_name || "-"}</div>
          <div className="text-xs text-slate-400">{row.branch_code || ""}</div>
        </div>
      ),
    },
    {
      title: "แผนก / ฝ่าย / หน่วย",
      key: "org",
      width: 310,
      render: (_, row) => (
        <div className="text-xs leading-5 text-slate-600">
          <div>{row.department_name || "-"}</div>
          <div>{row.division_name || "-"}</div>
          <div className="font-semibold text-slate-800">
            {row.unit_code ? `${row.unit_code} - ` : ""}
            {row.unit_name || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "ตำแหน่ง",
      key: "position",
      width: 230,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">
            {row.position_name || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {[row.position_code, row.position_level].filter(Boolean).join(" · ")}
          </div>
        </div>
      ),
    },
    {
      title: "Target",
      dataIndex: "headcount_target",
      width: 95,
      align: "center",
      render: (value) => numberTag(value, "blue"),
    },
    {
      title: "Slot",
      dataIndex: "slot_capacity",
      width: 90,
      align: "center",
      render: (value) => numberTag(value, "cyan"),
    },
    {
      title: "Filled",
      dataIndex: "filled_count",
      width: 90,
      align: "center",
      render: (value) => numberTag(value, "green"),
    },
    {
      title: "Vacant",
      dataIndex: "vacant_count",
      width: 90,
      align: "center",
      render: (value) => numberTag(value, value > 0 ? "gold" : "default"),
    },
    {
      title: "Gap",
      key: "gap",
      width: 100,
      align: "center",
      render: (_, row) => {
        if (row.slot_gap > 0) {
          return <Tag color="red">+{row.slot_gap}</Tag>;
        }

        if (row.over_plan > 0) {
          return <Tag color="purple">เกิน {row.over_plan}</Tag>;
        }

        return <Tag color="green">ครบ</Tag>;
      },
    },
    {
      title: "Occupancy",
      key: "occupancy",
      width: 150,
      render: (_, row) => (
        <div className="min-w-[120px]">
          <div className="mb-1 text-xs text-slate-500">
            {row.filled_count || 0}/{row.slot_capacity || 0}
          </div>
          <Progress
            percent={Number(row.occupancy_percent || 0)}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 100,
      align: "center",
      render: (_, row) => <StatusTag status={row.status} />,
    },
    {
      title: "จัดการ",
      key: "actions",
      fixed: "right",
      width: 190,
      align: "center",
      render: (_, row) => (
        <Space size={2}>
          {canGenerateSlots && row.status === "active" && row.slot_gap > 0 && (
            <Tooltip title={`Generate Position Slot ที่ขาด ${row.slot_gap} อัตรา`}>
              <Button
                type="text"
                icon={<ThunderboltOutlined />}
                loading={generatingId === row.id}
                onClick={() => onGenerateSlots?.(row)}
              />
            </Tooltip>
          )}

          {row.slot_capacity > 0 && (
            <Tooltip title={`มี Position Slot เชื่อม ${row.slot_count || 0} รายการ`}>
              <Button type="text" icon={<ApartmentOutlined />} disabled />
            </Tooltip>
          )}

          {canEdit && (
            <Tooltip
              title={
                row.slot_count > 0
                  ? "แก้ Target/Status ได้ แต่ล็อกสังกัด หน่วย และตำแหน่ง"
                  : "แก้ไข"
              }
            >
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(row)}
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip
              title={
                row.slot_count > 0
                  ? "มี Slot History แล้ว ให้ Inactive แทนการลบ"
                  : "ลบ"
              }
            >
              <Button
                type="text"
                danger
                disabled={row.slot_count > 0}
                loading={deletingId === row.id}
                icon={<DeleteOutlined />}
                onClick={() => onDelete?.(row)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={rows}
      scroll={{ x: 1850 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        showTotal: (value) => `ทั้งหมด ${value} รายการ`,
        onChange: onPageChange,
      }}
    />
  );
}
