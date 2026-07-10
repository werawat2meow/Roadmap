"use client";

import BaseSelect from "../BaseSelect";

export default function JobSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/jobs"
      valueField="id"
      labelField={(item) =>
        `${item.job_code} - ${item.job_name}`
      }
      placeholder="เลือก Job"
      {...props}
    />
  );
}