"use client";

import {
  Button,
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

export default function CareerPathTable({
  data = [],
  loading = false,

  page = 1,
  pageSize = 20,
  total = 0,

  onPageChange,

  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "#",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize + index + 1,
    },

    {
      title: "Career Path Code",
      dataIndex: "path_code",
      width: 170,
      sorter: (a, b) =>
        a.path_code.localeCompare(b.path_code),
    },

    {
      title: "Career Path Name",
      dataIndex: "path_name",
      sorter: (a, b) =>
        a.path_name.localeCompare(b.path_name),
    },

    {
      title: "Position Family",
      width: 220,
      render: (_, record) =>
        record.position_families ? (
          <>
            <div>
              <strong>
                {
                  record.position_families
                    .family_code
                }
              </strong>
            </div>

            <div
              style={{
                color: "#666",
                fontSize: 12,
              }}
            >
              {
                record.position_families
                  .family_name
              }
            </div>
          </>
        ) : (
          "-"
        ),
    },

    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Status",
      width: 120,
      align: "center",
      render: (_, record) =>
        record.is_active ? (
          <Tag color="green">
            Active
          </Tag>
        ) : (
          <Tag color="red">
            Inactive
          </Tag>
        ),
    },

    {
      title: "Actions",
      width: 170,
      fixed: "right",
      align: "center",

      render: (_, record) => (
        <Space>

          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                onView(record)
              }
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                onEdit(record)
              }
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
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
      scroll={{
        x: 1300,
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (t) =>
          `ทั้งหมด ${t} รายการ`,
        onChange: onPageChange,
      }}
    />
  );
}