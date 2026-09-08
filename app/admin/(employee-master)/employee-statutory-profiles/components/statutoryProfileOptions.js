export const TAX_IDENTITY_OPTIONS = [
  { value: "citizen_id", label: "ใช้เลขบัตรประชาชน" },
  { value: "passport", label: "ใช้เลข Passport" },
  { value: "tax_id", label: "ใช้เลขประจำตัวผู้เสียภาษีอื่น" },
];

export const TAX_FORM_OPTIONS = [
  { value: "PND90", label: "ภ.ง.ด.90" },
  { value: "PND91", label: "ภ.ง.ด.91" },
  { value: "PND92", label: "ภ.ง.ด.92" },
  { value: "PND93", label: "ภ.ง.ด.93" },
  { value: "PND94", label: "ภ.ง.ด.94" },
];

export const TAX_RESIDENT_OPTIONS = [
  { value: "resident", label: "ผู้มีถิ่นที่อยู่ทางภาษีในประเทศไทย" },
  { value: "non_resident", label: "ผู้ไม่มีถิ่นที่อยู่ทางภาษีในประเทศไทย" },
];

export const INSURED_TYPE_OPTIONS = [
  { value: "section_33", label: "มาตรา 33" },
  { value: "section_39", label: "มาตรา 39" },
  { value: "section_40", label: "มาตรา 40" },
  { value: "custom", label: "อื่น ๆ" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
];

export function getEmployeeName(employee) {
  if (!employee) return "-";

  const thai = [
    employee.first_name_th,
    employee.middle_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (thai) return thai;

  const english = [
    employee.first_name_en,
    employee.middle_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return english || "-";
}

export function getEmployeeLabel(employee) {
  if (!employee) return "-";

  const name = getEmployeeName(employee);
  return employee.employee_code
    ? `${employee.employee_code} - ${name}`
    : name;
}

export function getCompanyLabel(company) {
  if (!company) return "-";

  const name = company.company_name_th || company.company_name_en || "-";
  return company.company_code ? `${company.company_code} - ${name}` : name;
}

export function getPayrollCompanyLabel(employee) {
  const payrollCompany = employee?.payroll_companies;
  if (!payrollCompany) return "ยังไม่ได้กำหนดบริษัทเงินเดือน";

  const name = payrollCompany.payroll_company_name || "-";
  return payrollCompany.payroll_company_code
    ? `${payrollCompany.payroll_company_code} - ${name}`
    : name;
}

export function getIdentityLabel(value) {
  return (
    TAX_IDENTITY_OPTIONS.find((item) => item.value === value)?.label || value || "-"
  );
}

export function getInsuredTypeLabel(value) {
  return INSURED_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}
