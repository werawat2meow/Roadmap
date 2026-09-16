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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle:
        "medium",
    }
  ).format(date);
}

export default function VisaTypeTable({
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
      render: (
        _,
        record
      ) => {
        const company =
          record.companies;

        if (!company) {
          return "-";
        }

        return `${
          company.company_code ||
          "-"
        } - ${
          company.company_name_th ||
          company.company_name_en ||
          "-"
        }`;
      },
    },
    {
      title: "รหัส",
      dataIndex:
        "visa_code",
      key:
        "visa_code",
      width: 130,
    },
    {
      title: "ประเภทวีซ่า",
      key: "name",
      width: 260,
      render: (
        _,
        record
      ) => (
        <div>
          <div className="font-medium">
            {record.visa_name_th ||
              "-"}
          </div>

          {record.visa_name_en ? (
            <div className="text-xs text-gray-500">
              {
                record.visa_name_en
              }
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "ทำงาน",
      dataIndex:
        "allows_work",
      key:
        "allows_work",
      width: 100,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="blue">
            รองรับ
          </Tag>
        ) : (
          <Tag>
            ไม่รองรับ
          </Tag>
        ),
    },
    {
      title: "Work Permit",
      dataIndex:
        "requires_work_permit",
      key:
        "requires_work_permit",
      width: 120,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="orange">
            ต้องมี
          </Tag>
        ) : (
          <Tag color="green">
            ไม่บังคับ
          </Tag>
        ),
    },
    {
      title: "ต่ออายุ",
      dataIndex:
        "is_extendable",
      key:
        "is_extendable",
      width: 95,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="green">
            ได้
          </Tag>
        ) : (
          <Tag>
            ไม่ได้
          </Tag>
        ),
    },
    {
      title: "อายุเริ่มต้น",
      dataIndex:
        "default_validity_days",
      key:
        "default_validity_days",
      width: 110,
      align: "right",
      render: (value) =>
        value
          ? `${value} วัน`
          : "-",
    },
    {
      title: "เริ่มมีผล",
      dataIndex:
        "effective_date",
      key:
        "effective_date",
      width: 120,
      render:
        formatDate,
    },
    {
      title: "สถานะ",
      dataIndex:
        "status",
      key:
        "status",
      width: 100,
      render: (value) =>
        value === "active" ? (
          <Tag color="green">
            ใช้งาน
          </Tag>
        ) : (
          <Tag>
            ไม่ใช้งาน
          </Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (
        _,
        record
      ) => (
        <Space size={4}>
          <Tooltip title="ดู">
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

          {canEdit ? (
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
                icon={
                  <DeleteOutlined />
                }
                onClick={() =>
                  onDelete?.(
                    record
                  )
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
        scroll={{
          x: 1250,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger:
            true,
          pageSizeOptions: [
            10,
            20,
            50,
            100,
          ],
          showTotal: (
            value
          ) =>
            `ทั้งหมด ${value} รายการ`,
        }}
        onChange={
          onChange
        }
      />
    </Card>
  );
}
