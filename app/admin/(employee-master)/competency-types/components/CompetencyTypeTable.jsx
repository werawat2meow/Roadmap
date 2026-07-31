"use client";

import {
  Table,
  Tag,
  Button,
  Space,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  swalConfirm,
  swalSuccess,
  swalError,
} from "@/app/components/Swal";

export default function CompetencyTypeTable({
  loading,
  data,
  canEdit,
  canDelete,
  onEdit,
  onDeleteSuccess,
}) {
  const handleDelete = async (record) => {
    const confirmed = await swalConfirm(
      "ยืนยันการลบ",
      `ต้องการลบ "${record.type_name}" ใช่หรือไม่`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/competency-types/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "ลบข้อมูลไม่สำเร็จ"
        );
      }

      await swalSuccess(
        "ลบ Competency Type สำเร็จ"
      );

      onDeleteSuccess?.();

    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "ลบข้อมูลไม่สำเร็จ"
      );
    }
  };

  const columns = [
    {
      title: "Type Code",
      dataIndex: "type_code",
      key: "type_code",
      width: 150,
    },
    {
      title: "Type Name",
      dataIndex: "type_name",
      key: "type_name",
      width: 220,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : "red"
          }
        >
          {status === "active"
            ? "Active"
            : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "จัดการ",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          )}

          {canDelete && (
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={() =>
                handleDelete(record)
              }
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{
        x: 1000,
      }}
    />
  );
}