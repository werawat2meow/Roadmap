"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";

import {
  BankOutlined,
  DollarOutlined,
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

function sameId(left, right) {
  if (!left || !right) {
    return false;
  }

  return String(left) === String(right);
}

export default function EmployeePayrollStep({
  form,
  mode = "create",
  disabled = false,
  masterData = {},
  masterLoading = false,
}) {
  /*
    company_id และ position_level_id อยู่คนละ Step
    กับ Payroll Step และ Step ก่อนหน้าจะถูก unmount
    ตอนเปลี่ยนหน้า Wizard

    preserve: true ทำให้ useWatch อ่านค่าที่ Form เก็บไว้
    แม้ field นั้นไม่ได้ mount อยู่ใน Step ปัจจุบัน
  */
  const companyId =
    Form.useWatch(
      "company_id",
      {
        form,
        preserve: true,
      }
    );

  const payrollCompanyId =
    Form.useWatch(
      "payroll_company_id",
      form
    );

  const payrollTypeId =
    Form.useWatch(
      "payroll_type_id",
      form
    );

  const positionLevelId =
    Form.useWatch(
      "position_level_id",
      {
        form,
        preserve: true,
      }
    );

  const positionLevelBandId =
    Form.useWatch(
      "position_level_band_id",
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
              sameId(
                item.company_id,
                companyId
              )
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
    useMemo(
      () =>
        payrollGroups
          .filter((item) => {
            if (
              payrollCompanyId &&
              item.payroll_company_id &&
              !sameId(
                item.payroll_company_id,
                payrollCompanyId
              )
            ) {
              return false;
            }

            if (
              payrollTypeId &&
              item.payroll_type_id &&
              !sameId(
                item.payroll_type_id,
                payrollTypeId
              )
            ) {
              return false;
            }

            return true;
          })
          .map((item) => ({
            value: item.id,
            label: makeLabel(
              item,
              "payroll_group_code",
              "payroll_group_name"
            ),
          })),
      [
        payrollGroups,
        payrollCompanyId,
        payrollTypeId,
      ]
    );

  const salaryBandOptions = useMemo(
    () =>
      positionLevelBands
        .filter(
          (item) =>
            !positionLevelId ||
            sameId(
              item.position_level_id,
              positionLevelId
            )
        )
        .map((item) => ({
          value: item.id,
          label: `${item.band_code} - ${item.band_name}`,
        })),
    [positionLevelBands, positionLevelId]
  );

  const selectedSalaryBand =
    useMemo(
      () =>
        positionLevelBands.find(
          (item) =>
            sameId(
              item.id,
              positionLevelBandId
            )
        ) || null,
      [
        positionLevelBands,
        positionLevelBandId,
      ]
    );

  const salaryBandRangeText =
    selectedSalaryBand
      ? [
          selectedSalaryBand.salary_min,
          selectedSalaryBand.salary_mid,
          selectedSalaryBand.salary_max,
        ]
          .map((value) =>
            value === null ||
            value === undefined
              ? "-"
              : Number(value).toLocaleString(
                  "th-TH",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )
          )
          .join(" / ")
      : null;

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
            label="กลุ่มเงินเดือน"
            name="payroll_group_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !payrollCompanyId ||
                !payrollTypeId
              }
              placeholder={
                !payrollCompanyId
                  ? "กรุณาเลือกบริษัทเงินเดือนก่อน"
                  : !payrollTypeId
                    ? "กรุณาเลือกรอบการจ่ายเงินก่อน"
                    : "เลือกกลุ่มเงินเดือน"
              }
              options={
                payrollGroupOptions
              }
              optionFilterProp="label"
              notFoundContent={
                masterLoading
                  ? "กำลังโหลดกลุ่มเงินเดือน..."
                  : "ไม่พบกลุ่มเงินเดือนที่ตรงกับบริษัทและรอบการจ่ายเงิน"
              }
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
            rules={[
              {
                required: mode === "create",
                message:
                  "กรุณาเลือก Salary Band",
              },
            ]}
            extra={
              salaryBandRangeText
                ? `Min / Mid / Max: ${salaryBandRangeText} บาท`
                : !positionLevelId
                  ? "กรุณาเลือกระดับตำแหน่งก่อน"
                  : salaryBandOptions.length === 0 &&
                      !masterLoading
                    ? "ไม่พบ Salary Band ที่เปิดใช้งานสำหรับระดับตำแหน่งนี้"
                    : null
            }
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
              placeholder={
                positionLevelId
                  ? "เลือก Salary Band"
                  : "กรุณาเลือกระดับตำแหน่งก่อน"
              }
              notFoundContent={
                masterLoading
                  ? "กำลังโหลด Salary Band..."
                  : "ไม่พบ Salary Band ของระดับตำแหน่งนี้"
              }
              onChange={() => {
                form.setFieldValue(
                  "base_salary",
                  undefined
                );
              }}
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
          เงินเดือนฐานเริ่มต้น
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="เงินเดือนฐาน (Base Salary)"
            name="base_salary"
            rules={[
              {
                required: mode === "create",
                message:
                  "กรุณาระบุเงินเดือนฐาน",
              },
              {
                validator: (_, value) => {
                  if (
                    value === undefined ||
                    value === null ||
                    value === ""
                  ) {
                    return Promise.resolve();
                  }

                  if (Number(value) < 0) {
                    return Promise.reject(
                      new Error(
                        "เงินเดือนฐานต้องไม่น้อยกว่า 0"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
            extra={
              mode === "edit"
                ? "การปรับเงินเดือนหลังเริ่มงานให้ทำผ่านโมดูลค่าตอบแทน เพื่อเก็บประวัติ Effective Date"
                : "บันทึกเป็นค่าตอบแทนเริ่มต้นของพนักงานใน employee_compensations"
            }
          >
            <InputNumber
              min={0}
              precision={2}
              step={100}
              className="w-full"
              disabled={
                disabled ||
                mode === "edit"
              }
              suffix="THB"
              placeholder="เช่น 25,000.00"
              formatter={(value) =>
                value === undefined ||
                value === null ||
                value === ""
                  ? ""
                  : String(value).replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    )
              }
              parser={(value) =>
                String(value || "").replace(
                  /,/g,
                  ""
                )
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Alert
        showIcon
        type="info"
        title="ไม่เก็บเงินเดือนฐานไว้ในตาราง employees"
        description="ตอนสร้างพนักงาน ระบบจะบันทึก Base Salary พร้อม Salary Band, Position, Payroll Company/Type/Group และ snapshot ช่วงเงินเดือนลง employee_compensations"
      />
    </div>
  );
}