"use client";

import { useState } from "react";
import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import {
  swalConfirm,
  swalSuccess,
  swalError,
} from "@/app/components/Swal";

export default function SkillDeleteButton({
  record,
  onSuccess,
}) {

  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    const result = await swalConfirm(
      "ยืนยันการลบ?",
      `ต้องการลบ Skill "${record.skill_name}" ใช่หรือไม่`
    );

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/skills/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "ไม่สามารถลบ Skill ได้"
        );
      }

      await swalSuccess(
        "ลบข้อมูลสำเร็จ",
        json.message || ""
      );

      onSuccess?.();
    } catch (err) {
      console.error("DELETE_SKILL:", err);

      await swalError(
        "เกิดข้อผิดพลาด",
        err.message || "ไม่สามารถลบ Skill ได้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      danger
      type="text"
      icon={<DeleteOutlined />}
      loading={loading}
      disabled={loading}
      onClick={handleDelete}
    />
  );
}