"use client";

import { Tag } from "antd";
import {
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";

export default function SkillCategoryStatusTag({
  status,
}) {
  if (status === "active") {
    return (
      <Tag
        color="success"
        icon={<CheckCircleOutlined />}
      >
        Active
      </Tag>
    );
  }

  return (
    <Tag
      color="error"
      icon={<StopOutlined />}
    >
      Inactive
    </Tag>
  );
}
