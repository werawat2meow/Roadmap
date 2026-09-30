"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
  Typography,
} from "antd";

const {
  Text,
} =
  Typography;

function buildOptions(
  rows,
  {
    valueKey = "id",
    codeKey,
    nameKeys = [],
  } = {}
) {
  return (
    rows || []
  )
    .filter(
      (item) =>
        item?.[
          valueKey
        ]
    )
    .map(
      (item) => {
        const name =
          nameKeys
            .map(
              (key) =>
                item?.[
                  key
                ]
            )
            .find(
              Boolean
            ) ||
          "-";

        const code =
          codeKey
            ? item?.[
                codeKey
              ]
            : null;

        return {
          value:
            item[
              valueKey
            ],

          label:
            code
              ? `${code} - ${name}`
              : name,
        };
      }
    );
}

export default function BenefitPolicyRuleModal({
  open = false,
  mode = "create",
  form,
  loading = false,
  masters = {},
  onCancel,
  onSubmit,
}) {
  const readOnly =
    mode === "view";

  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const departmentId =
    Form.useWatch(
      "department_id",
      form
    );

  const divisionId =
    Form.useWatch(
      "division_id",
      form
    );

  const isUnlimited =
    Boolean(
      Form.useWatch(
        "is_unlimited",
        form
      )
    );

  const companyOptions =
    buildOptions(
      masters.companies,
      {
        codeKey:
          "company_code",
        nameKeys: [
          "company_name_th",
          "company_name_en",
        ],
      }
    );

  const branchOptions =
    buildOptions(
      (
        masters.branches ||
        []
      ).filter(
        (item) =>
          !companyId ||
          String(
            item
              ?.company_id ||
              ""
          ) ===
            String(
              companyId
            )
      ),
      {
        codeKey:
          "branch_code",
        nameKeys: [
          "branch_name",
        ],
      }
    );

  const departmentOptions =
    buildOptions(
      masters.departments,
      {
        codeKey:
          "department_code",
        nameKeys: [
          "department_name",
        ],
      }
    );

  const divisionOptions =
    buildOptions(
      (
        masters.divisions ||
        []
      ).filter(
        (item) =>
          !departmentId ||
          String(
            item
              ?.department_id ||
              ""
          ) ===
            String(
              departmentId
            )
      ),
      {
        codeKey:
          "division_code",
        nameKeys: [
          "division_name",
        ],
      }
    );

  const unitOptions =
    buildOptions(
      (
        masters.units ||
        []
      ).filter(
        (item) =>
          !divisionId ||
          String(
            item
              ?.division_id ||
              ""
          ) ===
            String(
              divisionId
            )
      ),
      {
        codeKey:
          "unit_code",
        nameKeys: [
          "unit_name",
        ],
      }
    );

  const benefitOptions =
    buildOptions(
      masters.benefits,
      {
        codeKey:
          "benefit_code",
        nameKeys: [
          "benefit_name",
        ],
      }
    );

  const positionLevelOptions =
    (
      masters
        .positionLevels ||
      []
    ).map(
      (item) => ({
        value:
          item
            .level_code,

        label:
          item
            .level_name
            ? `${item.level_code} - ${item.level_name}`
            : item.level_code,
      })
    );

  const employmentTypeOptions =
    buildOptions(
      masters.employmentTypes,
      {
        codeKey:
          "type_code",
        nameKeys: [
          "type_name",
        ],
      }
    );

  const employeeStatusOptions =
    buildOptions(
      masters.employeeStatuses,
      {
        codeKey:
          "status_code",
        nameKeys: [
          "status_name",
        ],
      }
    );

  const title =
    mode === "view"
      ? "รายละเอียดกฎเกณฑ์สวัสดิการ"
      : mode === "edit"
        ? "แก้ไขกฎเกณฑ์สวัสดิการ"
        : "เพิ่มกฎเกณฑ์สวัสดิการ";

  return (
    <Modal
      open={open}
      width={1050}
      title={title}
      onCancel={
        onCancel
      }
      onOk={
        readOnly
          ? undefined
          : onSubmit
      }
      okText="บันทึก"
      cancelText={
        readOnly
          ? "ปิด"
          : "ยกเลิก"
      }
      confirmLoading={
        loading
      }
      footer={
        readOnly
          ? undefined
          : undefined
      }
      destroyOnHidden
    >
      <Alert
        className="mb-4"
        type="info"
        showIcon
        title="เงื่อนไขที่เว้นว่าง = ไม่จำกัด"
        description="Policy จะถูกนำไปใช้เมื่อพนักงานตรงกับเงื่อนไขที่กำหนดทั้งหมด เช่น บริษัท สังกัด แผนก Level ประเภทการจ้าง สถานะ อายุงาน และ Probation"
      />

      <Form
        form={form}
        layout="vertical"
        disabled={
          readOnly
        }
      >
        <Divider titlePlacement="left">
          ข้อมูล Policy
        </Divider>

        <Row
          gutter={[
            16,
            0,
          ]}
        >
          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="Policy Code"
              name="policy_code"
              rules={[
                {
                  required:
                    true,
                  message:
                    "กรุณากรอก Policy Code",
                },
              ]}
            >
              <Input
                maxLength={
                  80
                }
                placeholder="เช่น PHONE-P8-2026"
                onChange={(
                  event
                ) => {
                  const value =
                    String(
                      event
                        .target
                        .value ||
                        ""
                    )
                      .toUpperCase()
                      .replace(
                        /\s+/g,
                        "-"
                      );

                  form.setFieldValue(
                    "policy_code",
                    value
                  );
                }}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ชื่อ Policy"
              name="policy_name"
              rules={[
                {
                  required:
                    true,
                  message:
                    "กรุณากรอกชื่อ Policy",
                },
              ]}
            >
              <Input
                maxLength={
                  200
                }
                placeholder="เช่น ค่าโทรศัพท์สำหรับ P8 ขึ้นไป"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ปีที่ใช้ Rule"
              name="rule_year"
              rules={[
                {
                  required:
                    true,
                  message:
                    "กรุณาระบุปี",
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={2000}
                max={2100}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="แผนสวัสดิการ"
              name="benefit_id"
              rules={[
                {
                  required:
                    true,
                  message:
                    "กรุณาเลือกแผนสวัสดิการ",
                },
              ]}
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  benefitOptions
                }
                placeholder="เลือก Benefit Plan"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">
          เงื่อนไขโครงสร้างองค์กร
        </Divider>

        <Text
          type="secondary"
          className="mb-3 block"
        >
          หากไม่เลือกในระดับใด หมายถึง Policy นี้ไม่จำกัดระดับนั้น
        </Text>

        <Row
          gutter={[
            16,
            0,
          ]}
        >
          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="บริษัท"
              name="company_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  companyOptions
                }
                placeholder="ทุกบริษัท"
                onChange={() => {
                  form.setFieldsValue({
                    branch_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="สังกัด / สาขา"
              name="branch_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  branchOptions
                }
                placeholder="ทุกสังกัด"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="แผนก"
              name="department_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  departmentOptions
                }
                placeholder="ทุกแผนก"
                onChange={() => {
                  form.setFieldsValue({
                    division_id:
                      undefined,
                    unit_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ฝ่าย"
              name="division_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  divisionOptions
                }
                placeholder="ทุกฝ่าย"
                onChange={() => {
                  form.setFieldValue(
                    "unit_id",
                    undefined
                  );
                }}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="หน่วยงาน"
              name="unit_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  unitOptions
                }
                placeholder="ทุกหน่วยงาน"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">
          เงื่อนไขพนักงาน
        </Divider>

        <Row
          gutter={[
            16,
            0,
          ]}
        >
          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ระดับตำแหน่ง"
              name="position_level"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  positionLevelOptions
                }
                placeholder="ทุก Level"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ประเภทการจ้าง"
              name="employment_type_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  employmentTypeOptions
                }
                placeholder="ทุกประเภทการจ้าง"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="สถานะพนักงาน"
              name="employee_status_id"
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={
                  employeeStatusOptions
                }
                placeholder="ทุกสถานะ"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={6}
          >
            <Form.Item
              label="อายุงานขั้นต่ำ (เดือน)"
              name="min_service_months"
              rules={[
                {
                  type:
                    "number",
                  min: 0,
                  message:
                    "อายุงานต้องไม่น้อยกว่า 0",
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={6}
          >
            <Form.Item
              label="อายุงานสูงสุด (เดือน)"
              name="max_service_months"
              dependencies={[
                "min_service_months",
              ]}
              rules={[
                (
                  {
                    getFieldValue,
                  }
                ) => ({
                  validator(
                    _,
                    value
                  ) {
                    if (
                      value ===
                        undefined ||
                      value ===
                        null
                    ) {
                      return Promise.resolve();
                    }

                    const min =
                      Number(
                        getFieldValue(
                          "min_service_months"
                        ) ||
                          0
                      );

                    if (
                      Number(
                        value
                      ) <
                      min
                    ) {
                      return Promise.reject(
                        new Error(
                          "อายุงานสูงสุดต้องไม่น้อยกว่าอายุงานขั้นต่ำ"
                        )
                      );
                    }

                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="ไม่จำกัด"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={6}
          >
            <Form.Item
              label="อายุขั้นต่ำ (ปี)"
              name="min_age"
            >
              <InputNumber
                className="w-full"
                min={0}
                max={120}
                placeholder="ไม่จำกัด"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={6}
          >
            <Form.Item
              label="อายุสูงสุด (ปี)"
              name="max_age"
              dependencies={[
                "min_age",
              ]}
              rules={[
                (
                  {
                    getFieldValue,
                  }
                ) => ({
                  validator(
                    _,
                    value
                  ) {
                    if (
                      value ===
                        undefined ||
                      value ===
                        null
                    ) {
                      return Promise.resolve();
                    }

                    const min =
                      getFieldValue(
                        "min_age"
                      );

                    if (
                      min !==
                        undefined &&
                      min !==
                        null &&
                      Number(
                        value
                      ) <
                        Number(
                          min
                        )
                    ) {
                      return Promise.reject(
                        new Error(
                          "อายุสูงสุดต้องไม่น้อยกว่าอายุขั้นต่ำ"
                        )
                      );
                    }

                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                className="w-full"
                min={0}
                max={120}
                placeholder="ไม่จำกัด"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ต้องผ่าน Probation ก่อน"
              name="probation_required"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="ต้องผ่าน"
                unCheckedChildren="ไม่บังคับ"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">
          สิทธิ์และโควตา
        </Divider>

        <Row
          gutter={[
            16,
            0,
          ]}
        >
          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="หน่วยสิทธิ์"
              name="quota_unit"
            >
              <Select
                options={[
                  {
                    label:
                      "Amount / บาท",
                    value:
                      "amount",
                  },
                  {
                    label:
                      "Day / วัน",
                    value:
                      "day",
                  },
                  {
                    label:
                      "Time / ครั้ง",
                    value:
                      "time",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="รอบสิทธิ์"
              name="quota_frequency"
            >
              <Select
                options={[
                  {
                    label:
                      "Yearly / รายปี",
                    value:
                      "yearly",
                  },
                  {
                    label:
                      "Monthly / รายเดือน",
                    value:
                      "monthly",
                  },
                  {
                    label:
                      "Once / ครั้งเดียว",
                    value:
                      "once",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ไม่จำกัดโควตา"
              name="is_unlimited"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Unlimited"
                unCheckedChildren="มีโควตา"
              />
            </Form.Item>
          </Col>

          {!isUnlimited && (
            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="จำนวนสิทธิ์ / วงเงิน"
                name="quota_amount"
                rules={[
                  {
                    required:
                      true,
                    message:
                      "กรุณาระบุจำนวนสิทธิ์",
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          )}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="Priority"
              name="priority"
              tooltip="ตัวเลขน้อยจะถูกพิจารณาก่อนเมื่อพนักงานตรงหลาย Policy"
            >
              <InputNumber
                className="w-full"
                min={1}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="สถานะ"
              name="is_active"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
