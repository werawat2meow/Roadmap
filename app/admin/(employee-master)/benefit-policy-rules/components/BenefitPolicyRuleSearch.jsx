"use client";

import {
  Button,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function BenefitPolicyRuleSearch({
  search,
  setSearch,

  year,
  setYear,

  benefitId,
  setBenefitId,

  status,
  setStatus,

  benefitOptions = [],

  loading = false,
  canCreate = false,

  onSearch,
  onReset,
  onCreate,
}) {
  /* =========================================================
     Search / Filter UI only
     Auto Search ถูกควบคุมจาก page.jsx เพื่อให้ทุก Filter
     ใช้พฤติกรรมเดียวกันตาม Master Page pattern
  ========================================================= */

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Row
        gutter={[
          12,
          12,
        ]}
        align="middle"
      >
        {/* =====================================================
            Search
        ===================================================== */}

        <Col
          xs={24}
          lg={7}
        >
          <Input
            allowClear
            value={search}
            prefix={
              <SearchOutlined />
            }
            placeholder="ค้นหา Policy Code / Policy Name"

            /*
             * ส่งค่า Search กลับไปที่ page.jsx
             * page.jsx เป็นคน debounce และโหลดข้อมูลอัตโนมัติ
             */
            onChange={(
              event
            ) =>
              setSearch(
                event
                  .target
                  .value
              )
            }

            /*
             * Enter ยังใช้ได้เหมือนเดิม
             */
            onPressEnter={
              onSearch
            }
          />
        </Col>

        {/* =====================================================
            Year
        ===================================================== */}

        <Col
          xs={24}
          sm={12}
          lg={3}
        >
          <InputNumber
            className="w-full"
            min={2000}
            max={2100}
            value={year}
            placeholder="ปี"
            onChange={(
              value
            ) =>
              setYear(
                value
              )
            }
          />
        </Col>

        {/* =====================================================
            Benefit
        ===================================================== */}

        <Col
          xs={24}
          sm={12}
          lg={5}
        >
          <Select
            allowClear
            showSearch
            className="w-full"
            value={
              benefitId
            }
            optionFilterProp="label"
            options={
              benefitOptions
            }
            placeholder="ทุกแผนสวัสดิการ"
            onChange={
              setBenefitId
            }
          />
        </Col>

        {/* =====================================================
            Status
        ===================================================== */}

        <Col
          xs={24}
          sm={12}
          lg={3}
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
                label:
                  "Active",
                value:
                  true,
              },
              {
                label:
                  "Inactive",
                value:
                  false,
              },
            ]}
            onChange={
              setStatus
            }
          />
        </Col>

        {/* =====================================================
            Actions
        ===================================================== */}

        <Col
          xs={24}
          lg={6}
        >
          <Space
            wrap
            className="w-full justify-end"
          >
            <Button
              icon={
                <SearchOutlined />
              }
              loading={
                loading
              }
              onClick={
                onSearch
              }
            >
              ค้นหา
            </Button>

            <Button
              icon={
                <ReloadOutlined />
              }
              disabled={
                loading
              }
              onClick={
                onReset
              }
            >
              ล้างค่า
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={
                  <PlusOutlined />
                }
                onClick={
                  onCreate
                }
              >
                เพิ่ม Policy
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
}