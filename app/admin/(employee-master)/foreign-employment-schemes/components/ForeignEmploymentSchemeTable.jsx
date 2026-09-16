"use client";

import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const CATEGORY_LABELS = {
  mou: "MOU",
  direct_hire: "Direct Hire",
  expat: "Expat",
  boi: "BOI",
  contractor: "Contractor",
  other: "Other",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle: "medium",
    }
  ).format(date);
}

export default function ForeignEmploymentSchemeTable({
  data = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  canEdit = false,
  canDelete = false,
  deletingId = null,
  onChange,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "บริษัท",
      key: "company",
      width: 190,
      render: (_, record) => {
        const company = record.companies;

        if (!company) {
          return "-";
        }

        return `${
          company.company_code || "-"
        } - ${
          company.company_name_th ||
          company.company_name_en ||
          "-"
        }`;
      },
    },
    {
      title: "รหัส",
      dataIndex: "scheme_code",
      key: "scheme_code",
      width: 140,
    },
    {
      title: "รูปแบบการจ้าง",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.scheme_name_th || "-"}
          </div>
          {record.scheme_name_en ? (
            <div className="text-xs text-gray-500">
              {record.scheme_name_en}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "ประเภท",
      dataIndex: "scheme_category",
      key: "scheme_category",
      width: 120,
      render: (value) => (
        <Tag>
          {CATEGORY_LABELS[value] ||
            value ||
            "-"}
        </Tag>
      ),
    },
    {
      title: "Visa",
      dataIndex: "requires_visa",
      key: "requires_visa",
      width: 80,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="blue">ต้องมี</Tag>
        ) : (
          <Tag>ไม่บังคับ</Tag>
        ),
    },
    {
      title: "Work Permit",
      dataIndex: "requires_work_permit",
      key: "requires_work_permit",
      width: 115,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="blue">ต้องมี</Tag>
        ) : (
          <Tag>ไม่บังคับ</Tag>
        ),
    },
    {
      title: "เริ่มมีผล",
      dataIndex: "effective_date",
      key: "effective_date",
      width: 120,
      render: formatDate,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (value) =>
        value === "active" ? (
          <Tag color="green">ใช้งาน</Tag>
        ) : (
          <Tag>ไม่ใช้งาน</Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="ดู">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                onView?.(record)
              }
            />
          </Tooltip>

          {canEdit ? (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit?.(record)
                }
              />
            </Tooltip>
          ) : null}

          {canDelete ? (
            <Tooltip title="ลบ">
              <Button
                type="text"
                danger
                loading={
                  deletingId ===
                  record.id
                }
                icon={<DeleteOutlined />}
                onClick={() =>
                  onDelete?.(record)
                }
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Card size="small">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [
            10,
            20,
            50,
            100,
          ],
          showTotal: (value) =>
            `ทั้งหมด ${value} รายการ`,
        }}
        onChange={onChange}
      />
    </Card>
  );
}
