"use client";

import {
  Alert,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Switch,
} from "antd";

const {
  TextArea,
} = Input;

export default function BenefitTypeModal({
  open = false,
  form,
  editing = null,
  viewMode = false,
  saving = false,

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
        760
      }
      title={
        viewMode
          ? "รายละเอียดประเภทสวัสดิการ"
          : editing
            ? "แก้ไขประเภทสวัสดิการ"
            : "เพิ่มประเภทสวัสดิการ"
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
          message="ประเภทสวัสดิการเป็น Master กลาง"
          description="หน้านี้ใช้จัดหมวดหมู่ของสวัสดิการเท่านั้น ส่วนเงื่อนไขบริษัท ประเภทการจ้าง สถานะพนักงาน และอายุงาน ให้กำหนดใน Benefit Policy Rules"
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
              label="รหัสประเภท"
              name="category_code"
              extra="เช่น HEALTH, MEAL, TRAVEL"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกรหัสประเภท",
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
                  50
                }
                disabled={
                  disabled ||
                  Boolean(
                    editing
                  )
                }
                placeholder="HEALTH"
                onChange={(
                  event
                ) => {
                  form.setFieldValue(
                    "category_code",
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
          >
            <Form.Item
              label="ชื่อประเภทสวัสดิการ"
              name="category_name"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกชื่อประเภทสวัสดิการ",
                },
              ]}
            >
              <Input
                maxLength={
                  200
                }
                placeholder="เช่น สุขภาพและการรักษาพยาบาล"
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
                placeholder="อธิบายขอบเขตของประเภทสวัสดิการ"
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
