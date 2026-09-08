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

  canCreate = false,
  canEdit = false,

  hasChanges = false,
  canSave = false,

  onSave,
  onRefresh,
  onReset,
}) {
  /* =========================================================
     Permission

     view
     -> ดูข้อมูลอย่างเดียว

     create
     -> สามารถเพิ่ม Mapping ใหม่ได้

     edit
     -> สามารถแก้ไข Mapping เดิมได้

     ปุ่ม Save ไม่ใช่ Permission แยก
     จึงแสดงเมื่อ User มี create หรือ edit
  ========================================================= */

  const canManage =
    canCreate ||
    canEdit;

  /*
   * Save ต้องแสดงตลอด
   * เมื่อ User มีสิทธิ์ Create หรือ Edit
   *
   * แต่จะ Disable ถ้า:
   * - ยังไม่ได้เลือก Family
   * - ยังไม่มีการเปลี่ยนแปลง
   * - การเปลี่ยนแปลงนั้นไม่ตรงกับ Permission
   */
  const showSave =
    canManage;

  const disableSave =
    !selectedFamilyId ||
    !hasChanges ||
    !canSave;

  return (
    <Card className="mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Space
          orientation="vertical"
          size={0}
        >
          <Text strong>
            Position Family Level Management
          </Text>

          <Text type="secondary">
            เลือกแล้ว{" "}
            <b>
              {selectedLevels.length}
            </b>{" "}
            ระดับ
          </Text>
        </Space>

        <Space>
          <Button
            icon={
              <ReloadOutlined />
            }
            onClick={
              onReset
            }
            disabled={
              !selectedFamilyId
            }
          >
            Reset
          </Button>

          <Button
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
            Refresh
          </Button>

          {showSave && (
            <Button
              type="primary"
              icon={
                <SaveOutlined />
              }
              loading={
                saving
              }
              disabled={
                disableSave
              }
              onClick={
                onSave
              }
            >
              Save
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
}