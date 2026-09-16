"use client";

import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

const {
  TextArea,
} = Input;

export const STATUS_OPTIONS = [
  {
    value: "active",
    label: "ใช้งาน",
  },
  {
    value: "inactive",
    label: "ไม่ใช้งาน",
  },
];

export function getInitialValues() {
  return {
    company_id:
      undefined,

    visa_code:
      "",

    visa_name_th:
      "",

    visa_name_en:
      "",

    description:
      "",

    allows_work:
      false,

    requires_work_permit:
      true,

    is_extendable:
      true,

    default_validity_days:
      null,

    effective_date:
      null,

    expire_date:
      null,

    status:
      "active",

    sort_order:
      0,

    remark:
      "",
  };
}

export default function VisaTypeForm({
  form,
  companies = [],
  companyLoading = false,
  mode = "create",
  saving = false,
  onFinish,
}) {
  const disabled =
    mode === "view" ||
    saving;

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      initialValues={
        getInitialValues()
      }
      onFinish={onFinish}
    >
      <Row gutter={16}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={
                companyLoading
              }
              placeholder="เลือกบริษัท"
              optionFilterProp="label"
              options={companies}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="รหัสประเภทวีซ่า"
            name="visa_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสประเภทวีซ่า",
              },
              {
                max: 50,
                message:
                  "รหัสต้องไม่เกิน 50 ตัวอักษร",
              },
            ]}
          >
            <Input
              placeholder="เช่น NON_B"
              onInput={(
                event
              ) => {
                event.currentTarget.value =
                  event.currentTarget.value.toUpperCase();
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อประเภทวีซ่า (ไทย)"
            name="visa_name_th"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อประเภทวีซ่า",
              },
            ]}
          >
            <Input placeholder="เช่น วีซ่าธุรกิจ Non-Immigrant B" />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อประเภทวีซ่า (อังกฤษ)"
            name="visa_name_en"
          >
            <Input placeholder="เช่น Non-Immigrant B Visa" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="อธิบายวัตถุประสงค์หรือเงื่อนไขของประเภทวีซ่า"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="รองรับการทำงาน"
            name="allows_work"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ต้องมี Work Permit"
            name="requires_work_permit"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ต่ออายุได้"
            name="is_extendable"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="อายุเริ่มต้น (วัน)"
            name="default_validity_days"
          >
            <InputNumber
              min={1}
              precision={0}
              className="w-full"
              placeholder="เช่น 90"
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
          >
            <Select
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
            label="ลำดับ"
            name="sort_order"
          >
            <InputNumber
              min={0}
              precision={0}
              className="w-full"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="วันที่เริ่มมีผล"
            name="effective_date"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่เริ่มมีผล",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
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
            rules={[
              ({
                getFieldValue,
              }) => ({
                validator(
                  _,
                  value
                ) {
                  const effectiveDate =
                    getFieldValue(
                      "effective_date"
                    );

                  if (
                    !value ||
                    !effectiveDate ||
                    !value.isBefore(
                      effectiveDate,
                      "day"
                    )
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker
              allowClear
              className="w-full"
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
