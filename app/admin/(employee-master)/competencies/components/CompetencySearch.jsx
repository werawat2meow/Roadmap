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
import {
  SearchOutlined,
  ReloadOutlined,
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

export default function CompetencySearch({
  loading,
  filters,
  onSearch,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(filters);
  }, [filters, form]);

  const handleFinish = (values) => {
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

    form.setFieldsValue(values);
    onSearch(values);
  };

  const handleValuesChange = (_, allValues) => {
    onSearch({
      search: allValues.search?.trim() || "",
      status: allValues.status || "",
    });
  };

  return (
    <Card
      variant="borderless"
      className="mb-4"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
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
                placeholder="Code / Name"
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
                options={statusOptions}
                placeholder="ทั้งหมด"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item label=" ">
              <div className="flex justify-end gap-2">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  ล้าง
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  ค้นหา
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}