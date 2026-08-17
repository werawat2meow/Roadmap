"use client";

import {
  Avatar,
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
  UserOutlined,
} from "@ant-design/icons";

export default function EmployeePositionAssignmentTable({
  data = [],
  loading = false,

  pagination = {},

  deletingId = "",

  canEdit = false,
  canDelete = false,

  onView,
  onEdit,
  onDelete,
  onPageChange,
}) {
  /* =======================================================
     Columns
  ======================================================= */

  const columns = [
    /* =====================================================
       Employee
    ===================================================== */

    {
      title:
        "พนักงาน",

      key:
        "employee",

      width:
        260,

      render: (
        _,
        row
      ) => {
        const employee =
          row.employees ||
          {};

        const name =
          getEmployeeName(
            employee
          );

        return (
          <div className="flex items-center gap-3">

            <Avatar
              size={42}
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

            <div className="min-w-0">

              <div className="truncate font-semibold text-slate-800">
                {name}
              </div>

              <div className="text-xs text-slate-500">
                {employee.employee_code ||
                  "-"}
              </div>

            </div>

          </div>
        );
      },
    },

    /* =====================================================
       Position Slot
    ===================================================== */

    {
      title:
        "Position Slot",

      key:
        "slot",

      width:
        260,

      render: (
        _,
        row
      ) => {
        const slot =
          row.org_position_slots ||
          {};

        return (
          <div>

            <div className="font-semibold text-slate-800">
              {slot.slot_code ||
                "-"}
            </div>

            <div className="text-xs text-slate-500">
              {slot.slot_name ||
                slot.positions
                  ?.position_name ||
                "-"}
            </div>

          </div>
        );
      },
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
        row
      ) =>
        row
          .org_position_slots
          ?.positions
          ?.position_name ||
        "-",
    },

    /* =====================================================
       Organization Path
    ===================================================== */

    {
      title:
        "สายองค์กร",

      key:
        "org",

      width:
        300,

      render: (
        _,
        row
      ) => (
        <div className="text-xs leading-5 text-slate-600">

          <div>
            {row.organization_path ||
              "-"}
          </div>

        </div>
      ),
    },

    /* =====================================================
       Assignment Type
    ===================================================== */

    {
      title:
        "ประเภท",

      dataIndex:
        "assignment_type",

      width:
        140,

      render: (
        value
      ) => (
        <AssignmentTypeTag
          value={
            value
          }
        />
      ),
    },

    /* =====================================================
       Primary
    ===================================================== */

    {
      title:
        "Primary",

      dataIndex:
        "is_primary",

      width:
        100,

      align:
        "center",

      render: (
        value
      ) =>
        value
          ? (
            <Tag color="blue">
              Primary
            </Tag>
          )
          : (
            <Tag>
              Secondary
            </Tag>
          ),
    },

    /* =====================================================
       Effective Dates
    ===================================================== */

    {
      title:
        "ช่วงวันที่",

      key:
        "dates",

      width:
        190,

      render: (
        _,
        row
      ) => (
        <div className="text-xs text-slate-600">

          <div>
            {row.effective_from ||
              "-"}
          </div>

          <div>
            ถึง{" "}
            {row.effective_to ||
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
        110,

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
            <Tag color="default">
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
        row
      ) => (
        <Space size={4}>

          {/* View */}

          <Tooltip title="ดูรายละเอียด">

            <Button
              type="text"
              icon={
                <EyeOutlined />
              }
              onClick={() =>
                onView?.(
                  row
                )
              }
            />

          </Tooltip>

          {/* Edit */}

          {canEdit && (
            <Tooltip title="แก้ไข">

              <Button
                type="text"
                icon={
                  <EditOutlined />
                }
                onClick={() =>
                  onEdit?.(
                    row
                  )
                }
              />

            </Tooltip>
          )}

          {/* Delete */}

          {canDelete && (
            <Tooltip title="ลบ">

              <Button
                danger
                type="text"
                loading={
                  deletingId ===
                  row.id
                }
                icon={
                  <DeleteOutlined />
                }
                onClick={() =>
                  onDelete?.(
                    row
                  )
                }
              />

            </Tooltip>
          )}

        </Space>
      ),
    },
  ];

  /* =======================================================
     Render
  ======================================================= */

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
        x: 1750,
      }}
      pagination={{
        current:
          pagination.page ||
          1,

        pageSize:
          pagination.pageSize ||
          20,

        total:
          pagination.total ||
          0,

        showSizeChanger:
          true,

        pageSizeOptions: [
          10,
          20,
          50,
          100,
        ],

        showTotal: (
          total
        ) =>
          `ทั้งหมด ${total} รายการ`,

        onChange: (
          page,
          pageSize
        ) =>
          onPageChange?.(
            page,
            pageSize
          ),
      }}
    />
  );
}

/* =========================================================
   Assignment Type Tag
========================================================= */

function AssignmentTypeTag({
  value,
}) {
  const config = {
    primary: {
      color:
        "blue",
      label:
        "Primary",
    },

    acting: {
      color:
        "gold",
      label:
        "Acting",
    },

    secondary: {
      color:
        "purple",
      label:
        "Secondary",
    },

    temporary: {
      color:
        "cyan",
      label:
        "Temporary",
    },
  };

  const current =
    config[value] ||
    {
      color:
        "default",
      label:
        value ||
        "-",
    };

  return (
    <Tag
      color={
        current.color
      }
    >
      {current.label}
    </Tag>
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