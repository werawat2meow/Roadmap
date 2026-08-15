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

  editingRow = null,

  disabled = false,
}) {
  /* =========================================================
     Edit Initial Unit

     สำคัญ:
     UUID + Label ต้องมาคู่กัน
  ========================================================= */

  const initialUnitOption =
    editingRow?.unit_id
      ? {
          id:
            editingRow.unit_id,

          unit_name:
            editingRow.unit_name ||
            "",

          division_name:
            editingRow.division_name ||
            "",

          department_name:
            editingRow.department_name ||
            "",
        }
      : null;

  /* =========================================================
     Edit Initial Position
  ========================================================= */

  const initialPositionOption =
    editingRow?.position_id
      ? {
          id:
            editingRow.position_id,

          position_name:
            editingRow.position_name ||
            "",

          position_code:
            editingRow.position_code ||
            "",

          position_level:
            editingRow.position_level ||
            "",
        }
      : null;

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
                message:
                  "กรุณาเลือกหน่วยงาน",
              },
            ]}
          >
            <UnitSelector
              disabled={disabled}

              initialOption={
                initialUnitOption
              }
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
                message:
                  "กรุณาเลือกตำแหน่ง",
              },
            ]}
          >
            <PositionSelector
              disabled={disabled}

              initialOption={
                initialPositionOption
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
            Headcount
        ========================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="จำนวนอัตรา"
            name="headcount_target"
            initialValue={0}
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุจำนวนอัตรา",
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{
                width:
                  "100%",
              }}
              disabled={
                disabled
              }
              placeholder="0"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select
              disabled={
                disabled
              }
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