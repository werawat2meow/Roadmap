"use client";

import {
  Avatar,
  Button,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";

/* =========================================================
   Component
========================================================= */

export default function OrgPositionSlotTable({
  data = [],

  loading = false,

  page = 1,

  pageSize = 20,

  total = 0,

  deletingId = "",

  canEdit = false,

  canDelete = false,

  onChange,

  onView,

  onEdit,

  onDelete,
}) {
  const columns = [
    /* =====================================================
       Slot
    ===================================================== */

    {
      title:
        "Position Slot",

      key:
        "slot",

      fixed:
        "left",

      width:
        220,

      render: (
        _,
        record
      ) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.slot_code ||
              "-"}
          </div>

          <div className="text-xs text-slate-500">
            {record.slot_name ||
              "-"}
          </div>

          {record.is_context_ancestor && (
            <Tag
              className="mt-1"
              color="default"
            >
              Context
            </Tag>
          )}
        </div>
      ),
    },

    /* =====================================================
       Position
    ===================================================== */

    {
      title:
        "ตำแหน่ง",

      key:
        "position",

      width:
        220,

      render: (
        _,
        record
      ) => (
        <div>
          <div className="font-medium text-slate-700">
            {record.positions
              ?.position_name ||
              "-"}
          </div>

          <div className="text-xs text-slate-400">
            {record.positions
              ?.position_code ||
              ""}
          </div>
        </div>
      ),
    },

    /* =====================================================
       Organization
    ===================================================== */

    {
      title:
        "สายองค์กร",

      key:
        "organization",

      width:
        340,

      render: (
        _,
        record
      ) => (
        <div className="text-xs leading-5 text-slate-600">
          {getOrganizationPath(
            record
          )}
        </div>
      ),
    },

    /* =====================================================
       Parent
    ===================================================== */

    {
      title:
        "Parent Slot",

      key:
        "parent",

      width:
        150,

      render: (
        _,
        record
      ) =>
        record.parent_slot_id
          ? (
            <Tag color="blue">
              มี Parent
            </Tag>
          )
          : (
            <Tag color="gold">
              Root
            </Tag>
          ),
    },

    /* =====================================================
       Occupancy
    ===================================================== */

    {
      title:
        "อัตรากำลัง",

      key:
        "occupancy",

      width:
        200,

      render: (
        _,
        record
      ) => {
        const capacity =
          Math.max(
            Number(
              record
                .employment_capacity ||
                1
            ),
            1
          );

        const assignments =
          getCurrentPrimaryAssignments(
            record
          );

        const filled =
          assignments.length;

        const percent =
          Math.min(
            Math.round(
              (
                filled /
                capacity
              ) *
                100
            ),
            100
          );

        return (
          <div className="min-w-[150px]">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>
                {filled}/
                {capacity}
              </span>

              <span>
                {Math.max(
                  capacity -
                    filled,
                  0
                ) > 0
                  ? `ว่าง ${Math.max(
                      capacity -
                        filled,
                      0
                    )}`
                  : "ครบ"}
              </span>
            </div>

            <Progress
              percent={
                percent
              }
              size="small"
              showInfo={
                false
              }
            />
          </div>
        );
      },
    },

    /* =====================================================
       Current Holder
    ===================================================== */

    {
      title:
        "ผู้ครองตำแหน่ง",

      key:
        "employee",

      width:
        240,

      render: (
        _,
        record
      ) => {
        const assignment =
          getCurrentPrimaryAssignments(
            record
          )[0];

        const employee =
          assignment?.employees;

        if (!employee) {
          return (
            <Tag color="orange">
              VACANT
            </Tag>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Avatar
              size={34}
              src={
                employee.employee_photo_url ||
                undefined
              }
              icon={
                !employee.employee_photo_url
                  ? (
                    <UserOutlined />
                  )
                  : undefined
              }
            />

            <div>
              <div className="text-sm font-medium">
                {getEmployeeName(
                  employee
                )}
              </div>

              <div className="text-xs text-slate-400">
                {employee.employee_code ||
                  "-"}
              </div>
            </div>
          </div>
        );
      },
    },

    /* =====================================================
       Slot Type
    ===================================================== */

    {
      title:
        "Type",

      dataIndex:
        "slot_type",

      width:
        110,

      render: (
        value
      ) => (
        <Tag>
          {value ||
            "normal"}
        </Tag>
      ),
    },

    /* =====================================================
       Effective
    ===================================================== */

    {
      title:
        "Effective",

      key:
        "effective",

      width:
        180,

      render: (
        _,
        record
      ) => (
        <div className="text-xs text-slate-600">
          <div>
            {record.effective_from ||
              "-"}
          </div>

          <div>
            ถึง{" "}
            {record.effective_to ||
              "ไม่กำหนด"}
          </div>
        </div>
      ),
    },

    /* =====================================================
       Status
    ===================================================== */

    {
      title:
        "สถานะ",

      dataIndex:
        "status",

      width:
        100,

      render: (
        value
      ) =>
        value ===
        "active"
          ? (
            <Tag color="green">
              ใช้งาน
            </Tag>
          )
          : (
            <Tag>
              ยกเลิก
            </Tag>
          ),
    },

    /* =====================================================
       Actions
    ===================================================== */

    {
      title:
        "จัดการ",

      key:
        "actions",

      fixed:
        "right",

      width:
        140,

      align:
        "right",

      render: (
        _,
        record
      ) => {
        const context =
          Boolean(
            record
              ?.is_context_ancestor
          );

        return (
          <Space size={2}>
            <Tooltip title="ดูรายละเอียด">
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

            {canEdit &&
              !context && (
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

            {canDelete &&
              !context && (
                <Tooltip title="ลบ">
                  <Button
                    type="text"
                    danger
                    loading={
                      deletingId ===
                      record.id
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
              )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={
        columns
      }
      dataSource={
        data
      }
      loading={
        loading
      }
      scroll={{
        x: 1900,
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
          `ทั้งหมด ${value} รายการ`,
      }}
      onChange={
        onChange
      }
    />
  );
}

/* =========================================================
   Organization Path
========================================================= */

function getOrganizationPath(
  record
) {
  return [
    record?.companies
      ?.company_name_th ||
      record?.companies
        ?.company_name_en,

    record?.branch_groups
      ?.group_name,

    record?.branches
      ?.branch_name,

    record?.departments
      ?.department_name,

    record?.divisions
      ?.division_name,

    record?.units
      ?.unit_name,
  ]
    .filter(Boolean)
    .join(" → ") ||
    "-";
}

/* =========================================================
   Current Assignments
========================================================= */

function getCurrentPrimaryAssignments(
  slot
) {
  const today =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Bangkok",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).format(
      new Date()
    );

  return (
    slot
      ?.employee_position_assignments ||
    []
  ).filter(
    (
      assignment
    ) => {
      if (
        assignment.status !==
        "active"
      ) {
        return false;
      }

      if (
        assignment.is_primary !==
        true
      ) {
        return false;
      }

      if (
        assignment.effective_from &&
        assignment.effective_from >
          today
      ) {
        return false;
      }

      if (
        assignment.effective_to &&
        assignment.effective_to <
          today
      ) {
        return false;
      }

      return true;
    }
  );
}

/* =========================================================
   Employee Name
========================================================= */

function getEmployeeName(
  employee = {}
) {
  return (
    [
      employee.first_name_th,
      employee.last_name_th,
    ]
      .filter(Boolean)
      .join(" ") ||

    [
      employee.first_name_en,
      employee.last_name_en,
    ]
      .filter(Boolean)
      .join(" ") ||

    "-"
  );
}