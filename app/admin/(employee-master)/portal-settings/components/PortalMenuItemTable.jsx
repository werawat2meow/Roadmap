"use client";

import {
  Button,
  Popconfirm,
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

/* =========================================================
   Helper
========================================================= */

function getMenuTypeTag(
  value
) {
  if (
    value === "group"
  ) {
    return (
      <Tag color="purple">
        Group
      </Tag>
    );
  }

  if (
    value === "action"
  ) {
    return (
      <Tag color="orange">
        Action
      </Tag>
    );
  }

  return (
    <Tag color="blue">
      Link
    </Tag>
  );
}

function getOpenModeTag(
  value
) {
  if (
    value === "external"
  ) {
    return (
      <Tag color="magenta">
        External
      </Tag>
    );
  }

  if (
    value === "hard"
  ) {
    return (
      <Tag color="gold">
        Hard
      </Tag>
    );
  }

  return (
    <Tag>
      Router
    </Tag>
  );
}

/* =========================================================
   Component
========================================================= */

export default function PortalMenuItemTable({
  data = [],

  loading = false,

  onView,

  onEdit,

  onDelete,
}) {
  const columns = [
    {
      title: "ลำดับ",

      dataIndex:
        "sort_order",

      key:
        "sort_order",

      width: 75,

      align: "center",
    },

    {
      title:
        "Menu Code",

      dataIndex:
        "menu_code",

      key:
        "menu_code",

      width: 190,

      render: (value) => (
        <Tag color="blue">
          {value || "-"}
        </Tag>
      ),
    },

    {
      title: "เมนู",

      key: "menu",

      width: 230,

      render: (
        _,
        record
      ) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.menu_name ||
              "-"}
          </div>

          {record.menu_subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {
                record.menu_subtitle
              }
            </div>
          )}
        </div>
      ),
    },

    {
      title: "ระบบ",

      key: "system",

      width: 180,

      render: (
        _,
        record
      ) =>
        record
          .portal_systems
          ?.system_name ||
        record
          .portal_systems
          ?.system_code ||
        "-",
    },

    {
      title: "Group",

      key: "group",

      width: 180,

      render: (
        _,
        record
      ) =>
        record
          .portal_menu_groups
          ?.group_name ||
        "-",
    },

    {
      title: "ประเภท",

      dataIndex:
        "menu_type",

      key:
        "menu_type",

      width: 100,

      align: "center",

      render:
        getMenuTypeTag,
    },

    {
      title: "Route",

      dataIndex:
        "route_path",

      key:
        "route_path",

      width: 230,

      render: (value) => (
        <code className="text-xs text-slate-600">
          {value || "-"}
        </code>
      ),
    },

    {
      title: "Module",

      dataIndex:
        "module_code",

      key:
        "module_code",

      width: 110,

      render: (value) => (
        <code className="text-xs">
          {value || "-"}
        </code>
      ),
    },

    {
      title: "Page",

      dataIndex:
        "page_code",

      key:
        "page_code",

      width: 150,

      render: (value) => (
        <code className="text-xs">
          {value || "-"}
        </code>
      ),
    },

    {
      title: "Permission",

      dataIndex:
        "permission_code",

      key:
        "permission_code",

      width: 230,

      render: (value) => (
        <code className="text-xs text-violet-700">
          {value || "-"}
        </code>
      ),
    },

    {
      title:
        "Open Mode",

      dataIndex:
        "open_mode",

      key:
        "open_mode",

      width: 110,

      align: "center",

      render:
        getOpenModeTag,
    },

    {
      title: "แสดง",

      dataIndex:
        "is_visible",

      key:
        "is_visible",

      width: 90,

      align: "center",

      render: (value) =>
        value ? (
          <Tag color="green">
            แสดง
          </Tag>
        ) : (
          <Tag>
            ซ่อน
          </Tag>
        ),
    },

    {
      title: "สถานะ",

      dataIndex:
        "status",

      key:
        "status",

      width: 100,

      align: "center",

      render: (value) =>
        value ===
        "active" ? (
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

      align: "center",

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

          <Popconfirm
            title="ลบ Menu Item?"
            description={
              record.menu_type ===
              "group"
                ? "ถ้าเมนูนี้มีเมนูย่อย เมนูย่อยจะถูกลบตาม Foreign Key"
                : "ยืนยันการลบเมนูนี้"
            }
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              onDelete?.(
                record
              )
            }
          >
            <Tooltip title="ลบ">
              <Button
                type="text"
                danger
                icon={
                  <DeleteOutlined />
                }
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={false}
        scroll={{
          x: 1900,
        }}
      />
    </div>
  );
}