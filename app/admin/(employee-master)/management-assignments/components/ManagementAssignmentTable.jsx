"use client";

import { useMemo } from "react";

import {
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Avatar,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

import {
  getAssignmentScopes,
  getScopeTypeLabel,
  getSingleScopeLabel,
} from "../utils/scopeUtils";

export default function ManagementAssignmentTable({assignments = [],loading = false,onEdit,onDelete,}) {
  const columns = useMemo(() => [
    {
      title: "พนักงาน",
      key: "employee",
      width: 300,

      render: (_, row) => {

        const employee =
          row.employee ||
          row.employees ||
          {};

        const fullName =
          row.employee_name ||
          employee.full_name_th ||
          [
            employee.first_name_th,
            employee.last_name_th,
          ]
            .filter(Boolean)
            .join(" ");

        return (

          <Space align="start">

            <Avatar
              size={48}
              src={employee.employee_photo_url}
              icon={<UserOutlined />}
            />

            <div>

              <div className="font-bold">

                {fullName || "-"}

              </div>

              <div className="text-xs text-slate-500">

                {employee.employee_code || "-"}

              </div>

            </div>

          </Space>

        );

      },

    },

    {
      title: "Level",

      dataIndex: "management_level",

      width: 120,

      render: (value) => (

        <Tag color="blue">

          {value}

        </Tag>

      ),

    },

    {
      title: "Scope",

      key: "scope",

      render: (_, row) => {
        const scopes = getAssignmentScopes(row);

        if (!scopes.length) {

          return "-";

        }
        return (
          <Space
            orientation="vertical"
            size={4}
          >
                        {scopes.map((scope, index) => (

              <Tag
                key={`${scope.scope_type}-${index}`}
                color="processing"
                icon={<ApartmentOutlined />}
              >

                {getScopeTypeLabel(scope.scope_type)}

                {" : "}

                {getSingleScopeLabel(scope)}

              </Tag>

            ))}

          </Space>

        );

      },

    },

    {
      title: "Supervisor",

      width: 220,

      render: (_, row) => {

        const supervisor =
          row.supervisor ||
          row.supervisor_employee ||
          {};

        const supervisorName =
          supervisor.employee_name ||
          supervisor.full_name_th ||
          [
            supervisor.first_name_th,
            supervisor.last_name_th,
          ]
            .filter(Boolean)
            .join(" ");

        if (!supervisorName) {

          return "-";

        }

        return (

          <div>

            <div className="font-medium">

              {supervisorName}

            </div>

            <div className="text-xs text-slate-500">

              {supervisor.employee_code || ""}

            </div>

          </div>

        );

      },

    },

    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={ status === "active"
              ? "success" : "default"
          }
        >
          {status === "active"
            ? "Active"
            : "Inactive"}

        </Tag>

      ),

    },

    {
      title: "Action",
      width: 120,
      align: "center",
      render: (_, row) => (
        <Space>
          <Tooltip title="แก้ไข">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() =>
                onEdit?.(row)
              }
            />
          </Tooltip>

          <Tooltip title="ลบ">
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={() =>
                onDelete?.(row)
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [onEdit,onDelete,]);

  return (

    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={assignments}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `ทั้งหมด ${total} รายการ`,
      }}
      scroll={{
        x: 1200,
      }}
    />
  );
}