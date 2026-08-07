"use client";

import { useEffect, useRef } from "react";
import {
  Button,
  Col,
  Input,
  Row,
  Select,
  Space,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Search } = Input;

export default function CareerPathSearch({
  search,
  setSearch,

  statusFilter,
  setStatusFilter,

  loading = false,

  onSearch,
  onReset,
  onCreate,
  canCreate,
}) {
  const isFirstRun = useRef(true);

  // Debounce: ค้นหาอัตโนมัติเวลาพิมพ์ (ไม่ต้องกด Enter)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSearch(search);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <Row
      gutter={[16, 16]}
      justify="space-between"
      align="middle"
    >
      <Col xs={24} lg={18}>
        <Space
          wrap
          style={{ width: "100%" }}
        >
          <Search
            allowClear
            enterButton={<SearchOutlined />}
            loading={loading}
            placeholder="ค้นหา Code / Name / Description"
            style={{
              width: 320,
              maxWidth: "100%",
            }}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onSearch={onSearch}
          />

          <Select
            allowClear
            placeholder="สถานะ"
            style={{ width: 170 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              {
                label: "ใช้งาน",
                value: true,
              },
              {
                label: "ไม่ใช้งาน",
                value: false,
              },
            ]}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
          >
            รีเซ็ต
          </Button>
        </Space>
      </Col>

      <Col
        xs={24}
        lg={6}
        style={{
          textAlign: "right",
        }}
      >
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            เพิ่ม Career Path
          </Button>
        )}
      </Col>
    </Row>
  );
}