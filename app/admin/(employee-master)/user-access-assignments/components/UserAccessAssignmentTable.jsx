"use client";

import {
  Avatar,
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

/* =========================================================
   Helpers
========================================================= */

function buildEmployeeName(employee) {
  if (!employee) {
    return "";
  }

  const fullNameTh = [
    employee.first_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullNameEn = [
    employee.first_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    employee.full_name_th ||
    fullNameTh ||
    employee.full_name_en ||
    fullNameEn ||
    employee.employee_code ||
    ""
  );
}

function getEmployee(record) {
  return (
    record?.employee ||
    record?.user_account?.employee ||
    record?.user_account?.employees ||
    null
  );
}

function getUsername(record) {
  return (
    record?.user_account?.username ||
    record?.username ||
    "-"
  );
}

function getDisplayName(record) {
  const employee = getEmployee(record);

  return (
    buildEmployeeName(employee) ||
    getUsername(record)
  );
}

function getRoleName(record) {
  return (
    record?.role?.role_name ||
    "-"
  );
}

function getRoleCode(record) {
  return (
    record?.role?.role_code ||
    "-"
  );
}

function getScopeCount(record) {
  if ( typeof record?.scope_count === "number" && Number.isFinite(record.scope_count)) {
    return record.scope_count;
  }

  if (typeof record?.scope_count === "string" && record.scope_count.trim() !== "" && Number.isFinite(Number(record.scope_count))) {
    return Number(
      record.scope_count
    );
  }

  if (Array.isArray(record?.scopes)) {
    return record.scopes.length;
  }

  if (Array.isArray(record?.access_scopes)) {
    return record.access_scopes.length;
  }

  if (Array.isArray(record?.user_access_assignment_scopes)) {
    return record
      .user_access_assignment_scopes
      .length;
  }

  return 0;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const parts = String(value).split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* =========================================================
   Component
========================================================= */

export default function UserAccessAssignmentTable({
  rows = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,

  canEdit = false,
  canDelete = false,

  deletingId = null,

  onView,
  onEdit,
  onDelete,
  onTableChange,
}) {
  const columns = [
    {
      title: "ผู้ใช้งานระบบ",
      key: "user_account",
      width: 270,

      render: (_, record) => {
        const employee =
          getEmployee(record);

        const displayName =
          getDisplayName(record);

        const username =
          getUsername(record);

        const employeeCode =
          employee?.employee_code || null;

        return (
          <Space>
            <Avatar
              size={42}
              src={
                employee?.employee_photo_url ||
                null
              }
              icon={<UserOutlined />}
            />

            <div>
              <div className="font-medium text-slate-800">
                {displayName}
              </div>

              <Space
                size={4}
                separator={
                  <span className="text-slate-300">
                    •
                  </span>
                }
              >
                {employeeCode && (
                  <Text
                    type="secondary"
                    className="text-xs"
                  >
                    {employeeCode}
                  </Text>
                )}

                <Text
                  type="secondary"
                  className="text-xs"
                >
                  {username}
                </Text>
              </Space>
            </div>
          </Space>
        );
      },
    },

    {
      title: "บทบาทผู้ใช้งาน",
      key: "role",
      width: 220,

      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-800">
            {getRoleName(record)}
          </div>

          <Text
            type="secondary"
            className="text-xs"
          >
            {getRoleCode(record)}
          </Text>
        </div>
      ),
    },

    {
      title: "ชื่อ Assignment",
      dataIndex: "assignment_name",
      key: "assignment_name",
      width: 240,

      render: (value) => (
        <Text>
          {value || "-"}
        </Text>
      ),
    },

    {
      title: "ขอบเขต",
      key: "scope_count",
      width: 120,
      align: "center",

      render: (_, record) => (
        <Tag color="blue">
          {getScopeCount(record)} ขอบเขต
        </Tag>
      ),
    },

    {
      title: "บทบาทหลัก",
      dataIndex: "is_primary",
      key: "is_primary",
      width: 120,
      align: "center",

      render: (value) =>
        value ? (
          <Tag color="gold">
            Primary
          </Tag>
        ) : (
          <Tag>ทั่วไป</Tag>
        ),
    },

    {
      title: "ช่วงวันที่มีผล",
      key: "effective_period",
      width: 220,

      render: (_, record) => (
        <div>
          <div className="text-sm text-slate-700">
            เริ่ม{" "}
            {formatDate(
              record.effective_from
            )}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            สิ้นสุด{" "}
            {record.effective_to
              ? formatDate(
                  record.effective_to
                )
              : "ไม่กำหนด"}
          </div>
        </div>
      ),
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 110,
      align: "center",

      render: (value) => (
        <StatusTag value={value} />
      ),
    },

    {
      title: "จัดการ",
      key: "actions",
      width: 150,
      fixed: "right",
      align: "center",

      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                onView?.(record)
              }
            />
          </Tooltip>

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit?.(record)
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <DeleteConfirm
              title="ลบบทบาทผู้ใช้งาน"
              description={`ยืนยันการลบบทบาทของ ${getDisplayName(
                record
              )} ใช่หรือไม่`}
              loading={
                deletingId === record.id
              }
              onConfirm={() =>
                onDelete?.(record)
              }
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <MasterTable
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      scroll={{
        x: 1450,
      }}
      onChange={onTableChange}
    />
  );
}