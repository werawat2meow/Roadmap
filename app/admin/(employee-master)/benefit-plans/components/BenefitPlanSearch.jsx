"use client";

import {
  Button,
  Col,
  Input,
  Row,
  Select,
} from "antd";

import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

function buildCategoryOptions(
  categories
) {
  return (
    categories || []
  ).map(
    (item) => ({
      value:
        item.id,

      label:
        `${item.category_code} - ${item.category_name}`,
    })
  );
}

export default function BenefitPlanSearch({
  loading = false,
  categoryLoading = false,

  search = "",
  categories = [],
  categoryId,
  status,

  onSearch,
  onCategoryChange,
  onStatusChange,
  onRefresh,
}) {
  return (
    <Row
      
    >
      <Col
        xs={24}
        lg={10}
      >
        <Input
          allowClear
          value={
            search
          }
          prefix={
            <SearchOutlined />
          }
          placeholder="ค้นหารหัส ชื่อ หรือรายละเอียดแผนสวัสดิการ"
          onChange={(
            event
          ) =>
            onSearch?.(
              event.target
                .value
            )
          }
        />
      </Col>

      <Col
        xs={24}
        sm={12}
        lg={6}
      >
        <Select
          allowClear
          showSearch
          className="w-full"
          optionFilterProp="label"
          loading={
            categoryLoading
          }
          value={
            categoryId
          }
          options={
            buildCategoryOptions(
              categories
            )
          }
          placeholder="ทุกประเภทสวัสดิการ"
          onChange={
            onCategoryChange
          }
        />
      </Col>

      <Col
        xs={24}
        sm={8}
        lg={5}
      >
        <Select
          allowClear
          className="w-full"
          value={
            status
          }
          placeholder="ทุกสถานะ"
          options={[
            {
              value:
                true,

              label:
                "ใช้งาน",
            },
            {
              value:
                false,

              label:
                "ไม่ใช้งาน",
            },
          ]}
          onChange={
            onStatusChange
          }
        />
      </Col>

      <Col
        xs={24}
        sm={4}
        lg={3}
      >
        <Button
          block
          icon={
            <ReloadOutlined />
          }
          loading={
            loading
          }
          onClick={
            onRefresh
          }
        >
          รีเฟรช
        </Button>
      </Col>
    </Row>
  );
}
