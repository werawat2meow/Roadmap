"use client";

import {
  Card,
  Checkbox,
  Button,
  Empty,
  Space,
  Typography,
  Divider,
} from "antd";

const { Text } = Typography;

export default function PositionFamilyLevelTransfer({
  levels = [],
  selectedLevels = [],
  loading = false,
  onChange,
}) {
  const allIds = levels.map((item) => item.id);

  const handleSelectAll = () => {
    onChange(allIds);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleCheck = (checked, id) => {
    if (checked) {
      onChange([...selectedLevels, id]);
    } else {
      onChange(
        selectedLevels.filter(
          (item) => item !== id
        )
      );
    }
  };

  return (
    <Card
      loading={loading}
      title="Supported Position Levels"
      extra={
        <Space>
          <Button
            size="small"
            onClick={handleSelectAll}
          >
            Select All
          </Button>

          <Button
            size="small"
            onClick={handleClearAll}
          >
            Clear
          </Button>
        </Space>
      }
    >
      <Text type="secondary">
        เลือกระดับตำแหน่งที่สามารถใช้งานได้ใน
        Position Family นี้
      </Text>

      <Divider />

      {levels.length === 0 ? (
        <Empty
          description="ไม่พบ Position Levels"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3">

            {levels.map((item) => (
              <Checkbox
                key={item.id}
                checked={selectedLevels.includes(
                  item.id
                )}
                onChange={(e) =>
                  handleCheck(
                    e.target.checked,
                    item.id
                  )
                }
              >
                <Space size={4}>
                  <Text strong>
                    {item.level_code}
                  </Text>

                  <Text type="secondary">
                    {item.level_name}
                  </Text>
                </Space>
              </Checkbox>
            ))}

          </div>

          <Divider />

          <Text type="secondary">
            เลือกแล้ว{" "}
            <b>{selectedLevels.length}</b>{" "}
            จาก <b>{levels.length}</b> ระดับ
          </Text>
        </>
      )}
    </Card>
  );
}