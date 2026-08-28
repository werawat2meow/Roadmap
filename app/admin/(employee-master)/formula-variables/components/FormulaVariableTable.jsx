"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const {
  Text,
} = Typography;

const DATA_TYPE_LABELS = {
  number:
    "ตัวเลขทศนิยม",

  integer:
    "จำนวนเต็ม",

  boolean:
    "จริง / เท็จ",

  text:
    "ข้อความ",

  date:
    "วันที่",
};

const SOURCE_TYPE_LABELS = {
  system:
    "ระบบ",

  employee:
    "ข้อมูลพนักงาน",

  attendance:
    "เวลาและการลงเวลา",

  payroll:
    "Payroll",

  custom:
    "กำหนดเอง",
};

function getCompanyLabel(
  record
) {
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

export default function FormulaVariableTable({
  dataSource = [],
  loading = false,
  deletingId = null,
  page = 1,
  pageSize = 20,
  total = 0,
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
        "รหัสตัวแปร",

      dataIndex:
        "variable_code",

      width:
        170,

      fixed:
        "left",

      render:
        (
          value,
          record
        ) => (
          <Space size={6}>
            <Text
              strong
              code
            >
              {value ||
                "-"}
            </Text>

            {record
              ?.is_system ===
              true && (
              <Tooltip title="ตัวแปรระบบ">
                <LockOutlined />
              </Tooltip>
            )}
          </Space>
        ),
    },

    {
      title:
        "ชื่อตัวแปร",

      dataIndex:
        "variable_name",

      width:
        210,

      render:
        (value) =>
          value || "-",
    },

    {
      title:
        "บริษัท",

      key:
        "company",

      width:
        240,

      render:
        (
          _,
          record
        ) =>
          getCompanyLabel(
            record
          ),
    },

    {
      title:
        "ชนิดข้อมูล",

      dataIndex:
        "data_type",

      width:
        130,

      render:
        (value) => (
          <Tag>
            {DATA_TYPE_LABELS[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        ),
    },

    {
      title:
        "แหล่งข้อมูล",

      dataIndex:
        "source_type",

      width:
        150,

      render:
        (value) => (
          <Tag>
            {SOURCE_TYPE_LABELS[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        ),
    },

    {
      title:
        "Source Key",

      dataIndex:
        "source_key",

      width:
        220,

      render:
        (value) =>
          value
            ? (
                <Text code>
                  {value}
                </Text>
              )
            : "-",
    },

    {
      title:
        "ค่าเริ่มต้น",

      dataIndex:
        "default_value",

      width:
        130,

      render:
        (value) =>
          value ===
            null ||
          value ===
            undefined ||
          value ===
            ""
            ? "-"
            : String(
                value
              ),
    },

    {
      title:
        "จำเป็น",

      dataIndex:
        "is_required",

      width:
        90,

      align:
        "center",

      render:
        (value) => (
          <Tag>
            {value
              ? "ใช่"
              : "ไม่"}
          </Tag>
        ),
    },

    {
      title:
        "สถานะ",

      dataIndex:
        "status",

      width:
        110,

      align:
        "center",

      render:
        (value) => (
          <StatusTag
            status={
              value
            }
          />
        ),
    },

    {
      title:
        "จัดการ",

      key:
        "actions",

      width:
        130,

      fixed:
        "right",

      align:
        "center",

      render:
        (
          _,
          record
        ) => {
          const protectedRecord =
            record
              ?.is_system ===
            true;

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

              {canEdit && (
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
                !protectedRecord && (
                  <Tooltip title="ลบ">
                    <DeleteConfirm
                      title="ลบตัวแปรสูตรคำนวณ"
                      description={`ยืนยันการลบ "${record.variable_code} - ${record.variable_name}" ใช่หรือไม่`}
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

              {canDelete &&
                protectedRecord && (
                  <Tooltip title="ตัวแปรระบบไม่สามารถลบได้">
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
    <div
      style={{
        width:
          "100%",
        maxWidth:
          "100%",
        minWidth:
          0,
        overflow:
          "hidden",
      }}
    >
      <MasterTable
        rowKey="id"
        title="รายการตัวแปรสูตรคำนวณ"
        columns={
          columns
        }
        dataSource={
          dataSource
        }
        loading={
          loading
        }
        page={
          page
        }
        pageSize={
          pageSize
        }
        total={
          total
        }
        scroll={{
          x:
            1580,
        }}
        onChange={
          onChange
        }
      />
    </div>
  );
}
