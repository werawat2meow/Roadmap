"use client";

import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Switch,
} from "antd";

import PositionFamilySelector from "./PositionFamilySelector";

const { TextArea } = Input;

export default function CareerPathForm({
  form,
  families = [],
  disabled = false,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={16}>

        {/* =========================
            Career Path Code
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="Career Path Code"
            name="path_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอก Career Path Code",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Career Path Code"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Career Path Name
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="Career Path Name"
            name="path_name"
            rules={[
              {
                required: true,
                message: "กรุณากรอก Career Path Name",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Career Path Name"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Position Family
        ========================= */}

        <Col xs={24}>
          <Form.Item
            label="Position Family"
            name="position_family_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือก Position Family",
              },
            ]}
          >
            <PositionFamilySelector
              disabled={disabled}
              families={families}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Description
        ========================= */}

        <Col xs={24}>
          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea
              rows={4}
              disabled={disabled}
              placeholder="Description"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Col>

        {/* =========================
            Sort Order
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="Sort Order"
            name="sort_order"
            initialValue={0}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="Status"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              disabled={disabled}
            />
          </Form.Item>
        </Col>

      </Row>
    </Form>
  );
}