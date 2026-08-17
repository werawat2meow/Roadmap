"use client";

import { useEffect, useState, useRef } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Button,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Search } = Input;

export default function SkillCategorySearch({
  loading,
  filters,
  onSearch,
}) {
  const [search, setSearch] = useState(
    filters?.search || ""
  );

  const [status, setStatus] = useState(
    filters?.status || ""
  );

  // ✅ ใช้เช็คว่าเป็นการ sync จาก parent หรือ user พิมพ์เอง
  const isFirstRender = useRef(true);

  useEffect(() => {
    setSearch(filters?.search || "");
    setStatus(filters?.status || "");
  }, [filters]);

  // ✅ Debounce real-time search
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
    }, 400); // หน่วง 400ms หลังหยุดพิมพ์/เปลี่ยนค่า

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
      <Col xs={24} md={10}>
        <Search
          allowClear
          value={search}
          placeholder="ค้นหารหัส / ชื่อหมวดหมู่"
          enterButton={<SearchOutlined />}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Col>

      <Col xs={24} md={6}>
        <Select
          allowClear
          style={{ width: "100%" }}
          placeholder="สถานะ"
          value={status || undefined}
          onChange={(value) => setStatus(value || "")}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </Col>

      <Col xs={24} md={8}>
        <Button
          style={{ marginLeft: 8 }}
          icon={<ReloadOutlined />}
          onClick={handleReset}
        >
          รีเซ็ต
        </Button>
      </Col>
    </Row>
  );
}