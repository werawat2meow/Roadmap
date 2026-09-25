"use client";

import {
  Alert,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
} from "antd";

const {
  TextArea,
} = Input;

function buildCategoryOptions(
  categories
) {
  return (
    categories || []
  ).map(
    (item) => ({
      value:
        item.id,

      label:
        `${item.category_code} - ${item.category_name}`,
    })
  );
}

export default function BenefitPlanModal({
  open = false,
  form,
  editing = null,
  viewMode = false,
  saving = false,

  categories = [],
  categoryLoading = false,

  onCancel,
  onSubmit,
}) {
  const disabled =
    viewMode ||
    saving;

  return (
    <Modal
      open={
        open
      }
      width={
        860
      }
      title={
        viewMode
          ? "รายละเอียดแผนสวัสดิการ"
          : editing
            ? "แก้ไขแผนสวัสดิการ"
            : "เพิ่มแผนสวัสดิการ"
      }
      destroyOnHidden
      mask={{ closable: !saving }}
      onCancel={
        onCancel
      }
      onOk={
        viewMode
          ? onCancel
          : () =>
              form.submit()
      }
      okText={
        viewMode
          ? "ปิด"
          : "บันทึก"
      }
      cancelButtonProps={{
        style:
          viewMode
            ? {
                display:
                  "none",
              }
            : undefined,
      }}
      confirmLoading={
        saving
      }
    >
      <Form
        form={
          form
        }
        layout="vertical"
        disabled={
          disabled
        }
        onFinish={
          onSubmit
        }
      >
        <Alert
          className="mb-4"
          showIcon
          type="info"
          message="Plan Master เก็บว่าองค์กรมีสวัสดิการอะไร"
          description="จำนวนเงิน วงเงิน เงื่อนไขบริษัท โครงสร้างองค์กร ประเภทการจ้าง ระดับตำแหน่ง อายุงาน และช่วงทดลองงาน ให้กำหนดใน Benefit Policy Rules ไม่ Hardcode ในหน้าแผน"
        />

        <Row
          gutter={[
            16,
            0,
          ]}
        >
          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ประเภทสวัสดิการ"
              name="category_id"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือกประเภทสวัสดิการ",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                loading={
                  categoryLoading
                }
                options={
                  buildCategoryOptions(
                    categories
                  )
                }
                placeholder="เลือกประเภทสวัสดิการ"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="รหัสแผน"
              name="benefit_code"
              extra="เช่น PHONE_ALLOWANCE, FUEL_ALLOWANCE"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกรหัสแผน",
                },
                {
                  pattern:
                    /^[A-Za-z0-9_]+$/,

                  message:
                    "ใช้ได้เฉพาะ A-Z, 0-9 และ _",
                },
              ]}
            >
              <Input
                maxLength={
                  80
                }
                disabled={
                  disabled ||
                  Boolean(
                    editing
                  )
                }
                placeholder="PHONE_ALLOWANCE"
                onChange={(
                  event
                ) => {
                  form.setFieldValue(
                    "benefit_code",
                    event.target
                      .value
                      .toUpperCase()
                      .replace(
                        /\s+/g,
                        "_"
                      )
                  );
                }}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
          >
            <Form.Item
              label="ชื่อแผนสวัสดิการ"
              name="benefit_name"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกชื่อแผนสวัสดิการ",
                },
              ]}
            >
              <Input
                maxLength={
                  200
                }
                placeholder="เช่น ค่าโทรศัพท์"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="รูปแบบสวัสดิการ"
              name="benefit_type"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือกรูปแบบสวัสดิการ",
                },
              ]}
            >
              <Select
                options={[
                  {
                    value:
                      "allowance",

                    label:
                      "Allowance / เงินช่วยเหลือ",
                  },
                  {
                    value:
                      "insurance",

                    label:
                      "Insurance / ประกัน",
                  },
                  {
                    value:
                      "reimbursement",

                    label:
                      "Reimbursement / เบิกคืน",
                  },
                  {
                    value:
                      "general",

                    label:
                      "General / ทั่วไป",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="รอบสิทธิ์เริ่มต้น"
              name="active_period"
              extra="Policy Rule สามารถกำหนดรายละเอียดวงเงิน/รอบสิทธิ์เพิ่มเติมภายหลัง"
            >
              <Select
                allowClear
                options={[
                  {
                    value:
                      "once",

                    label:
                      "ครั้งเดียว",
                  },
                  {
                    value:
                      "monthly",

                    label:
                      "รายเดือน",
                  },
                  {
                    value:
                      "yearly",

                    label:
                      "รายปี",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
          >
            <Form.Item
              label="รายละเอียด"
              name="description"
            >
              <TextArea
                rows={
                  3
                }
                maxLength={
                  1000
                }
                showCount
                placeholder="อธิบายวัตถุประสงค์ของแผนสวัสดิการ"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ลำดับแสดงผล"
              name="sort_order"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกลำดับ",
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={
                  0
                }
                precision={
                  0
                }
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="สถานะ"
              name="is_active"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="ใช้งาน"
                unCheckedChildren="ไม่ใช้งาน"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
