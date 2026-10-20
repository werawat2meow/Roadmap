"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "antd";

import AntIcon from "@/components/AntIcon";

import { SelectContractSignerModal } from "./SelectContractSignerModal";
import type { EmployerSignatureType } from "./types";

export interface ExportEmploymentContractButtonProps {
  id: string;
  ids?: string[];
  buttonText?: string;
  type?: ButtonProps["type"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  autoExport?: boolean;
  saveOnly?: boolean;
  onSaved?: (signerId: string, signatureType: EmployerSignatureType) => void;
  signerId?: string | null;
  employerSignatureType?: EmployerSignatureType | null;
}

export function ExportEmploymentContractButton({
  id,
  ids,
  buttonText = "Export สัญญาจ้าง",
  type = "primary",
  size,
  disabled = false,
  autoExport = false,
  saveOnly = false,
  onSaved,
  signerId,
  employerSignatureType,
}: ExportEmploymentContractButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [exportIds, setExportIds] = useState<string[] | undefined>();

  return (
    <>
      <Button
        type={type}
        size={size}
        disabled={disabled}
        icon={<AntIcon name={saveOnly ? "EditOutlined" : "FilePdfOutlined"} />}
        onClick={() => { setExportIds(ids ? [...ids] : undefined); setModalOpen(true); }}
      >
        {buttonText}
      </Button>

      {modalOpen ? (
        <SelectContractSignerModal
          contractId={id}
          contractIds={exportIds}
          autoExport={autoExport}
          saveOnly={saveOnly}
          onSaved={onSaved}
          signerId={signerId}
          employerSignatureType={employerSignatureType}
          open
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}

export default ExportEmploymentContractButton;
