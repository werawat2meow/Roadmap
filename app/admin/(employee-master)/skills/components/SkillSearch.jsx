"use client";

import { useEffect, useRef, useState } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Button,
} from "antd";

const { Search } = Input;

export default function SkillSearch({
  loading = false,
  filters,
  onSearch,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // ✅ กันไม่ให้ debounce effect ยิงซ้ำตอน mount
  // (page.jsx มี useEffect โหลดข้อมูลตอน mount อยู่แล้ว)
  const isFirstRender = useRef(true);

  useEffect(() => {
    setSearch(filters?.search || "");
    setStatus(filters?.status || "");
  }, [filters]);

  // ✅ Real-time search แบบ debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSearch?.({
        search: search.trim(),
        status,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [search, status]);

  const handleReset = () => {
    setSearch("");
    setStatus("");

    onSearch?.({
      search: "",
      status: "",
    });
  };

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} md={12}>
        <Search
          allowClear
          placeholder="ค้นหา Skill Code หรือ Skill Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Col>

      <Col xs={24} md={6}>
        <Select
          style={{ width: "100%" }}
          placeholder="ทุกสถานะ"
          allowClear
          value={status || undefined}
          onChange={(value) => setStatus(value || "")}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
      </Col>

      <Col xs={24} md={6}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            onClick={handleReset}
            disabled={loading}
          >
            รีเซ็ต
          </Button>
        </div>
      </Col>
    </Row>
  );
}