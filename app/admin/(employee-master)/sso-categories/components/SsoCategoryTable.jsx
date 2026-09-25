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
      value ?? ""
    ).trim();

  return text ||
    "-";
}

export default function SsoCategoryTable({
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
        "category_code",
      width: 180,
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
        "ประเภทผู้ประกันตน",
      dataIndex:
        "category_name_th",
      width: 260,

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
            .category_name_en ? (
            <div className="mt-1 text-xs text-slate-400">
              {
                record
                  .category_name_en
              }
            </div>
          ) : null}
        </div>
      ),
    },

    {
      title:
        "มาตรา",
      dataIndex:
        "section_no",
      width: 100,

      render: (
        value
      ) =>
        value ===
          null ||
        value ===
          undefined
          ? "-"
          : `มาตรา ${value}`,
    },

    {
      title:
        "ผูกกับนายจ้าง",
      dataIndex:
        "requires_employer_registration",
      width: 140,

      render: (
        value
      ) => (
        <Tag
          color={
            value
              ? "blue"
              : "default"
          }
        >
          {value
            ? "ใช่"
            : "ไม่"}
        </Tag>
      ),
    },

    {
      title:
        "ค่าเริ่มต้น",
      dataIndex:
        "is_default",
      width: 120,

      render: (
        value
      ) =>
        value ? (
          <Tag color="gold">
            ค่าเริ่มต้น
          </Tag>
        ) : (
          "-"
        ),
    },

    {
      title:
        "ลำดับ",
      dataIndex:
        "sort_order",
      width: 90,

      render: (
        value
      ) =>
        Number(
          value || 0
        ),
    },

    {
      title:
        "สถานะ",
      dataIndex:
        "status",
      width: 110,

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
        x: 1150,
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
