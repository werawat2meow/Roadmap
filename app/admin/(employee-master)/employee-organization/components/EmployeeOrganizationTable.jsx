"use client";

import {
  Avatar,
  Button,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

function fullName(record) {
  const thai = [
    record?.first_name_th,
    record?.middle_name_th,
    record?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const english = [
    record?.first_name_en,
    record?.middle_name_en,
    record?.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    thai: thai || english || "-",
    english: thai ? english : "",
  };
}

function makeLabel(item, codeKey, nameKey) {
  if (!item) return "-";

  const code = item?.[codeKey] || "";
  const name = item?.[nameKey] || "-";

  return code ? `${code} - ${name}` : name;
}

function formatDate(value) {
  if (!value) return "-";

  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
}

export default function EmployeeOrganizationTable({
  data = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  canView = false,
  canEdit = false,
  onView,
  onEdit,
  onChange,
}) {
  const columns = [
    {
      title: "พนักงาน",
      key: "employee",
      width: 280,
      fixed: "left",
      render: (_, record) => {
        const name = fullName(record);

        return (
          <Space align="start">
            <Avatar
              size={42}
              src={record.employee_photo_url || null}
              icon={<UserOutlined />}
            />

            <div>
              <Text strong>{name.thai}</Text>
              {name.english && (
                <div>
                  <Text type="secondary" className="text-xs">
                    {name.english}
                  </Text>
                </div>
              )}
              <div>
                <Text code>{record.employee_code || "-"}</Text>
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "บริษัท / กรุ๊ป / สังกัด",
      key: "company_branch",
      width: 300,
      render: (_, record) => (
        <div>
          <Text strong>
            {makeLabel(
              record.companies,
              "company_code",
              "company_name_th"
            )}
          </Text>
          <div>
            <Text type="secondary">
              {makeLabel(
                record.branch_groups,
                "group_code",
                "group_name"
              )}
            </Text>
          </div>
          <div>
            <Text type="secondary">
              {makeLabel(record.branches, "branch_code", "branch_name")}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "แผนก / ฝ่าย / หน่วยงาน",
      key: "org_path",
      width: 300,
      render: (_, record) => {
        const path = [
          record?.departments?.department_name,
          record?.divisions?.division_name,
          record?.units?.unit_name,
        ].filter(Boolean);

        return path.length ? path.join(" / ") : "-";
      },
    },
    {
      title: "ตำแหน่ง / Level",
      key: "position",
      width: 240,
      render: (_, record) => (
        <div>
          <Text strong>
            {makeLabel(record.positions, "position_code", "position_name")}
          </Text>
          <div>
            <Tag color="blue">
              {record?.position_levels?.level_code || "-"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "ประเภทการจ้าง",
      key: "employment_type",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Tag color="cyan">
          {record?.employment_types?.type_name ||
            record?.employment_types?.type_code ||
            "-"}
        </Tag>
      ),
    },
    {
      title: "สถานะพนักงาน",
      key: "employee_status",
      width: 160,
      align: "center",
      render: (_, record) => {
        const status = record?.employee_statuses;

        return (
          <Tag color={status?.color || "default"}>
            {status?.status_name || status?.status_code || record?.status || "-"}
          </Tag>
        );
      },
    },
    {
      title: "วันที่เริ่มงาน",
      dataIndex: "start_work_date",
      key: "start_work_date",
      width: 140,
      align: "center",
      render: formatDate,
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 120,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          {canView && (
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView?.(record)}
              />
            </Tooltip>
          )}

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 1670 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (value) => `ทั้งหมด ${value} คน`,
      }}
      onChange={(pagination) => {
        onChange?.(
          pagination.current || 1,
          pagination.pageSize || 20
        );
      }}
    />
  );
}
