"use client";

import {
  Card,
  Descriptions,
  Tag,
  Empty,
  Space,
  Typography,
} from "antd";

const { Text } = Typography;

export default function PositionFamilyLevelSummary({
  family,
  levels = [],
}) {
  if (!family) {
    return (
      <Card className="mb-4">
        <Empty
          description="กรุณาเลือก Position Family"
        />
      </Card>
    );
  }

  return (
    <Card
      className="mb-4"
      title="Position Family Summary"
    >

      <Descriptions
        bordered
        column={2}
        size="small"
      >

        <Descriptions.Item label="Family Code">
          {family.family_code}
        </Descriptions.Item>

        <Descriptions.Item label="Family Name">
          {family.family_name}
        </Descriptions.Item>

        <Descriptions.Item
          label="Description"
          span={2}
        >
          {family.description || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Supported Levels">
          {levels.length}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag
            color={
              family.status === "active"
                ? "green"
                : "red"
            }
          >
            {family.status}
          </Tag>
        </Descriptions.Item>

      </Descriptions>

      <div className="mt-5">

        <Text strong>
          Position Levels
        </Text>

        <div className="mt-3">

          <Space wrap>

            {levels.length === 0 ? (
              <Text type="secondary">
                ยังไม่ได้กำหนด Position Level
              </Text>
            ) : (
              levels.map((item) => (
                <Tag
                  key={item.id}
                  color="blue"
                >
                  {item.level_code}
                </Tag>
              ))
            )}

          </Space>

        </div>

      </div>

    </Card>
  );
}