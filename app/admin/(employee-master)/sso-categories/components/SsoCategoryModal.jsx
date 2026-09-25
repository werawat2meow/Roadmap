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

export default function SsoCategoryModal({
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

  const isDefault =
    Boolean(
      Form.useWatch(
        "is_default",
        form
      )
    );

  return (
    <Modal
      open={
        open
      }
      width={
        820
      }
      title={
        viewMode
          ? "รายละเอียดประเภทผู้ประกันตน"
          : editing
            ? "แก้ไขประเภทผู้ประกันตน"
            : "เพิ่มประเภทผู้ประกันตน"
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
        style: viewMode
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
          title="Master นี้เก็บประเภทผู้ประกันตน ไม่เก็บอัตราเงินสมทบ"
          description="อัตราสมทบและเพดานการคำนวณให้แยกอยู่ในค่าคงที่ภาษีและประกันสังคม เพื่อไม่ผูกค่ากฎหมายไว้กับประเภทผู้ประกันตนโดยตรง"
        />

        {isDefault ? (
          <Alert
            className="mb-4"
            showIcon
            type="warning"
            title="เมื่อบันทึกเป็นค่าเริ่มต้น ระบบจะยกเลิกค่าเริ่มต้นของประเภทอื่นอัตโนมัติ"
          />
        ) : null}

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
              extra="เช่น section_33"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกรหัสประเภท",
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
                placeholder="section_33"
                onChange={(
                  event
                ) => {
                  form.setFieldValue(
                    "category_code",
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
              label="เลขมาตรา"
              name="section_no"
              extra="เว้นว่างได้สำหรับประเภทอื่น"
              rules={[
                {
                  type:
                    "number",

                  min:
                    1,

                  max:
                    999,

                  message:
                    "เลขมาตราไม่ถูกต้อง",
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={
                  1
                }
                max={
                  999
                }
                precision={
                  0
                }
                placeholder="เช่น 33"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ชื่อประเภทภาษาไทย"
              name="category_name_th"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกชื่อประเภทภาษาไทย",
                },
              ]}
            >
              <Input
                maxLength={
                  200
                }
                placeholder="เช่น มาตรา 33"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ชื่อประเภทภาษาอังกฤษ"
              name="category_name_en"
            >
              <Input
                maxLength={
                  200
                }
                placeholder="เช่น Section 33"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ต้องผูกบริษัทนายจ้าง"
              name="requires_employer_registration"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="ใช่"
                unCheckedChildren="ไม่"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ค่าเริ่มต้น"
              name="is_default"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="ใช่"
                unCheckedChildren="ไม่"
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={8}
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
            md={8}
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
