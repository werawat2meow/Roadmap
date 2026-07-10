"use client";

import BaseSelect from "../BaseSelect";

export default function BranchSelect({
  companyId = "",
  branchGroupId = "",
  ...props
}) {
  return (
    <BaseSelect
      api="/api/admin/branches"
      valueField="id"
      labelField={(item) =>
        `${item.branch_code} - ${item.branch_name}`
      }
      params={{
        company_id: companyId,
        branch_group_id: branchGroupId,
      }}
      placeholder="เลือกสาขา"
      {...props}
    />
  );
}