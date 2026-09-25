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

export default function BenefitTypeTable({
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
      width:
        180,
      fixed:
        "left",

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
        "ชื่อประเภทสวัสดิการ",
      dataIndex:
        "category_name",
      width:
        300,

      render: (
        value
      ) => (
        <span className="font-medium text-slate-800">
          {textOrDash(
            value
          )}
        </span>
      ),
    },

    {
      title:
        "รายละเอียด",
      dataIndex:
        "description",
      ellipsis:
        true,

      render:
        textOrDash,
    },

    {
      title:
        "จำนวนสวัสดิการ",
      dataIndex:
        "benefit_count",
      width:
        140,
      align:
        "center",

      render: (
        value
      ) => (
        <Tag
          color={
            Number(
              value ||
                0
            ) > 0
              ? "blue"
              : "default"
          }
          variant="filled"
        >
          {Number(
            value ||
              0
          )} รายการ
        </Tag>
      ),
    },

    {
      title:
        "ลำดับ",
      dataIndex:
        "sort_order",
      width:
        90,

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
        "is_active",
      width:
        110,

      render: (
        value
      ) => (
        <Tag
          color={
            value
              ? "success"
              : "default"
          }
        >
          {value
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
      width:
        145,
      fixed:
        "right",

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
              title={
                Number(
                  record
                    .benefit_count ||
                    0
                ) > 0
                  ? "มีสวัสดิการอ้างอิงอยู่ แนะนำให้ปิดใช้งาน"
                  : "ลบ"
              }
            >
              <Button
                type="text"
                danger
                disabled={
                  Number(
                    record
                      .benefit_count ||
                      0
                  ) > 0
                }
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
        x:
          1150,
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
