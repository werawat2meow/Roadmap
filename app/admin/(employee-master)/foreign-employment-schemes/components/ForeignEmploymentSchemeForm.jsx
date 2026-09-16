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

const { TextArea } = Input;

export const SCHEME_CATEGORY_OPTIONS = [
  {
    value: "mou",
    label: "MOU Foreign Worker",
  },
  {
    value: "direct_hire",
    label: "Direct Hire Foreign Employee",
  },
  {
    value: "expat",
    label: "Expat / Foreign Specialist",
  },
  {
    value: "boi",
    label: "BOI Sponsored Foreign Employee",
  },
  {
    value: "contractor",
    label: "Foreign Contractor",
  },
  {
    value: "other",
    label: "Other",
  },
];

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
    company_id: undefined,
    scheme_code: "",
    scheme_name_th: "",
    scheme_name_en: "",
    scheme_category: "other",
    description: "",
    requires_visa: true,
    requires_work_permit: true,
    effective_date: null,
    expire_date: null,
    status: "active",
    sort_order: 0,
    remark: "",
  };
}

export default function ForeignEmploymentSchemeForm({
  form,
  companies = [],
  companyLoading = false,
  mode = "create",
  saving = false,
  onFinish,
}) {
  const disabled =
    mode === "view" || saving;

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      initialValues={getInitialValues()}
      onFinish={onFinish}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={companyLoading}
              placeholder="เลือกบริษัท"
              optionFilterProp="label"
              options={companies}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ประเภทรูปแบบการจ้าง"
            name="scheme_category"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภทรูปแบบการจ้าง",
              },
            ]}
          >
            <Select
              options={
                SCHEME_CATEGORY_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รหัสรูปแบบการจ้าง"
            name="scheme_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสรูปแบบการจ้าง",
              },
              {
                max: 50,
                message:
                  "รหัสต้องไม่เกิน 50 ตัวอักษร",
              },
            ]}
          >
            <Input
              placeholder="เช่น MOU_WORKER"
              onInput={(event) => {
                event.currentTarget.value =
                  event.currentTarget.value.toUpperCase();
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="ชื่อรูปแบบการจ้าง (ไทย)"
            name="scheme_name_th"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อรูปแบบการจ้าง",
              },
            ]}
          >
            <Input placeholder="เช่น แรงงานต่างชาติระบบ MOU" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="ชื่อรูปแบบการจ้าง (อังกฤษ)"
            name="scheme_name_en"
          >
            <Input placeholder="เช่น MOU Foreign Worker" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="อธิบายเงื่อนไขหรือวัตถุประสงค์ของรูปแบบการจ้าง"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ต้องมี Visa"
            name="requires_visa"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ต้องมี Work Permit"
            name="requires_work_permit"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="สถานะ"
            name="status"
          >
            <Select
              options={STATUS_OPTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
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

        <Col xs={24} md={12}>
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

        <Col xs={24} md={12}>
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={[
              "effective_date",
            ]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
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
              className="w-full"
              format="DD/MM/YYYY"
              allowClear
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea rows={2} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
