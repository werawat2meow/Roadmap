"use client";

import {
  Button,
  Card,
  Col,
  Form,
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

const statusOptions = [
  {
    label: "ทั้งหมด",
    value: "",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Inactive",
    value: "inactive",
  },
];

export default function SkillLevelSearch({
  search,
  setSearch,

  status,
  setStatus,

  loading = false,

  onSearch,
  onReset,
  onAdd,

  canCreate = true,
}) {
  const [form] = Form.useForm();

  return (
    <Card className="mb-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={onSearch}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12} lg={16}>
            <Form.Item label="ค้นหา">
              <Input
                allowClear
                placeholder="ค้นหารหัสระดับ, ชื่อระดับ..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onPressEnter={onSearch}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item label="สถานะ">
              <Select
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            className="flex justify-end items-end"
          >
            <Space wrap>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={onSearch}
              >
                ค้นหา
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={onReset}
              >
                รีเซ็ต
              </Button>

              {canCreate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onAdd}
                >
                  เพิ่มข้อมูล
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}