"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function PositionCompetencySearch({
  search,
  setSearch,

  positionId,
  setPositionId,

  competencyId,
  setCompetencyId,

  requiredLevelId,
  setRequiredLevelId,

  importance,
  setImportance,

  status,
  setStatus,

  positions,
  competencies,
  competencyLevels,

  onSearch,
  onReset,
  onAdd,

  canCreate,
}) {
  return (
    <Card
      variant="borderless"
      className="mb-4"
    >
      <Row gutter={[16, 16]}>
        {/* =========================
              Search
        ========================= */}

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="ค้นหา"
            className="mb-0"
          >
            <Input
              allowClear
              placeholder="Position / Competency"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onPressEnter={
                onSearch
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
              Position
        ========================= */}

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="ตำแหน่ง"
            className="mb-0"
          >
            <Select
              allowClear
              showSearch
              value={
                positionId ||
                undefined
              }
              placeholder="ทั้งหมด"
              optionFilterProp="label"
              options={positions.map(
                (item) => ({
                  value: item.id,
                  label: `${item.position_code} - ${item.position_name}`,
                })
              )}
              onChange={(value) =>
                setPositionId(
                  value || ""
                )
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
              Competency
        ========================= */}

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Competency"
            className="mb-0"
          >
            <Select
              allowClear
              showSearch
              value={
                competencyId ||
                undefined
              }
              placeholder="ทั้งหมด"
              optionFilterProp="label"
              options={competencies.map(
                (item) => ({
                  value: item.id,
                  label: `${item.competency_code} - ${item.competency_name}`,
                })
              )}
              onChange={(value) =>
                setCompetencyId(
                  value || ""
                )
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
              Level
        ========================= */}

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Required Level"
            className="mb-0"
          >
            <Select
              allowClear
              value={
                requiredLevelId ||
                undefined
              }
              placeholder="ทั้งหมด"
              optionFilterProp="label"
              options={competencyLevels.map(
                (item) => ({
                  value: item.id,
                  label: `${item.level_code} - ${item.level_name}`,
                })
              )}
              onChange={(value) =>
                setRequiredLevelId(
                  value || ""
                )
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
              Importance
        ========================= */}

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Importance"
            className="mb-0"
          >
            <Select
              allowClear
              value={
                importance ||
                undefined
              }
              placeholder="ทั้งหมด"
              options={[
                {
                  value: "low",
                  label: "Low",
                },
                {
                  value: "medium",
                  label: "Medium",
                },
                {
                  value: "high",
                  label: "High",
                },
                {
                  value: "critical",
                  label:
                    "Critical",
                },
              ]}
              onChange={(value) =>
                setImportance(
                  value || ""
                )
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
              Status
        ========================= */}

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            label="Status"
            className="mb-0"
          >
            <Select
              value={status}
              options={[
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label:
                    "Inactive",
                },
              ]}
              onChange={
                setStatus
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
              Buttons
        ========================= */}

        <Col span={24}>
          <Form.Item
            label=" "
            className="mb-0"
          >
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                icon={
                  <SearchOutlined />
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
                onClick={
                  onReset
                }
              >
                รีเซ็ต
              </Button>

              {canCreate && (
                <Button
                  type="primary"
                  icon={
                    <PlusOutlined />
                  }
                  onClick={
                    onAdd
                  }
                >
                  เพิ่มข้อมูล
                </Button>
              )}
            </div>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}