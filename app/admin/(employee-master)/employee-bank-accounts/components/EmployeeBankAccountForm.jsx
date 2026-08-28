"use client";

import { Col, DatePicker, Form, Input, Row, Select, Switch } from "antd";

import EmployeeBankAccountEmployeeSelect from "./EmployeeBankAccountEmployeeSelect";

const { TextArea } = Input;

function getBankLabel(bank) {
  const code = bank?.bank_code || bank?.code || "";
  const name =
    bank?.bank_name_th ||
    bank?.bank_name ||
    bank?.bank_name_en ||
    bank?.name ||
    "-";

  return code ? `${code} - ${name}` : name;
}

function getPaymentMethodLabel(item) {
  const code =
    item?.payment_method_code || item?.method_code || item?.code || "";
  const name =
    item?.payment_method_name || item?.method_name || item?.name || "-";

  return code ? `${code} - ${name}` : name;
}

export default function EmployeeBankAccountForm({
  form,
  editing = null,
  viewMode = false,
  saving = false,
  banks = [],
  paymentMethods = [],
}) {
  const disabled = viewMode || saving;

  return (
    <Form form={form} layout="vertical" disabled={disabled} preserve={false}>
      <Row gutter={[16, 0]}>
        <Col xs={24} lg={12}>
          <Form.Item
            label="พนักงาน"
            name="employee_id"
            rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
          >
            <EmployeeBankAccountEmployeeSelect
              initialEmployee={editing?.employees || null}
              disabled={disabled}
              allowClear={!viewMode}
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={12}>
          <Form.Item
            label="ธนาคาร"
            name="bank_id"
            rules={[{ required: true, message: "กรุณาเลือกธนาคาร" }]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="เลือกธนาคาร"
              options={banks.map((item) => ({
                value: item.id,
                label: getBankLabel(item),
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={12}>
          <Form.Item
            label="เลขที่บัญชี"
            name="account_no"
            rules={[
              {
                required: true,
                message: "กรุณากรอกเลขที่บัญชี",
              },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const digits =
                    String(value).replace(
                      /\D/g,
                      ""
                    );

                  if (digits.length !== 10) {
                    return Promise.reject(
                      new Error(
                        "เลขบัญชีต้องมี 10 หลัก"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
            getValueFromEvent={(event) => {
              const digits =
                String(
                  event?.target?.value ||
                    ""
                )
                  .replace(/\D/g, "")
                  .slice(0, 10);

              /*
              * 1234567890
              * ↓
              * 123-4-56789-0
              */
              if (digits.length <= 3) {
                return digits;
              }

              if (digits.length <= 4) {
                return `${digits.slice(
                  0,
                  3
                )}-${digits.slice(3)}`;
              }

              if (digits.length <= 9) {
                return `${digits.slice(
                  0,
                  3
                )}-${digits.slice(
                  3,
                  4
                )}-${digits.slice(4)}`;
              }

              return `${digits.slice(
                0,
                3
              )}-${digits.slice(
                3,
                4
              )}-${digits.slice(
                4,
                9
              )}-${digits.slice(9, 10)}`;
            }}
          >
            <Input
              placeholder="123-4-56789-0"
              inputMode="numeric"
              autoComplete="off"
              maxLength={13}
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={12}>
          <Form.Item
            label="ชื่อบัญชี"
            name="account_name"
            rules={[{ required: true, message: "กรุณากรอกชื่อบัญชี" }]}
          >
            <Input placeholder="ชื่อเจ้าของบัญชี" autoComplete="off" />
          </Form.Item>
        </Col>

        <Col xs={24} lg={12}>
          <Form.Item label="วิธีการจ่ายเงิน" name="payment_method_id">
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="เลือกวิธีการจ่ายเงิน"
              options={paymentMethods.map((item) => ({
                value: item.id,
                label: getPaymentMethodLabel(item),
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={12}>
          <Form.Item label="สาขาธนาคาร" name="branch_name">
            <Input placeholder="ระบุสาขา (ถ้ามี)" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="วันที่เริ่มใช้งาน"
            name="effective_date"
            rules={[{ required: true, message: "กรุณาเลือกวันที่เริ่มใช้งาน" }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={["effective_date"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue("effective_date");

                  if (
                    !value ||
                    !start ||
                    !value.isBefore(start, "day")
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้งาน"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="สถานะ"
            name="status"
            rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
          >
            <Select
              options={[
                { value: "active", label: "ใช้งาน" },
                { value: "inactive", label: "ไม่ใช้งาน" },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="บัญชีหลักรับเงินเดือน"
            name="is_primary"
            valuePropName="checked"
          >
            <Switch checkedChildren="หลัก" unCheckedChildren="รอง" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item label="หมายเหตุ" name="remark">
            <TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
