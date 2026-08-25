"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Rate,
  Typography,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const {
  Text,
} = Typography;

const importanceColor = {
  low: "default",
  medium: "blue",
  high: "orange",
  critical: "red",
};

const importanceLabel = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function shortUuid(value) {
  if (!value) {
    return "-";
  }

  const text =
    String(value);

  if (
    text.length <= 20
  ) {
    return text;
  }

  return `${text.slice(
    0,
    8
  )}...${text.slice(-6)}`;
}

export default function PositionSkillTable({
  data = [],
  loading = false,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) {
  const columns = [
    {
      title: "ตำแหน่ง",
      dataIndex:
        "position_name",
      key:
        "position_name",
      width: 250,

      render: (
        _,
        record
      ) => {
        if (
          record.position_name
        ) {
          return (
            <div>
              <div className="font-semibold">
                {
                  record
                    .position_name
                }
              </div>

              <div className="text-xs text-gray-500">
                {
                  record
                    .position_code ||
                  "-"
                }
              </div>
            </div>
          );
        }

        return (
          <div>
            <Tag
              color="error"
              icon={
                <WarningOutlined />
              }
            >
              ไม่พบ Position
            </Tag>

            <div className="mt-1">
              <Tooltip
                title={
                  record
                    .position_id
                }
              >
                <Text
                  type="secondary"
                  className="text-xs"
                >
                  {shortUuid(
                    record
                      .position_id
                  )}
                </Text>
              </Tooltip>
            </div>
          </div>
        );
      },
    },

    {
      title: "ทักษะ",
      dataIndex:
        "skill_name",
      key:
        "skill_name",
      width: 250,

      render: (
        _,
        record
      ) => {
        if (
          record.skill_name
        ) {
          return (
            <div>
              <div className="font-semibold">
                {
                  record
                    .skill_name
                }
              </div>

              <div className="text-xs text-gray-500">
                {
                  record
                    .skill_code ||
                  "-"
                }
              </div>
            </div>
          );
        }

        return (
          <div>
            <Tag
              color="error"
              icon={
                <WarningOutlined />
              }
            >
              ไม่พบ Skill
            </Tag>

            <div className="mt-1">
              <Tooltip
                title={
                  record.skill_id
                }
              >
                <Text
                  type="secondary"
                  className="text-xs"
                >
                  {shortUuid(
                    record.skill_id
                  )}
                </Text>
              </Tooltip>
            </div>
          </div>
        );
      },
    },

    {
      title:
        "Required Level",
      dataIndex:
        "required_level",
      key:
        "required_level",
      width: 170,
      align: "center",

      render: (value) => (
        <Space
          orientation="vertical"
          size={0}
        >
          <Rate
            disabled
            count={5}
            value={
              Number(
                value ||
                  0
              )
            }
          />

          <span className="text-xs text-gray-500">
            {Number(
              value || 0
            )}{" "}
            / 5
          </span>
        </Space>
      ),
    },

    {
      title: "Importance",
      dataIndex:
        "importance_level",
      key:
        "importance_level",
      width: 140,
      align: "center",

      render: (value) => (
        <Tag
          color={
            importanceColor[
              value
            ] ||
            "default"
          }
        >
          {importanceLabel[
            value
          ] ||
            value ||
            "-"}
        </Tag>
      ),
    },

    {
      title: "Mandatory",
      dataIndex:
        "is_mandatory",
      key:
        "is_mandatory",
      width: 130,
      align: "center",

      render: (value) =>
        value ? (
          <Tag color="green">
            YES
          </Tag>
        ) : (
          <Tag>NO</Tag>
        ),
    },

    {
      title: "Status",
      dataIndex:
        "status",
      key: "status",
      width: 120,
      align: "center",

      render: (value) =>
        value ===
        "active" ? (
          <Tag color="success">
            Active
          </Tag>
        ) : (
          <Tag color="default">
            Inactive
          </Tag>
        ),
    },

    {
      title: "Sort",
      dataIndex:
        "sort_order",
      key: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",

      render: (
        _,
        record
      ) => (
        <Space>
          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={
                  <EditOutlined />
                }
                onClick={() =>
                  onEdit?.(
                    record
                  )
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Popconfirm
              title="ลบข้อมูลนี้ ?"
              okText="ลบ"
              cancelText="ยกเลิก"
              onConfirm={() =>
                onDelete?.(
                  record
                )
              }
            >
              <Tooltip title="ลบ">
                <Button
                  danger
                  type="text"
                  icon={
                    <DeleteOutlined />
                  }
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      bordered
      scroll={{
        x: 1250,
      }}
    />
  );
}
