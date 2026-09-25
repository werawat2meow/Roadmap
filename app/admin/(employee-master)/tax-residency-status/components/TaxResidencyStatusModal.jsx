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
} from "antd";

const {
  TextArea,
} = Input;

export default function TaxResidencyStatusModal({
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
          ? "รายละเอียดสถานะผู้มีถิ่นที่อยู่ทางภาษี"
          : editing
            ? "แก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษี"
            : "เพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษี"
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
          message="Master นี้ใช้จัดประเภทสถานะ Tax Residency เท่านั้น"
          description="เกณฑ์ทางภาษีหรือสูตรคำนวณไม่ควร Hardcode ไว้ใน Master นี้ ให้ระบบ Payroll/Tax ใช้กฎตาม Effective Date จากโมดูลที่เกี่ยวข้อง"
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
              label="รหัสสถานะ"
              name="residency_code"
              extra="เช่น resident / non_resident"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกรหัสสถานะ",
                },
                {
                  pattern:
                    /^[a-z0-9_]+$/,

                  message:
                    "ใช้ได้เฉพาะ a-z, 0-9 และ _",
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
                placeholder="resident"
                onChange={(
                  event
                ) => {
                  form.setFieldValue(
                    "residency_code",
                    event.target
                      .value
                      .toLowerCase()
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
            md={12}
          >
            <Form.Item
              label="ชื่อสถานะภาษาไทย"
              name="residency_name_th"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกชื่อสถานะภาษาไทย",
                },
              ]}
            >
              <Input
                maxLength={
                  200
                }
                placeholder="ผู้มีถิ่นที่อยู่ในประเทศไทย"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ชื่อสถานะภาษาอังกฤษ"
              name="residency_name_en"
            >
              <Input
                maxLength={
                  200
                }
                placeholder="Tax Resident"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="สถานะ"
              name="status"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือกสถานะ",
                },
              ]}
            >
              <Select
                options={[
                  {
                    value:
                      "active",

                    label:
                      "ใช้งาน",
                  },
                  {
                    value:
                      "inactive",

                    label:
                      "ไม่ใช้งาน",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
          >
            <Form.Item
              label="หมายเหตุ"
              name="remark"
            >
              <TextArea
                rows={
                  3
                }
                maxLength={
                  1000
                }
                showCount
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
