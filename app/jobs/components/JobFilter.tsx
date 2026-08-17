"use client";

import { Input, Select } from "antd";

const { Search } = Input;

interface Props {
  keyword: string;
  setKeyword: (v: string) => void;
}

export default function JobFilter({
  keyword,
  setKeyword,
}: Props) {
  return (
    <div className="mb-6 rounded-xl bg-white p-4 shadow">
      <div className="grid gap-4 md:grid-cols-3">
        <Search
          placeholder="Search Job"
          value={keyword}
          onChange={(e) =>
            setKeyword(e.target.value)
          }
        />

        <Select
          placeholder="Employment Type"
          allowClear
          options={[
            {
              label: "Full Time",
              value: "Full Time",
            },
          ]}
        />

        <Select
          placeholder="Experience Level"
          allowClear
          options={[
            {
              label: "Junior",
              value: "Junior",
            },
            {
              label: "Mid-Level",
              value: "Mid-Level",
            },
            {
              label: "Senior",
              value: "Senior",
            },
          ]}
        />
      </div>
    </div>
  );
}