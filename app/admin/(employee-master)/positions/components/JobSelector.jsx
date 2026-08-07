"use client";

import { useEffect, useState } from "react";
import { Select } from "antd";

const { Option } = Select;

export default function JobSelector({
  value,
  onChange,

  disabled = false,

  allowClear = true,

  placeholder = "เลือกบทบาทงาน",

  style = {
    width: "100%",
  },
}) {
  const [loading, setLoading] = useState(false);

  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/admin/jobs?all=true"
      );

      const json = await res.json();

      if (json.success) {
        setJobs(json.data || []);
      }
    } catch (err) {
      console.error("LOAD_JOBS_ERROR", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      value={value}
      style={style}
      placeholder={placeholder}
      optionFilterProp="label"
      onChange={onChange}
      filterOption={(input, option) =>
        (option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    >
      {jobs.map((job) => (
        <Option
          key={job.id}
          value={job.id}
          label={`${job.job_code} - ${job.job_name}`}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span>
              {job.job_code}
            </span>

            <span
              style={{
                color: "#666",
              }}
            >
              {job.job_name}
            </span>
          </div>
        </Option>
      ))}
    </Select>
  );
}