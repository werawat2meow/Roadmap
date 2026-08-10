// components/common/PageInfoAlert.jsx
import { Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export default function PageInfoAlert({ description, type = "info" }) {
  return (
    <Alert
      className="mt-4 rounded-2xl"
      type={type}
      showIcon
      icon={<InfoCircleOutlined />}
      closable
      title="เกี่ยวกับหน้านี้"
      description={description}
    />
  );
}