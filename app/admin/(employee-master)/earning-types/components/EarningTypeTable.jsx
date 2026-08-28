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
  salary: "เงินเดือน",
  overtime: "ค่าล่วงเวลา",
  allowance: "เบี้ยเลี้ยง / ค่าตอบแทน",
  bonus: "โบนัส",
  commission: "ค่าคอมมิชชั่น",
  other: "อื่น ๆ",
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

export default function EarningTypeTable({
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
      dataIndex: "earning_code",
      width: 130,
      fixed: "left",
      render: (value) => (
        <Text strong>
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "ชื่อประเภทเงินได้",
      dataIndex: "earning_name",
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
      dataIndex: "earning_category",
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
      title: "ภาษี",
      dataIndex: "taxable",
      width: 90,
      align: "center",
      render: (value) => (
        <Tag>
          {value
            ? "คิด"
            : "ไม่คิด"}
        </Tag>
      ),
    },
    {
      title: "ประกันสังคม",
      dataIndex:
        "social_security_applicable",
      width: 120,
      align: "center",
      render: (value) => (
        <Tag>
          {value
            ? "คิด"
            : "ไม่คิด"}
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
                title="ลบประเภทเงินได้"
                description={`ยืนยันการลบ "${record.earning_code} - ${record.earning_name}" ใช่หรือไม่`}
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
     <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <MasterTable
        rowKey="id"
        title="รายการประเภทเงินได้"
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
    </div>
  );
}
