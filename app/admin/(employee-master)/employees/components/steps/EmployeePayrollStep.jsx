"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  Row,
  Select,
  Space,
} from "antd";

import {
  ApartmentOutlined,
  BankOutlined,
  DollarOutlined,
  TagsOutlined,
} from "@ant-design/icons";

import {
  useMemo,
} from "react";

function makeLabel(
  item,
  codeKey,
  nameKey
) {
  const code = item?.[codeKey];
  const name =
    item?.[nameKey] || "-";

  return code
    ? `${code} - ${name}`
    : name;
}

export default function EmployeePayrollStep({
  form,
  disabled = false,
  masterData = {},
  masterLoading = false,
}) {
  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const payrollCompanyId =
    Form.useWatch(
      "payroll_company_id",
      form
    );

  const positionLevelId =
    Form.useWatch(
      "position_level_id",
      form
  );

  const payrollCompanies =
    masterData.payrollCompanies ||
    [];

  const payrollTypes =
    masterData.payrollTypes || [];

  const payrollGroups =
    masterData.payrollGroups || [];

  const positionLevelBands =
    masterData.positionLevelBands || [];

  const payrollCompanyOptions =
    useMemo(
      () =>
        payrollCompanies
          .filter(
            (item) =>
              !companyId ||
              !item.company_id ||
              item.company_id ===
                companyId
          )
          .map((item) => ({
            value: item.id,
            label: makeLabel(
              item,
              "company_code",
              "company_name"
            ),
          })),
      [
        payrollCompanies,
        companyId,
      ]
    );

  const payrollTypeOptions =
    payrollTypes.map((item) => ({
      value: item.id,
      label: makeLabel(
        item,
        "payroll_type_code",
        "payroll_type_name"
      ),
    }));

  const payrollGroupOptions =
    payrollGroups
      .filter(
        (item) =>
          !payrollCompanyId ||
          !item.payroll_company_id ||
          item.payroll_company_id ===
            payrollCompanyId
      )
      .map((item) => ({
        value: item.id,
        label: makeLabel(
          item,
          "payroll_group_code",
          "payroll_group_name"
        ),
      }));

  

  const salaryBandOptions = useMemo(() =>
      positionLevelBands
        .filter(
          (item) =>
            !positionLevelId ||
            item.position_level_id ===
              positionLevelId
        )
        .map((item) => ({
          value: item.id,

          label: `${item.band_code} - ${item.band_name}`,
        })),
    [
      positionLevelBands,
      positionLevelId,
    ]
  );

  return (
    <div>
      <Alert
        showIcon
        type="info"
        title="ข้อมูล Payroll"
        description="เชื่อมพนักงานกับ Payroll Company, Payroll Type, Payroll Group และ Salary Band"
        className="mb-5"
      />

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <BankOutlined />
          บริษัทและรอบเงินเดือน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="บริษัทเงินเดือน"
            name="payroll_company_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกบริษัทเงินเดือน"
              options={
                payrollCompanyOptions
              }
              optionFilterProp="label"
              onChange={() => {
                form.setFieldValue(
                  "payroll_group_id",
                  undefined
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="รอบการจ่ายเงิน"
            name="payroll_type_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกรอบการจ่าย"
              options={
                payrollTypeOptions
              }
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="กลุ่มเงินเดือน"
            name="payroll_group_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !payrollCompanyId
              }
              placeholder="เลือกกลุ่มเงินเดือน"
              options={
                payrollGroupOptions
              }
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
              label="Salary Band"
              name="position_level_band_id"
          >
            <Select
              showSearch
              allowClear
              disabled={
                disabled ||
                !positionLevelId
              }
              loading={masterLoading}
              options={salaryBandOptions}
              optionFilterProp="label"
              placeholder="เลือก Salary Band"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <DollarOutlined />
          หมายเหตุด้านค่าตอบแทน
        </Space>
      </Divider>

      <Alert
        showIcon
        type="warning"
        title="ไม่บันทึกเงินเดือนในตาราง employees"
        description="Employee Wizard จะเก็บเฉพาะ Salary Band ส่วนรายการเงินเดือน (Salary Components) และอัตราเงินเดือนจริง จะจัดการในโมดูล Payroll ภายหลัง"
      />
    </div>
  );
}