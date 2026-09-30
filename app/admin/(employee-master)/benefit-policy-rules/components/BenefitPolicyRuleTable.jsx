"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const {
  Text,
} =
  Typography;

function formatQuota(
  record
) {
  if (
    record?.is_unlimited
  ) {
    return (
      <Tag color="green">
        Unlimited
      </Tag>
    );
  }

  const amount =
    Number(
      record
        ?.quota_amount ||
        0
    ).toLocaleString();

  return (
    <span>
      {amount}{" "}
      <Text
        type="secondary"
        className="text-xs"
      >
        {record
          ?.quota_unit ||
          "amount"}
      </Text>
    </span>
  );
}

function formatService(
  record
) {
  const min =
    record
      ?.min_service_months ??
    0;

  const max =
    record
      ?.max_service_months;

  if (
    max === null ||
    max === undefined
  ) {
    return `${min}+ เดือน`;
  }

  return `${min} - ${max} เดือน`;
}

function formatOrganization(
  record
) {
  const values = [
    record?.company_name,
    record?.branch_name,
    record?.department_name,
    record?.division_name,
    record?.unit_name,
  ].filter(Boolean);

  return values.length
    ? values.join(
        " / "
      )
    : "ทุกองค์กร";
}

export default function BenefitPolicyRuleTable({
  loading = false,
  data = [],

  page = 1,
  pageSize = 20,
  total = 0,

  canView = false,
  canEdit = false,
  canDelete = false,

  onView,
  onEdit,
  onDelete,
  onChange,
}) {
  const columns = [
    {
      title:
        "Policy",
      key:
        "policy",
      width: 235,
      fixed:
        "left",
      render: (
        _,
        record
      ) => (
        <div>
          <Text
            code
            className="text-xs"
          >
            {record
              .policy_code ||
              "-"}
          </Text>

          <div className="mt-1 font-semibold text-slate-800">
            {record
              .policy_name ||
              "-"}
          </div>
        </div>
      ),
    },
    {
      title:
        "สวัสดิการ",
      key:
        "benefit",
      width: 250,
      render: (
        _,
        record
      ) => (
        <div>
          <div className="font-medium">
            {record
              .benefit_name ||
              "-"}
          </div>

          <Text
            type="secondary"
            className="text-xs"
          >
            {record
              .benefit_code ||
              "-"}
          </Text>
        </div>
      ),
    },
    {
      title:
        "ปี",
      dataIndex:
        "rule_year",
      width: 80,
      align:
        "center",
    },
    {
      title:
        "ขอบเขตองค์กร",
      key:
        "organization",
      width: 330,
      render: (
        _,
        record
      ) =>
        formatOrganization(
          record
        ),
    },
    {
      title:
        "Level",
      dataIndex:
        "position_level",
      width: 100,
      align:
        "center",
      render: (
        value
      ) =>
        value ? (
          <Tag color="blue">
            {value}
          </Tag>
        ) : (
          <Text type="secondary">
            ทุก Level
          </Text>
        ),
    },
    {
      title:
        "ประเภทการจ้าง",
      dataIndex:
        "employment_type_name",
      width: 170,
      render: (
        value
      ) =>
        value ||
        "ทุกประเภท",
    },
    {
      title:
        "สถานะพนักงาน",
      dataIndex:
        "employee_status_name",
      width: 160,
      render: (
        value
      ) =>
        value ||
        "ทุกสถานะ",
    },
    {
      title:
        "อายุงาน",
      key:
        "service",
      width: 140,
      render: (
        _,
        record
      ) =>
        formatService(
          record
        ),
    },
    {
      title:
        "ผ่าน Probation",
      dataIndex:
        "probation_required",
      width: 125,
      align:
        "center",
      render: (
        value
      ) => (
        <Tag
          color={
            value
              ? "orange"
              : "default"
          }
        >
          {value
            ? "ต้องผ่าน"
            : "ไม่บังคับ"}
        </Tag>
      ),
    },
    {
      title:
        "Quota",
      key:
        "quota",
      width: 150,
      render: (
        _,
        record
      ) =>
        formatQuota(
          record
        ),
    },
    {
      title:
        "รอบสิทธิ์",
      dataIndex:
        "quota_frequency",
      width: 110,
      render: (
        value
      ) => {
        const labels = {
          yearly:
            "รายปี",
          monthly:
            "รายเดือน",
          once:
            "ครั้งเดียว",
        };

        return (
          <Tag>
            {labels[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        );
      },
    },
    {
      title:
        "Priority",
      dataIndex:
        "priority",
      width: 90,
      align:
        "center",
    },
    {
      title:
        "สถานะ",
      dataIndex:
        "is_active",
      width: 100,
      align:
        "center",
      render: (
        value
      ) => (
        <Tag
          color={
            value
              ? "green"
              : "red"
          }
        >
          {value
            ? "ACTIVE"
            : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title:
        "จัดการ",
      key:
        "actions",
      width: 150,
      fixed:
        "right",
      render: (
        _,
        record
      ) => (
        <Space>
          {canView && (
            <Tooltip title="ดูรายละเอียด">
              <Button
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
          )}

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="primary"
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
              title="ยืนยันการลบ Policy"
              description={`ต้องการลบ ${
                record
                  .policy_code ||
                record
                  .policy_name ||
                ""
              } ใช่หรือไม่`}
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{
                danger:
                  true,
              }}
              onConfirm={() =>
                onDelete?.(
                  record
                )
              }
            >
              <Tooltip title="ลบ">
                <Button
                  danger
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
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <Table
        rowKey="id"
        loading={
          loading
        }
        columns={
          columns
        }
        dataSource={
          data
        }
        scroll={{
          x: 2150,
        }}
        pagination={{
          current:
            page,
          pageSize,
          total,
          showSizeChanger:
            true,
          pageSizeOptions: [
            10,
            20,
            50,
            100,
          ],
          showTotal: (
            value
          ) =>
            `ทั้งหมด ${value} Policy`,
          onChange: (
            nextPage,
            nextPageSize
          ) =>
            onChange?.(
              nextPage,
              nextPageSize
            ),
        }}
      />
    </div>
  );
}
