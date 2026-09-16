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

    permit_code:
      "",

    permit_name_th:
      "",

    permit_name_en:
      "",

    description:
      "",

    requires_valid_visa:
      true,

    is_renewable:
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

export default function WorkPermitTypeForm({
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
            label="รหัสประเภทใบอนุญาตทำงาน"
            name="permit_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสประเภทใบอนุญาตทำงาน",
              },
              {
                max: 50,
                message:
                  "รหัสต้องไม่เกิน 50 ตัวอักษร",
              },
            ]}
          >
            <Input
              placeholder="เช่น GENERAL"
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
            label="ชื่อประเภทใบอนุญาตทำงาน (ไทย)"
            name="permit_name_th"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อประเภทใบอนุญาตทำงาน",
              },
            ]}
          >
            <Input placeholder="ชื่อประเภทใบอนุญาตทำงาน" />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อประเภทใบอนุญาตทำงาน (อังกฤษ)"
            name="permit_name_en"
          >
            <Input placeholder="Work Permit Type Name" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="อธิบายเงื่อนไขหรือวัตถุประสงค์ของประเภทใบอนุญาตทำงาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ต้องมี Visa ที่ยังใช้งาน"
            name="requires_valid_visa"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ต่ออายุได้"
            name="is_renewable"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="อายุเริ่มต้น (วัน)"
            name="default_validity_days"
          >
            <InputNumber
              min={1}
              precision={0}
              className="w-full"
              placeholder="เช่น 365"
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
