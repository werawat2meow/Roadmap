export type ContractDataErrorCode =
  | "INVALID_ID"
  | "NOT_FOUND"
  | "NOT_APPROVED"
  | "INCOMPLETE_DATA"
  | "SIGNER_NOT_ALLOWED"
  | "DATABASE_ERROR";

export class ContractDataError extends Error {
  readonly code: ContractDataErrorCode;
  readonly cause?: unknown;

  constructor(
    code: ContractDataErrorCode,
    message: string,
    options: { cause?: unknown } = {}
  ) {
    super(message);
    this.name = "ContractDataError";
    this.code = code;
    this.cause = options.cause;
  }
}
