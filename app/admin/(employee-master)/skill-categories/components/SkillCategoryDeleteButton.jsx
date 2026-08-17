"use client";

import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import {
  swalConfirm,
  swalSuccess,
  swalError,
} from "@/app/components/Swal";

export default function SkillCategoryDeleteButton({
  record,
  onSuccess,
}) {
  const handleDelete = async () => {
    const result = await swalConfirm(
      "ยืนยันการลบ?",
      `ต้องการลบ "${record.category_name}" ใช่หรือไม่`
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/skill-categories/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "ไม่สามารถลบหมวดหมู่ทักษะได้"
        );
      }

      await swalSuccess(
        "ลบข้อมูลสำเร็จ",
        json.message || ""
      );

      onSuccess?.();

    } catch (err) {
      console.error(
        "DELETE_SKILL_CATEGORY:",
        err
      );

      await swalError(
        "เกิดข้อผิดพลาด",
        err.message ||
          "ไม่สามารถลบหมวดหมู่ทักษะได้"
      );
    }
  };

  return (
    <Button
      danger
      type="text"
      icon={<DeleteOutlined />}
      onClick={handleDelete}
    />
  );
}