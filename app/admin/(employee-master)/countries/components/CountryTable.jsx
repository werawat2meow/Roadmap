"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

export default function CountryTable({
  data = [],
  loading = false,

  page = 1,
  pageSize = 20,
  total = 0,

  // =========================================================
  // Permissions
  // =========================================================
  canView = false,
  canEdit = false,
  canDelete = false,

  // =========================================================
  // Events
  // =========================================================
  onChange,
  onView,
  onEdit,
  onDelete,
}) {
  // =========================================================
  // Base Columns
  // =========================================================
  const columns = [
    {
      title: "#",
      key: "no",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize +
        index +
        1,
    },

    {
      title: "Country Code",
      dataIndex: "country_code",
      key: "country_code",
      width: 120,
      render: (value) => value || "-",
    },

    {
      title: "ISO2",
      dataIndex: "iso2",
      key: "iso2",
      width: 90,
      align: "center",
      render: (value) => value || "-",
    },

    {
      title: "ISO3",
      dataIndex: "iso3",
      key: "iso3",
      width: 90,
      align: "center",
      render: (value) => value || "-",
    },

    {
      title: "ประเทศ",
      dataIndex: "country_name_th",
      key: "country_name_th",
      width: 260,

      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: 600,
            }}
          >
            {record?.flag_emoji || ""}{" "}
            {record?.country_name_th || "-"}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record?.country_name_en || "-"}
          </div>
        </div>
      ),
    },

    {
      title: "สัญชาติ",
      key: "nationality",
      width: 180,

      render: (_, record) => (
        <div>
          <div>
            {record?.nationality_th || "-"}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record?.nationality_en || "-"}
          </div>
        </div>
      ),
    },

    {
      title: "Dial",
      dataIndex: "dialing_code",
      key: "dialing_code",
      width: 90,
      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "Currency",
      dataIndex: "currency_code",
      key: "currency_code",
      width: 100,
      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "Timezone",
      dataIndex: "timezone",
      key: "timezone",
      width: 180,

      render: (value) =>
        value || "-",
    },

    {
      title: "Default",
      dataIndex: "is_default",
      key: "is_default",
      width: 100,
      align: "center",

      render: (value) =>
        value ? (
          <Tag color="gold">
            Default
          </Tag>
        ) : (
          "-"
        ),
    },

    {
      title: "Thailand",
      dataIndex: "is_thailand",
      key: "is_thailand",
      width: 100,
      align: "center",

      render: (value) =>
        value ? (
          <Tag color="blue">
            Thailand
          </Tag>
        ) : (
          "-"
        ),
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",

      render: (value) => (
        <StatusTag value={value} />
      ),
    },
  ];

  // =========================================================
  // Action Column
  // =========================================================
  const hasActionPermission =
    canView ||
    canEdit ||
    canDelete;

  if (hasActionPermission) {
    columns.push({
      title: "จัดการ",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",

      render: (_, record) => (
        <Space size={4}>
          {/* ================================================
              VIEW
          ================================================= */}
          {canView && (
            <Tooltip title="ดูข้อมูล">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => {
                  onView?.(record);
                }}
              />
            </Tooltip>
          )}

          {/* ================================================
              EDIT
          ================================================= */}
          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  onEdit?.(record);
                }}
              />
            </Tooltip>
          )}

          {/* ================================================
              DELETE
          ================================================= */}
          {canDelete && (
            <DeleteConfirm
              title="ลบประเทศ"
              description={`ต้องการลบ "${
                record?.country_name_th || "-"
              }" ใช่หรือไม่`}
              onConfirm={() => {
                onDelete?.(record);
              }}
            />
          )}
        </Space>
      ),
    });
  }

  // =========================================================
  // Render
  // =========================================================
  return (
    <MasterTable
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      page={page}
      pageSize={pageSize}
      total={total}
      onChange={onChange}
      scroll={{
        x: 1800,
      }}
    />
  );
}