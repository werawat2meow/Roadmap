"use client";

import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

import LazyFormulaVariableCompanySelect from "./LazyFormulaVariableCompanySelect";

const {
  TextArea,
} = Input;

/* =========================================================
   Options
========================================================= */

const DATA_TYPE_OPTIONS = [
  {
    value: "number",
    label: "ตัวเลขทศนิยม",
  },
  {
    value: "integer",
    label: "จำนวนเต็ม",
  },
  {
    value: "boolean",
    label: "จริง / เท็จ",
  },
  {
    value: "text",
    label: "ข้อความ",
  },
  {
    value: "date",
    label: "วันที่",
  },
];

const SOURCE_TYPE_OPTIONS = [
  {
    value: "employee",
    label: "ข้อมูลพนักงาน",
  },
  {
    value: "attendance",
    label: "ข้อมูลเวลา / การลงเวลา",
  },
  {
    value: "payroll",
    label: "ผลการคำนวณ Payroll",
  },
  {
    value: "system",
    label: "ค่าที่ระบบสร้าง",
  },
  {
    value: "custom",
    label: "กำหนดค่าเอง",
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

/* =========================================================
   Source Help
========================================================= */

function getSourceHelp(
  sourceType
) {
  switch (
    sourceType
  ) {
    case "employee":
      return {
        placeholder:
          "employee.base_salary",

        help:
          "ใช้ดึงค่าจากข้อมูลพนักงาน เช่น เงินเดือนพื้นฐาน อายุ ประเภทการจ้าง หรือข้อมูลประจำตัวพนักงาน",

        exampleCode:
          "BASE_SALARY",

        exampleName:
          "เงินเดือนพื้นฐาน",

        exampleSource:
          "employee.base_salary",
      };

    case "attendance":
      return {
        placeholder:
          "attendance.ot_hours",

        help:
          "ใช้ดึงค่าจากข้อมูลเวลา เช่น ชั่วโมง OT จำนวนวันทำงาน ขาดงาน ลางาน หรือมาสาย",

        exampleCode:
          "OT_HOURS",

        exampleName:
          "จำนวนชั่วโมง OT",

        exampleSource:
          "attendance.ot_hours",
      };

    case "payroll":
      return {
        placeholder:
          "payroll.gross_pay",

        help:
          "ใช้ดึงค่าที่เกิดขึ้นระหว่างการคำนวณ Payroll เช่น Gross Pay รายได้รวม หรือยอดรายการอื่นที่คำนวณแล้ว",

        exampleCode:
          "GROSS_PAY",

        exampleName:
          "รายได้รวมก่อนหัก",

        exampleSource:
          "payroll.gross_pay",
      };

    case "system":
      return {
        placeholder:
          "system.current_date",

        help:
          "ใช้ค่าที่ระบบสร้างให้ เช่น วันที่ปัจจุบัน ปี เดือน หรืองวดเงินเดือนที่กำลังประมวลผล",

        exampleCode:
          "CURRENT_DATE",

        exampleName:
          "วันที่ปัจจุบัน",

        exampleSource:
          "system.current_date",
      };

    case "custom":
      return {
        placeholder:
          "สามารถเว้นว่างได้",

        help:
          "ใช้สำหรับค่าที่กำหนดเอง ไม่ได้ดึงจากข้อมูลระบบโดยตรง สามารถกำหนดค่าเริ่มต้นหรือค่าสำรองไว้ได้",

        exampleCode:
          "BONUS_RATE",

        exampleName:
          "อัตราโบนัส",

        exampleSource:
          "ไม่จำเป็นต้องระบุ",
      };

    default:
      return {
        placeholder: "",
        help: "",
        exampleCode: "-",
        exampleName: "-",
        exampleSource: "-",
      };
  }
}

/* =========================================================
   Default Value Field
========================================================= */

function DefaultValueField({
  dataType,
  disabled,
}) {
  if (
    dataType ===
    "number"
  ) {
    return (
      <InputNumber
        disabled={
          disabled
        }
        style={{
          width: "100%",
        }}
        placeholder="0.00"
      />
    );
  }

  if (
    dataType ===
    "integer"
  ) {
    return (
      <InputNumber
        disabled={
          disabled
        }
        precision={0}
        style={{
          width: "100%",
        }}
        placeholder="0"
      />
    );
  }

  if (
    dataType ===
    "boolean"
  ) {
    return (
      <Select
        disabled={
          disabled
        }
        allowClear
        placeholder="เลือกค่าเริ่มต้น"
        options={[
          {
            value: "true",
            label: "True",
          },
          {
            value: "false",
            label: "False",
          },
        ]}
      />
    );
  }

  if (
    dataType ===
    "date"
  ) {
    return (
      <DatePicker
        disabled={
          disabled
        }
        format="DD/MM/YYYY"
        style={{
          width: "100%",
        }}
        placeholder="เลือกวันที่"
      />
    );
  }

  return (
    <Input
      disabled={
        disabled
      }
      placeholder="ค่าเริ่มต้น"
    />
  );
}

/* =========================================================
   Component
========================================================= */

export default function FormulaVariableForm({
  form,

  disabled = false,

  systemProtected = false,

  companyInitialOption = null,

  onFinish,
}) {
  const dataType =
    Form.useWatch(
      "data_type",
      form
    ) ||
    "number";

  const sourceType =
    Form.useWatch(
      "source_type",
      form
    ) ||
    "custom";

  const sourceHelp =
    getSourceHelp(
      sourceType
    );

  return (
    <Form
      form={
        form
      }
      layout="vertical"
      onFinish={
        onFinish
      }
    >
      {/* =====================================================
          SYSTEM VARIABLE NOTICE
      ===================================================== */}

      {systemProtected && (
        <Alert
          type="info"
          showIcon
          title="ตัวแปรระบบ"
          description="ตัวแปรนี้ถูกสร้างและควบคุมโดยระบบ จึงไม่อนุญาตให้เปลี่ยนบริษัท รหัสตัวแปร หรือแหล่งที่มาของค่า และไม่สามารถลบได้"
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {/* =====================================================
          FORM EXPLANATION
      ===================================================== */}

      <Alert
        type="info"
        showIcon
        title="ตัวแปรสูตรคำนวณคืออะไร?"
        description={
          <>
            หน้านี้ใช้สร้าง{" "}
            <strong>
              ตัวแปรที่สูตรเงินเดือนจะนำไปใช้คำนวณ
            </strong>
            {" "}เช่น{" "}
            <strong>
              BASE_SALARY
            </strong>
            {" "}คือเงินเดือนพื้นฐาน,{" "}
            <strong>
              OT_HOURS
            </strong>
            {" "}คือจำนวนชั่วโมง OT และ{" "}
            <strong>
              WORK_DAYS
            </strong>
            {" "}คือจำนวนวันทำงาน
            โดยต้องกำหนดว่าระบบจะนำค่าของตัวแปรนั้นมาจากข้อมูลส่วนใด
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
            extra="ตัวแปรนี้จะสามารถใช้งานกับสูตร Payroll ของบริษัทที่เลือก"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <LazyFormulaVariableCompanySelect
              disabled={
                disabled ||
                systemProtected
              }
              initialOption={
                companyInitialOption
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            VARIABLE CODE
        =================================================== */}

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="รหัสตัวแปร"
            name="variable_code"
            extra="ใช้รหัสนี้อ้างอิงในสูตร เช่น BASE_SALARY, OT_HOURS"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสตัวแปร",
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
              placeholder="BASE_SALARY"
              onChange={(
                event
              ) => {
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
                  "variable_code",
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
            label="ลำดับ"
            name="sort_order"
            extra="ใช้จัดลำดับการแสดงผล"
          >
            <InputNumber
              disabled={
                disabled
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
            VARIABLE NAME
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อตัวแปร"
            name="variable_name"
            extra="ชื่อที่ผู้ใช้งานเข้าใจ เช่น เงินเดือนพื้นฐาน หรือ จำนวนชั่วโมง OT"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อตัวแปร",
              },
            ]}
          >
            <Input
              disabled={
                disabled
              }
              placeholder="เงินเดือนพื้นฐาน"
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            DATA TYPE
        =================================================== */}

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ชนิดข้อมูล"
            name="data_type"
            extra="กำหนดรูปแบบค่าที่ตัวแปรนี้จะเก็บและส่งให้สูตรคำนวณ"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกชนิดข้อมูล",
              },
            ]}
          >
            <Select
              disabled={
                disabled
              }
              options={
                DATA_TYPE_OPTIONS
              }
              onChange={() => {
                /*
                 * เมื่อเปลี่ยนชนิดข้อมูล
                 * ล้างค่าเริ่มต้นเดิม
                 * ป้องกัน Type เดิมค้างอยู่
                 */
                form.setFieldValue(
                  "default_value",
                  null
                );
              }}
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
            extra="ปิดใช้งานเมื่อตัวแปรนี้ไม่ควรถูกนำไปใช้ในสูตรใหม่"
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
                disabled
              }
              options={
                STATUS_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            SOURCE TYPE
        =================================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="แหล่งที่มาของค่า"
            name="source_type"
            extra="เลือกว่าระบบจะไปนำค่าของตัวแปรนี้มาจากข้อมูลส่วนใด"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกแหล่งที่มาของค่า",
              },
            ]}
          >
            <Select
              disabled={
                disabled ||
                systemProtected
              }
              options={
                SOURCE_TYPE_OPTIONS
              }
              onChange={() => {
                /*
                 * เปลี่ยน Source Type
                 * ให้ล้าง Source Key เดิม
                 * ป้องกันการอ้างอิงผิดแหล่ง
                 */
                form.setFieldValue(
                  "source_key",
                  null
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            SOURCE KEY
        =================================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสแหล่งข้อมูล"
            name="source_key"
            extra={
              sourceHelp.help
            }
            rules={[
              {
                validator:
                  (
                    _,
                    value
                  ) => {
                    if (
                      sourceType ===
                        "custom" ||
                      String(
                        value ||
                          ""
                      ).trim()
                    ) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error(
                        "กรุณาระบุรหัสแหล่งข้อมูล"
                      )
                    );
                  },
              },
            ]}
          >
            <Input
              disabled={
                disabled ||
                systemProtected
              }
              placeholder={
                sourceHelp.placeholder
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            DEFAULT VALUE
        =================================================== */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ค่าเริ่มต้น / ค่าสำรอง"
            name="default_value"
            extra="ใช้เป็นค่าเริ่มต้นหรือค่าสำรองเมื่อไม่มีค่าจากแหล่งข้อมูล หากไม่ต้องการสามารถเว้นว่างได้"
          >
            <DefaultValueField
              dataType={
                dataType
              }
              disabled={
                disabled
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            SOURCE EXAMPLE
        =================================================== */}

        <Col
          xs={24}
        >
          <Alert
            type="success"
            showIcon
            title="ตัวอย่างการตั้งค่าตัวแปร"
            description={
              <>
                <strong>
                  {sourceHelp.exampleCode}
                </strong>
                {" "}=
                {" "}
                {sourceHelp.exampleName}
                {" "}→ แหล่งข้อมูล{" "}
                <strong>
                  {
                    SOURCE_TYPE_OPTIONS.find(
                      (item) =>
                        item.value ===
                        sourceType
                    )?.label ||
                    "-"
                  }
                </strong>
                {" "}→ รหัสแหล่งข้อมูล{" "}
                <strong>
                  {
                    sourceHelp.exampleSource
                  }
                </strong>
              </>
            }
            style={{
              marginBottom: 16,
            }}
          />
        </Col>

        {/* ===================================================
            REQUIRED
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บังคับต้องมีค่า"
            name="is_required"
            valuePropName="checked"
            extra="หากเปิดไว้ ตัวแปรนี้ต้องมีค่าก่อนนำไปคำนวณ Payroll เช่น BASE_SALARY ควรบังคับ แต่ OT_HOURS อาจไม่บังคับและใช้ค่า 0 แทนได้"
          >
            <Switch
              disabled={
                disabled
              }
              checkedChildren="บังคับ"
              unCheckedChildren="ไม่บังคับ"
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            VARIABLE MANAGEMENT TYPE
        =================================================== */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ประเภทการจัดการตัวแปร"
            extra={
              systemProtected
                ? "ตัวแปรนี้ถูกควบคุมโดยระบบ"
                : "ตัวแปรนี้สามารถกำหนดและปรับแต่งได้"
            }
          >
            <Input
              disabled
              value={
                systemProtected
                  ? "ตัวแปรระบบ"
                  : "ตัวแปรกำหนดเอง / ปรับแต่งได้"
              }
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <Col
          xs={24}
        >
          <Form.Item
            label="รายละเอียด"
            name="description"
            extra="อธิบายความหมายของตัวแปรเพื่อให้ผู้ดูแล Payroll คนอื่นเข้าใจตรงกัน"
          >
            <TextArea
              disabled={
                disabled
              }
              rows={3}
              placeholder="เช่น ใช้เก็บเงินเดือนพื้นฐานของพนักงานก่อนรวมค่าตอบแทนอื่น"
            />
          </Form.Item>
        </Col>

        {/* ===================================================
            REMARK
        =================================================== */}

        <Col
          xs={24}
        >
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              disabled={
                disabled
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
