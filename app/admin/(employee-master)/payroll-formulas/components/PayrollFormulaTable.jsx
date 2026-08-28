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

const FORMULA_TYPE_LABELS = {
  earning:
    "สูตรรายได้",

  deduction:
    "สูตรรายการหัก",

  general:
    "สูตรทั่วไป",
};

const ROUNDING_LABELS = {
  none:
    "ไม่ปัดเศษ",

  round:
    "ปัดตามหลัก",

  floor:
    "ปัดลง",

  ceil:
    "ปัดขึ้น",
};

function getCompanyLabel(record) {
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

export default function PayrollFormulaTable({
  dataSource = [],
  loading = false,
  deletingId = null,
  page = 1,
  pageSize = 20,
  total = 0,
  canEdit = false,
  canDelete = false,
  canEditRecord,
  canDeleteRecord,
  onView,
  onEdit,
  onDelete,
  onChange,
}) {
  const columns = [
    {
      title:
        "รหัสสูตร",

      dataIndex:
        "formula_code",

      width: 160,

      fixed: "left",

      render: (
        value,
        record
      ) => (
        <Space size={6}>
          <Text
            strong
            code
          >
            {value || "-"}
          </Text>

          {record
            ?.is_system ===
            true && (
            <Tooltip title="สูตรระบบ">
              <LockOutlined />
            </Tooltip>
          )}
        </Space>
      ),
    },

    {
      title:
        "ชื่อสูตร",

      dataIndex:
        "formula_name",

      width: 220,

      render:
        (value) =>
          value || "-",
    },

    {
      title:
        "บริษัท",

      key:
        "company",

      width: 250,

      render: (
        _,
        record
      ) =>
        getCompanyLabel(
          record
        ),
    },

    {
      title:
        "ประเภทสูตร",

      dataIndex:
        "formula_type",

      width: 140,

      render:
        (value) => (
          <Tag>
            {FORMULA_TYPE_LABELS[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        ),
    },

    {
      title:
        "สูตรคำนวณ",

      dataIndex:
        "formula_expression",

      width: 360,

      ellipsis: true,

      render:
        (value) =>
          value
            ? (
                <Tooltip
                  title={value}
                >
                  <Text code>
                    {value}
                  </Text>
                </Tooltip>
              )
            : "-",
    },

    {
      title:
        "ลำดับคำนวณ",

      dataIndex:
        "calculation_order",

      width: 110,

      align: "center",

      render:
        (value) =>
          Number(
            value || 0
          ),
    },

    {
      title:
        "การปัดเศษ",

      key:
        "rounding",

      width: 150,

      render: (
        _,
        record
      ) =>
        `${ROUNDING_LABELS[
          record.rounding_method
        ] ||
          record.rounding_method ||
          "-"} / ${
          record.decimal_places ??
          0
        } ตำแหน่ง`,
    },

    {
      title:
        "สถานะ",

      dataIndex:
        "status",

      width: 110,

      align: "center",

      render:
        (value) => (
          <StatusTag
            status={value}
          />
        ),
    },

    {
      title:
        "จัดการ",

      key:
        "actions",

      width: 130,

      fixed: "right",

      align: "center",

      render: (
        _,
        record
      ) => {
        const protectedRecord =
          record
            ?.is_system ===
          true;

        const allowEdit =
          protectedRecord
            ? false
            : typeof canEditRecord ===
                "function"
              ? canEditRecord(
                  record
                )
              : canEdit;

        const allowDelete =
          protectedRecord
            ? false
            : typeof canDeleteRecord ===
                "function"
              ? canDeleteRecord(
                  record
                )
              : canDelete;

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

            {allowDelete && (
              <Tooltip title="ลบ">
                <DeleteConfirm
                  title="ลบสูตรการคำนวณเงินเดือน"
                  description={`ยืนยันการลบ "${record.formula_code} - ${record.formula_name}" ใช่หรือไม่`}
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

            {protectedRecord &&
              (canEdit ||
                canDelete) && (
                <Tooltip title="สูตรระบบไม่อนุญาตให้แก้ไขหรือลบ">
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
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <MasterTable
        rowKey="id"
        title="รายการสูตรการคำนวณเงินเดือน"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        scroll={{
          x: 1690,
        }}
        onChange={onChange}
      />
    </div>
  );
}
