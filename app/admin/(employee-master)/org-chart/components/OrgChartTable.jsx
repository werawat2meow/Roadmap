"use client";

import {
  Table,
  Tag,
  Typography,
} from "antd";

import {
  flattenTree,
  getOrganizationPath,
} from "./orgChartUtils";

const {
  Text,
} = Typography;

export default function OrgChartTable({
  roots = [],
  loading = false,
}) {
  const rows =
    flattenTree(
      roots
    );

  const columns = [
    {
      title: "ลำดับชั้น",
      dataIndex:
        "depth",
      width: 90,
      align: "center",
    },

    {
      title:
        "Position Slot",
      dataIndex:
        "slot_code",
      width: 150,
      fixed: "left",
      render: (
        value,
        record
      ) => (
        <div
          style={{
            paddingLeft:
              Math.min(
                record.depth *
                  14,
                70
              ),
          }}
        >
          <Text
            strong
            code
          >
            {value || "-"}
          </Text>
        </div>
      ),
    },

    {
      title: "ตำแหน่ง",
      key: "position",
      width: 220,
      render: (
        _,
        record
      ) =>
        record.position_name ||
        record.slot_name ||
        "-",
    },

    {
      title: "ระดับ",
      dataIndex:
        "position_level_code",
      width: 100,
      align: "center",
      render: (value) =>
        value
          ? (
              <Tag>
                {value}
              </Tag>
            )
          : "-",
    },

    {
      title:
        "โครงสร้างองค์กร",
      key:
        "organization",
      width: 360,
      render: (
        _,
        record
      ) =>
        getOrganizationPath(
          record
        ) ||
        "-",
    },

    {
      title:
        "ผู้ครองตำแหน่ง",
      key:
        "occupants",
      width: 320,
      render: (
        _,
        record
      ) =>
        record.occupants
          ?.length
          ? record.occupants
              .map(
                (item) =>
                  `${item.employee_code} - ${item.full_name}`
              )
              .join(", ")
          : (
              <Tag color="warning">
                ว่าง
              </Tag>
            ),
    },

    {
      title:
        "Capacity",
      dataIndex:
        "capacity",
      width: 100,
      align: "right",
    },

    {
      title:
        "Filled",
      dataIndex:
        "filled",
      width: 90,
      align: "right",
    },

    {
      title:
        "Vacant",
      dataIndex:
        "vacant",
      width: 90,
      align: "right",
      render: (value) =>
        value > 0
          ? (
              <Tag color="warning">
                {value}
              </Tag>
            )
          : 0,
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
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          pageSize: 50,
          showSizeChanger:
            true,
          pageSizeOptions: [
            20,
            50,
            100,
          ],
          showTotal:
            (total) =>
              `ทั้งหมด ${total} Slot`,
        }}
        scroll={{
          x: 1510,
        }}
      />
    </div>
  );
}
