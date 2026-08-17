"use client";

import {
  Button,
  Col,
  Input,
  Row,
  Space,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function PositionSearch({
  search,
  setSearch,

  onSearch,
  onReset,
  onCreate,

  loading = false,
}) {
  const handleSearch = () => {
    if (onSearch) {
      onSearch();
    }
  };

  const handleReset = () => {
    if (setSearch) {
      setSearch("");
    }

    if (onReset) {
      onReset();
    }
  };

  return (
    <Row
      gutter={[16, 16]}
      align="middle"
      justify="space-between"
      style={{
        marginBottom: 16,
      }}
    >
      <Col xs={24} lg={18}>
        <Space
          wrap
          style={{
            width: "100%",
          }}
        >
          <Input
            allowClear
            value={search}
            disabled={loading}
            placeholder="ค้นหารหัส / ชื่อตำแหน่ง / ชื่อย่อ / รายละเอียด..."
            prefix={<SearchOutlined />}
            style={{
              width: 420,
              maxWidth: "100%",
            }}
            onPressEnter={handleSearch}
            onChange={(e) =>
              setSearch?.(e.target.value)
            }
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleSearch}
          >
            ค้นหา
          </Button>

          <Button
            icon={<ReloadOutlined />}
            disabled={loading}
            onClick={handleReset}
          >
            ล้าง
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          เพิ่มตำแหน่ง
        </Button>
      </Col>
    </Row>
  );
}