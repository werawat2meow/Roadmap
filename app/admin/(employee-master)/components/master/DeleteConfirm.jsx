"use client";

import {
  Button,
  Popconfirm,
} from "antd";

import {
  DeleteOutlined,
} from "@ant-design/icons";

export default function DeleteConfirm({
  title = "ลบข้อมูล",

  description = "ยืนยันการลบข้อมูลใช่หรือไม่",

  loading = false,

  danger = true,

  onConfirm,
}) {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText="ลบ"
      cancelText="ยกเลิก"
      onConfirm={onConfirm}
      okButtonProps={{
        danger,
        loading,
      }}
    >
      <Button
        danger={danger}
        type="text"
        icon={<DeleteOutlined />}
      />
    </Popconfirm>
  );
}