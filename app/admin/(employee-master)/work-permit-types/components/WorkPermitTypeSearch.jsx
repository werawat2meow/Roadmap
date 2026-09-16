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
} from "./WorkPermitTypeForm";

const VALID_VISA_OPTIONS = [
  {
    value: "true",
    label: "ต้องมี Visa ที่ยังใช้งาน",
  },
  {
    value: "false",
    label: "ไม่บังคับ Visa",
  },
];

export default function WorkPermitTypeSearch({
  search = "",
  companyId = "",
  requiresValidVisa = "",
  status = "",
  companies = [],
  companyLoading = false,
  loading = false,
  onSearchChange,
  onCompanyChange,
  onRequiresValidVisaChange,
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
            placeholder="ค้นหารหัส / ชื่อประเภทใบอนุญาตทำงาน"
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
            placeholder="เงื่อนไข Visa"
            value={
              requiresValidVisa ||
              undefined
            }
            options={
              VALID_VISA_OPTIONS
            }
            onChange={(
              value
            ) =>
              onRequiresValidVisaChange?.(
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
