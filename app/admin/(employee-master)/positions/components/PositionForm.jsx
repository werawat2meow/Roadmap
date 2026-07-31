"use client";

import { useEffect } from "react";
import {
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
} from "antd";
import JobSelector from "./JobSelector";
import PositionLevelSelector from "./Positionlevelselector";

const { TextArea } = Input;

export default function PositionForm({form,families = [],disabled = false,}) {

  const familyId = Form.useWatch("position_family_id",form);

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={16}>

        {/* =========================
            Position Code
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="รหัสตำแหน่ง"

            name="position_code"

            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสตำแหน่ง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Position Code"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Position Name
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="ชื่อตำแหน่ง"

            name="position_name"

            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อตำแหน่ง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Position Name"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Short Name
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="ชื่อย่อ"

            name="short_name"
          >
            <Input
              disabled={disabled}
              placeholder="Short Name"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Job Family
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="กลุ่มสายงาน"
            name="position_family_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกกลุ่มสายงาน",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              disabled={disabled}
              optionFilterProp="label"
              placeholder="เลือกกลุ่มสายงาน"
              onChange={(value) => {
                form.setFieldValue("position_family_id", value);
                form.setFieldValue("position_levels", []);
              }}
            >
              {families.map((item) => (
                <Select.Option
                  key={item.id}
                  value={item.id}
                  label={`${item.family_code} - ${item.family_name}`}
                >
                  {item.family_code} - {item.family_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
                {/* =========================
            Job
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="บทบาทงาน"
            name="job_id"
          >
            <JobSelector
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Position Levels
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="ระดับตำแหน่ง"
            name="position_levels"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกระดับตำแหน่ง",
              },
            ]}
          >
            <PositionLevelSelector
              familyId={familyId}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Description
        ========================= */}

        <Col span={24}>
          <Form.Item
            label="รายละเอียดตำแหน่ง"
            name="description"
          >
            <TextArea
              rows={4}
              disabled={disabled}
              placeholder="รายละเอียด / หน้าที่ / หมายเหตุ"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Manager
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="ตำแหน่งผู้จัดการ"
            name="is_manager"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ใช่"
              unCheckedChildren="ไม่ใช่"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Executive
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="ตำแหน่งผู้บริหาร"
            name="is_executive"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ใช่"
              unCheckedChildren="ไม่ใช่"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Multiple Assignment
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับหลายตำแหน่ง"
            name="allow_multiple_assignment"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ใช่"
              unCheckedChildren="ไม่ใช่"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select disabled={disabled}>
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