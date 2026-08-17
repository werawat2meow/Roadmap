"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

export default function PositionTable({
  loading = false,

  data = [],

  onEdit,

  onDelete,

  onView,
}) {
  const columns = [
    {
      title: "รหัส",

      dataIndex: "position_code",

      key: "position_code",

      width: 130,

      fixed: "left",
    },

    {
      title: "ชื่อตำแหน่ง",

      dataIndex: "position_name",

      key: "position_name",

      width: 260,

      render: (_, row) => (
        <div>
          <div
            style={{
              fontWeight: 600,
            }}
          >
            {row.position_name}
          </div>

          {row.short_name && (
            <div
              style={{
                color: "#999",
                fontSize: 12,
              }}
            >
              {row.short_name}
            </div>
          )}
        </div>
      ),
    },

    {
      title: "กลุ่มสายงาน",

      key: "family",

      width: 220,

      render: (_, row) => {
         if (!row.family) return "-";

        return (
          <>
            <div>{row.family.code}</div>
            <small style={{ color: "#888" }}>
              {row.family.name}
            </small>
          </>
        );
      },
    },

    {
      title: "Job",

      key: "job",

      width: 220,

      render: (_, row) => {
        if (!row.job) return "-";
        return (
          <>
            <div>{row.job.code}</div>
            <small style={{ color:"#888" }}>
              {row.job.name}
            </small>
          </>
        );
      },
    },

    {
      title: "Position Levels",
      key: "levels",
      width: 260,
      render: (_, row) => (
        <Space wrap>
          {(row.levels || []).map((level) => (
            <Tag
                key={level.id}
                color={
                    level.is_default
                        ? "blue"
                        : "default"
                }
            >
                {level.level_code} - {level.level_name}
            </Tag>
          ))}
        </Space>
      ),
    },
        {
      title: "Manager",
      key: "is_manager",
      width: 110,
      align: "center",
      render: (_, row) =>
        row.is_manager ? (
          <Tag color="processing">YES</Tag>
        ) : (
          <Tag>NO</Tag>
        ),
    },

    {
      title: "Executive",
      key: "is_executive",
      width: 110,
      align: "center",
      render: (_, row) =>
        row.is_executive ? (
          <Tag color="volcano">YES</Tag>
        ) : (
          <Tag>NO</Tag>
        ),
    },

    {
      title: "Multiple",
      key: "allow_multiple_assignment",
      width: 130,
      align: "center",
      render: (_, row) =>
        row.allow_multiple_assignment ? (
          <Tag color="purple">
            รองรับ
          </Tag>
        ) : (
          <Tag>
            ไม่รองรับ
          </Tag>
        ),
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 110,
      align: "center",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "success"
              : "default"
          }
        >
          {status?.toUpperCase()}
        </Tag>
      ),
    },

    {
      title: "จัดการ",
      key: "action",
      fixed: "right",
      width: 180,
      align: "center",

      render: (_, row) => (
        <Space>

          <Tooltip title="รายละเอียด">
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                onView?.(row)
              }
            />
          </Tooltip>

          <Tooltip title="แก้ไข">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                onEdit?.(row)
              }
            />
          </Tooltip>

          <Tooltip title="ลบ">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete?.(row)}
            />
          </Tooltip>

        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      size="middle"
      scroll={{
        x: 1800,
      }}
    />
  );
}