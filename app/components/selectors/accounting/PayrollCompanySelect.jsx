"use client";

import BaseSelect from "../BaseSelect";

export default function PayrollCompanySelect(props) {
  return (
    <BaseSelect
      api="/api/admin/payroll-companies"
      valueField="id"
      labelField={(item) =>
        `${item.payroll_company_code} - ${item.payroll_company_name}`
      }
      placeholder="เลือก Payroll Company"
      {...props}
    />
  );
}