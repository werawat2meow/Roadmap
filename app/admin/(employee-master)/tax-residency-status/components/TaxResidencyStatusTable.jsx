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

function textOrDash(
  value
) {
  const text =
    String(
      value ??
        ""
    ).trim();

  return text ||
    "-";
}

export default function TaxResidencyStatusTable({
  data = [],
  loading = false,

  page = 1,
  pageSize = 20,
  total = 0,

  canView = false,
  canEdit = false,
  canDelete = false,

  onChange,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title:
        "รหัส",
      dataIndex:
        "residency_code",
      width: 200,
      fixed: "left",

      render: (
        value
      ) => (
        <span className="font-semibold text-slate-800">
          {textOrDash(
            value
          )}
        </span>
      ),
    },

    {
      title:
        "สถานะผู้มีถิ่นที่อยู่ทางภาษี",
      dataIndex:
        "residency_name_th",
      width: 340,

      render: (
        value,
        record
      ) => (
        <div>
          <div className="font-medium text-slate-800">
            {textOrDash(
              value
            )}
          </div>

          {record
            .residency_name_en ? (
            <div className="mt-1 text-xs text-slate-400">
              {
                record
                  .residency_name_en
              }
            </div>
          ) : null}
        </div>
      ),
    },

    {
      title:
        "ลำดับ",
      dataIndex:
        "sort_order",
      width: 100,

      render: (
        value
      ) =>
        Number(
          value ||
            0
        ),
    },

    {
      title:
        "สถานะ",
      dataIndex:
        "status",
      width: 120,

      render: (
        value
      ) => (
        <Tag
          color={
            value ===
            "active"
              ? "success"
              : "default"
          }
        >
          {value ===
          "active"
            ? "ใช้งาน"
            : "ไม่ใช้งาน"}
        </Tag>
      ),
    },

    {
      title:
        "หมายเหตุ",
      dataIndex:
        "remark",
      ellipsis:
        true,

      render:
        textOrDash,
    },

    {
      title:
        "จัดการ",
      key:
        "actions",
      width: 145,
      fixed: "right",

      render: (
        _,
        record
      ) => (
        <Space>
          {canView ? (
            <Tooltip
              title="ดู"
            >
              <Button
                type="text"
                icon={
                  <EyeOutlined />
                }
                onClick={() =>
                  onView?.(
                    record
                  )
                }
              />
            </Tooltip>
          ) : null}

          {canEdit ? (
            <Tooltip
              title="แก้ไข"
            >
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
          ) : null}

          {canDelete ? (
            <Tooltip
              title="ลบ"
            >
              <Button
                type="text"
                danger
                icon={
                  <DeleteOutlined />
                }
                onClick={() =>
                  onDelete?.(
                    record
                  )
                }
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={
        loading
      }
      dataSource={
        data
      }
      columns={
        columns
      }
      scroll={{
        x: 1050,
      }}
      pagination={{
        current:
          page,

        pageSize,

        total,

        showSizeChanger:
          true,

        pageSizeOptions: [
          20,
          50,
          100,
        ],

        showTotal: (
          value
        ) =>
          `ทั้งหมด ${value} รายการ`,
      }}
      onChange={
        onChange
      }
    />
  );
}
