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

export default function GenderTable({
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
      dataIndex: "gender_code",
      width: 140,
    },

    {
      title: "เพศ",
      width: 260,
      render: (_, record) => (
        <div>

          <div
            style={{
              fontWeight: 600,
            }}
          >
            {record.gender_name_th}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record.gender_name_en}
          </div>

        </div>
      ),
    },

    {
      title: "ชื่อย่อ",
      width: 180,
      render: (_, record) => (
        <div>

          <div>
            {record.short_name_th ||
              "-"}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record.short_name_en ||
              "-"}
          </div>

        </div>
      ),
    },

    {
      title: "รายละเอียด",
      dataIndex: "description",
      width: 260,
      ellipsis: true,
      render: value =>
        value || "-",
    },
        {
      title: "Default",
      dataIndex: "is_default",
      width: 100,
      align: "center",
      render: value =>
        value ? (
          <Tag color="gold">
            Default
          </Tag>
        ) : (
          "-"
        ),
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
            title="ลบข้อมูลเพศ"
            description={`ต้องการลบ "${record.gender_name_th}" ใช่หรือไม่`}
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