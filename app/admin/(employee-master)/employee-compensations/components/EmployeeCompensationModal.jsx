"use client";

import {
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from "antd";
import dayjs from "dayjs";
import LazyEmployeeSelect from "./LazyEmployeeSelect";
import LazySalaryStructureSelect from "./LazySalaryStructureSelect";

const { TextArea } = Input;

export default function EmployeeCompensationModal({
  open,
  mode = "create",
  saving = false,
  form,
  onCancel,
  onSubmit,
}) {
  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      title={isEdit ? "แก้ไขข้อมูลค่าตอบแทน" : "กำหนดเงินเดือนเริ่มต้นพนักงาน"}
      okText={isEdit ? "บันทึก" : "สร้างรายการ"}
      cancelText="ยกเลิก"
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Divider titlePlacement="left">พนักงานและแถบเงินเดือน</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="พนักงาน"
              name="employee_id"
              rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
            >
              <LazyEmployeeSelect disabled={isEdit} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="แถบเงินเดือนตามระดับตำแหน่ง"
              name="salary_structure_id"
            >
              <LazySalaryStructureSelect />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="สกุลเงิน"
              name="currency_code"
              initialValue="THB"
            >
              <Select
                options={[
                  { value: "THB", label: "THB - บาท" },
                  { value: "USD", label: "USD" },
                  { value: "EUR", label: "EUR" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">เงินเดือนและวันที่มีผล</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="เงินเดือนฐาน"
              name="base_salary"
              rules={[{ required: true, message: "กรุณาระบุเงินเดือนฐาน" }]}
            >
              <InputNumber
                min={0}
                precision={2}
                className="w-full"
                placeholder="15000.00"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="วันที่มีผล"
              name="effective_from"
              rules={[{ required: true, message: "กรุณาระบุวันที่มีผล" }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="สิ้นสุดวันที่" name="effective_to">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="สถานะ"
              name="status"
              initialValue="active"
            >
              <Select
                options={[
                  { value: "draft", label: "ฉบับร่าง" },
                  { value: "active", label: "ใช้งาน" },
                  { value: "inactive", label: "สิ้นสุด" },
                  { value: "cancelled", label: "ยกเลิก" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="เหตุผล" name="reason">
          <Input placeholder="เช่น Initial salary / Migration" />
        </Form.Item>

        <Form.Item label="หมายเหตุ" name="remark">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function compensationToForm(record) {
  return {
    employee_id: record?.employee_id,
    salary_structure_id: record?.salary_structure_id || undefined,
    currency_code: record?.currency_code || "THB",
    base_salary: Number(record?.base_salary || 0),
    effective_from: record?.effective_from
      ? dayjs(record.effective_from)
      : null,
    effective_to: record?.effective_to ? dayjs(record.effective_to) : null,
    status: record?.status || "active",
    reason: record?.reason || "",
    remark: record?.remark || "",
  };
}
