"use client";

import { useEffect } from "react";
import {Modal,Form,Input,InputNumber,Select,DatePicker,Row,Col, Alert, Collapse,Typography,} from "antd";
import dayjs from "dayjs";

export default function PositionLevelBandModal({
  open,
  onCancel,
  onSubmit,
  loading,
  editingItem,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      form.setFieldsValue({
        ...editingItem,

        effective_date: editingItem.effective_date
          ? dayjs(editingItem.effective_date)
          : null,

        expire_date: editingItem.expire_date
          ? dayjs(editingItem.expire_date)
          : null,
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        status: "active",
        step_no: 1,
        sort_order: 0,
      });
    }
  }, [editingItem, open, form]);

  const calculateMidpoint = () => {
    const min = Number(
      form.getFieldValue("salary_min") || 0
    );

    const max = Number(
      form.getFieldValue("salary_max") || 0
    );

    if (max >= min) {
      form.setFieldValue(
        "midpoint",
        Number(((min + max) / 2).toFixed(2))
      );
    }
  };

  const handleFinish = (values) => {
    onSubmit({
      ...values,
      effective_date: values.effective_date
        ? values.effective_date.format("YYYY-MM-DD")
        : null,
      expire_date: values.expire_date
        ? values.expire_date.format("YYYY-MM-DD")
        : null,
    });
  };

  return (
    <Modal
      title={editingItem ? "แก้ไข Salary Band" : "เพิ่ม Salary Band"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnHidden
      width={850}
      mask={{
        closable: false,
      }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        title="คำแนะนำการสร้าง Salary Band"
        description={
          <div>
            <p>
              <strong>Band Code</strong> :
              ใช้กำหนดรหัสของ Salary Band เช่น S1, S2, M1
            </p>

            <p>
              <strong>Band Name</strong> :
              ชื่อที่ใช้แสดงผล เช่น Step 1,
              Junior, Senior
            </p>

            <p>
              <strong>Step No</strong> :
              ลำดับขั้นของ Salary Band
              โดยเริ่มจาก 1 → 2 → 3 ...
            </p>

            <p>
              <strong>Salary Range</strong> :
              กำหนดช่วงเงินเดือนขั้นต่ำและสูงสุด
              ระบบจะคำนวณ Midpoint ให้อัตโนมัติ
            </p>

            <p>
              <strong>Effective Date</strong> :
              วันที่เริ่มใช้งาน Salary Band
            </p>

            <p>
              <strong>Expire Date</strong> :
              เว้นว่างได้ หากยังไม่มีวันสิ้นสุด
            </p>
          </div>
        }
      />

      <Collapse
        defaultActiveKey={["guide"]}
        style={{ marginBottom: 20 }}
        items={[
          {
            key: "guide",
            label: "📘 วิธีการสร้าง Salary Band",
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="Salary Band คืออะไร ?"
                  description="Salary Band คือช่วงเงินเดือนของ Position Level โดยแต่ละ Step จะใช้กำหนดการเติบโตของเงินเดือนภายในตำแหน่งเดียวกัน"
                />

                <Typography.Paragraph>
                  <strong>ตัวอย่าง</strong>
                </Typography.Paragraph>

                <pre
                  style={{
                    background: "#fafafa",
                    padding: 16,
                    borderRadius: 8,
                    overflow: "auto",
                  }}
                >
                {`Position Level : P7

                S1   30,000 - 35,000
                S2   35,001 - 40,000
                S3   40,001 - 45,000
                S4   45,001 - 50,000`}
                </pre>

                <Typography.Paragraph>
                  • Band Code คือรหัสของ Salary Band
                </Typography.Paragraph>

                <Typography.Paragraph>
                  • Band Name คือชื่อที่ใช้แสดงผล
                </Typography.Paragraph>

                <Typography.Paragraph>
                  • Step No คือ ลำดับการเติบโตของเงินเดือน
                </Typography.Paragraph>

                <Typography.Paragraph>
                  • Midpoint ระบบจะคำนวณจาก Min และ Max ให้อัตโนมัติ
                </Typography.Paragraph>

                <Typography.Paragraph>
                  • Expire Date สามารถเว้นว่างได้ หากยังไม่มีวันสิ้นสุด
                </Typography.Paragraph>
              </>
            ),
          },
        ]}
      />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="รหัส Band"
              extra="เช่น S1, S2, M1 หรือ Executive-01"
              name="band_code"
              rules={[
                {
                  required: true,
                  message: "กรุณากรอกรหัส Band",
                },
              ]}
            >
              <Input placeholder="เช่น S1" maxLength={20} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="ชื่อ Band"
              extra="ชื่อที่ใช้แสดงผล เช่น Step 1, Junior, Senior"
              name="band_name"
              rules={[
                {
                  required: true,
                  message: "กรุณากรอกชื่อ Band",
                },
              ]}
            >
              <Input placeholder="เช่น Step 1" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="ลำดับขั้น (Step No)" extra="Step ที่น้อยกว่าจะเป็นเงินเดือนเริ่มต้นของ Position Level" name="step_no">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="ลำดับการแสดงผล" name="sort_order">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="สถานะ" name="status">
              <Select
                options={[
                  { label: "เปิดใช้งาน", value: "active" },
                  { label: "ปิดใช้งาน", value: "inactive" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="เงินเดือนขั้นต่ำ"
              extra="เงินเดือนต่ำสุดของ Band นี้"
              name="salary_min"
              rules={[
                {
                  required: true,
                  message: "กรุณากรอกเงินเดือนขั้นต่ำ",
                },
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/,/g, "")}
                onChange={calculateMidpoint}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="เงินเดือนสูงสุด"
              extra="เงินเดือนสูงสุดที่สามารถอยู่ใน Band นี้"
              name="salary_max"
              rules={[
                {
                  required: true,
                  message: "กรุณากรอกเงินเดือนสูงสุด",
                },
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/,/g, "")}
                onChange={calculateMidpoint}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="ค่ากลาง (Midpoint)" extra="ระบบคำนวณอัตโนมัติจากค่า Min และ Max" name="midpoint">
              <InputNumber
                disabled
                style={{ width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="วันที่เริ่มมีผล"  extra="วันที่เริ่มใช้งาน Salary Band นี้" name="effective_date">
              <DatePicker style={{ width: "100%" }} placeholder="เลือกวันที่" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="วันที่สิ้นสุด"  extra="เว้นว่างได้ หากยังไม่มีวันสิ้นสุดการใช้งาน" name="expire_date">
              <DatePicker style={{ width: "100%" }} placeholder="เลือกวันที่" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}