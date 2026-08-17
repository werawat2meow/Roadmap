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
  Space, 
  Button,
  Select,
  Statistic,
} from "antd";
import dayjs from "dayjs";
import LazyEmployeeSelect from "./LazyEmployeeSelect";
import {
  adjustmentTypeOptions,
  formatMoney,
} from "./compensationUi";

const { TextArea } = Input;

export default function CompensationAdjustmentModal({
  open,
  saving = false,
  form,
  currentCompensation,
  initialEmployee,
  onEmployeeChange,
  onCancel,
  onSubmit,
}) {
  const currentSalary = Number(currentCompensation?.base_salary || 0);
  const amount = Number(Form.useWatch("adjustment_amount", form) || 0);
  const percent = Form.useWatch("adjustment_percent", form);
  const proposedInput = Form.useWatch("proposed_salary", form);

  let preview = currentSalary;
  if (proposedInput !== null && proposedInput !== undefined && proposedInput !== "") {
    preview = Number(proposedInput || 0);
  } else if (amount) {
    preview = currentSalary + amount;
  } else if (percent !== null && percent !== undefined && percent !== "") {
    preview = currentSalary + currentSalary * (Number(percent) / 100);
  }

  return (
    <Modal
      open={open}
      title="สร้าง Salary Adjustment"
      okText="สร้าง Adjustment"
      cancelText="ยกเลิก"
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="พนักงาน"
          name="employee_id"
          rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
        >
          <LazyEmployeeSelect
            initialEmployee={initialEmployee}
            onChange={(value, employee) => onEmployeeChange?.(value, employee)}
          />
        </Form.Item>

        <Row gutter={16} className="mb-2">
          <Col span={12}>
            <Statistic
              title="เงินเดือนปัจจุบัน"
              value={currentSalary}
              precision={2}
              suffix={currentCompensation?.currency_code || "THB"}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="เงินเดือนหลังปรับ (Preview)"
              value={Number.isFinite(preview) ? preview : 0}
              precision={2}
              suffix={currentCompensation?.currency_code || "THB"}
            />
          </Col>
        </Row>

        <Divider titlePlacement="left">รายละเอียดการปรับ</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="ประเภทการปรับ"
              name="adjustment_type"
              rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
            >
              <Select options={adjustmentTypeOptions} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="วันที่มีผล"
              name="effective_date"
              rules={[{ required: true, message: "กรุณาระบุวันที่มีผล" }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="เพิ่ม/ลด จำนวนเงิน" name="adjustment_amount">
              <InputNumber precision={2} className="w-full" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="เพิ่ม/ลด เปอร์เซ็นต์" name="adjustment_percent">
              <Space.Compact className="w-full">
                <InputNumber precision={4} className="w-full" />
                <Button disabled style={{ pointerEvents: "none" }}>%</Button>
              </Space.Compact>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="เงินเดือนใหม่ (กำหนดตรง)" name="proposed_salary">
              <InputNumber min={0} precision={2} className="w-full" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">Performance / Review</Divider>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Performance Rating" name="performance_rating">
              <Input placeholder="A / B / Exceeds" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Performance Score" name="performance_score">
              <InputNumber className="w-full" precision={4} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Review Cycle" name="review_cycle">
              <Input placeholder="2026 Annual Review" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="เหตุผล" name="reason">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item label="หมายเหตุ" name="remark">
          <TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function adjustmentToPayload(values) {
  return {
    ...values,
    effective_date: values.effective_date
      ? dayjs(values.effective_date).format("YYYY-MM-DD")
      : null,
  };
}
