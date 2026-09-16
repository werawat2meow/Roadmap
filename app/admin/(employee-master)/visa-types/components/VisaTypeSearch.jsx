"use client";

import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
} from "antd";

import {
  ClearOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  STATUS_OPTIONS,
} from "./VisaTypeForm";

const ALLOWS_WORK_OPTIONS = [
  {
    value: "true",
    label: "รองรับการทำงาน",
  },
  {
    value: "false",
    label: "ไม่รองรับการทำงาน",
  },
];

export default function VisaTypeSearch({
  search = "",
  companyId = "",
  allowsWork = "",
  status = "",
  companies = [],
  companyLoading = false,
  loading = false,
  onSearchChange,
  onCompanyChange,
  onAllowsWorkChange,
  onStatusChange,
  onClear,
  onRefresh,
}) {
  return (
    <Card size="small">
      <Row gutter={[12, 12]}>
        <Col
          xs={24}
          md={8}
        >
          <Input
            allowClear
            prefix={
              <SearchOutlined />
            }
            placeholder="ค้นหารหัส / ชื่อประเภทวีซ่า"
            value={search}
            onChange={(
              event
            ) =>
              onSearchChange?.(
                event.target.value
              )
            }
          />
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="บริษัททั้งหมด"
            loading={
              companyLoading
            }
            value={
              companyId ||
              undefined
            }
            options={companies}
            onChange={(
              value
            ) =>
              onCompanyChange?.(
                value || ""
              )
            }
          />
        </Col>

        <Col
          xs={24}
          md={5}
        >
          <Select
            allowClear
            className="w-full"
            placeholder="สิทธิ์ทำงานทั้งหมด"
            value={
              allowsWork ||
              undefined
            }
            options={
              ALLOWS_WORK_OPTIONS
            }
            onChange={(
              value
            ) =>
              onAllowsWorkChange?.(
                value || ""
              )
            }
          />
        </Col>

        <Col
          xs={24}
          md={5}
        >
          <Select
            allowClear
            className="w-full"
            placeholder="ทุกสถานะ"
            value={
              status ||
              undefined
            }
            options={
              STATUS_OPTIONS
            }
            onChange={(
              value
            ) =>
              onStatusChange?.(
                value || ""
              )
            }
          />
        </Col>

        <Col xs={24}>
          <Space wrap>
            <Button
              icon={
                <ClearOutlined />
              }
              disabled={loading}
              onClick={onClear}
            >
              ล้างตัวกรอง
            </Button>

            <Button
              icon={
                <ReloadOutlined />
              }
              loading={loading}
              onClick={
                onRefresh
              }
            >
              รีเฟรช
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
