"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  Input,
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
  useEffect,
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

function normalizeBankAccountNo(
  value
) {
  return String(
    value || ""
  )
    .replace(/\D/g, "")
    .slice(0, 10);
}

function formatBankAccountNo(
  value
) {
  const digits =
    normalizeBankAccountNo(
      value
    );

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9, 10)}`;
}

function getBankLabel(
  item
) {
  const code =
    item?.bank_code ||
    item?.code ||
    "";

  const name =
    item?.bank_name_th ||
    item?.bank_name ||
    item?.bank_name_en ||
    item?.name ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function getPaymentMethodLabel(
  item
) {
  const code =
    item?.payment_method_code ||
    item?.method_code ||
    item?.code ||
    "";

  const name =
    item?.payment_method_name ||
    item?.method_name ||
    item?.name ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
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

  const paymentMethodId =
    Form.useWatch(
      "payment_method_id",
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

  const positionId =
    Form.useWatch(
      "position_id",
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

  const positions =
    masterData.positions || [];

  const banks =
    masterData.banks || [];

  const paymentMethods =
    masterData.paymentMethods || [];

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

  const bankOptions =
    useMemo(
      () =>
        banks.map((item) => ({
          value: item.id,
          label: getBankLabel(
            item
          ),
        })),
      [banks]
    );

  const paymentMethodOptions =
    useMemo(
      () =>
        paymentMethods
          .filter(
            (item) =>
              item?.supports_payroll !==
              false
          )
          .map(
            (item) => ({
              value: item.id,
              label:
                getPaymentMethodLabel(
                  item
                ),
            })
          ),
      [paymentMethods]
    );

  const selectedPaymentMethod =
    useMemo(
      () =>
        paymentMethods.find(
          (item) =>
            sameId(
              item.id,
              paymentMethodId
            )
        ) || null,
      [
        paymentMethods,
        paymentMethodId,
      ]
    );

  const paymentMethodRequiresBank =
    Boolean(
      selectedPaymentMethod?.bank_required
    ) ||
    selectedPaymentMethod?.payment_type ===
      "bank_transfer";

  /*
   * CASH / วิธีจ่ายที่ไม่ใช้บัญชีธนาคาร:
   * ล้างข้อมูลธนาคารเดิมเพื่อไม่ให้ค่าที่เคยกรอกค้างไปกับ Payload
   *
   * ทำเฉพาะ Create Step นี้
   * ไม่กระทบ Employee API / Payroll / Compensation logic อื่น
   */
  useEffect(() => {
    if (
      mode !== "create" ||
      !paymentMethodId ||
      !selectedPaymentMethod ||
      paymentMethodRequiresBank
    ) {
      return;
    }

    form.setFields([
      {
        name: "bank_id",
        value: undefined,
        errors: [],
      },
      {
        name: "bank_account_no",
        value: "",
        errors: [],
      },
      {
        name: "bank_account_name",
        value: "",
        errors: [],
      },
      {
        name: "bank_branch_name",
        value: "",
        errors: [],
      },
    ]);
  }, [
    form,
    mode,
    paymentMethodId,
    paymentMethodRequiresBank,
    selectedPaymentMethod,
  ]);

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

  const hasSalaryBandOptions =
    salaryBandOptions.length > 0;

  const selectedPosition =
    useMemo(
      () =>
        positions.find(
          (item) =>
            sameId(
              item?.id,
              positionId
            )
        ) || null,
      [positions, positionId]
    );

  /*
    Executive สามารถมี Salary Band ได้ แต่ไม่บังคับ
    เพื่อรองรับค่าตอบแทนรายบุคคล / Executive Contract
  */
  const isExecutivePosition =
    selectedPosition?.is_executive ===
    true;

  const isConfirmedNonExecutive =
    selectedPosition?.is_executive ===
    false;

  const salaryBandRequired =
    mode === "create" &&
    Boolean(positionLevelId) &&
    hasSalaryBandOptions &&
    isConfirmedNonExecutive;

  const useIndividualCompensation =
    Boolean(positionLevelId) &&
    !masterLoading &&
    (
      !hasSalaryBandOptions ||
      (
        isExecutivePosition &&
        !positionLevelBandId
      )
    );

  return (
    <div>
      <Alert
        showIcon
        type="info"
        title="ข้อมูล Payroll"
        description="เชื่อมพนักงานกับ Payroll Company, Payroll Type, Payroll Group และ Salary Band (ถ้ามี)"
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
            dependencies={[
              "position_level_id",
            ]}
            rules={[
              {
                validator: (_, value) => {
                  if (
                    !salaryBandRequired
                  ) {
                    return Promise.resolve();
                  }

                  if (!value) {
                    return Promise.reject(
                      new Error(
                        "กรุณาเลือก Salary Band"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
            extra={
              salaryBandRangeText
                ? `Min / Mid / Max: ${salaryBandRangeText} บาท`
                : !positionLevelId
                  ? "กรุณาเลือกระดับตำแหน่งก่อน"
                  : isExecutivePosition
                    ? "ตำแหน่งผู้บริหาร: Salary Band เป็นตัวเลือก สามารถเว้นว่างและใช้ค่าตอบแทนรายบุคคลได้"
                    : useIndividualCompensation
                      ? "ระดับตำแหน่งนี้ไม่มี Salary Band สามารถใช้ค่าตอบแทนรายบุคคลและระบุ Base Salary ได้"
                      : null
            }
          >
            <Select
              showSearch
              allowClear
              disabled={
                disabled ||
                !positionLevelId ||
                !hasSalaryBandOptions
              }
              loading={masterLoading}
              options={salaryBandOptions}
              optionFilterProp="label"
              placeholder={
                !positionLevelId
                  ? "กรุณาเลือกระดับตำแหน่งก่อน"
                  : !hasSalaryBandOptions
                    ? "ไม่มี Salary Band สำหรับระดับตำแหน่งนี้"
                    : isExecutivePosition
                      ? "เลือก Salary Band (ไม่บังคับ)"
                      : "เลือก Salary Band"
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

      {useIndividualCompensation && (
        <Alert
          showIcon
          type="info"
          title="ค่าตอบแทนรายบุคคล / ไม่ใช้ Salary Band"
          description={
            isExecutivePosition
              ? "ตำแหน่งผู้บริหารสามารถใช้ค่าตอบแทนรายบุคคลได้ Salary Band จึงไม่บังคับ หากไม่เลือก ระบบจะบันทึก position_level_band_id เป็นค่าว่างและใช้ Base Salary ที่ระบุ"
              : "ระดับตำแหน่งนี้ไม่มี Salary Band ที่เปิดใช้งาน ระบบจะอนุญาตให้ระบุ Base Salary โดยไม่ต้องเลือก Salary Band และจะบันทึก position_level_band_id เป็นค่าว่าง"
          }
          className="mb-4"
        />
      )}

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

                  const salary = Number(value);

                  if (salary < 0) {
                    return Promise.reject(
                      new Error(
                        "เงินเดือนฐานต้องไม่น้อยกว่า 0"
                      )
                    );
                  }

                  if (
                    mode === "create" &&
                    selectedSalaryBand
                  ) {
                    const salaryMin =
                      selectedSalaryBand.salary_min;

                    const salaryMax =
                      selectedSalaryBand.salary_max;

                    if (
                      salaryMin !== null &&
                      salaryMin !== undefined &&
                      salaryMin !== "" &&
                      salary < Number(salaryMin)
                    ) {
                      return Promise.reject(
                        new Error(
                          `เงินเดือนฐานต้องไม่น้อยกว่า ${Number(
                            salaryMin
                          ).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )} บาท ตาม Salary Band`
                        )
                      );
                    }

                    if (
                      salaryMax !== null &&
                      salaryMax !== undefined &&
                      salaryMax !== "" &&
                      salary > Number(salaryMax)
                    ) {
                      return Promise.reject(
                        new Error(
                          `เงินเดือนฐานต้องไม่เกิน ${Number(
                            salaryMax
                          ).toLocaleString(
                            "th-TH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )} บาท ตาม Salary Band`
                        )
                      );
                    }
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
              min={
                mode === "create" &&
                selectedSalaryBand?.salary_min !== null &&
                selectedSalaryBand?.salary_min !== undefined &&
                selectedSalaryBand?.salary_min !== ""
                  ? Number(
                      selectedSalaryBand.salary_min
                    )
                  : 0
              }
              max={
                mode === "create" &&
                selectedSalaryBand?.salary_max !== null &&
                selectedSalaryBand?.salary_max !== undefined &&
                selectedSalaryBand?.salary_max !== ""
                  ? Number(
                      selectedSalaryBand.salary_max
                    )
                  : undefined
              }
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

      {mode === "create" ? (
        <>
          <Divider
            titlePlacement="left"
            plain
          >
            <Space>
              <BankOutlined />
              บัญชีรับเงินเดือนเริ่มต้น
            </Space>
          </Divider>

          <Alert
            showIcon
            type="info"
            title="วิธีรับเงินเดือนพนักงาน"
            description="เลือกวิธีการจ่ายเงินก่อน หากเป็นโอนเข้าบัญชีธนาคาร ระบบจะแสดงข้อมูลธนาคารให้กรอก หากเป็นเงินสดจะไม่ต้องระบุข้อมูลธนาคาร"
            className="mb-4"
          />

          <Row gutter={[16, 0]}>
            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                label="วิธีการจ่ายเงิน"
                name="payment_method_id"
              >
                <Select
                  showSearch
                  allowClear
                  loading={masterLoading}
                  disabled={disabled}
                  placeholder="เลือกวิธีการจ่ายเงิน"
                  options={
                    paymentMethodOptions
                  }
                  optionFilterProp="label"
                  onChange={(value) => {
                    const nextMethod =
                      paymentMethods.find(
                        (item) =>
                          sameId(
                            item.id,
                            value
                          )
                      ) || null;

                    const nextRequiresBank =
                      Boolean(
                        nextMethod
                          ?.bank_required
                      ) ||
                      nextMethod
                        ?.payment_type ===
                        "bank_transfer";

                    if (
                      !value ||
                      !nextRequiresBank
                    ) {
                      form.setFields([
                        {
                          name: "bank_id",
                          value: undefined,
                          errors: [],
                        },
                        {
                          name: "bank_account_no",
                          value: "",
                          errors: [],
                        },
                        {
                          name: "bank_account_name",
                          value: "",
                          errors: [],
                        },
                        {
                          name: "bank_branch_name",
                          value: "",
                          errors: [],
                        },
                      ]);
                    }
                  }}
                />
              </Form.Item>
            </Col>

            {paymentMethodRequiresBank ? (
              <>
            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                label="ธนาคาร"
                name="bank_id"
                dependencies={[
                  "payment_method_id",
                  "bank_account_no",
                  "bank_account_name",
                  "bank_branch_name",
                ]}
                rules={[
                  ({
                    getFieldValue,
                  }) => ({
                    validator(
                      _,
                      value
                    ) {
                      const hasBankDetail =
                        Boolean(
                          getFieldValue(
                            "bank_account_no"
                          ) ||
                            getFieldValue(
                              "bank_account_name"
                            ) ||
                            getFieldValue(
                              "bank_branch_name"
                            )
                        );

                      if (
                        !paymentMethodRequiresBank &&
                        !hasBankDetail
                      ) {
                        return Promise.resolve();
                      }

                      if (!value) {
                        return Promise.reject(
                          new Error(
                            "กรุณาเลือกธนาคาร"
                          )
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  loading={masterLoading}
                  disabled={disabled}
                  placeholder="เลือกธนาคาร"
                  options={
                    bankOptions
                  }
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                label="เลขที่บัญชี"
                name="bank_account_no"
                dependencies={[
                  "payment_method_id",
                  "bank_id",
                  "bank_account_name",
                ]}
                getValueFromEvent={(
                  event
                ) =>
                  formatBankAccountNo(
                    event?.target?.value
                  )
                }
                rules={[
                  ({
                    getFieldValue,
                  }) => ({
                    validator(
                      _,
                      value
                    ) {
                      const digits =
                        normalizeBankAccountNo(
                          value
                        );

                      const required =
                        paymentMethodRequiresBank ||
                        Boolean(
                          getFieldValue(
                            "bank_id"
                          ) ||
                            getFieldValue(
                              "bank_account_name"
                            )
                        );

                      if (
                        !required &&
                        !digits
                      ) {
                        return Promise.resolve();
                      }

                      if (!digits) {
                        return Promise.reject(
                          new Error(
                            "กรุณากรอกเลขที่บัญชี"
                          )
                        );
                      }

                      if (
                        digits.length !==
                        10
                      ) {
                        return Promise.reject(
                          new Error(
                            "เลขบัญชีธนาคารต้องมี 10 หลัก"
                          )
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  disabled={disabled}
                  placeholder="123-4-56789-0"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                label="ชื่อบัญชี"
                name="bank_account_name"
                dependencies={[
                  "payment_method_id",
                  "bank_id",
                  "bank_account_no",
                ]}
                rules={[
                  ({
                    getFieldValue,
                  }) => ({
                    validator(
                      _,
                      value
                    ) {
                      const required =
                        paymentMethodRequiresBank ||
                        Boolean(
                          getFieldValue(
                            "bank_id"
                          ) ||
                            getFieldValue(
                              "bank_account_no"
                            )
                        );

                      if (
                        !required &&
                        !String(
                          value || ""
                        ).trim()
                      ) {
                        return Promise.resolve();
                      }

                      if (
                        !String(
                          value || ""
                        ).trim()
                      ) {
                        return Promise.reject(
                          new Error(
                            "กรุณากรอกชื่อบัญชี"
                          )
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input
                  disabled={disabled}
                  autoComplete="off"
                  placeholder="ชื่อเจ้าของบัญชี"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={12}
            >
              <Form.Item
                label="สาขาธนาคาร"
                name="bank_branch_name"
              >
                <Input
                  disabled={disabled}
                  placeholder="ระบุสาขา (ถ้ามี)"
                />
              </Form.Item>
            </Col>
              </>
            ) : selectedPaymentMethod ? (
              <Col xs={24}>
                <Alert
                  showIcon
                  type="success"
                  title="วิธีการจ่ายเงินนี้ไม่ต้องใช้บัญชีธนาคาร"
                  description={`${getPaymentMethodLabel(
                    selectedPaymentMethod
                  )} สามารถเพิ่มพนักงานต่อได้โดยไม่ต้องกรอกธนาคาร เลขที่บัญชี ชื่อบัญชี หรือสาขาธนาคาร`}
                />
              </Col>
            ) : null}
          </Row>
        </>
      ) : (
        <Alert
          showIcon
          type="info"
          title="การแก้ไขบัญชีธนาคาร"
          description="หลังสร้างพนักงานแล้ว ให้จัดการบัญชีหลัก บัญชีสำรอง หรือเปลี่ยนบัญชีรับเงินเดือนที่หน้า บัญชีธนาคารพนักงาน เพื่อเก็บข้อมูลแยกจากตาราง employees"
          className="mb-5"
        />
      )}

    </div>
  );
}
