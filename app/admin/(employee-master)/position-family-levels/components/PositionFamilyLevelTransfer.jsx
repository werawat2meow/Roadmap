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
  originalSelectedLevels = [],
  selectedLevels = [],
  loading = false,
  canCreate = false,
  canEdit = false,
  onChange,
}) {
  const originalSet = new Set(
    originalSelectedLevels
  );

  const selectedSet = new Set(
    selectedLevels
  );

  const allIds = levels.map(
    (item) => item.id
  );

  /*
   * Checkbox Permission
   *
   * Mapping เดิมจาก DB:
   * - เอาออก ต้องมี Edit
   * - ถ้าเอาออกไปแล้ว กดกลับคืนได้ เพราะเป็นการ Undo
   *
   * Mapping ที่เดิมยังไม่มี:
   * - เพิ่ม ต้องมี Create
   * - ถ้าเพิ่มแล้ว ยกเลิกก่อน Save ได้ เพราะเป็นการ Undo
   */
  const canToggleLevel = (
    id,
    nextChecked
  ) => {
    const existedBefore =
      originalSet.has(id);

    const checkedNow =
      selectedSet.has(id);

    if (
      nextChecked === checkedNow
    ) {
      return true;
    }

    if (existedBefore) {
      if (nextChecked) {
        return true;
      }

      return canEdit;
    }

    if (!nextChecked) {
      return true;
    }

    return canCreate;
  };

  const handleSelectAll = () => {
    const next = new Set(
      selectedLevels
    );

    for (const id of allIds) {
      if (
        originalSet.has(id) ||
        canCreate
      ) {
        next.add(id);
      }
    }

    onChange([...next]);
  };

  const handleClearAll = () => {
    const next = selectedLevels.filter(
      (id) => {
        /*
         * Mapping เดิม ถ้าไม่มี Edit
         * ต้องเก็บไว้
         */
        if (
          originalSet.has(id) &&
          !canEdit
        ) {
          return true;
        }

        /*
         * Mapping ใหม่ที่ยังไม่ Save
         * ยกเลิกได้เสมอ
         */
        return false;
      }
    );

    onChange(next);
  };

  const handleCheck = (
    checked,
    id
  ) => {
    if (
      !canToggleLevel(
        id,
        checked
      )
    ) {
      return;
    }

    if (checked) {
      if (
        !selectedLevels.includes(id)
      ) {
        onChange([
          ...selectedLevels,
          id,
        ]);
      }

      return;
    }

    onChange(
      selectedLevels.filter(
        (item) => item !== id
      )
    );
  };

  const canUseSelectAll =
    allIds.some(
      (id) =>
        !selectedSet.has(id) &&
        (
          originalSet.has(id) ||
          canCreate
        )
    );

  const canUseClear =
    selectedLevels.some(
      (id) =>
        !originalSet.has(id) ||
        canEdit
    );

  return (
    <Card
      loading={loading}
      title="Supported Position Levels"
      extra={
        <Space>
          <Button
            size="small"
            onClick={handleSelectAll}
            disabled={!canUseSelectAll}
          >
            Select All
          </Button>

          <Button
            size="small"
            onClick={handleClearAll}
            disabled={!canUseClear}
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

            {levels.map((item) => {
              const checked =
                selectedLevels.includes(
                  item.id
                );

              const disabled =
                !canToggleLevel(
                  item.id,
                  !checked
                );

              return (
                <Checkbox
                  key={item.id}
                  checked={checked}
                  disabled={disabled}
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
              );
            })}

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
