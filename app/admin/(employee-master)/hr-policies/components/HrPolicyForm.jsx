"use client";

import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Switch,
} from "antd";

import LazyPolicyCompanySelect from "./LazyPolicyCompanySelect";

import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
} from "./HrPolicySearch";

const {
  TextArea,
} = Input;

export default function HrPolicyForm({
  form,
  disabled = false,
  companyInitialOption = null,
  onFinish,
}) {
  const status =
    Form.useWatch(
      "status",
      form
    );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Alert
        type="info"
        showIcon
        title="นโยบายบริษัท"
        description="นโยบายจะเก็บเป็น Version เพื่อรักษาประวัติการแก้ไข เมื่อแก้เนื้อหา/สถานะ/วันที่มีผล ระบบจะสร้าง Version ใหม่แทนการเขียนทับประวัติเดิม"
        style={{
          marginBottom: 16,
        }}
      />

      <Row
        gutter={[
          16,
          0,
        ]}
      >
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            extra="แสดงตาม Company Scope ของผู้ใช้งาน"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <LazyPolicyCompanySelect
              disabled={disabled}
              initialOption={
                companyInitialOption
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
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
              disabled={disabled}
              options={
                STATUS_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="บังคับใช้"
            name="is_mandatory"
            valuePropName="checked"
            extra="ใช้สำหรับนโยบายที่พนักงานต้องรับทราบ/ปฏิบัติตาม"
          >
            <Switch
              disabled={disabled}
              checkedChildren="บังคับใช้"
              unCheckedChildren="ทั่วไป"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสนโยบาย"
            name="policy_code"
            extra="เช่น HR-POL-001"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสนโยบาย",
              },
              {
                pattern:
                  /^[A-Z0-9][A-Z0-9_-]*$/,
                message:
                  "ใช้เฉพาะ A-Z, 0-9, _ และ -",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="HR-POL-001"
              onChange={(event) => {
                const value =
                  String(
                    event?.target
                      ?.value || ""
                  )
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_-]/g,
                      "_"
                    )
                    .replace(
                      /_+/g,
                      "_"
                    );

                form.setFieldValue(
                  "policy_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={10}
        >
          <Form.Item
            label="ชื่อนโยบาย"
            name="policy_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อนโยบาย",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="เช่น นโยบายการทำงานและการปฏิบัติตน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="หมวดหมู่"
            name="policy_category"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกหมวดหมู่",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={
                CATEGORY_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="หน่วยงานเจ้าของนโยบาย"
            name="owner_department"
            extra="เช่น Human Resources, Legal, Management"
          >
            <Input
              disabled={disabled}
              maxLength={200}
              placeholder="Human Resources"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="วันที่มีผล"
            name="effective_date"
            rules={[
              {
                required:
                  status ===
                  "published",
                message:
                  "Published ต้องระบุวันที่มีผล",
              },
            ]}
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={[
              "effective_date",
            ]}
            extra="เว้นว่าง = ยังไม่มีวันสิ้นสุด"
            rules={[
              ({
                getFieldValue,
              }) => ({
                validator(
                  _,
                  value
                ) {
                  const start =
                    getFieldValue(
                      "effective_date"
                    );

                  if (
                    !start ||
                    !value ||
                    !value.isBefore(
                      start,
                      "day"
                    )
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่มีผล"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
        >
          <Form.Item
            label="คำอธิบายนโยบาย"
            name="description"
          >
            <TextArea
              disabled={disabled}
              rows={2}
              maxLength={1000}
              showCount
              placeholder="อธิบายวัตถุประสงค์และขอบเขตของนโยบายโดยย่อ"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อ Version"
            name="version_title"
            extra="เช่น Initial Release, Revised 2027"
          >
            <Input
              disabled={disabled}
              maxLength={200}
              placeholder="Initial Release"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="สรุปการแก้ไข"
            name="change_summary"
            extra="ใช้ในหน้า Version History"
          >
            <Input
              disabled={disabled}
              maxLength={500}
              placeholder="สร้างนโยบายฉบับแรก"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="เนื้อหานโยบาย"
            name="content"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกเนื้อหานโยบาย",
              },
            ]}
            extra="เวอร์ชันนี้ใช้ Text Area ก่อน เพื่อไม่ผูกกับ Rich Text Editor package เพิ่มเติม"
          >
            <TextArea
              disabled={disabled}
              rows={12}
              showCount
              maxLength={50000}
              placeholder={"1. วัตถุประสงค์\n2. ขอบเขต\n3. หลักเกณฑ์\n4. หน้าที่และความรับผิดชอบ\n5. การบังคับใช้"}
            />
          </Form.Item>
        </Col>
      </Row>

      {status ===
        "published" && (
        <Alert
          type="warning"
          showIcon
          title="Published Policy"
          description="เมื่อนโยบาย Published แล้ว หากมีการแก้ไขเนื้อหา ระบบจะเก็บ Version เดิมไว้และสร้าง Version ใหม่ เพื่อรองรับ Audit และ Version History"
        />
      )}
    </Form>
  );
}
