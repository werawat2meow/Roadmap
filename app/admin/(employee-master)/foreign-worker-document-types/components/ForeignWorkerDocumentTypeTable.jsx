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
  passport:
    "Passport",
  visa:
    "Visa",
  work_permit:
    "Work Permit",
  mou:
    "MOU",
  identity:
    "เอกสารประจำตัว",
  medical:
    "การแพทย์",
  insurance:
    "ประกัน",
  employment:
    "การจ้างงาน",
  government:
    "หน่วยงานรัฐ",
  other:
    "อื่น ๆ",
};

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

export default function ForeignWorkerDocumentTypeTable({
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
        "document_code",
      key:
        "document_code",
      width: 130,
    },
    {
      title: "ประเภทเอกสาร",
      key: "name",
      width: 260,
      render: (
        _,
        record
      ) => (
        <div>
          <div className="font-medium">
            {record.document_name_th ||
              "-"}
          </div>

          {record.document_name_en ? (
            <div className="text-xs text-gray-500">
              {
                record.document_name_en
              }
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "หมวด",
      dataIndex:
        "document_category",
      key:
        "document_category",
      width: 130,
      render: (value) => (
        <Tag>
          {CATEGORY_LABELS[
            value
          ] || value}
        </Tag>
      ),
    },
    {
      title: "เลขเอกสาร",
      dataIndex:
        "requires_document_no",
      key:
        "requires_document_no",
      width: 100,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="blue">
            ต้องมี
          </Tag>
        ) : (
          <Tag>
            ไม่บังคับ
          </Tag>
        ),
    },
    {
      title: "วันหมดอายุ",
      dataIndex:
        "requires_expiry_date",
      key:
        "requires_expiry_date",
      width: 110,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="orange">
            ต้องมี
          </Tag>
        ) : (
          <Tag>
            ไม่บังคับ
          </Tag>
        ),
    },
    {
      title: "บังคับ",
      dataIndex:
        "is_mandatory",
      key:
        "is_mandatory",
      width: 90,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="red">
            บังคับ
          </Tag>
        ) : (
          <Tag>
            ไม่บังคับ
          </Tag>
        ),
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
          x: 1350,
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
