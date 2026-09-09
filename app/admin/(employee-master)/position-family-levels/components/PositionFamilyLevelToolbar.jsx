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
  SolutionOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function PositionFamilyLevelToolbar({
  selectedFamilyId,
  selectedLevels = [],

  saving = false,
  loading = false,

  canCreate = false,
  canEdit = false,

  /* =========================================================
     Navigation Permission

     canViewPositions
     -> ems.positions.view
  ========================================================= */

  canViewPositions = false,

  hasChanges = false,
  canSave = false,

  onSave,
  onRefresh,
  onReset,

  /* =========================================================
     Navigation
  ========================================================= */

  onOpenPositions,
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

  /* =========================================================
     Navigation

     ปุ่มตำแหน่งใช้ Permission ของ Module ปลายทางโดยตรง

     ems.positions.view
  ========================================================= */

  const showPositions =
    canViewPositions;

  const disablePositions =
    !selectedFamilyId;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* ===================================================
            INFO
        =================================================== */}

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

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <Space wrap>
          {/* =================================================
              POSITIONS

              ไปหน้า:
              /admin/positions?family_id=...

              Handler อยู่ใน page.jsx
          ================================================= */}

          {showPositions && (
            <Button
              icon={
                <SolutionOutlined />
              }
              disabled={
                disablePositions
              }
              onClick={
                onOpenPositions
              }
            >
              ตำแหน่งในกลุ่มสายงาน
            </Button>
          )}

          {/* =================================================
              RESET
          ================================================= */}

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

          {/* =================================================
              REFRESH
          ================================================= */}

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

          {/* =================================================
              SAVE
          ================================================= */}

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