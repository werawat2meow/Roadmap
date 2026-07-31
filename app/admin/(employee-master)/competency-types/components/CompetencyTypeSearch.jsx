"use client";

import { useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";

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

export default function CompetencyTypeSearch({
  loading,
  filters,
  onSearch,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(filters);
  }, []);

  const handleValuesChange = (_, values) => {
    onSearch({
      search: values.search?.trim() || "",
      status: values.status || "",
    });
  };

  const handleReset = () => {
    const values = {
      search: "",
      status: "",
    };

    form.resetFields();
    form.setFieldsValue(values);

    onSearch(values);
  };

  return (
    <Card
      variant="borderless"
      className="mb-4"
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="ค้นหา"
              name="search"
            >
              <Input
                allowClear
                placeholder="Type Code / Type Name"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="สถานะ"
              name="status"
            >
              <Select
                allowClear
                placeholder="ทั้งหมด"
                options={statusOptions}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label=" ">
              <div className="flex justify-end">
                <Button
                  icon={<ReloadOutlined />}
                  loading={loading}
                  onClick={handleReset}
                >
                  ล้าง
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}