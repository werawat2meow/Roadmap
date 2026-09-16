"use client";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

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
  Space,
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

function cleanText(value) {
  return String(value || "").trim();
}

function buildTaxIdentityOptions(
  selectedEmployee
) {
  const hasCitizenId =
    Boolean(
      cleanText(
        selectedEmployee?.citizen_id
      )
    );

  const hasPassport =
    Boolean(
      cleanText(
        selectedEmployee?.passport_no
      )
    );

  return TAX_IDENTITY_OPTIONS.map(
    (item) => ({
      ...item,
      disabled:
        item.value === "citizen_id"
          ? !hasCitizenId
          : item.value === "passport"
            ? !hasPassport
            : false,
    })
  );
}

export default function EmployeeStatutoryProfileForm({
  form,
  disabled = false,
  employees = [],
  companies = [],
  employeeLoading = false,
  onEmployeeSearch,
  onEmployeePopupScroll,
}) {
  /* =======================================================
     Watch Form
  ======================================================= */

  const employeeId =
    Form.useWatch(
      "employee_id",
      form
    );

  const identityType =
    Form.useWatch(
      "tax_identity_type",
      form
    );

  const taxIdentificationNo =
    Form.useWatch(
      "tax_identification_no",
      form
    ) || "";

  const taxWithholdingEnabled =
    Boolean(
      Form.useWatch(
        "tax_withholding_enabled",
        form
      )
    );

  const taxWithholdingCompanyId =
    Form.useWatch(
      "tax_withholding_company_id",
      form
    );

  const socialRegistered =
    Boolean(
      Form.useWatch(
        "social_security_registered",
        form
      )
    );

  const sameTaxAsPayroll =
    Boolean(
      Form.useWatch(
        "same_tax_as_payroll_company",
        form
      )
    );

  const sameSsoAsPayroll =
    Boolean(
      Form.useWatch(
        "same_sso_as_payroll_company",
        form
      )
    );

  const searchTimerRef =
    useRef(null);

  const taxToggleInitializedForEmployeeRef =
    useRef(null);

  /* =======================================================
     Selected Employee
  ======================================================= */

  const selectedEmployee =
    useMemo(
      () =>
        employees.find(
          (item) =>
            String(item?.id || "") ===
            String(employeeId || "")
        ) || null,
      [
        employees,
        employeeId,
      ]
    );

  const citizenId =
    cleanText(
      selectedEmployee?.citizen_id
    );

  const passportNo =
    cleanText(
      selectedEmployee?.passport_no
    );

  const hasCitizenId =
    Boolean(citizenId);

  const hasPassport =
    Boolean(passportNo);

  const hasPersonalIdentity =
    hasCitizenId ||
    hasPassport;

  /*
   * Source of Truth ของ Identity
   * - ถ้ามีเลขบัตรประชาชน ให้ใช้ก่อน
   * - ถ้าไม่มีเลขบัตรประชาชน แต่มี Passport ให้ใช้ Passport
   * - ถ้าไม่มีทั้งสองอย่าง HR สามารถใช้ Tax ID อื่นได้
   */
  const lockedIdentityType =
    hasCitizenId
      ? "citizen_id"
      : hasPassport
        ? "passport"
        : "";

  const identityPreview =
    identityType === "citizen_id"
      ? citizenId
      : identityType === "passport"
        ? passportNo
        : taxIdentificationNo;

  const taxIdentityReady =
    identityType === "citizen_id"
      ? Boolean(citizenId)
      : identityType === "passport"
        ? Boolean(passportNo)
        : identityType === "tax_id"
          ? Boolean(
              cleanText(
                taxIdentificationNo
              )
            )
          : false;

  /* =======================================================
     Options
  ======================================================= */

  const employeeOptions =
    useMemo(
      () =>
        employees.map(
          (item) => ({
            value: item.id,
            label:
              getEmployeeLabel(
                item
              ),
          })
        ),
      [employees]
    );

  const companyOptions =
    useMemo(
      () =>
        companies.map(
          (item) => ({
            value: item.id,
            label:
              getCompanyLabel(
                item
              ),
          })
        ),
      [companies]
    );

  const taxFormOptions =
    TAX_FORM_OPTIONS.map(
      (item) => ({
        value: item.value,
        label:
          `${item.label} (${item.value})`,
      })
    );

  const taxIdentityOptions =
    useMemo(
      () =>
        buildTaxIdentityOptions(
          selectedEmployee
        ),
      [selectedEmployee]
    );

  /* =======================================================
     Search
  ======================================================= */

  function handleEmployeeSearch(
    value
  ) {
    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    searchTimerRef.current =
      setTimeout(() => {
        onEmployeeSearch?.(
          value || ""
        );
      }, 350);
  }

  /* =======================================================
     Payroll Company Helper
  ======================================================= */

  function applyPayrollCompanyTo(
    fieldName,
    checked
  ) {
    if (!checked) {
      return;
    }

    const companyId =
      selectedEmployee
        ?.payroll_companies
        ?.company_id;

    if (companyId) {
      form.setFieldValue(
        fieldName,
        companyId
      );
    }
  }

  useEffect(() => {
    const payrollCompanyId =
      selectedEmployee
        ?.payroll_companies
        ?.company_id || null;

    if (sameTaxAsPayroll) {
      form.setFieldValue(
        "tax_withholding_company_id",
        payrollCompanyId ||
          undefined
      );
    }

    if (sameSsoAsPayroll) {
      form.setFieldValue(
        "social_security_company_id",
        payrollCompanyId ||
          undefined
      );
    }
  }, [
    form,
    selectedEmployee,
    sameTaxAsPayroll,
    sameSsoAsPayroll,
  ]);

  /* =======================================================
     Identity Sync
  ======================================================= */

  useEffect(() => {
    if (!selectedEmployee) {
      return;
    }

    if (lockedIdentityType) {
      form.setFieldsValue({
        tax_identity_type:
          lockedIdentityType,
        tax_identification_no:
          "",
      });

      return;
    }

    const currentType =
      form.getFieldValue(
        "tax_identity_type"
      );

    /*
     * ไม่มี Citizen ID / Passport
     * ไม่ให้ค้างอยู่ที่ identity ที่ไม่มีข้อมูล
     * HR ยังสามารถเลือก Tax ID อื่นได้
     */
    if (
      currentType ===
        "citizen_id" ||
      currentType ===
        "passport"
    ) {
      form.setFieldsValue({
        tax_identity_type:
          "tax_id",
        tax_identification_no:
          "",
      });
    }
  }, [
    form,
    selectedEmployee,
    lockedIdentityType,
  ]);

  /* =======================================================
     Tax Withholding Initialization

     tax_withholding_enabled เป็น UI Control
     ไม่สร้าง Field ใหม่ในฐานข้อมูล

     ตอน Edit:
     - ถ้ามี tax_withholding_company_id
       ถือว่าเปิด "บริษัทนำส่ง"
     - ถ้าไม่มี ถือว่า "ไม่นำส่ง"
  ======================================================= */

  useEffect(() => {
    if (!employeeId) {
      taxToggleInitializedForEmployeeRef.current =
        null;

      form.setFieldValue(
        "tax_withholding_enabled",
        false
      );

      return;
    }

    if (
      taxToggleInitializedForEmployeeRef.current ===
      String(employeeId)
    ) {
      return;
    }

    taxToggleInitializedForEmployeeRef.current =
      String(employeeId);

    form.setFieldValue(
      "tax_withholding_enabled",
      Boolean(
        form.getFieldValue(
          "tax_withholding_company_id"
        )
      )
    );
  }, [
    employeeId,
    form,
    taxWithholdingCompanyId,
  ]);

  /* =======================================================
     Tax Group Cleanup
  ======================================================= */

  useEffect(() => {
    /*
     * อ่านค่าปัจจุบันจาก Form Store อีกครั้ง
     * เพื่อป้องกันตอนเปิด Edit ที่ initialization
     * เพิ่ง set tax_withholding_enabled = true
     * ใน effect ก่อนหน้า
     */
    const currentEnabled =
      Boolean(
        form.getFieldValue(
          "tax_withholding_enabled"
        )
      );

    if (currentEnabled) {
      return;
    }

    form.setFieldsValue({
      tax_filing_form_code:
        undefined,
      tax_resident_status:
        undefined,
      same_tax_as_payroll_company:
        false,
      tax_withholding_company_id:
        undefined,
    });
  }, [
    taxWithholdingEnabled,
    form,
  ]);

  /* =======================================================
     Social Security Guard
  ======================================================= */

  useEffect(() => {
    if (
      selectedEmployee &&
      hasPersonalIdentity
    ) {
      return;
    }

    form.setFieldsValue({
      social_security_registered:
        false,
      social_security_no:
        "",
      insured_type:
        undefined,
      same_sso_as_payroll_company:
        false,
      social_security_company_id:
        undefined,
    });
  }, [
    selectedEmployee,
    hasPersonalIdentity,
    form,
  ]);

  useEffect(() => {
    if (socialRegistered) {
      return;
    }

    form.setFieldsValue({
      social_security_no:
        "",
      insured_type:
        undefined,
      same_sso_as_payroll_company:
        false,
      social_security_company_id:
        undefined,
    });
  }, [
    socialRegistered,
    form,
  ]);

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div>
      {/* ===================================================
          Employee
      =================================================== */}

      <Divider
        titlePlacement="start"
        plain
      >
        <IdcardOutlined />{" "}
        พนักงานและบริษัทเงินเดือน
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} lg={10}>
          <Form.Item
            name="employee_id"
            label="พนักงาน"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกพนักงาน",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              filterOption={false}
              onSearch={
                handleEmployeeSearch
              }
              onPopupScroll={
                onEmployeePopupScroll
              }
              loading={
                employeeLoading
              }
              options={
                employeeOptions
              }
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
          <Form.Item
            label="บริษัท/สังกัดที่ทำงาน"
          >
            <Input
              readOnly
              value={
                getCompanyLabel(
                  selectedEmployee
                    ?.companies
                )
              }
              prefix={
                <BankOutlined />
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={7}>
          <Form.Item
            label="บริษัทเงินเดือน (อ้างอิงจาก Employee Master)"
          >
            <Input
              readOnly
              value={
                getPayrollCompanyLabel(
                  selectedEmployee
                )
              }
              prefix={
                <BankOutlined />
              }
            />
          </Form.Item>
        </Col>
      </Row>

      {selectedEmployee ? (
        <Space
          orientation="vertical"
          size={10}
          className="mb-4 w-full"
        >
          <Alert
            type={
              hasPersonalIdentity
                ? "success"
                : "warning"
            }
            showIcon
            title={
              hasPersonalIdentity
                ? "พบข้อมูลยืนยันตัวตนจาก Employee Master"
                : "ยังไม่มีเลขบัตรประชาชนหรือ Passport"
            }
            description={
              hasPersonalIdentity
                ? `ระบบจะใช้ ${
                    lockedIdentityType ===
                    "citizen_id"
                      ? "เลขบัตรประชาชน"
                      : "Passport"
                  } เป็นข้อมูลอ้างอิงหลักโดยอัตโนมัติ`
                : "HR สามารถใช้ Tax ID อื่นสำหรับภาษีได้ แต่ยังไม่สามารถเปิดขึ้นทะเบียนประกันสังคมได้จนกว่าจะมีเลขบัตรประชาชนหรือ Passport ใน Employee Master"
            }
          />

          <Alert
            type="info"
            showIcon
            title="Legal Relationship แยกจากบริษัทที่ทำงานได้"
            description="บริษัทเงินเดือน, บริษัทนำส่งภาษี และบริษัทขึ้นทะเบียนประกันสังคมสามารถเป็นคนละนิติบุคคลกันได้ ระบบจะใช้ Employee Scope ควบคุมว่าคุณแก้ข้อมูลของพนักงานคนใดได้"
          />
        </Space>
      ) : null}

      {/* ===================================================
          Tax Identity
      =================================================== */}

      <Divider
        titlePlacement="start"
        plain
      >
        <FileProtectOutlined />{" "}
        ข้อมูลภาษีเงินได้บุคคลธรรมดา
      </Divider>

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="ข้อมูลภาษีแบ่งเป็นข้อมูลอ้างอิงตัวตน และข้อมูลการนำส่งภาษี"
        description="ข้อมูลอ้างอิงตัวตนใช้จาก Employee Master เมื่อมีเลขบัตรประชาชนหรือ Passport ส่วนข้อมูลแบบภาษี สถานะทางภาษี และบริษัทนำส่ง จะบังคับเฉพาะเมื่อเปิด 'บริษัทเป็นผู้หักและนำส่งภาษี'"
      />

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="tax_identity_type"
            label="เลขประจำตัวสำหรับภาษี"
            required={
              taxWithholdingEnabled
            }
            rules={[
              {
                validator: (
                  _,
                  value
                ) => {
                  if (
                    !taxWithholdingEnabled
                  ) {
                    return Promise.resolve();
                  }

                  if (!value) {
                    return Promise.reject(
                      new Error(
                        "กรุณาเลือก Tax Identity"
                      )
                    );
                  }

                  if (
                    lockedIdentityType &&
                    value !==
                      lockedIdentityType
                  ) {
                    return Promise.reject(
                      new Error(
                        "Tax Identity ต้องอ้างอิงข้อมูลจาก Employee Master"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select
              allowClear={
                !lockedIdentityType
              }
              options={
                taxIdentityOptions
              }
              disabled={
                disabled ||
                Boolean(
                  lockedIdentityType
                )
              }
              placeholder="เลือก Tax Identity"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          {identityType ===
          "tax_id" ? (
            <Form.Item
              name="tax_identification_no"
              label="เลขประจำตัวผู้เสียภาษี"
              required={
                taxWithholdingEnabled
              }
              rules={[
                {
                  validator: (
                    _,
                    value
                  ) => {
                    if (
                      !taxWithholdingEnabled
                    ) {
                      return Promise.resolve();
                    }

                    if (
                      !cleanText(
                        value
                      )
                    ) {
                      return Promise.reject(
                        new Error(
                          "กรุณากรอกเลขประจำตัวผู้เสียภาษี"
                        )
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                disabled={disabled}
                maxLength={30}
                placeholder="Tax Identification Number"
              />
            </Form.Item>
          ) : (
            <Form.Item
              label="เลขที่ใช้อ้างอิงจาก Employee Master"
              required={
                taxWithholdingEnabled
              }
            >
              <Input
                readOnly
                value={
                  identityPreview ||
                  "ยังไม่มีข้อมูล"
                }
                status={
                  taxWithholdingEnabled &&
                  !identityPreview
                    ? "error"
                    : undefined
                }
              />
            </Form.Item>
          )}
        </Col>

        {/* ===============================================
            Tax Withholding Switch
        =============================================== */}

        <Col xs={24} md={8}>
          <Form.Item
            name="tax_withholding_enabled"
            label="บริษัทเป็นผู้หักและนำส่งภาษี"
            valuePropName="checked"
          >
            <Switch
              disabled={
                disabled ||
                !selectedEmployee ||
                !taxIdentityReady
              }
              checkedChildren="บริษัทนำส่ง"
              unCheckedChildren="ไม่นำส่ง"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Text type="secondary">
            {!selectedEmployee
              ? "กรุณาเลือกพนักงานก่อน"
              : !taxIdentityReady
                ? "กรุณาระบุข้อมูลอ้างอิงสำหรับภาษีก่อน จึงจะสามารถเปิดการนำส่งภาษีโดยบริษัทได้"
                : taxWithholdingEnabled
                  ? "บริษัทเป็นผู้หักและนำส่งภาษี กรุณากรอกข้อมูลในกลุ่มด้านล่างให้ครบ"
                  : "พนักงานรายนี้ไม่ใช้บริษัทเป็นผู้หักและนำส่งภาษี จึงไม่ต้องกรอกข้อมูลกลุ่มนำส่งภาษี"}
          </Text>
        </Col>

        {taxWithholdingEnabled ? (
          <>
            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                name="tax_filing_form_code"
                label="แบบภาษี / การยื่น"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุแบบภาษี / การยื่น",
                  },
                ]}
              >
                <AutoComplete
                  disabled={
                    disabled
                  }
                  options={
                    taxFormOptions
                  }
                  placeholder="เช่น PND91 / PND92 หรือระบุรหัสอื่น"
                  filterOption={(
                    inputValue,
                    option
                  ) =>
                    String(
                      option?.label ||
                        ""
                    )
                      .toLowerCase()
                      .includes(
                        String(
                          inputValue ||
                            ""
                        ).toLowerCase()
                      )
                  }
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                name="tax_resident_status"
                label="สถานะผู้มีถิ่นที่อยู่ทางภาษี"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกสถานะผู้มีถิ่นที่อยู่ทางภาษี",
                  },
                ]}
              >
                <Select
                  options={
                    TAX_RESIDENT_OPTIONS
                  }
                  disabled={
                    disabled
                  }
                  placeholder="เลือกสถานะทางภาษี"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="same_tax_as_payroll_company"
                valuePropName="checked"
              >
                <Checkbox
                  disabled={
                    disabled ||
                    !selectedEmployee
                      ?.payroll_companies
                      ?.company_id
                  }
                  onChange={(
                    event
                  ) =>
                    applyPayrollCompanyTo(
                      "tax_withholding_company_id",
                      event.target
                        .checked
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
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกบริษัทนำส่งภาษี",
                  },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={
                    companyOptions
                  }
                  disabled={
                    disabled ||
                    sameTaxAsPayroll
                  }
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>
          </>
        ) : null}
      </Row>

      {/* ===================================================
          Social Security
      =================================================== */}

      <Divider
        titlePlacement="start"
        plain
      >
        <SafetyCertificateOutlined />{" "}
        ข้อมูลประกันสังคม
      </Divider>

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="เปิดขึ้นทะเบียนเมื่อข้อมูลยืนยันตัวตนพร้อมแล้ว"
        description="หากยังไม่มีเลขบัตรประชาชนหรือ Passport ระบบจะปิดสวิตช์ไว้ เมื่อเปิดขึ้นทะเบียนแล้ว ข้อมูลประกันสังคมที่สำคัญจะถูกบังคับให้กรอกครบก่อนบันทึก"
      />

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="social_security_registered"
            label="ขึ้นทะเบียนประกันสังคม"
            valuePropName="checked"
          >
            <Switch
              disabled={
                disabled ||
                !selectedEmployee ||
                !hasPersonalIdentity
              }
              checkedChildren="ขึ้นทะเบียน"
              unCheckedChildren="ไม่ขึ้นทะเบียน"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Text type="secondary">
            {!selectedEmployee
              ? "กรุณาเลือกพนักงานก่อน"
              : !hasPersonalIdentity
                ? "ยังไม่มีเลขบัตรประชาชนหรือ Passport จึงยังไม่สามารถเปิดขึ้นทะเบียนประกันสังคมได้"
                : socialRegistered
                  ? "เปิดขึ้นทะเบียนแล้ว กรุณากรอกข้อมูลประกันสังคมให้ครบ"
                  : "ยังไม่ขึ้นทะเบียนประกันสังคม"}
          </Text>
        </Col>

        {socialRegistered ? (
          <>
            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                name="social_security_no"
                label="เลขประกันสังคม"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณากรอกเลขประกันสังคม",
                  },
                ]}
              >
                <Input
                  disabled={
                    disabled
                  }
                  maxLength={20}
                  placeholder="เลขประกันสังคม"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                name="insured_type"
                label="ประเภทผู้ประกันตน"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกประเภทผู้ประกันตน",
                  },
                ]}
              >
                <Select
                  options={
                    INSURED_TYPE_OPTIONS
                  }
                  disabled={
                    disabled
                  }
                  placeholder="เลือกประเภทผู้ประกันตน"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="same_sso_as_payroll_company"
                valuePropName="checked"
              >
                <Checkbox
                  disabled={
                    disabled ||
                    !selectedEmployee
                      ?.payroll_companies
                      ?.company_id
                  }
                  onChange={(
                    event
                  ) =>
                    applyPayrollCompanyTo(
                      "social_security_company_id",
                      event.target
                        .checked
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
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกบริษัทประกันสังคม",
                  },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={
                    companyOptions
                  }
                  disabled={
                    disabled ||
                    sameSsoAsPayroll
                  }
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>
          </>
        ) : null}
      </Row>

      {/* ===================================================
          Effective History
      =================================================== */}

      <Divider
        titlePlacement="start"
        plain
      >
        ช่วงเวลาที่มีผล
      </Divider>

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="ข้อมูลหน้านี้เป็น Effective History"
        description="วันที่เริ่มมีผลใช้กำหนดช่วงเวลาที่ข้อมูลภาษีและประกันสังคมชุดนี้มีผล ระบบเก็บประวัติเดิมไว้ ไม่ Hard Delete"
      />

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="effective_from"
            label="วันที่เริ่มมีผล"
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
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="effective_to"
            label="วันที่สิ้นสุด"
            dependencies={[
              "effective_from",
            ]}
            rules={[
              ({
                getFieldValue,
              }) => ({
                validator(
                  _,
                  value
                ) {
                  const from =
                    getFieldValue(
                      "effective_from"
                    );

                  if (
                    !value ||
                    !from
                  ) {
                    return Promise.resolve();
                  }

                  if (
                    value.isBefore(
                      from,
                      "day"
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="status"
            label="สถานะ"
          >
            <Select
              options={
                STATUS_OPTIONS
              }
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="remark"
            label="หมายเหตุ"
          >
            <Input.TextArea
              rows={3}
              disabled={disabled}
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>

      <Text
        type="secondary"
        className="!text-xs"
      >
        * การปิดใช้งานจะเก็บประวัติไว้
        ไม่ Hard Delete ข้อมูล Statutory
        ของพนักงาน
      </Text>
    </div>
  );
}
