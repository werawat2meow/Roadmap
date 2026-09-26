import type { EmploymentContractData } from "@/app/recruitment/lib/contracts";

export const EMPLOYER_SIGNATURE_TYPE_LABELS = {
  employer: "นายจ้าง",
  authorized_representative: "ผู้ได้รับมอบอำนาจจากนายจ้าง",
} as const;

export type EmployerSignatureType =
  keyof typeof EMPLOYER_SIGNATURE_TYPE_LABELS;

export const DEFAULT_EMPLOYER_SIGNATURE_TYPE: EmployerSignatureType =
  "employer";

export function isEmployerSignatureType(
  value: unknown,
): value is EmployerSignatureType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(EMPLOYER_SIGNATURE_TYPE_LABELS, value)
  );
}

export interface ContractPdfConfig {
  highlightDynamicText: boolean;
  showSignatureOnEveryPage: boolean;
}

export const CONTRACT_PDF_CONFIG: Readonly<ContractPdfConfig> = Object.freeze({
  highlightDynamicText: true,
  showSignatureOnEveryPage: true,
});

export interface EmploymentContractDocumentProps {
  data: EmploymentContractData;
  config?: Partial<ContractPdfConfig>;
  employerSignatureType?: EmployerSignatureType;
  /**
   * A validated image data URI prepared on the server with
   * fetchImageAsDataUri(). An absent/invalid logo is intentionally omitted.
   */
  logoDataUri?: string | null;
}

export interface ContractHeaderProps {
  company: EmploymentContractData["company"];
  /** Validated branch logo prepared by the server from branches.branch_image_url. */
  logoDataUri: string | null;
}

export interface ContractFooterProps {
  employer: EmploymentContractData["employer"];
  employee: EmploymentContractData["employee"];
  employerSignatureType: EmployerSignatureType;
  fixed?: boolean;
}
