"use client";

import {
  Button,
  Space,
  Tooltip,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

export default function NationalityTable({
  data = [],

  loading = false,

  page = 1,

  pageSize = 20,

  total = 0,

  onChange,

  onView,

  onEdit,

  onDelete,
}) {

  const columns = [

    {
      title: "#",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize +
        index +
        1,
    },

    {
      title: "Code",
      dataIndex: "nationality_code",
      width: 150,
    },

    {
      title: "สัญชาติ",
      width: 280,
      render: (_, record) => (
        <div>

          <div
            style={{
              fontWeight: 600,
            }}
          >
            {record.nationality_name_th}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record.nationality_name_en}
          </div>

        </div>
      ),
    },

    {
      title: "ประเทศ",
      width: 260,
      render: (_, record) => (
        <div>

          <div>
            {record.countries
              ?.flag_emoji}{" "}

            {record.countries
              ?.country_name_th || "-"}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record.countries
              ?.country_name_en || "-"}
          </div>

        </div>
      ),
    },

    {
      title: "ISO2",
      dataIndex: "iso2",
      width: 90,
      align: "center",
      render: value =>
        value || "-",
    },

    {
      title: "ISO3",
      dataIndex: "iso3",
      width: 90,
      align: "center",
      render: value =>
        value || "-",
    },
        {
      title: "Default",
      dataIndex: "is_default",
      width: 110,
      align: "center",
      render: value =>
        value
          ? "⭐"
          : "-",
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: value => (
        <StatusTag
          value={value}
        />
      ),
    },

    {
      title: "จัดการ",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",

      render: (_, record) => (
        <Space size={4}>

          <Tooltip title="ดูข้อมูล">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                onView?.(record)
              }
            />
          </Tooltip>

          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() =>
                onEdit?.(record)
              }
            />
          </Tooltip>

          <DeleteConfirm
            title="ลบสัญชาติ"
            description={`ต้องการลบ "${record.nationality_name_th}" ใช่หรือไม่`}
            onConfirm={() =>
              onDelete?.(record)
            }
          />

        </Space>
      ),
    },

  ];

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
        x: 1400,
      }}
    />
  );
}