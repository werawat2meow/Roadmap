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

export default function CountryForm({
  form,
  disabled = false,
  onFinish,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Divider titlePlacement="left">
        ข้อมูลประเทศ
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={6}>
          <Form.Item
            label="Country Code"
            name="country_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสประเทศ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="TH"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ISO2"
            name="iso2"
            rules={[
              {
                required: true,
                message: "กรุณากรอก ISO2",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="TH"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ISO3"
            name="iso3"
            rules={[
              {
                required: true,
                message: "กรุณากรอก ISO3",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="THA"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="Dial Code"
            name="dialing_code"
          >
            <Input
              disabled={disabled}
              placeholder="+66"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ชื่อประเทศ (ไทย)"
            name="country_name_th"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อประเทศ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="ประเทศไทย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="Country Name (English)"
            name="country_name_en"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อประเทศภาษาอังกฤษ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Thailand"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="สัญชาติ (ไทย)"
            name="nationality_th"
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
            name="nationality_en"
          >
            <Input
              disabled={disabled}
              placeholder="Thai"
            />
          </Form.Item>
        </Col>

      </Row>
            <Divider titlePlacement="left">
        ข้อมูลเพิ่มเติม
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={4}>
          <Form.Item
            label="Currency"
            name="currency_code"
          >
            <Input
              disabled={disabled}
              placeholder="THB"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="Currency Name"
            name="currency_name"
          >
            <Input
              disabled={disabled}
              placeholder="Thai Baht"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item
            label="Symbol"
            name="currency_symbol"
          >
            <Input
              disabled={disabled}
              placeholder="฿"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="Timezone"
            name="timezone"
          >
            <Input
              disabled={disabled}
              placeholder="Asia/Bangkok"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="Continent"
            name="continent"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  label: "Africa",
                  value: "Africa",
                },
                {
                  label: "Asia",
                  value: "Asia",
                },
                {
                  label: "Europe",
                  value: "Europe",
                },
                {
                  label: "North America",
                  value: "North America",
                },
                {
                  label: "South America",
                  value: "South America",
                },
                {
                  label: "Oceania",
                  value: "Oceania",
                },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="Region"
            name="region"
          >
            <Input
              disabled={disabled}
              placeholder="South-East Asia"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item
            label="Flag Emoji"
            name="flag_emoji"
          >
            <Input
              disabled={disabled}
              placeholder="🇹🇭"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
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

        <Col xs={24} md={4}>
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
            <Divider titlePlacement="left">
        การตั้งค่าระบบ
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={8}>
          <Form.Item
            label="Default Country"
            name="is_default"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="ประเทศไทย"
            name="is_thailand"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

      </Row>

    </Form>
  );
}