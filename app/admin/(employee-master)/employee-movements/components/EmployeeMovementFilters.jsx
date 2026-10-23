"use client";

import { Button, Card, Col, DatePicker, Input, Row, Select, Typography } from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ORG = [
  ["company_id", "สังกัด/แบรนด์"],
  ["department_id", "แผนก"],
];

export default function EmployeeMovementFilters({
  keywordText,
  setKeywordText,
  codeText,
  setCodeText,
  levelText,
  setLevelText,
  range,
  setRange,
  filters,
  setFilters,
  event,
  setEvent,
  statuses,
  types,
  orgOptions,
  onReset,
  onExport,
  onChecklist,
  employeeId,
  onEmployeeChange,
  employeeOptions = [],
  employeeLoading = false,
  onEmployeeSearch,
}) {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 18,
      }}
      styles={{
        body: {
          padding: 20,
        },
      }}
    >
      <Row gutter={[14, 14]} align="bottom">
        <Col xs={24} md={8} lg={4}>
          <Text strong>สถานะการทำงาน</Text>
          <Select
            style={{ width: "100%", marginTop: 6 }}
            allowClear
            placeholder="-- กรุณาเลือก --"
            value={filters.employee_status_id || undefined}
            onChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                employee_status_id: value,
              }));
            }}
            options={statuses.map((item) => ({
              label: item.status_name,
              value: item.id,
            }))}
          />
        </Col>

        <Col xs={24} md={8} lg={3}>
          <Text strong>เริ่มงานวันที่</Text>
          <DatePicker
            style={{ width: "100%", marginTop: 6 }}
            format="DD/MM/YYYY"
            value={range?.[0] || null}
            disabledDate={(date) => !!(date && range?.[1] && date.isAfter(range[1], 'day'))}
            onChange={(value) => {
              setRange((prev) => {
                if (!value && !prev?.[1]) return null;
                return [value, prev?.[1] || null];
              });
            }}
          />
        </Col>

        <Col xs={24} md={8} lg={3}>
          <Text strong>ถึงวันที่</Text>
          <DatePicker
            style={{ width: "100%", marginTop: 6 }}
            format="DD/MM/YYYY"
            value={range?.[1] || null}
            disabledDate={(date) => !!(date && range?.[0] && date.isBefore(range[0], 'day'))}
            onChange={(value) => {
              setRange((prev) => {
                if (!value && !prev?.[0]) return null;
                return [prev?.[0] || null, value];
              });
            }}
          />
        </Col>

        <Col xs={24} md={8} lg={3}>
          <Text strong>ระดับ P</Text>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="เลือกระดับ P"
            value={levelText || undefined}
            onChange={(value) => setLevelText(value || "")}
            options={orgOptions.position_levels || []}
            style={{ width: "100%", marginTop: 6 }}
          />
        </Col>

        {ORG.map(([key, label]) => (
          <Col xs={24} md={8} lg={5} key={key}>
            <Text strong>{label}</Text>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={`เลือก${label}`}
              value={filters[key] || undefined}
              style={{ width: "100%", marginTop: 6 }}
              options={orgOptions[key] || []}
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  [key]: value,
                }));
              }}
            />
          </Col>
        ))}

        {/* <Col xs={24} md={8} lg={4}>
          <Text strong>ติดตามรายการ</Text>
          <Select
            style={{ width: "100%", marginTop: 6 }}
            allowClear
            placeholder="-- กรุณาเลือก --"
            value={event || undefined}
            onChange={(value) => setEvent(value || "")}
            options={types.map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Col> */}

        <Col xs={24} md={8} lg={3}>
          <Text strong>รหัสพนักงาน</Text>
          <Input
            allowClear
            placeholder="EM00001"
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            style={{ marginTop: 6 }}
          />
        </Col>

        <Col xs={24} md={24} lg={8}>
          <Text strong>คำค้น</Text>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="ชื่อ-สกุล / ตำแหน่ง / ชื่อกลุ่มไลน์ / ไอดีไลน์"
            value={keywordText}
            onChange={(e) => setKeywordText(e.target.value)}
            style={{ marginTop: 6 }}
          />
        </Col>

        <Col xs={24} md={24} lg={6}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-start",
              alignItems: "flex-end",
              height: "100%",
            }}
          >
            <Button onClick={onReset}>Clear</Button>
            <Button icon={<DownloadOutlined />} disabled={!onExport} onClick={onExport}>Export</Button>
            <Button onClick={onChecklist}>CheckList</Button>
            
          </div>
        </Col>
      </Row>
    </Card>
  );
}
