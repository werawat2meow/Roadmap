"use client";

import { Table, Tag, Button, Space } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import {
  swalConfirm,
  swalSuccess,
  swalError,
} from "@/app/components/Swal";

export default function CompetencyTable({
  loading,
  data,
  canEdit,
  canDelete,
  onEdit,
  onDeleteSuccess,
}) {
  const handleDelete = async (record) => {
    const confirm = await swalConfirm(
      "ยืนยันการลบ",
      `ต้องการลบ "${record.competency_name}" ใช่หรือไม่`
    );

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `/api/admin/competencies/${record.id}`,
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

      await swalSuccess("ลบข้อมูลสำเร็จ");

      onDeleteSuccess?.();

    } catch (err) {
      console.error(err);

      swalError(
        err.message || "ลบข้อมูลไม่สำเร็จ"
      );
    }
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "competency_code",
      width: 150,
    },
    {
      title: "Competency Name",
      dataIndex: "competency_name",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "competency_type",
      width: 180,
      render: (value) =>
        value ? (
          <Tag color="blue">{value}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (value) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "green"
              : "red"
          }
        >
          {value?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "Action",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() =>
                onEdit(record)
              }
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
        x: 1100,
      }}
    />
  );
}