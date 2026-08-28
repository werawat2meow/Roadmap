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
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

const CATEGORY_LABELS = {
  tax: "ภาษี",
  social_security: "ประกันสังคม",
  provident_fund: "กองทุนสำรองเลี้ยงชีพ",
  loan: "เงินกู้ / เงินยืม",
  absence: "ขาดงาน / ลางาน / มาสาย",
  other: "รายการหักอื่น ๆ",
};

const CALCULATION_LABELS = {
  fixed: "จำนวนคงที่",
  variable: "จำนวนเปลี่ยนแปลง",
  formula: "สูตรคำนวณ",
};

function getCompanyLabel(record) {
  const company = record?.companies;

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

export default function DeductionTypeTable({
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
      title: "รหัส",
      dataIndex: "deduction_code",
      width: 130,
      fixed: "left",
      render: (value) => (
        <Text strong>
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "ชื่อประเภทรายการหัก",
      dataIndex: "deduction_name",
      width: 220,
      render: (value) =>
        value || "-",
    },
    {
      title: "บริษัท",
      key: "company",
      width: 250,
      render: (_, record) =>
        getCompanyLabel(record),
    },
    {
      title: "หมวด",
      dataIndex: "deduction_category",
      width: 180,
      render: (value) => (
        <Tag>
          {CATEGORY_LABELS[value] ||
            value ||
            "-"}
        </Tag>
      ),
    },
    {
      title: "วิธีคำนวณ",
      dataIndex: "calculation_method",
      width: 150,
      render: (value) =>
        CALCULATION_LABELS[value] ||
        value ||
        "-",
    },
    {
      title: "จำนวนเริ่มต้น",
      dataIndex: "default_amount",
      width: 140,
      align: "right",
      render: (value) =>
        value === null ||
        value === undefined
          ? "-"
          : Number(value).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            ),
    },
    {
      title: "ตามกฎหมาย",
      dataIndex: "is_statutory",
      width: 110,
      align: "center",
      render: (value) => (
        <Tag>
          {value
            ? "ใช่"
            : "ไม่ใช่"}
        </Tag>
      ),
    },
    {
      title: "ลดฐานภาษี",
      dataIndex:
        "reduce_taxable_income",
      width: 110,
      align: "center",
      render: (value) => (
        <Tag>
          {value
            ? "ใช่"
            : "ไม่ใช่"}
        </Tag>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 110,
      align: "center",
      render: (value) => (
        <StatusTag
          status={value}
        />
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 130,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={
                <EyeOutlined />
              }
              onClick={() =>
                onView?.(record)
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
                  onEdit?.(record)
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <DeleteConfirm
                title="ลบประเภทรายการหัก"
                description={`ยืนยันการลบ "${record.deduction_code} - ${record.deduction_name}" ใช่หรือไม่`}
                loading={
                  deletingId ===
                  record.id
                }
                onConfirm={() =>
                  onDelete?.(record)
                }
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MasterTable
      rowKey="id"
      title="รายการประเภทรายการหัก"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      scroll={{
        x: 1550,
      }}
      onChange={onChange}
    />
  );
}
