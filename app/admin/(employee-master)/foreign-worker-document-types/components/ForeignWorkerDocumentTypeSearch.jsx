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
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
} from "./ForeignWorkerDocumentTypeForm";

const MANDATORY_OPTIONS = [
  {
    value: "true",
    label: "เอกสารบังคับ",
  },
  {
    value: "false",
    label: "ไม่บังคับ",
  },
];

export default function ForeignWorkerDocumentTypeSearch({
  search = "",
  companyId = "",
  documentCategory = "",
  mandatory = "",
  status = "",
  companies = [],
  companyLoading = false,
  loading = false,
  onSearchChange,
  onCompanyChange,
  onCategoryChange,
  onMandatoryChange,
  onStatusChange,
  onClear,
  onRefresh,
}) {
  return (
    <Card size="small">
      <Row gutter={[12, 12]}>
        <Col
          xs={24}
          lg={7}
        >
          <Input
            allowClear
            prefix={
              <SearchOutlined />
            }
            placeholder="ค้นหารหัส / ชื่อประเภทเอกสาร"
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
          md={12}
          lg={5}
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
          md={12}
          lg={4}
        >
          <Select
            allowClear
            className="w-full"
            placeholder="ทุกหมวดเอกสาร"
            value={
              documentCategory ||
              undefined
            }
            options={
              CATEGORY_OPTIONS
            }
            onChange={(
              value
            ) =>
              onCategoryChange?.(
                value || ""
              )
            }
          />
        </Col>

        <Col
          xs={24}
          md={12}
          lg={4}
        >
          <Select
            allowClear
            className="w-full"
            placeholder="บังคับ/ไม่บังคับ"
            value={
              mandatory ||
              undefined
            }
            options={
              MANDATORY_OPTIONS
            }
            onChange={(
              value
            ) =>
              onMandatoryChange?.(
                value || ""
              )
            }
          />
        </Col>

        <Col
          xs={24}
          md={12}
          lg={4}
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
