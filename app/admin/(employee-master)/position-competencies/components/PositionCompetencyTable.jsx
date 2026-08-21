"use client";

import {
  Button,
  Space,
  Table,
  Tag,
  Tooltip,
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

function getImportanceColor(
  level
) {
  switch (level) {
    case "critical":
      return "red";

    case "high":
      return "volcano";

    case "medium":
      return "gold";

    case "low":
      return "green";

    default:
      return "default";
  }
}

export default function PositionCompetencyTable({
  loading,
  data = [],
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  const columns = [
    {
      title: "Position",
      dataIndex:
        "position_name",
      width: 230,

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
      title: "Competency",
      dataIndex:
        "competency_name",
      width: 270,

      render: (
        _,
        record
      ) => {
        if (
          record
            .competency_name
        ) {
          return (
            <div>
              <div className="font-semibold">
                {
                  record
                    .competency_name
                }
              </div>

              <div className="text-xs text-gray-500">
                {
                  record
                    .competency_code ||
                  "-"
                }
              </div>

              {record
                .competency_type_name ||
              record
                .competency_type ? (
                <Tag className="mt-1">
                  {record
                    .competency_type_name ||
                    record
                      .competency_type}
                </Tag>
              ) : null}
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
              ไม่พบ Competency
            </Tag>

            <div className="mt-1">
              <Tooltip
                title={
                  record
                    .competency_id
                }
              >
                <Text
                  type="secondary"
                  className="text-xs"
                >
                  {shortUuid(
                    record
                      .competency_id
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
        "required_level_name",
      width: 190,
      align: "center",

      render: (
        _,
        record
      ) => {
        if (
          record
            .required_level_name ||
          record
            .required_level_code
        ) {
          return (
            <Tag color="blue">
              {record
                .required_level_code ||
                "-"}{" "}
              -{" "}
              {record
                .required_level_name ||
                "-"}
            </Tag>
          );
        }

        return (
          <Tooltip
            title={
              record
                .required_level_id
            }
          >
            <Tag
              color="error"
              icon={
                <WarningOutlined />
              }
            >
              ไม่พบ Level
            </Tag>
          </Tooltip>
        );
      },
    },

    {
      title: "Importance",
      dataIndex:
        "importance_level",
      width: 150,
      align: "center",

      render: (value) => (
        <Tag
          color={
            getImportanceColor(
              value
            )
          }
        >
          {String(
            value || ""
          ).toUpperCase()}
        </Tag>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      align: "center",

      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "success"
              : "default"
          }
        >
          {value === "active"
            ? "Active"
            : "Inactive"}
        </Tag>
      ),
    },

    {
      title: "Sort",
      dataIndex:
        "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Action",
      width: 140,
      fixed: "right",
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
                  onEdit(
                    record
                  )
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <Button
                danger
                type="text"
                icon={
                  <DeleteOutlined />
                }
                onClick={() =>
                  onDelete(
                    record
                  )
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
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      scroll={{
        x: 1250,
      }}
    />
  );
}
