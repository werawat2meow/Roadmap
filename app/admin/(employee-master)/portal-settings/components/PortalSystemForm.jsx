"use client";

import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";

const {
  TextArea,
} = Input;

/* =========================================================
   Initial Values
========================================================= */

export function getInitialPortalSystemValues() {
  return {
    system_code: "",
    module_code: "",
    system_name: "",
    system_subtitle: "",
    description: "",
    base_path: "",
    permission_code: "",
    icon_code: "",
    sort_order: 0,
    status: "active",
  };
}

/* =========================================================
   Options
========================================================= */

const statusOptions = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

/* =========================================================
   Component
========================================================= */

export default function PortalSystemForm({
  form,

  disabled = false,

  saving = false,

  onFinish,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={
        disabled ||
        saving
      }
      initialValues={
        getInitialPortalSystemValues()
      }
      onFinish={onFinish}
    >
      <Row gutter={[16, 0]}>
        {/* ===============================================
            System Code
        =============================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสระบบ"
            name="system_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสระบบ",
              },
              {
                pattern:
                  /^[A-Za-z0-9_]+$/,
                message:
                  "ใช้ได้เฉพาะ A-Z, 0-9 และ _",
              },
            ]}
          >
            <Input
              maxLength={100}
              placeholder="เช่น EMS"
              onChange={(event) => {
                const value =
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_]/g,
                      ""
                    );

                form.setFieldValue(
                  "system_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Module Code
        =============================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Module Code"
            name="module_code"
            extra="เช่น ems, payroll, benefit, access"
          >
            <Input
              maxLength={100}
              placeholder="ems"
              onChange={(event) => {
                const value =
                  event.target.value
                    .trim()
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9_]/g,
                      ""
                    );

                form.setFieldValue(
                  "module_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            System Name
        =============================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ชื่อระบบ"
            name="system_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อระบบ",
              },
            ]}
          >
            <Input
              maxLength={200}
              placeholder="เช่น Employee Management"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Subtitle
        =============================================== */}

        <Col xs={24}>
          <Form.Item
            label="คำอธิบายสั้น"
            name="system_subtitle"
          >
            <Input
              maxLength={300}
              placeholder="เช่น ระบบข้อมูลพนักงาน"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Description
        =============================================== */}

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              maxLength={1000}
              placeholder="รายละเอียดของระบบ"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Base Path
        =============================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Base Path"
            name="base_path"
            extra="Route หลักของระบบ เช่น /admin/dashboard"
          >
            <Input
              placeholder="/admin/dashboard"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Permission
        =============================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Permission"
            name="permission_code"
            extra="สิทธิ์สำหรับแสดงระบบบน Portal"
          >
            <Input
              placeholder="ems.portal.view"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Icon
        =============================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Icon Code"
            name="icon_code"
          >
            <Input
              placeholder="เช่น team"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Sort Order
        =============================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ลำดับ"
            name="sort_order"
          >
            <InputNumber
              min={0}
              precision={0}
              className="!w-full"
            />
          </Form.Item>
        </Col>

        {/* ===============================================
            Status
        =============================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สถานะ"
            name="status"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะ",
              },
            ]}
          >
            <Select
              options={
                statusOptions
              }
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}