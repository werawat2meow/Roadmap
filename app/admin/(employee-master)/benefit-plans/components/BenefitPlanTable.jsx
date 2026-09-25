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

function getTypeLabel(
  value
) {
  const labels = {
    allowance:
      "Allowance / เงินช่วยเหลือ",
    insurance:
      "Insurance / ประกัน",
    reimbursement:
      "Reimbursement / เบิกคืน",
    general:
      "General / ทั่วไป",
  };

  return (
    labels[value] ||
    textOrDash(
      value
    )
  );
}

function getPeriodLabel(
  value
) {
  const labels = {
    once:
      "ครั้งเดียว",
    monthly:
      "รายเดือน",
    yearly:
      "รายปี",
  };

  return (
    labels[value] ||
    textOrDash(
      value
    )
  );
}

export default function BenefitPlanTable({
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
        "รหัสแผน",
      dataIndex:
        "benefit_code",
      width:
        190,
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
        "แผนสวัสดิการ",
      dataIndex:
        "benefit_name",
      width:
        280,

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
            .description ? (
            <div className="mt-1 max-w-[360px] truncate text-xs text-slate-400">
              {
                record
                  .description
              }
            </div>
          ) : null}
        </div>
      ),
    },

    {
      title:
        "ประเภทสวัสดิการ",
      key:
        "category",
      width:
        220,

      render: (
        _,
        record
      ) => (
        record
          .benefit_categories ? (
          <Tag
            color="blue"
            variant="filled"
          >
            {
              record
                .benefit_categories
                .category_code
            }
            {" - "}
            {
              record
                .benefit_categories
                .category_name
            }
          </Tag>
        ) : (
          "-"
        )
      ),
    },

    {
      title:
        "รูปแบบ",
      dataIndex:
        "benefit_type",
      width:
        185,

      render:
        getTypeLabel,
    },

    {
      title:
        "รอบสิทธิ์",
      dataIndex:
        "active_period",
      width:
        120,

      render:
        getPeriodLabel,
    },

    {
      title:
        "Policy Rules",
      dataIndex:
        "rule_count",
      width:
        120,
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
              ? "gold"
              : "default"
          }
          variant="filled"
        >
          {Number(
            value ||
              0
          )} กฎ
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
                    .reference_count ||
                    0
                ) > 0
                  ? "มีข้อมูลอ้างอิงอยู่ แนะนำให้ปิดใช้งาน"
                  : "ลบ"
              }
            >
              <Button
                type="text"
                danger
                disabled={
                  Number(
                    record
                      .reference_count ||
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
          1500,
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
