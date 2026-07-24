"use client";

import {
  Card,
  Button,
  Space,
  Typography,
} from "antd";

import {
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function PositionFamilyLevelToolbar({
  selectedFamilyId,
  selectedLevels = [],
  saving = false,
  loading = false,
  canEdit = false,
  onSave,
  onRefresh,
  onReset,
}) {
  return (
    <Card className="mb-4">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <Space orientation="vertical" size={0}>

          <Text strong>
            Position Family Level Management
          </Text>

          <Text type="secondary">
            เลือกแล้ว{" "}
            <b>{selectedLevels.length}</b>{" "}
            ระดับ
          </Text>

        </Space>

        <Space>

          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            disabled={!selectedFamilyId}
          >
            Reset
          </Button>

          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={onRefresh}
          >
            Refresh
          </Button>

          {canEdit && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!selectedFamilyId}
              onClick={onSave}
            >
              Save
            </Button>
          )}

        </Space>

      </div>

    </Card>
  );
}