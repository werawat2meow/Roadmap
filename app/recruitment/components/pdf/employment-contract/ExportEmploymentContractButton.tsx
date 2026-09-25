"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "antd";

import AntIcon from "@/components/AntIcon";

import { SelectContractSignerModal } from "./SelectContractSignerModal";

export interface ExportEmploymentContractButtonProps {
  id: string;
  buttonText?: string;
  type?: ButtonProps["type"];
  size?: ButtonProps["size"];
  disabled?: boolean;
}

export function ExportEmploymentContractButton({
  id,
  buttonText = "Export สัญญาจ้าง",
  type = "primary",
  size,
  disabled = false,
}: ExportEmploymentContractButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        type={type}
        size={size}
        disabled={disabled}
        icon={<AntIcon name="FilePdfOutlined" />}
        onClick={() => setModalOpen(true)}
      >
        {buttonText}
      </Button>

      {modalOpen ? (
        <SelectContractSignerModal
          contractId={id}
          open
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}

export default ExportEmploymentContractButton;
