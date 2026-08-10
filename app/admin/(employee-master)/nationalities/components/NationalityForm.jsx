"use client";

import {
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

import { useEffect, useState } from "react";

export default function NationalityForm({form,disabled = false,onFinish,}) {
  const [countries, setCountries] =useState([]);
  useEffect(() => {
    loadCountries();
  }, []);

  async function loadCountries() {
    try {
      const res = await fetch(
        "/api/admin/countries?all=true"
      );

      const result =
        await res.json();

      if (result.success) {
        setCountries(
          result.data || []
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Divider titlePlacement="left">
        ข้อมูลสัญชาติ
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={6}>
          <Form.Item
            label="Nationality Code"
            name="nationality_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสสัญชาติ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="THAI"
              style={{
                textTransform:
                  "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={10}>
          <Form.Item
            label="ประเทศ"
            name="country_id"
          >
            <Select
              disabled={disabled}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="เลือกประเทศ"
              options={countries.map(
                item => ({
                  value: item.id,
                  label: `${item.flag_emoji || ""} ${item.country_name_th}`,
                })
              )}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item
            label="ISO2"
            name="iso2"
          >
            <Input
              disabled={disabled}
              placeholder="TH"
              style={{
                textTransform:
                  "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item
            label="ISO3"
            name="iso3"
          >
            <Input
              disabled={disabled}
              placeholder="THA"
              style={{
                textTransform:
                  "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ชื่อสัญชาติ (ไทย)"
            name="nationality_name_th"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อสัญชาติ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="ไทย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="Nationality (English)"
            name="nationality_name_en"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อภาษาอังกฤษ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Thai"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="left">
        การตั้งค่าระบบ
      </Divider>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Default Nationality"
            name="is_default"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="ลำดับ"
            name="sort_order"
            initialValue={0}
          >
            <InputNumber
              disabled={disabled}
              min={0}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  label: "ใช้งาน",
                  value: "active",
                },
                {
                  label: "ไม่ใช้งาน",
                  value: "inactive",
                },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}