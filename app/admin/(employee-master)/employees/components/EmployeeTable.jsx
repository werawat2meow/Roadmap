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
  IdcardOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

function getEmployeeFullName(record) {
  const thaiName = [
    record?.first_name_th,
    record?.middle_name_th,
    record?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const englishName = [
    record?.first_name_en,
    record?.middle_name_en,
    record?.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    thaiName: thaiName || "-",
    englishName,
  };
}

function getCompanyName(record) {
  const company =
    record?.companies;

  if (!company) {
    return "-";
  }

  const name =
    company.company_name_th ||
    company.company_name_en ||
    "-";

  return company.company_code
    ? `${company.company_code} - ${name}`
    : name;
}

function getBranchName(record) {
  const branch =
    record?.branches;

  if (!branch) {
    return "-";
  }

  return branch.branch_code
    ? `${branch.branch_code} - ${
        branch.branch_name || "-"
      }`
    : branch.branch_name || "-";
}

function getOrganizationPath(record) {
  const items = [
    record?.departments
      ?.department_name,

    record?.divisions
      ?.division_name,

    record?.units
      ?.unit_name,
  ].filter(Boolean);

  return items.length
    ? items.join(" / ")
    : "-";
}

function getPositionName(record) {
  const position =
    record?.positions;

  if (!position) {
    return "-";
  }

  return position.position_code
    ? `${position.position_code} - ${
        position.position_name || "-"
      }`
    : position.position_name || "-";
}

function getJobName(record) {
  const job = record?.jobs;

  if (!job) {
    return null;
  }

  return job.job_code
    ? `${job.job_code} - ${
        job.job_name || "-"
      }`
    : job.job_name || "-";
}

function getEmployeeStatus(record) {
  return record?.employee_statuses;
}

function getEmploymentType(record) {
  return record?.employment_types;
}

function getUserAccount(record) {
  if (
    Array.isArray(
      record?.user_accounts
    )
  ) {
    return (
      record.user_accounts[0] ||
      null
    );
  }

  return (
    record?.user_accounts ||
    null
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return "-";
  }

  return date.format(
    "DD/MM/YYYY"
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EmployeeTable({
   dataSource = [],

  loading = false,

  deletingId = null,

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
      title: "พนักงาน",

      key: "employee",

      width: 300,

      fixed: "left",

      render: (_, record) => {
        const {
          thaiName,
          englishName,
        } =
          getEmployeeFullName(
            record
          );

        const photoUrl =
          record.employee_photo_url ||
          null;

        return (
          <Space
            align="start"
            size={12}
          >
            <Avatar
              size={48}
              src={photoUrl}
              icon={<UserOutlined />}
            />

            <div>
              <Space
                wrap
                size={6}
              >
                <Text strong>
                  {thaiName}
                </Text>

                {record.nickname_th && (
                  <Tag>
                    {
                      record.nickname_th
                    }
                  </Tag>
                )}
              </Space>

              {englishName && (
                <div>
                  <Text
                    type="secondary"
                    className="text-xs"
                  >
                    {englishName}
                  </Text>
                </div>
              )}

              <div className="mt-1">
                <Text
                  code
                  copyable={{
                    text:
                      record.employee_code,
                  }}
                >
                  {record.employee_code}
                </Text>
              </div>
            </div>
          </Space>
        );
      },
    },

    {
      title: "บริษัท / สังกัด",

      key: "company_branch",

      width: 270,

      render: (_, record) => (
        <Space
          orientation="vertical"
          size={1}
        >
          <Text strong>
            {getCompanyName(record)}
          </Text>

          <Text
            type="secondary"
            className="text-xs"
          >
            {getBranchName(record)}
          </Text>

          {record
            ?.branch_groups
            ?.group_name && (
            <Tag color="blue">
              {
                record
                  .branch_groups
                  .group_name
              }
            </Tag>
          )}
        </Space>
      ),
    },

    {
      title: "โครงสร้างองค์กร",

      key: "organization",

      width: 280,

      render: (_, record) => (
        <Space
          orientation="vertical"
          size={1}
        >
          <Text>
            {getOrganizationPath(
              record
            )}
          </Text>

          <Text
            type="secondary"
            className="text-xs"
          >
            {getPositionName(record)}
          </Text>

          {getJobName(record) && (
            <Tag color="purple">
              {getJobName(record)}
            </Tag>
          )}
        </Space>
      ),
    },

    {
      title: "ประเภทการจ้าง",

      key: "employment_type",

      width: 160,

      align: "center",

      render: (_, record) => {
        const employmentType =
          getEmploymentType(
            record
          );

        if (!employmentType) {
          return "-";
        }

        return (
          <Tag color="cyan">
            {employmentType
              .employment_type_name ||
              employmentType
                .employment_type_code ||
              "-"}
          </Tag>
        );
      },
    },

    {
      title: "สถานะพนักงาน",

      key: "employee_status",

      width: 160,

      align: "center",

      render: (_, record) => {
        const employeeStatus =
          getEmployeeStatus(
            record
          );

        if (!employeeStatus) {
          return (
            <StatusTag
              value={record.status}
            />
          );
        }

        return (
          <Tag
            color={
              employeeStatus.color ||
              "default"
            }
          >
            {employeeStatus
              .status_name ||
              employeeStatus
                .status_code ||
              "-"}
          </Tag>
        );
      },
    },

    {
      title: "วันที่เริ่มงาน",

      dataIndex:
        "start_work_date",

      key: "start_work_date",

      width: 140,

      align: "center",

      sorter: true,

      render: (value) =>
        formatDate(value),
    },

    {
      title: "บัญชีผู้ใช้งาน",

      key: "user_account",

      width: 200,

      render: (_, record) => {
        const account =
          getUserAccount(record);

        if (!account) {
          return (
            <Tag>
              ยังไม่มีบัญชี
            </Tag>
          );
        }

        return (
          <Space
            orientation="vertical"
            size={1}
          >
            <Space size={5}>
              <IdcardOutlined />

              <Text strong>
                {account.username}
              </Text>
            </Space>

            {account.roles && (
              <Tag
                color="geekblue"
                icon={
                  <SafetyCertificateOutlined />
                }
              >
                {account.roles
                  .role_name ||
                  account.roles
                    .role_code ||
                  "-"}
              </Tag>
            )}

            <Tag
              color={
                account.is_active
                  ? "green"
                  : "red"
              }
            >
              {account.is_active
                ? "บัญชีใช้งาน"
                : "บัญชีปิดใช้งาน"}
            </Tag>
          </Space>
        );
      },
    },

    {
      title: "สถานะระบบ",
      dataIndex: "status",
      key: "status",
      width: 120,
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

      render: (_, record) => {
        const account =
          getUserAccount(record);

        const protectedAccount =
          account?.roles?.is_system ===
          true;

        /* =====================================================
          Permission

          รายการ Employee ถูก Backend Scope
          มาเรียบร้อยแล้ว

          ตรง Action ใช้ Permission ปกติ:
          - ems.employees.view
          - ems.employees.edit
          - ems.employees.delete
        ===================================================== */

        const allowView =
          Boolean(canView);

        const allowEdit =
          Boolean(canEdit);

        const allowDelete =
          Boolean(canDelete);

        /* =====================================================
          ACTION
        ===================================================== */

        return (
          <Space size={2}>

            {/* =========================
                VIEW
            ========================= */}

            {allowView && (
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
            )}

            {/* =========================
                EDIT
            ========================= */}

            {allowEdit && (
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

            {/* =========================
                DELETE
            ========================= */}

            {allowDelete &&
              !protectedAccount && (
                <Tooltip title="ลบ">
                  <DeleteConfirm
                    title="ลบพนักงาน"
                    description={
                      `ยืนยันการลบพนักงาน ${record.employee_code} ใช่หรือไม่`
                    }
                    loading={
                      deletingId ===
                      record.id
                    }
                    onConfirm={() =>
                      onDelete?.(
                        record
                      )
                    }
                  />
                </Tooltip>
              )}

            {/* =========================
                SYSTEM ACCOUNT
            ========================= */}

            {protectedAccount &&
              allowDelete && (
                <Tooltip title="บัญชีระบบไม่สามารถลบได้">
                  <Button
                    type="text"
                    disabled
                    icon={
                      <LockOutlined />
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
    <MasterTable
      rowKey="id"
      title="รายการพนักงาน"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      scroll={{
        x: 1900,
      }}
      onChange={onChange}
    />
  );
}