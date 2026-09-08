"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  Alert,
  AutoComplete,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Typography,
} from "antd";

import {
  BankOutlined,
  FileProtectOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import {
  INSURED_TYPE_OPTIONS,
  STATUS_OPTIONS,
  TAX_FORM_OPTIONS,
  TAX_IDENTITY_OPTIONS,
  TAX_RESIDENT_OPTIONS,
  getCompanyLabel,
  getEmployeeLabel,
  getPayrollCompanyLabel,
} from "./statutoryProfileOptions";

const { Text } = Typography;

export default function EmployeeStatutoryProfileForm({
  form,
  disabled = false,
  employees = [],
  companies = [],
  employeeLoading = false,
  onEmployeeSearch,
  onEmployeePopupScroll,
}) {
  const employeeId = Form.useWatch("employee_id", form);
  const identityType = Form.useWatch("tax_identity_type", form);
  const socialRegistered = Form.useWatch("social_security_registered", form);
  const sameTaxAsPayroll = Form.useWatch("same_tax_as_payroll_company", form);
  const sameSsoAsPayroll = Form.useWatch("same_sso_as_payroll_company", form);

  const searchTimerRef = useRef(null);

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === employeeId) || null,
    [employees, employeeId]
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((item) => ({
        value: item.id,
        label: getEmployeeLabel(item),
      })),
    [employees]
  );

  const companyOptions = useMemo(
    () =>
      companies.map((item) => ({
        value: item.id,
        label: getCompanyLabel(item),
      })),
    [companies]
  );

  const taxFormOptions = TAX_FORM_OPTIONS.map((item) => ({
    value: item.value,
    label: `${item.label} (${item.value})`,
  }));

  function handleEmployeeSearch(value) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onEmployeeSearch?.(value || "");
    }, 350);
  }

  function applyPayrollCompanyTo(fieldName, checked) {
    if (!checked) return;
    const companyId = selectedEmployee?.payroll_companies?.company_id;
    if (companyId) {
      form.setFieldValue(fieldName, companyId);
    }
  }

  useEffect(() => {
    const payrollCompanyId =
      selectedEmployee?.payroll_companies?.company_id || null;

    if (sameTaxAsPayroll) {
      form.setFieldValue(
        "tax_withholding_company_id",
        payrollCompanyId || undefined
      );
    }

    if (sameSsoAsPayroll) {
      form.setFieldValue(
        "social_security_company_id",
        payrollCompanyId || undefined
      );
    }
  }, [
    form,
    selectedEmployee,
    sameTaxAsPayroll,
    sameSsoAsPayroll,
  ]);

  const identityPreview =
    identityType === "citizen_id"
      ? selectedEmployee?.citizen_id
      : identityType === "passport"
        ? selectedEmployee?.passport_no
        : null;

  return (
    <div>
      <Divider titlePlacement="start" plain>
        <IdcardOutlined /> พนักงานและบริษัทเงินเดือน
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} lg={10}>
          <Form.Item
            name="employee_id"
            label="พนักงาน"
            rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
          >
            <Select
              showSearch
              allowClear
              filterOption={false}
              onSearch={handleEmployeeSearch}
              onPopupScroll={onEmployeePopupScroll}
              loading={employeeLoading}
              options={employeeOptions}
              placeholder="ค้นหารหัสพนักงาน / ชื่อ / บัตรประชาชน / Passport"
              disabled={disabled}
              notFoundContent={
                employeeLoading
                  ? "กำลังโหลดพนักงาน..."
                  : "ไม่พบพนักงาน"
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={7}>
          <Form.Item label="บริษัท/สังกัดที่ทำงาน">
            <Input
              readOnly
              value={getCompanyLabel(selectedEmployee?.companies)}
              prefix={<BankOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={7}>
          <Form.Item label="บริษัทเงินเดือน (อ้างอิงจาก Employee Master)">
            <Input
              readOnly
              value={getPayrollCompanyLabel(selectedEmployee)}
              prefix={<BankOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      {selectedEmployee ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          title="Legal Relationship แยกจากบริษัทที่ทำงานได้"
          description="บริษัทเงินเดือน, บริษัทนำส่งภาษี และบริษัทขึ้นทะเบียนประกันสังคมสามารถเป็นคนละนิติบุคคลกันได้ ระบบจะใช้ Employee Scope ควบคุมว่าคุณแก้ข้อมูลของพนักงานคนใดได้"
        />
      ) : null}

      <Divider titlePlacement="start" plain>
        <FileProtectOutlined /> ข้อมูลภาษีเงินได้บุคคลธรรมดา
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="tax_identity_type"
            label="เลขประจำตัวสำหรับภาษี"
            rules={[{ required: true, message: "กรุณาเลือก Tax Identity" }]}
          >
            <Select options={TAX_IDENTITY_OPTIONS} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          {identityType === "tax_id" ? (
            <Form.Item
              name="tax_identification_no"
              label="เลขประจำตัวผู้เสียภาษี"
              rules={[{ required: true, message: "กรุณากรอกเลขประจำตัวผู้เสียภาษี" }]}
            >
              <Input disabled={disabled} placeholder="Tax Identification Number" />
            </Form.Item>
          ) : (
            <Form.Item label="เลขที่ใช้อ้างอิงจาก Employee Master">
              <Input
                readOnly
                value={identityPreview || "ยังไม่มีข้อมูล"}
                status={selectedEmployee && !identityPreview ? "error" : undefined}
              />
            </Form.Item>
          )}
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="tax_filing_form_code" label="แบบภาษี / การยื่น">
            <AutoComplete
              disabled={disabled}
              options={taxFormOptions}
              placeholder="เช่น PND91 / PND92 หรือระบุรหัสอื่น"
              filterOption={(inputValue, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(String(inputValue || "").toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="tax_resident_status"
            label="สถานะผู้มีถิ่นที่อยู่ทางภาษี"
          >
            <Select options={TAX_RESIDENT_OPTIONS} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="same_tax_as_payroll_company" valuePropName="checked">
            <Checkbox
              disabled={disabled || !selectedEmployee?.payroll_companies?.company_id}
              onChange={(event) =>
                applyPayrollCompanyTo(
                  "tax_withholding_company_id",
                  event.target.checked
                )
              }
            >
              ใช้นิติบุคคลเดียวกับบริษัทเงินเดือนสำหรับการนำส่งภาษี
            </Checkbox>
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="tax_withholding_company_id"
            label="บริษัทผู้จ่ายเงินได้ / บริษัทนำส่งภาษี"
            rules={[{ required: true, message: "กรุณาเลือกบริษัทนำส่งภาษี" }]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              options={companyOptions}
              disabled={disabled || sameTaxAsPayroll}
              placeholder="เลือก Company Master"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="start" plain>
        <SafetyCertificateOutlined /> ข้อมูลประกันสังคม
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24}>
          <Form.Item
            name="social_security_registered"
            label="ขึ้นทะเบียนประกันสังคม"
            valuePropName="checked"
          >
            <Switch disabled={disabled} checkedChildren="ขึ้นทะเบียน" unCheckedChildren="ไม่ขึ้นทะเบียน" />
          </Form.Item>
        </Col>

        {socialRegistered ? (
          <>
            <Col xs={24} md={12}>
              <Form.Item
                name="social_security_no"
                label="เลขประกันสังคม"
                rules={[{ required: true, message: "กรุณากรอกเลขประกันสังคม" }]}
              >
                <Input disabled={disabled} placeholder="เลขประกันสังคม" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="insured_type"
                label="ประเภทผู้ประกันตน"
                rules={[{ required: true, message: "กรุณาเลือกประเภทผู้ประกันตน" }]}
              >
                <Select options={INSURED_TYPE_OPTIONS} disabled={disabled} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="same_sso_as_payroll_company" valuePropName="checked">
                <Checkbox
                  disabled={disabled || !selectedEmployee?.payroll_companies?.company_id}
                  onChange={(event) =>
                    applyPayrollCompanyTo(
                      "social_security_company_id",
                      event.target.checked
                    )
                  }
                >
                  ใช้นิติบุคคลเดียวกับบริษัทเงินเดือนสำหรับประกันสังคม
                </Checkbox>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="social_security_company_id"
                label="บริษัทที่ขึ้นทะเบียน / นำส่งประกันสังคม"
                rules={[{ required: true, message: "กรุณาเลือกบริษัทประกันสังคม" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={companyOptions}
                  disabled={disabled || sameSsoAsPayroll}
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>
          </>
        ) : null}
      </Row>

      <Divider titlePlacement="start" plain>
        ช่วงเวลาที่มีผล
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="effective_from"
            label="วันที่เริ่มมีผล"
            rules={[{ required: true, message: "กรุณาเลือกวันที่เริ่มมีผล" }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item name="effective_to" label="วันที่สิ้นสุด">
            <DatePicker className="w-full" format="DD/MM/YYYY" disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item name="status" label="สถานะ">
            <Select options={STATUS_OPTIONS} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="remark" label="หมายเหตุ">
            <Input.TextArea rows={3} disabled={disabled} placeholder="หมายเหตุเพิ่มเติม" />
          </Form.Item>
        </Col>
      </Row>

      <Text type="secondary" className="!text-xs">
        * การปิดใช้งานจะเก็บประวัติไว้ ไม่ Hard Delete ข้อมูล Statutory ของพนักงาน
      </Text>
    </div>
  );
}
