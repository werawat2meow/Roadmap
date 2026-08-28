"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  CalculatorOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const {
  Text,
} = Typography;

const STATUS_META = {
  draft: {
    label: "Draft",
    color: "default",
  },
  prepared: {
    label: "Prepared",
    color: "processing",
  },
  processing: {
    label: "Processing",
    color: "warning",
  },
  completed: {
    label: "Completed",
    color: "success",
  },
  cancelled: {
    label: "Cancelled",
    color: "error",
  },
};

const RUN_TYPE_META = {
  regular: "Regular",
  adjustment: "Adjustment",
  bonus: "Bonus",
  final: "Final",
};

function money(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "th-TH",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  ).format(
    Number(value || 0)
  );
}

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

function getPeriodLabel(
  record
) {
  const period =
    record
      ?.payroll_periods;

  if (!period) {
    return "-";
  }

  return `${period.period_code || "-"} - ${period.period_name || "-"}`;
}

function getGroupLabel(
  record
) {
  const group =
    record
      ?.payroll_groups;

  if (!group) {
    return "-";
  }

  const code =
    group
      .payroll_group_code ||
    "";

  const name =
    group
      .payroll_group_name ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

export default function PayrollRunTable({
  dataSource = [],
  loading = false,
  actionLoadingId = null,
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
  onPrepare,
  onProcess,
  onViewItems,
  onChange,
}) {
  const columns = [
    {
      title: "รหัส Run",
      dataIndex:
        "run_code",
      width: 155,
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
      title: "ชื่อ Payroll Run",
      dataIndex:
        "run_name",
      width: 230,
      render:
        (value) =>
          value || "-",
    },
    {
      title: "บริษัท",
      key: "company",
      width: 230,
      render: (
        _,
        record
      ) =>
        getCompanyLabel(
          record
        ),
    },
    {
      title: "งวดเงินเดือน",
      key: "period",
      width: 250,
      render: (
        _,
        record
      ) =>
        getPeriodLabel(
          record
        ),
    },
    {
      title: "กลุ่มเงินเดือน",
      key: "group",
      width: 220,
      render: (
        _,
        record
      ) =>
        getGroupLabel(
          record
        ),
    },
    {
      title: "ประเภท",
      dataIndex:
        "run_type",
      width: 120,
      align: "center",
      render:
        (value) => (
          <Tag>
            {RUN_TYPE_META[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        ),
    },
    {
      title: "พนักงาน",
      dataIndex:
        "employee_count",
      width: 100,
      align: "right",
    },
    {
      title: "คำนวณแล้ว",
      dataIndex:
        "calculated_count",
      width: 105,
      align: "right",
    },
    {
      title: "Error",
      dataIndex:
        "error_count",
      width: 90,
      align: "right",
      render:
        (value) =>
          Number(value || 0) >
          0 ? (
            <Tag color="error">
              {value}
            </Tag>
          ) : (
            value || 0
          ),
    },
    {
      title: "Base Salary รวม",
      dataIndex:
        "base_salary_total",
      width: 150,
      align: "right",
      render:
        money,
    },
    {
      title: "Gross",
      dataIndex:
        "gross_amount",
      width: 140,
      align: "right",
      render:
        money,
    },
    {
      title: "Deduction",
      dataIndex:
        "deduction_amount",
      width: 140,
      align: "right",
      render:
        money,
    },
    {
      title: "Net",
      dataIndex:
        "net_amount",
      width: 140,
      align: "right",
      render:
        (value) => (
          <Text strong>
            {money(value)}
          </Text>
        ),
    },
    {
      title: "Engine",
      dataIndex:
        "calculation_engine",
      width: 150,
      render:
        (value) =>
          value ? (
            <Tag>
              {value}
            </Tag>
          ) : (
            "-"
          ),
    },
    {
      title: "สถานะ",
      dataIndex:
        "status",
      width: 125,
      align: "center",
      render:
        (value) => {
          const meta =
            STATUS_META[
              value
            ] || {
              label:
                value ||
                "-",
              color:
                "default",
            };

          return (
            <Tag
              color={
                meta.color
              }
            >
              {meta.label}
            </Tag>
          );
        },
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 220,
      fixed: "right",
      align: "center",
      render: (
        _,
        record
      ) => {
        const allowEdit =
          typeof canEditRecord ===
          "function"
            ? canEditRecord(
                record
              )
            : canEdit;

        const allowDelete =
          typeof canDeleteRecord ===
          "function"
            ? canDeleteRecord(
                record
              )
            : canDelete;

        const canPrepare =
          allowEdit &&
          record.status ===
            "draft";

        const canProcess =
          allowEdit &&
          record.status ===
            "prepared";

        const canModify =
          allowEdit &&
          record.status ===
            "draft";

        const canRemove =
          allowDelete &&
          record.status ===
            "draft" &&
          !record
            .is_locked;

        const actionLoading =
          actionLoadingId ===
          record.id;

        return (
          <Space size={0}>
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

            <Tooltip title="ดูรายการพนักงาน">
              <Button
                type="text"
                icon={
                  <FileSearchOutlined />
                }
                onClick={() =>
                  onViewItems?.(
                    record
                  )
                }
              />
            </Tooltip>

            {canModify && (
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

            {canPrepare && (
              <Tooltip title="Prepare Employee Snapshot">
                <Button
                  type="text"
                  loading={
                    actionLoading
                  }
                  icon={
                    <ReloadOutlined />
                  }
                  onClick={() =>
                    onPrepare?.(
                      record
                    )
                  }
                />
              </Tooltip>
            )}

            {canProcess && (
              <Tooltip title="ประมวลผล Payroll">
                <Button
                  type="text"
                  loading={
                    actionLoading
                  }
                  icon={
                    <PlayCircleOutlined />
                  }
                  onClick={() =>
                    onProcess?.(
                      record
                    )
                  }
                />
              </Tooltip>
            )}

            {record.status ===
              "processing" && (
              <Tooltip title="กำลังประมวลผล">
                <Button
                  type="text"
                  disabled
                  icon={
                    <CalculatorOutlined />
                  }
                />
              </Tooltip>
            )}

            {canRemove && (
              <DeleteConfirm
                title="ลบ Payroll Run"
                description={`ยืนยันการลบ "${record.run_code} - ${record.run_name}" ใช่หรือไม่`}
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
        title="รายการประมวลผลเงินเดือน"
        columns={columns}
        dataSource={
          dataSource
        }
        loading={
          loading
        }
        page={page}
        pageSize={
          pageSize
        }
        total={
          total
        }
        scroll={{
          x: 2450,
        }}
        onChange={
          onChange
        }
      />
    </div>
  );
}
