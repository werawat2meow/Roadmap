"use client";

import { Button } from "antd";
import AntIcon from '@/components/AntIcon';

export default function PrintButton({
  label = "พิมพ์",
  type = "primary",
  size = "middle",
  orientation = "portrait",
  className = "",
}) {
  const handlePrint = () => {
    document.documentElement.setAttribute(
      "data-print-orientation",
      orientation
    );

    window.print();
  };

  return (
    <Button
      type={type}
      size={size}
      icon={<AntIcon name="PrinterOutlined"/>}
      onClick={handlePrint}
      className={`print-button no-print ${className}`}
    >
      {label}
    </Button>
  );
}