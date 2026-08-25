"use client";

import { Button, Card, Col, Form, Input, Row, Select, Space } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useRef } from "react";

const AUTO_SEARCH_DELAY_MS = 500;

export const CATEGORY_OPTIONS = [
  { value: "salary", label: "เงินเดือน" },
  { value: "allowance", label: "เงินเพิ่ม / เบี้ยเลี้ยง" },
  { value: "overtime", label: "ค่าล่วงเวลา" },
  { value: "bonus", label: "โบนัส" },
  { value: "commission", label: "ค่าคอมมิชชั่น" },
  { value: "incentive", label: "เงินจูงใจ" },
  { value: "reimbursement", label: "เงินชดเชย / เบิกคืน" },
  { value: "other", label: "อื่น ๆ" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
];

export default function EarningTypeSearch({ loading = false, value = {}, onSearch, onReset }) {
  const [form] = Form.useForm();
  const debounceRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    form.setFieldsValue({ search: value.search || "", status: value.status || "", earning_category: value.earning_category || "" });
  }, [form, value]);

  // ยกเลิก debounce ที่ค้างอยู่เมื่อ component unmount กัน setState หลัง unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const triggerSearch = (overrideValues) => {
    const values = { ...form.getFieldsValue(), ...overrideValues };
    onSearch?.({
      search: values.search?.trim() || "",
      status: values.status || "",
      earning_category: values.earning_category || "",
    });
  };

  // พิมพ์ในช่องค้นหา -> auto search แบบ debounce ไม่ต้องกดปุ่ม/Enter
  const handleSearchChange = (e) => {
    const nextValue = e.target.value;
    form.setFieldValue("search", nextValue);
    if (isFirstRender.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerSearch({ search: nextValue }), AUTO_SEARCH_DELAY_MS);
  };

  // เปลี่ยน Select (หมวดรายได้ / สถานะ) -> ค้นหาทันที ไม่ต้องรอ debounce
  const handleSelectChange = (field) => (nextValue) => {
    form.setFieldValue(field, nextValue ?? "");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    triggerSearch({ [field]: nextValue ?? "" });
  };

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ search: "", status: "", earning_category: "" }}
        onFinish={(values) => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          onSearch?.({
            search: values.search?.trim() || "",
            status: values.status || "",
            earning_category: values.earning_category || "",
          });
        }}
      >
        <Row gutter={16}>
          <Col xs={24} lg={10}>
            <Form.Item label="ค้นหา" name="search">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="รหัส / ชื่อประเภทเงินได้ / รายละเอียด"
                onChange={handleSearchChange}
                onClear={() => {
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  triggerSearch({ search: "" });
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={7}>
            <Form.Item label="หมวดรายได้" name="earning_category">
              <Select
                allowClear
                placeholder="ทุกหมวด"
                options={CATEGORY_OPTIONS}
                onChange={handleSelectChange("earning_category")}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={7}>
            <Form.Item label="สถานะ" name="status">
              <Select
                allowClear
                placeholder="ทุกสถานะ"
                options={STATUS_OPTIONS}
                onChange={handleSelectChange("status")}
              />
            </Form.Item>
          </Col>
        </Row>
        <Space wrap>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>ค้นหา</Button>
          <Button
            icon={<ReloadOutlined />}
            disabled={loading}
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              form.resetFields();
              form.setFieldsValue({ search: "", status: "", earning_category: "" });
              onReset?.();
            }}
          >ล้างตัวกรอง</Button>
        </Space>
      </Form>
    </Card>
  );
}