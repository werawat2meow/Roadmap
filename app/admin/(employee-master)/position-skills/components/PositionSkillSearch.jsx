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

const importanceOptions = [
  {
    label: "ทั้งหมด",
    value: "",
  },
  {
    label: "Low",
    value: "low",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "High",
    value: "high",
  },
  {
    label: "Critical",
    value: "critical",
  },
];

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

export default function PositionSkillSearch({
  search,
  setSearch,

  positionId,
  setPositionId,

  skillId,
  setSkillId,

  importance,
  setImportance,

  status,
  setStatus,

  positions = [],
  skills = [],

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
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="ค้นหา">
              <Input
                allowClear
                placeholder="ค้นหาตำแหน่ง หรือ ทักษะ..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onPressEnter={onSearch}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item label="ตำแหน่ง">
              <Select
                allowClear
                showSearch
                placeholder="ทั้งหมด"
                optionFilterProp="label"
                value={positionId || undefined}
                options={positions.map((item) => ({
                  label: `${item.position_code} - ${item.position_name}`,
                  value: item.id,
                }))}
                onChange={(value) =>
                  setPositionId(value || "")
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item label="ทักษะ">
              <Select
                allowClear
                showSearch
                placeholder="ทั้งหมด"
                optionFilterProp="label"
                value={skillId || undefined}
                options={skills.map((item) => ({
                  label: `${item.skill_code} - ${item.skill_name}`,
                  value: item.id,
                }))}
                onChange={(value) =>
                  setSkillId(value || "")
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Importance">
              <Select
                options={importanceOptions}
                value={importance}
                onChange={setImportance}
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

          <Col xs={24} md={12} lg={8}>
            <Form.Item label=" ">
              <Space className="w-full justify-end">
                <Button
                  icon={<SearchOutlined />}
                  type="primary"
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
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}