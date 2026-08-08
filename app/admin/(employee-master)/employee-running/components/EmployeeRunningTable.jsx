"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
  FieldNumberOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";

import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";

import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

/* =========================================================
   Month Labels
========================================================= */

const monthLabels = {
  1: "มกราคม",
  2: "กุมภาพันธ์",
  3: "มีนาคม",
  4: "เมษายน",
  5: "พฤษภาคม",
  6: "มิถุนายน",
  7: "กรกฎาคม",
  8: "สิงหาคม",
  9: "กันยายน",
  10: "ตุลาคม",
  11: "พฤศจิกายน",
  12: "ธันวาคม",
};

/* =========================================================
   Helpers
========================================================= */

function getCompanyName(record) {
  const company = record?.companies;

  if (!company) {
    return "-";
  }

  const companyName =
    company.company_name_th ||
    company.company_name_en ||
    "-";

  if (company.company_code) {
    return `${company.company_code} - ${companyName}`;
  }

  return companyName;
}

function getSettingName(record) {
  return (
    record?.employee_code_settings
      ?.code_name || "-"
  );
}

function getSettingPattern(record) {
  return (
    record?.employee_code_settings
      ?.code_pattern || "-"
  );
}

function getResetPolicyLabel(value) {
  const labels = {
    never: "ไม่รีเซ็ต",
    yearly: "รายปี",
    monthly: "รายเดือน",
  };

  return labels[value] || value || "-";
}

function getResetPolicyColor(value) {
  const colors = {
    never: "default",
    yearly: "blue",
    monthly: "purple",
  };

  return colors[value] || "default";
}

function getRunningPeriod(record) {
  const resetPolicy =
    record?.employee_code_settings
      ?.reset_policy;

  if (
    resetPolicy === "never" ||
    Number(record.running_year) === 0
  ) {
    return {
      main: "ต่อเนื่อง",
      sub: "ไม่รีเซ็ตเลข",
    };
  }

  if (record.running_month) {
    return {
      main:
        monthLabels[
          Number(record.running_month)
        ] || record.running_month,

      sub: `ปี ${record.running_year}`,
    };
  }

  return {
    main: `ปี ${record.running_year}`,
    sub: "รีเซ็ตรายปี",
  };
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return "-";
  }

  return date.format(
    "DD/MM/YYYY HH:mm"
  );
}

function getEmployeeName(employee) {
  if (!employee) {
    return "-";
  }

  const thaiName = [
    employee.first_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const englishName = [
    employee.first_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    thaiName ||
    englishName ||
    employee.employee_code ||
    "-"
  );
}

/* =========================================================
   Component
========================================================= */

export default function EmployeeRunningTable({
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
      title: "บริษัท",

      key: "company",

      width: 230,

      fixed: "left",

      render: (_, record) => (
        <div>
          <Text strong>
            {getCompanyName(record)}
          </Text>
        </div>
      ),
    },

    {
      title: "รูปแบบรหัส",

      key: "setting",

      width: 230,

      render: (_, record) => (
        <Space
          orientation="vertical"
          size={1}
        >
          <Text strong>
            {getSettingName(record)}
          </Text>

          <Text
            code
            copyable={
              getSettingPattern(record) !==
              "-"
                ? {
                    text: getSettingPattern(
                      record
                    ),
                  }
                : false
            }
          >
            {getSettingPattern(record)}
          </Text>

          <Tag
            color={getResetPolicyColor(
              record
                ?.employee_code_settings
                ?.reset_policy
            )}
          >
            {getResetPolicyLabel(
              record
                ?.employee_code_settings
                ?.reset_policy
            )}
          </Tag>
        </Space>
      ),
    },

    {
      title: "รอบ Running",

      key: "period",

      width: 150,

      align: "center",

      render: (_, record) => {
        const period =
          getRunningPeriod(record);

        return (
          <Space
            orientation="vertical"
            size={0}
          >
            <Text strong>
              <CalendarOutlined className="mr-1 text-slate-400" />

              {period.main}
            </Text>

            <Text
              type="secondary"
              className="text-xs"
            >
              {period.sub}
            </Text>
          </Space>
        );
      },
    },

    {
      title: "เลขปัจจุบัน",

      dataIndex: "current_running",

      key: "current_running",

      width: 130,

      align: "center",

      sorter: true,

      render: (value) => (
        <Tag
          color="blue"
          icon={<FieldNumberOutlined />}
          className="px-3 text-base font-semibold"
        >
          {Number(value || 0).toLocaleString(
            "th-TH"
          )}
        </Tag>
      ),
    },

    {
      title: "รหัสพนักงานล่าสุด",

      dataIndex: "last_employee_code",

      key: "last_employee_code",

      width: 180,

      render: (value) =>
        value ? (
          <Text
            code
            copyable={{
              text: value,
            }}
          >
            {value}
          </Text>
        ) : (
          <Text type="secondary">
            ยังไม่มีการใช้งาน
          </Text>
        ),
    },

    {
      title: "พนักงานล่าสุด",

      key: "last_employee",

      width: 210,

      render: (_, record) => {
        const employee =
          record?.employees;

        if (!employee) {
          return (
            <Text type="secondary">
              -
            </Text>
          );
        }

        return (
          <Space
            direction="vertical"
            size={0}
          >
            <Text strong>
              {getEmployeeName(employee)}
            </Text>

            <Text
              type="secondary"
              className="text-xs"
            >
              {employee.employee_code || "-"}
            </Text>
          </Space>
        );
      },
    },

    {
      title: "สร้างล่าสุดเมื่อ",

      dataIndex: "last_generated_at",

      key: "last_generated_at",

      width: 170,

      render: (value) => (
        <Space size={5}>
          <HistoryOutlined className="text-slate-400" />

          <Text>
            {formatDateTime(value)}
          </Text>
        </Space>
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

      width: 145,

      fixed: "right",

      align: "center",

      render: (_, record) => (
        <Space size={2}>
          {canView && (
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() =>
                  onView?.(record)
                }
              />
            </Tooltip>
          )}

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
            <Tooltip
              title={
                Number(
                  record.current_running ||
                    0
                ) > 0
                  ? "รายการที่ใช้งานแล้วไม่สามารถลบได้"
                  : "ลบ"
              }
            >
              <span>
                <DeleteConfirm
                  title="ลบ Running Number"
                  description={`ยืนยันการลบ Running Number ของ ${getSettingName(
                    record
                  )} ใช่หรือไม่`}
                  loading={
                    deletingId === record.id
                  }
                  onConfirm={() =>
                    onDelete?.(record)
                  }
                />
              </span>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MasterTable
      rowKey="id"
      title="รายการ Running Number"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      scroll={{
        x: 1700,
      }}
      onChange={onChange}
    />
  );
}