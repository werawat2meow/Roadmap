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

export default function TaxResidencyStatusSearch({
  loading = false,
  search = "",
  status,

  onSearch,
  onStatusChange,
  onRefresh,
}) {
  return (
    <Row
     
    >
      <Col
        xs={24}
        lg={15}
      >
        <Input
          allowClear
          value={
            search
          }
          prefix={
            <SearchOutlined />
          }
          placeholder="ค้นหารหัสหรือชื่อสถานะ"
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
        sm={16}
        lg={6}
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
                "active",

              label:
                "ใช้งาน",
            },
            {
              value:
                "inactive",

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
        sm={8}
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
