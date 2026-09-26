"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Modal,
  Select,
  message,
  type FormInstance,
  type SelectProps,
} from "antd";

import type { ContractSigner } from "@/app/recruitment/lib/contracts";
import {
  DEFAULT_EMPLOYER_SIGNATURE_TYPE,
  EMPLOYER_SIGNATURE_TYPE_LABELS,
  type EmployerSignatureType,
} from "./types";

interface ContractSignerFormValues {
  signerId?: string;
  employerSignatureType?: EmployerSignatureType;
}

interface SelectContractSignerModalProps {
  contractId: string;
  open: boolean;
  onClose: () => void;
}

interface SignerOption {
  value: string;
  label: string;
  searchText: string;
}

interface ApiErrorBody {
  message?: string;
}

const employerSignatureTypeOptions = Object.entries(
  EMPLOYER_SIGNATURE_TYPE_LABELS,
).map(([value, label]) => ({
  value: value as EmployerSignatureType,
  label,
}));

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return Boolean(value) && typeof value === "object" && "message" in value;
}

function isFormValidationError(
  value: unknown,
): value is { errorFields: unknown[] } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    "errorFields" in value &&
    Array.isArray((value as { errorFields?: unknown }).errorFields)
  );
}

async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isApiErrorBody(body) && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // A non-JSON error response uses the safe fallback below.
  }

  return fallback;
}

function getSignerLabel(signer: ContractSigner): string {
  const name = signer.nameTH || signer.nameEN || signer.id;
  const position = signer.positionTH || signer.positionEN;
  return position ? `${name} — ${position}` : name;
}

function sanitizeDownloadedFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop()?.trim();
  return basename || "employment-contract.pdf";
}

function getDownloadFilename(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;

  const encodedMatch = contentDisposition.match(
    /filename\*\s*=\s*UTF-8''([^;]+)/i,
  );
  if (encodedMatch?.[1]) {
    try {
      return sanitizeDownloadedFilename(decodeURIComponent(encodedMatch[1].trim()));
    } catch {
      // Continue to the plain filename when RFC 5987 decoding fails.
    }
  }

  const plainMatch = contentDisposition.match(
    /filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i,
  );
  const plainFilename = plainMatch?.[1] ?? plainMatch?.[2];
  return plainFilename ? sanitizeDownloadedFilename(plainFilename) : fallback;
}

function triggerBrowserDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function loadContractSigners(
  contractId: string,
  signal: AbortSignal,
): Promise<ContractSigner[]> {
  const response = await fetch(
    `/recruitment/api/contracts/${encodeURIComponent(contractId)}/signers`,
    { cache: "no-store", signal },
  );

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "ไม่สามารถโหลดรายชื่อผู้ลงนามได้"),
    );
  }

  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("data" in body)) return [];

  const data = (body as { data?: unknown }).data;
  return Array.isArray(data) ? (data as ContractSigner[]) : [];
}

export function SelectContractSignerModal({
  contractId,
  open,
  onClose,
}: SelectContractSignerModalProps) {
  const [form]: [FormInstance<ContractSignerFormValues>] =
    Form.useForm<ContractSignerFormValues>();
  const [loadingSigners, setLoadingSigners] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [signers, setSigners] = useState<ContractSigner[]>([]);
  const [selectedSignerId, setSelectedSignerId] = useState<string>();
  const [selectedEmployerSignatureType, setSelectedEmployerSignatureType] =
    useState<EmployerSignatureType>(DEFAULT_EMPLOYER_SIGNATURE_TYPE);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();

    void loadContractSigners(contractId, controller.signal)
      .then(setSigners)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const errorMessage =
          error instanceof Error
            ? error.message
            : "ไม่สามารถโหลดรายชื่อผู้ลงนามได้";
        setLoadError(errorMessage);
        message.error(errorMessage);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSigners(false);
      });

    return () => controller.abort();
  }, [contractId, open]);

  const signerOptions = useMemo<SignerOption[]>(
    () =>
      signers.map((signer) => ({
        value: signer.id,
        label: getSignerLabel(signer),
        searchText: [
          signer.nameTH,
          signer.nameEN,
          signer.positionTH,
          signer.positionEN,
        ]
          .filter((value): value is string => Boolean(value?.trim()))
          .join(" ")
          .toLocaleLowerCase(),
      })),
    [signers],
  );

  const handleCancel = () => {
    if (exporting) return;
    form.resetFields();
    setSelectedSignerId(undefined);
    setSelectedEmployerSignatureType(DEFAULT_EMPLOYER_SIGNATURE_TYPE);
    onClose();
  };

  const handleConfirmExport = async () => {
    let objectUrl: string | undefined;

    try {
      const values = await form.validateFields();
      if (!values.signerId || !values.employerSignatureType) return;

      setExporting(true);
      const response = await fetch(
        `/recruitment/api/contracts/${encodeURIComponent(contractId)}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signerId: values.signerId,
            employerSignatureType: values.employerSignatureType,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "ไม่สามารถ Export สัญญาจ้างได้",
          ),
        );
      }

      const blob = await response.blob();
      objectUrl = window.URL.createObjectURL(blob);
      const filename = getDownloadFilename(
        response.headers.get("Content-Disposition"),
        `employment-contract-${sanitizeDownloadedFilename(contractId)}.pdf`,
      );
      triggerBrowserDownload(objectUrl, filename);

      message.success("Export สัญญาจ้างสำเร็จ");
      form.resetFields();
      setSelectedSignerId(undefined);
      setSelectedEmployerSignatureType(DEFAULT_EMPLOYER_SIGNATURE_TYPE);
      onClose();
    } catch (error: unknown) {
      if (isFormValidationError(error)) return;

      message.error(
        error instanceof Error
          ? error.message
          : "ไม่สามารถ Export สัญญาจ้างได้",
      );
    } finally {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
      setExporting(false);
    }
  };

  const filterSignerOption: NonNullable<SelectProps["filterOption"]> = (
    input,
    option,
  ) =>
    String(option?.searchText ?? "")
      .toLocaleLowerCase()
      .includes(input.trim().toLocaleLowerCase());

  const noSigners = !loadingSigners && !loadError && signers.length === 0;

  return (
    <Modal
      title="Export สัญญาจ้าง"
      open={open}
      onCancel={handleCancel}
      closable={!exporting}
      mask={{ closable: !exporting }}
      keyboard={!exporting}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={exporting}>
          ยกเลิก
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={exporting}
          disabled={
            loadingSigners ||
            exporting ||
            signers.length === 0 ||
            !selectedSignerId ||
            !selectedEmployerSignatureType
          }
          onClick={() => void handleConfirmExport()}
        >
          ยืนยันการ Export
        </Button>,
      ]}
    >
      <Form<ContractSignerFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          employerSignatureType: DEFAULT_EMPLOYER_SIGNATURE_TYPE,
        }}
        onValuesChange={(_, values) => {
          setSelectedSignerId(values.signerId);
          setSelectedEmployerSignatureType(
            values.employerSignatureType ?? DEFAULT_EMPLOYER_SIGNATURE_TYPE,
          );
        }}
      >
        <Form.Item
          label="ผู้ลงนาม"
          name="signerId"
          rules={[{ required: true, message: "กรุณาเลือกผู้ลงนาม" }]}
        >
          <Select
            loading={loadingSigners}
            disabled={loadingSigners || exporting || signers.length === 0}
            placeholder="เลือกผู้ลงนาม"
            showSearch
            allowClear
            options={signerOptions}
            filterOption={filterSignerOption}
            notFoundContent={loadingSigners ? "กำลังโหลด..." : "ไม่พบผู้ลงนาม"}
          />
        </Form.Item>

        <Form.Item
          label="ประเภทผู้ลงนาม"
          name="employerSignatureType"
          rules={[{ required: true, message: "กรุณาเลือกประเภทผู้ลงนาม" }]}
        >
          <Select
            disabled={exporting}
            placeholder="เลือกประเภทผู้ลงนาม"
            options={employerSignatureTypeOptions}
          />
        </Form.Item>

        {loadError ? (
          <Alert type="error" showIcon message={loadError} />
        ) : null}

        {noSigners ? (
          <Alert
            type="warning"
            showIcon
            message="ไม่พบผู้มีสิทธิ์ลงนามในสัญญาจ้าง"
          />
        ) : null}
      </Form>
    </Modal>
  );
}
