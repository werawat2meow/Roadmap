"use client";

import {Table,Tag,Button,Tooltip,Space} from "antd";
import {EditOutlined,DeleteOutlined,DollarOutlined,} from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function PositionLevelTable({loading,levels,page,pageSize,canEdit,canDelete,deletingId,onEdit,onDelete,}) {

  const router = useRouter();
  const columns = [
    {
      title: "#",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: "Level Code",
      dataIndex: "level_code",
      width: 140,
      render: (value) => (
        <span className="font-semibold">
          {value}
        </span>
      ),
    },
    {
      title: "Level Name",
      dataIndex: "level_name",
    },

    {
      title: "Bands",
      dataIndex: "band_count",
      width: 120,
      align: "center",
      render: (value) => (
        <Tag color="blue">
          {value || 0} Bands
        </Tag>
      ),
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : "red"
          }
        >
          {status === "active"
            ? "Active"
            : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Action",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space>

          {canEdit && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit(record)
                }
              />
            </Tooltip>
          )}

          <Tooltip title="Manage Bands">
            <Button
              type="text"
              icon={<DollarOutlined style={{ color: '#fa8c16' }} />}
              onClick={() =>
                router.push(`/admin/position-level-bands?position_level_id=${record.id}`)
              }
              style={{
                backgroundColor: '#fff7e6',
                color: '#fa8c16',
                borderColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffe7ba';
                e.currentTarget.style.borderColor = '#fa8c16';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff7e6';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            />
          </Tooltip>

          {canDelete && (
            <Tooltip title="Delete">
              <Button
                danger
                type="text"
                loading={
                  deletingId === record.id
                }
                icon={<DeleteOutlined />}
                onClick={() =>
                  onDelete(record)
                }
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
      bordered
      loading={loading}
      columns={columns}
      dataSource={levels}
      pagination={false}
      scroll={{ x: 1000 }}
    />
  );
}