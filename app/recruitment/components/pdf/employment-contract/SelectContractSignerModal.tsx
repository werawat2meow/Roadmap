"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
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
import { automaticContractExportValues } from "@/app/recruitment/lib/contracts/autoExport.mjs";
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
  contractIds?: string[];
  autoExport?: boolean;
  saveOnly?: boolean;
  onSaved?: (signerId: string, signatureType: EmployerSignatureType) => void;
  signerId?: string | null;
  employerSignatureType?: EmployerSignatureType | null;
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
  results?: { application_id: string; success: boolean; message?: string }[];
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
      const details = body.results?.filter(item => !item.success).map(item => `${item.application_id}: ${item.message || 'ไม่สำเร็จ'}`).join('\n');
      return details ? `${body.message}\n${details}` : body.message;
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
  contractIds,
  autoExport = false,
  saveOnly = false,
  onSaved,
  signerId,
  employerSignatureType,
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
  const [exportReport, setExportReport] = useState<string>();
  const exportLock = useRef(false);
  const automaticExportStarted = useRef(false);
  const idsKey = JSON.stringify(contractIds?.length ? contractIds : [contractId]);

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();

    // Load the first accessible application's choices. The server independently
    // checks the selected signer for EVERY application during export.
    const loadChoices = async () => {
      const failures: string[] = [];
      for (const id of JSON.parse(idsKey) as string[]) {
        try { return await loadContractSigners(id, controller.signal); }
        catch (error) {
          if (controller.signal.aborted) throw error;
          failures.push(`${id}: ${error instanceof Error ? error.message : 'โหลดผู้ลงนามไม่สำเร็จ'}`);
        }
      }
      throw new Error(failures.join('\n'));
    };
    void loadChoices()
      .then((choices) => {
        if (controller.signal.aborted) return;
        setSigners(choices);
        const initial = automaticContractExportValues(choices, { signerId, employerSignatureType });
        const selected = choices.some(choice => choice.id === signerId) ? signerId ?? undefined : undefined;
        const signature = initial?.employerSignatureType ?? DEFAULT_EMPLOYER_SIGNATURE_TYPE;
        form.setFieldsValue({ signerId: selected, employerSignatureType: signature });
        setSelectedSignerId(selected);
        setSelectedEmployerSignatureType(signature);
      })
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
  }, [idsKey, open, signerId, employerSignatureType, form]);

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

  const exportWithValues = useCallback(async (values: ContractSignerFormValues) => {
    if (exportLock.current) return;
    exportLock.current = true;
    let objectUrl: string | undefined;

    try {
      if (!values.signerId || !values.employerSignatureType) return;

      setExporting(true);
      setExportReport(undefined);
      const response = await fetch(
        contractIds ? '/recruitment/api/contracts/export' : `/recruitment/api/contracts/${encodeURIComponent(contractId)}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signerId: values.signerId,
            employerSignatureType: values.employerSignatureType,
            ...(contractIds ? { applicationIds: contractIds } : {}),
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
      let partialReport: string | undefined;
      if (response.headers.get('Content-Type')?.includes('application/zip')) {
        const archive = await JSZip.loadAsync(await blob.arrayBuffer());
        const manifest = archive.file('export-results.json');
        if (!manifest) throw new Error('ZIP ไม่มีรายงานผลการส่งออก กรุณาลองใหม่');
        const report = JSON.parse(await manifest.async('string')) as { succeeded: number; failed: number; results: { application_id: string; success: boolean; message?: string }[] };
        const pdfCount = Object.keys(archive.files).filter(name => name.endsWith('.pdf')).length;
        if (pdfCount !== report.succeeded) throw new Error('จำนวน PDF ไม่ตรงกับรายงานผล กรุณาลองใหม่');
        if (report.failed) partialReport = `สำเร็จ ${report.succeeded} คน / ไม่สำเร็จ ${report.failed} คน\n` + report.results.filter(item => !item.success).map(item => `${item.application_id}: ${item.message || 'ไม่สำเร็จ'}`).join('\n');
      }
      objectUrl = window.URL.createObjectURL(blob);
      const filename = getDownloadFilename(
        response.headers.get("Content-Disposition"),
        `employment-contract-${sanitizeDownloadedFilename(contractId)}.pdf`,
      );
      triggerBrowserDownload(objectUrl, filename);

      if (partialReport) {
        setExportReport(partialReport);
        message.warning('ดาวน์โหลด ZIP แล้ว มีบางรายการไม่สำเร็จ โปรดตรวจรายงานด้านล่าง');
        return;
      }

      onSaved?.(values.signerId, values.employerSignatureType);
      message.success("Export สัญญาจ้างสำเร็จ");
      form.resetFields();
      setSelectedSignerId(undefined);
      setSelectedEmployerSignatureType(DEFAULT_EMPLOYER_SIGNATURE_TYPE);
      onClose();
    } catch (error: unknown) {
      if (isFormValidationError(error)) return;

      const failureMessage = error instanceof Error
          ? error.message
          : "ไม่สามารถ Export สัญญาจ้างได้";
      setExportReport(failureMessage);
      message.error(failureMessage);
    } finally {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
      setExporting(false);
      exportLock.current = false;
    }
  }, [contractId, contractIds, form, onClose, onSaved]);

  const handleSaveSigner = async () => {
    if (exportLock.current) return;
    exportLock.current = true;
    try {
      const values = await form.validateFields();
      if (!values.signerId || !values.employerSignatureType) return;
      setExporting(true);
      setExportReport(undefined);
      const response = await fetch(`/recruitment/api/contracts/${encodeURIComponent(contractId)}/signers`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "บันทึกผู้ลงนามไม่สำเร็จ"));
      onSaved?.(values.signerId, values.employerSignatureType);
      message.success("อัปเดตผู้ลงนามเรียบร้อยแล้ว");
      onClose();
    } catch (error) {
      if (!isFormValidationError(error)) {
        const text = error instanceof Error ? error.message : "บันทึกผู้ลงนามไม่สำเร็จ";
        setExportReport(text);
        message.error(text);
      }
    } finally {
      setExporting(false);
      exportLock.current = false;
    }
  };

  const handleConfirmExport = async () => {
    try {
      await exportWithValues(await form.validateFields());
    } catch (error: unknown) {
      if (!isFormValidationError(error)) throw error;
    }
  };

  useEffect(() => {
    if (
      saveOnly ||
      !autoExport ||
      !open ||
      loadingSigners ||
      loadError ||
      automaticExportStarted.current
    ) return;

    const values = automaticContractExportValues(signers, {
      signerId,
      employerSignatureType,
    }) as ContractSignerFormValues | null;
    if (!values) return;

    automaticExportStarted.current = true;
    queueMicrotask(() => void exportWithValues(values));
  }, [
    autoExport,
    saveOnly,
    employerSignatureType,
    exportWithValues,
    loadError,
    loadingSigners,
    open,
    signerId,
    signers,
  ]);

  const filterSignerOption: NonNullable<SelectProps["filterOption"]> = (
    input,
    option,
  ) =>
    String(option?.searchText ?? "")
      .toLocaleLowerCase()
      .includes(input.trim().toLocaleLowerCase());

  const automaticValues = automaticContractExportValues(signers, { signerId, employerSignatureType });
  const manualSelection = saveOnly || !autoExport || (!loadingSigners && !automaticValues) || Boolean(exportReport);
  const noSigners = !loadingSigners && !loadError && signers.length === 0;

  return (
    <Modal
      title={saveOnly ? "อัปเดตผู้ลงนาม" : !manualSelection ? "กำลัง Export สัญญาจ้าง" : `Export สัญญาจ้าง (${contractIds?.length || 1} คน)`}
      open={open}
      onCancel={handleCancel}
      closable={!exporting}
      mask={{ closable: !exporting }}
      keyboard={!exporting}
      destroyOnHidden
      footer={!manualSelection ? null : [
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
          onClick={() => void (saveOnly ? handleSaveSigner() : handleConfirmExport())}
        >
          {saveOnly ? "บันทึกผู้ลงนาม" : "ยืนยันการ Export"}
        </Button>,
      ]}
    >
      {exportReport ? <Alert type="warning" showIcon title={saveOnly ? "ผลการบันทึก" : "ผลการส่งออก"} description={<div style={{ whiteSpace: "pre-wrap" }}>{exportReport}</div>} /> : null}
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
        {manualSelection ? <><Form.Item
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
        </Form.Item></> : (
          <Alert
            type="info"
            showIcon
            title={loadingSigners ? "กำลังตรวจสอบผู้ลงนาม..." : "ระบบกำลัง Export โดยใช้ข้อมูลผู้ลงนามที่บันทึกไว้"}
          />
        )}

        {loadError ? (
          <Alert type="error" showIcon title={loadError} />
        ) : null}

        {noSigners ? (
          <Alert
            type="warning"
            showIcon
            title="ไม่พบผู้มีสิทธิ์ลงนามในสัญญาจ้าง"
          />
        ) : null}
      </Form>
    </Modal>
  );
}
