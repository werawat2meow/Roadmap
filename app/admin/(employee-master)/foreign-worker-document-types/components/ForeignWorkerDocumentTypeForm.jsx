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

export const CATEGORY_OPTIONS = [
  {
    value: "passport",
    label: "Passport",
  },
  {
    value: "visa",
    label: "Visa",
  },
  {
    value: "work_permit",
    label: "Work Permit",
  },
  {
    value: "mou",
    label: "MOU",
  },
  {
    value: "identity",
    label: "เอกสารประจำตัว",
  },
  {
    value: "medical",
    label: "เอกสารทางการแพทย์",
  },
  {
    value: "insurance",
    label: "ประกันภัย / ประกันสุขภาพ",
  },
  {
    value: "employment",
    label: "เอกสารการจ้างงาน",
  },
  {
    value: "government",
    label: "เอกสารหน่วยงานรัฐ",
  },
  {
    value: "other",
    label: "อื่น ๆ",
  },
];

export function getInitialValues() {
  return {
    company_id:
      undefined,

    document_code:
      "",

    document_name_th:
      "",

    document_name_en:
      "",

    document_category:
      "other",

    description:
      "",

    requires_document_no:
      true,

    requires_issue_date:
      false,

    requires_expiry_date:
      false,

    is_mandatory:
      false,

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

export default function ForeignWorkerDocumentTypeForm({
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

  const requiresExpiryDate =
    Form.useWatch(
      "requires_expiry_date",
      form
    );

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
            label="หมวดเอกสาร"
            name="document_category"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกหมวดเอกสาร",
              },
            ]}
          >
            <Select
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
            label="รหัสประเภทเอกสาร"
            name="document_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสประเภทเอกสาร",
              },
              {
                max: 50,
                message:
                  "รหัสต้องไม่เกิน 50 ตัวอักษร",
              },
            ]}
          >
            <Input
              placeholder="เช่น PASSPORT"
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
            label="ชื่อประเภทเอกสาร (ไทย)"
            name="document_name_th"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อประเภทเอกสาร",
              },
            ]}
          >
            <Input placeholder="เช่น หนังสือเดินทาง" />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อประเภทเอกสาร (อังกฤษ)"
            name="document_name_en"
          >
            <Input placeholder="เช่น Passport" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="อธิบายประเภทเอกสารและเงื่อนไขการใช้งาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ต้องมีเลขเอกสาร"
            name="requires_document_no"
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
            label="ต้องมีวันที่ออก"
            name="requires_issue_date"
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
            label="ต้องมีวันหมดอายุ"
            name="requires_expiry_date"
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
            label="เอกสารบังคับ"
            name="is_mandatory"
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
            tooltip={
              requiresExpiryDate
                ? "ใช้เป็นค่าอ้างอิงสำหรับเอกสารที่มีวันหมดอายุ"
                : "ไม่จำเป็น หากประเภทเอกสารไม่มีวันหมดอายุ"
            }
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
