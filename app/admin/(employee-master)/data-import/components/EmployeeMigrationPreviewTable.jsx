"use client";

import {
  Alert,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";

const {
  Text,
} = Typography;

function formatMoney(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return Number(
    value
  ).toLocaleString(
    "th-TH",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  );
}

export default function EmployeeMigrationPreviewTable({
  rows = [],
  loading = false,
}) {
  const columns = [
    {
      title: "Row",
      dataIndex:
        "row_no",
      width: 70,
      fixed: "left",
      align: "center",
    },
    {
      title:
        "รหัสพนักงานเดิม",
      dataIndex:
        "employee_code",
      width: 150,
      fixed: "left",
      render:
        (value) => (
          <Text
            strong
            code
          >
            {value || "-"}
          </Text>
        ),
    },
    {
      title:
        "External ID",
      dataIndex:
        "external_employee_id",
      width: 140,
      render:
        (value) =>
          value || "-",
    },
    {
      title:
        "ชื่อ-นามสกุล",
      dataIndex:
        "employee_name",
      width: 200,
      render:
        (value) =>
          value || "-",
    },
    {
      title:
        "บริษัท",
      dataIndex:
        "company_code",
      width: 100,
    },
    {
      title:
        "สังกัด",
      dataIndex:
        "branch_code",
      width: 100,
    },
    {
      title:
        "แผนก",
      dataIndex:
        "department_code",
      width: 100,
    },
    {
      title:
        "ตำแหน่ง",
      dataIndex:
        "position_code",
      width: 120,
    },
    {
      title:
        "เงินเดือนฐาน",
      dataIndex:
        "base_salary",
      width: 140,
      align: "right",
      render:
        formatMoney,
    },
    {
      title:
        "การทำงาน",
      dataIndex:
        "action",
      width: 100,
      align: "center",
      render:
        (value) => (
          <Tag
            color={
              value ===
              "insert"
                ? "green"
                : "blue"
            }
          >
            {value ===
            "insert"
              ? "INSERT"
              : "UPDATE"}
          </Tag>
        ),
    },
    {
      title:
        "ผลตรวจ",
      key:
        "result",
      width: 140,
      align: "center",
      render:
        (
          _,
          record
        ) =>
          record.valid
            ? (
                <Tag color="success">
                  พร้อมนำเข้า
                </Tag>
              )
            : (
                <Tag color="error">
                  ต้องแก้ไข
                </Tag>
              ),
    },
    {
      title:
        "รายละเอียด",
      key:
        "messages",
      width: 360,
      render:
        (
          _,
          record
        ) => {
          const errors =
            record.errors ||
            [];

          const warnings =
            record.warnings ||
            [];

          if (
            !errors.length &&
            !warnings.length
          ) {
            return (
              <Text type="success">
                ผ่าน Validation
              </Text>
            );
          }

          return (
            <div>
              {errors.map(
                (
                  item,
                  index
                ) => (
                  <Alert
                    key={`e-${index}`}
                    type="error"
                    showIcon={false}
                    title={item}
                    style={{
                      marginBottom:
                        4,
                    }}
                  />
                )
              )}

              {warnings.map(
                (
                  item,
                  index
                ) => (
                  <Alert
                    key={`w-${index}`}
                    type="warning"
                    showIcon={false}
                    title={item}
                    style={{
                      marginBottom:
                        4,
                    }}
                  />
                )
              )}
            </div>
          );
        },
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Table
        rowKey={(record) =>
          String(
            record.row_no
          )
        }
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [
            20,
            50,
            100,
          ],
          showTotal:
            (total) =>
              `ทั้งหมด ${total} แถว`,
        }}
        scroll={{
          x: 1800,
        }}
      />
    </div>
  );
}
