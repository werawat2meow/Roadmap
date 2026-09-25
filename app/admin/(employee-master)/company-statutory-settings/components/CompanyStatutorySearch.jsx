"use client";

import { Button, Col, Input, Row, Select } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";

export default function CompanyStatutorySearch({
  loading = false,
  companyLoading = false,
  search = "",
  companies = [],
  companyId,
  status,
  onSearch,
  onCompanyChange,
  onStatusChange,
  onRefresh,
}) {
  const companyOptions = companies.map((item) => ({
    value: item.id,
    label: `${item.company_code || ""} - ${
      item.company_name_th || item.company_name_en || "-"
    }`,
  }));

  return (
    <Row >
      <Col xs={24} lg={9}>
        <Input
          allowClear
          value={search}
          prefix={<SearchOutlined />}
          placeholder="ค้นหาเลขทะเบียน SSO / WCF หรือชื่อบริษัท"
          onChange={(event) => onSearch?.(event.target.value)}
        />
      </Col>

      <Col xs={24} sm={12} lg={7}>
        <Select
          allowClear
          showSearch
          className="w-full"
          optionFilterProp="label"
          loading={companyLoading}
          value={companyId}
          options={companyOptions}
          placeholder="ทุกบริษัท"
          onChange={onCompanyChange}
        />
      </Col>

      <Col xs={24} sm={8} lg={5}>
        <Select
          allowClear
          className="w-full"
          value={status}
          placeholder="ทุกสถานะ"
          options={[
            { value: "active", label: "ใช้งาน" },
            { value: "inactive", label: "ไม่ใช้งาน" },
          ]}
          onChange={onStatusChange}
        />
      </Col>

      <Col xs={24} sm={4} lg={3}>
        <Button
          block
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={onRefresh}
        >
          รีเฟรช
        </Button>
      </Col>
    </Row>
  );
}
