"use client";

import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from "antd";

import LazyPayrollFormulaCompanySelect from "./LazyPayrollFormulaCompanySelect";
import FormulaVariablePicker from "./FormulaVariablePicker";

const {
  Text,
} = Typography;

const {
  TextArea,
} = Input;

/* =========================================================
   Options
========================================================= */

const FORMULA_TYPE_OPTIONS = [
  {
    value: "earning",
    label: "สูตรรายได้",
  },
  {
    value: "deduction",
    label: "สูตรรายการหัก",
  },
  {
    value: "general",
    label: "สูตรทั่วไป",
  },
];

const ROUNDING_METHOD_OPTIONS = [
  {
    value: "none",
    label: "ไม่ปัดเศษ",
  },
  {
    value: "round",
    label: "ปัดตามหลักทั่วไป",
  },
  {
    value: "floor",
    label: "ปัดลง",
  },
  {
    value: "ceil",
    label: "ปัดขึ้น",
  },
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "ใช้งาน",
  },
  {
    value: "inactive",
    label: "ไม่ใช้งาน",
  },
];

const FORMULA_FUNCTIONS = [
  {
    code: "IF()",
    insert: "IF()",
    help:
      "เงื่อนไข IF",
  },
  {
    code: "MIN()",
    insert: "MIN()",
    help:
      "เลือกค่าต่ำสุด",
  },
  {
    code: "MAX()",
    insert: "MAX()",
    help:
      "เลือกค่าสูงสุด",
  },
  {
    code: "ROUND()",
    insert: "ROUND()",
    help:
      "ปัดเศษ",
  },
  {
    code: "FLOOR()",
    insert: "FLOOR()",
    help:
      "ปัดลง",
  },
  {
    code: "CEIL()",
    insert: "CEIL()",
    help:
      "ปัดขึ้น",
  },
  {
    code: "ABS()",
    insert: "ABS()",
    help:
      "ค่าสัมบูรณ์",
  },
];

/* =========================================================
   Component
========================================================= */

export default function PayrollFormulaForm({
  form,
  disabled = false,
  systemProtected = false,
  companyInitialOption = null,
  onFinish,
}) {
  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const roundingMethod =
    Form.useWatch(
      "rounding_method",
      form
    ) ||
    "round";

  function insertToken(token) {
    if (
      disabled ||
      systemProtected ||
      !token
    ) {
      return;
    }

    const current =
      String(
        form.getFieldValue(
          "formula_expression"
        ) ||
        ""
      );

    const next =
      current.trim()
        ? `${current.trim()} ${token}`
        : token;

    form.setFieldValue(
      "formula_expression",
      next
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      {systemProtected && (
        <Alert
          type="info"
          showIcon
          title="สูตรระบบ"
          description="สูตรนี้ถูกกำหนดโดยระบบ จึงเปิดดูได้อย่างเดียว และไม่อนุญาตให้แก้ไขหรือลบจากหน้าจอนี้"
          style={{
            marginBottom: 16,
          }}
        />
      )}

      <Alert
        type="info"
        showIcon
        title="สูตรการคำนวณเงินเดือนคืออะไร?"
        description={
          <>
            หน้านี้ใช้สร้างกฎคำนวณ Payroll โดยนำตัวแปรจากหน้า{" "}
            <strong>
              “ตัวแปรสูตรคำนวณ”
            </strong>
            {" "}มาประกอบเป็นสูตร เช่น{" "}
            <strong>
              BASE_SALARY / WORK_DAYS * ACTUAL_WORK_DAYS
            </strong>
            {" "}หรือ{" "}
            <strong>
              OT_HOURS * OT_RATE
            </strong>
            {" "}หน้านี้เก็บสูตรเท่านั้น ระบบจะไม่ execute JavaScript จากข้อความสูตรโดยตรง
          </>
        }
        style={{
          marginBottom: 16,
        }}
      />

      <Row
        gutter={[
          16,
          0,
        ]}
      >
        {/* ===================================================
            COMPANY
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            extra="สูตรจะใช้ได้เฉพาะกับข้อมูล Payroll ของบริษัทที่เลือก และตาม Company Scope ของผู้ใช้งาน"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <LazyPayrollFormulaCompanySelect
              disabled={
                disabled ||
                systemProtected
              }
              initialOption={
                companyInitialOption
              }
              onChange={() => {
                /*
                 * เมื่อเปลี่ยนบริษัท
                 * ล้าง expression เพื่อป้องกันตัวแปรของบริษัทเดิมค้าง
                 */
                form.setFieldValue(
                  "formula_expression",
                  ""
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            CODE
        =================================================== */}

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="รหัสสูตร"
            name="formula_code"
            extra="ใช้รหัสนี้อ้างอิงสูตร เช่น MONTHLY_SALARY, OT_PAY"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสสูตร",
              },
              {
                pattern:
                  /^[A-Z][A-Z0-9_]*$/,
                message:
                  "ใช้เฉพาะ A-Z, 0-9, _ และต้องขึ้นต้นด้วย A-Z",
              },
            ]}
          >
            <Input
              disabled={
                disabled ||
                systemProtected
              }
              placeholder="MONTHLY_SALARY"
              onChange={(event) => {
                const value =
                  String(
                    event
                      ?.target
                      ?.value ||
                      ""
                  )
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_]/g,
                      "_"
                    )
                    .replace(
                      /_+/g,
                      "_"
                    );

                form.setFieldValue(
                  "formula_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            SORT ORDER
        =================================================== */}

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ลำดับแสดงผล"
            name="sort_order"
            extra="ใช้จัดลำดับในหน้ารายการ"
          >
            <InputNumber
              disabled={
                disabled ||
                systemProtected
              }
              min={0}
              precision={0}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            NAME
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อสูตร"
            name="formula_name"
            extra="ชื่อที่ HR/Payroll เข้าใจ เช่น คำนวณเงินเดือนรายเดือน หรือ คำนวณค่าล่วงเวลา"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อสูตร",
              },
            ]}
          >
            <Input
              disabled={
                disabled ||
                systemProtected
              }
              placeholder="คำนวณเงินเดือนรายเดือน"
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            TYPE
        =================================================== */}

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ประเภทสูตร"
            name="formula_type"
            extra="ระบุว่าสูตรนี้ใช้กับรายได้ รายการหัก หรือเป็นสูตรกลาง"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภทสูตร",
              },
            ]}
          >
            <Select
              disabled={
                disabled ||
                systemProtected
              }
              options={
                FORMULA_TYPE_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            STATUS
        =================================================== */}

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="สถานะ"
            name="status"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะ",
              },
            ]}
          >
            <Select
              disabled={
                disabled ||
                systemProtected
              }
              options={
                STATUS_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            CALCULATION ORDER
        =================================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ลำดับการคำนวณ"
            name="calculation_order"
            extra="เลขน้อยคำนวณก่อน ใช้กำหนดลำดับเมื่อสูตรหนึ่งต้องพึ่งผลจากอีกสูตร"
          >
            <InputNumber
              disabled={
                disabled ||
                systemProtected
              }
              min={0}
              precision={0}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            ROUNDING METHOD
        =================================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วิธีปัดเศษผลลัพธ์"
            name="rounding_method"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวิธีปัดเศษ",
              },
            ]}
          >
            <Select
              disabled={
                disabled ||
                systemProtected
              }
              options={
                ROUNDING_METHOD_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            DECIMAL
        =================================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="จำนวนตำแหน่งทศนิยม"
            name="decimal_places"
            extra={
              roundingMethod ===
              "none"
                ? "เลือกไม่ปัดเศษ จึงไม่ใช้ค่านี้ในการปัดผลลัพธ์"
                : "กำหนดได้ 0 - 6 ตำแหน่ง"
            }
          >
            <InputNumber
              disabled={
                disabled ||
                systemProtected ||
                roundingMethod ===
                  "none"
              }
              min={0}
              max={6}
              precision={0}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            VARIABLE PICKER
        =================================================== */}

        <Col xs={24}>
          <Form.Item
            label="เลือกตัวแปรสำหรับนำมาใช้ในสูตร"
            extra="เลือกตัวแปรแล้วกด “แทรกตัวแปร” ระบบจะนำรหัสตัวแปรไปต่อในช่องสูตรคำนวณ"
          >
            <FormulaVariablePicker
              companyId={
                companyId
              }
              disabled={
                disabled ||
                systemProtected
              }
              onInsert={
                insertToken
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            FORMULA EXPRESSION
        =================================================== */}

        <Col xs={24}>
          <Form.Item
            label="สูตรคำนวณ"
            name="formula_expression"
            extra="ใช้รหัสตัวแปร + ตัวเลข + เครื่องหมายคำนวณ เช่น BASE_SALARY / WORK_DAYS * ACTUAL_WORK_DAYS"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุสูตรคำนวณ",
              },
              {
                max: 4000,
                message:
                  "สูตรคำนวณยาวเกิน 4,000 ตัวอักษร",
              },
              {
                pattern:
                  /^[A-Za-z0-9_+\-*/%().,\s<>=!&|]+$/,
                message:
                  "สูตรมีอักขระที่ไม่อนุญาต",
              },
            ]}
          >
            <TextArea
              disabled={
                disabled ||
                systemProtected
              }
              rows={5}
              placeholder="BASE_SALARY / WORK_DAYS * ACTUAL_WORK_DAYS"
              style={{
                fontFamily:
                  "monospace",
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            BUILT-IN FUNCTIONS
        =================================================== */}

        <Col xs={24}>
          <Form.Item
            label="ฟังก์ชันที่รองรับ"
            extra="ปุ่มนี้ใช้ช่วยแทรกชื่อฟังก์ชันเท่านั้น การประมวลผลจริงต้องผ่าน Safe Formula Engine ฝั่ง Backend"
          >
            <Flex
              gap={8}
              wrap="wrap"
            >
              {FORMULA_FUNCTIONS.map(
                (item) => (
                  <Button
                    key={
                      item.code
                    }
                    size="small"
                    disabled={
                      disabled ||
                      systemProtected
                    }
                    onClick={() =>
                      insertToken(
                        item.insert
                      )
                    }
                  >
                    {item.code}
                  </Button>
                )
              )}
            </Flex>
          </Form.Item>
        </Col>

        {/* ===================================================
            EXAMPLES
        =================================================== */}

        <Col xs={24}>
          <Alert
            type="success"
            showIcon
            title="ตัวอย่างสูตร"
            description={
              <Space
                orientation="vertical"
                size={2}
              >
                <Text>
                  เงินเดือนตามวันทำงาน:{" "}
                  <Text code>
                    BASE_SALARY / WORK_DAYS * ACTUAL_WORK_DAYS
                  </Text>
                </Text>

                <Text>
                  ค่าล่วงเวลา:{" "}
                  <Text code>
                    OT_HOURS * OT_RATE
                  </Text>
                </Text>

                <Text>
                  จำกัดจำนวนสูงสุด:{" "}
                  <Text code>
                    MIN(BONUS_AMOUNT, MAX_BONUS)
                  </Text>
                </Text>
              </Space>
            }
            style={{
              marginBottom: 16,
            }}
          />
        </Col>

        {/* ===================================================
            MIN / MAX
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ผลลัพธ์ต่ำสุด"
            name="minimum_amount"
            extra="เว้นว่างได้ หากไม่ต้องการกำหนดเพดานต่ำสุด"
          >
            <InputNumber
              disabled={
                disabled ||
                systemProtected
              }
              style={{
                width: "100%",
              }}
              precision={2}
              placeholder="ไม่กำหนด"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ผลลัพธ์สูงสุด"
            name="maximum_amount"
            dependencies={[
              "minimum_amount",
            ]}
            extra="เว้นว่างได้ หากไม่ต้องการกำหนดเพดานสูงสุด"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const min =
                    getFieldValue(
                      "minimum_amount"
                    );

                  if (
                    value === null ||
                    value === undefined ||
                    min === null ||
                    min === undefined ||
                    Number(value) >=
                      Number(min)
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "ผลลัพธ์สูงสุดต้องไม่น้อยกว่าผลลัพธ์ต่ำสุด"
                    )
                  );
                },
              }),
            ]}
          >
            <InputNumber
              disabled={
                disabled ||
                systemProtected
              }
              style={{
                width: "100%",
              }}
              precision={2}
              placeholder="ไม่กำหนด"
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            EFFECTIVE DATE
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="วันที่เริ่มใช้"
            name="effective_date"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่เริ่มใช้",
              },
            ]}
          >
            <DatePicker
              disabled={
                disabled ||
                systemProtected
              }
              format="DD/MM/YYYY"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={[
              "effective_date",
            ]}
            extra="เว้นว่างได้ หากสูตรยังไม่มีวันสิ้นสุด"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start =
                    getFieldValue(
                      "effective_date"
                    );

                  if (
                    !value ||
                    !start ||
                    !value.isBefore(
                      start,
                      "day"
                    )
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker
              disabled={
                disabled ||
                systemProtected
              }
              format="DD/MM/YYYY"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
            extra="อธิบายว่าสูตรนี้ใช้คำนวณอะไร เพื่อให้ผู้ดูแล Payroll คนอื่นเข้าใจตรงกัน"
          >
            <TextArea
              disabled={
                disabled ||
                systemProtected
              }
              rows={3}
              placeholder="เช่น ใช้คำนวณเงินเดือนพนักงานรายเดือนตามจำนวนวันทำงานจริง"
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            REMARK
        =================================================== */}

        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              disabled={
                disabled ||
                systemProtected
              }
              rows={2}
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
