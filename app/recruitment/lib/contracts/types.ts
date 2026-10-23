export type NullableText = string | null;

export interface ContractEmployer {
  id: string;
  employeeId: NullableText;
  /** Stored in recruit_contract_signatories.emp_name_th. */
  nameTH: string;
  /** Stored in recruit_contract_signatories.emp_name_en. */
  nameEN: NullableText;
  positionTH: NullableText;
  positionEN: NullableText;
  signerType: NullableText;
}

export interface EmploymentContractBaseData {
  contract: {
    /** recruit_job_applications.id until a contract table exists. */
    id: string;
    /** TODO: populate from the company contract-running table when available. */
    contractNo: NullableText;
    /** TODO: populate from the contract issue/version table when available. */
    contractDateTH: NullableText;
    /** TODO: populate from the contract issue/version table when available. */
    contractDateEN: NullableText;
    startDateTH: NullableText;
    startDateEN: NullableText;
    endDateTH: NullableText;
    endDateEN: NullableText;
    durationDays: number | null;
    probationDays: number | null;
  };
  company: {
    id: string;
    branchId: NullableText;
    logo: NullableText;
    nameTH: string;
    nameEN: NullableText;
    addressTH: NullableText;
    /** Built from companies.address/postcode and English names returned by geothai. */
    addressEN: NullableText;
  };
  employee: {
    id: NullableText;
    prefixTH: NullableText;
    firstNameTH: string;
    lastNameTH: string;
    nicknameTH: NullableText;
    prefixEN: NullableText;
    firstNameEN: NullableText;
    lastNameEN: NullableText;
    nicknameEN: NullableText;
    addressTH: NullableText;
    /** Built from shared address fields and English names returned by geothai. */
    addressEN: NullableText;
    positionTH: NullableText;
    /** The current positions schema has no English-name field. */
    positionEN: NullableText;
    departmentTH: NullableText;
    /** The current departments schema has no English-name field. */
    departmentEN: NullableText;
    divisionTH: NullableText;
    /** The current divisions schema has no English-name field. */
    divisionEN: NullableText;
    level: NullableText;
    salary: number | null;
    positionAllowance: number | null;
    totalSalary: number | null;
  };
}

export interface EmploymentContractData extends EmploymentContractBaseData {
  employer: ContractEmployer;
}

export interface ContractSigner {
  id: string;
  /** recruit_contract_signatories currently has no employee relation. */
  employeeId: NullableText;
  nameTH: string;
  /** Stored in recruit_contract_signatories.emp_name_en. */
  nameEN: NullableText;
  /** recruit_contract_signatories.position_id -> positions.position_name. */
  positionTH: NullableText;
  /** positions currently has no confirmed English-name field. */
  positionEN: NullableText;
  /** TODO: add and confirm the real signer-type field name. */
  signerType: NullableText;
}

export interface ContractAccessScope {
  id: string;
  employee_id: NullableText;
  company_id: NullableText;
  branch_id: NullableText;
  department_id: NullableText;
  division_id: NullableText;
  unit_id: NullableText;
}

export type ContractTemplateVariableKey =
  | "employeeNameTH"
  | "employeeNameEN"
  | "employeeNicknameTH"
  | "employeeNicknameEN"
  | "positionTH"
  | "positionEN"
  | "level"
  | "departmentTH"
  | "departmentEN"
  | "divisionTH"
  | "divisionEN"
  | "salary"
  | "salaryEN"
  | "salaryTextTH"
  | "salaryTextEN"
  | "positionAllowance"
  | "positionAllowanceEN"
  | "positionAllowanceTextTH"
  | "positionAllowanceTextEN"
  | "totalSalary"
  | "totalSalaryEN"
  | "totalSalaryTextTH"
  | "totalSalaryTextEN"
  | "startDateTH"
  | "startDateEN"
  | "endDateTH"
  | "endDateEN"
  | "durationDays"
  | "contractNo"
  | "contractDateTH"
  | "contractDateEN"
  | "companyNameTH"
  | "companyNameEN"
  | "companyAddressTH"
  | "companyAddressEN"
  | "employerNameTH"
  | "employerNameEN"
  | "employerPositionTH"
  | "employerPositionEN"
  | "employeeAddressTH"
  | "employeeAddressEN";

export type ContractTemplateVariables = Record<
  ContractTemplateVariableKey,
  string
>;

export type ContractTextPart = {
  text: string;
  dynamic?: boolean;
  bold?: boolean;
  variable?: ContractTemplateVariableKey;
};

export type ContractSection = {
  no: string;
  th: ContractTextPart[];
  en?: ContractTextPart[];
  children?: ContractSection[];
};
