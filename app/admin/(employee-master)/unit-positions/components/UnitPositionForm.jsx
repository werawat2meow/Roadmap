"use client";

import {
  Col,
  Form,
  InputNumber,
  Row,
  Select,
} from "antd";

import UnitSelector from "./UnitSelector";
import PositionSelector from "./PositionSelector";

export default function UnitPositionForm({
  form,
  disabled = false,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={16}>

        {/* =========================
            Unit
        ========================= */}

        <Col span={24}>
          <Form.Item
            label="หน่วยงาน"
            name="unit_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกหน่วยงาน",
              },
            ]}
          >
            <UnitSelector
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Position
        ========================= */}

        <Col span={24}>
          <Form.Item
            label="ตำแหน่ง"
            name="position_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกตำแหน่ง",
              },
            ]}
          >
            <PositionSelector
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Headcount
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="จำนวนอัตรา"
            name="headcount_target"
            initialValue={0}
            rules={[
              {
                required: true,
                message: "กรุณาระบุจำนวนอัตรา",
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: "100%" }}
              disabled={disabled}
              placeholder="0"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select
              disabled={disabled}
            >
              <Select.Option value="active">
                Active
              </Select.Option>

              <Select.Option value="inactive">
                Inactive
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>

      </Row>
    </Form>
  );
}