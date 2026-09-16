"use client";

import {
  Card,
  Checkbox,
  Button,
  Empty,
  Space,
  Typography,
  Divider,
  Tooltip,
} from "antd";

import Link from "next/link";

import {
  DollarOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function PositionFamilyLevelTransfer({
  levels = [],
  originalSelectedLevels = [],
  selectedLevels = [],

  loading = false,

  canCreate = false,
  canEdit = false,

  /* =========================================================
     Navigation Permissions

     Salary Band
     -> ems.position_level_bands.view

     Position
     -> ems.positions.view
  ========================================================= */

  canViewSalaryBands = false,
  canViewPositions = false,

  /* =========================================================
     Navigation Handlers
  ========================================================= */

  onOpenSalaryBand,
  onOpenPositions,

  onChange,
}) {

  const originalSet =
    new Set(
      originalSelectedLevels
    );

  const selectedSet =
    new Set(
      selectedLevels
    );

  const allIds =
    levels.map(
      (item) =>
        item.id
    );

  /* =========================================================
     CHECKBOX PERMISSION

     Mapping เดิมจาก DB:
     - เอาออก ต้องมี Edit
     - ถ้าเอาออกไปแล้ว กดกลับคืนได้
       เพราะเป็นการ Undo

     Mapping ที่เดิมยังไม่มี:
     - เพิ่ม ต้องมี Create
     - ถ้าเพิ่มแล้ว ยกเลิกก่อน Save ได้
       เพราะเป็นการ Undo
  ========================================================= */

  const canToggleLevel = (
    id,
    nextChecked
  ) => {
    const existedBefore =
      originalSet.has(id);

    const checkedNow =
      selectedSet.has(id);

    if (
      nextChecked ===
      checkedNow
    ) {
      return true;
    }

    /* -----------------------------------------------------
       Mapping เดิม
    ----------------------------------------------------- */

    if (existedBefore) {
      /*
       * ถ้า User เอาออกไปแล้ว
       * การกดกลับเข้ามาเป็น Undo
       */
      if (nextChecked) {
        return true;
      }

      /*
       * การเอา Mapping เดิมออก
       * ต้องมี Edit
       */
      return canEdit;
    }

    /* -----------------------------------------------------
       Mapping ใหม่
    ----------------------------------------------------- */

    /*
     * Mapping ใหม่ที่ User เพิ่งเลือก
     * หากกดยกเลิกก่อน Save
     * ถือเป็น Undo
     */
    if (!nextChecked) {
      return true;
    }

    /*
     * การเพิ่ม Mapping ใหม่
     * ต้องมี Create
     */
    return canCreate;
  };

  /* =========================================================
     SELECT ALL
  ========================================================= */

  const handleSelectAll = () => {
    const next = new Set(selectedLevels);
      for (const id of allIds) {
        if (originalSet.has(id) || canCreate ) {
          next.add(id);
        }
      }
    onChange?.(
      [...next]
    );
  };

  /* =========================================================
     CLEAR ALL
  ========================================================= */

  const handleClearAll =
    () => {
      const next =
        selectedLevels.filter(
          (id) => {
            /*
             * Mapping เดิม
             * ถ้าไม่มี Edit
             * ต้องเก็บไว้
             */
            if (
              originalSet.has(id) &&
              !canEdit
            ) {
              return true;
            }

            /*
             * Mapping ใหม่
             * ที่ยังไม่ Save
             * สามารถยกเลิกได้เสมอ
             */
            return false;
          }
        );

      onChange?.(
        next
      );
    };

  /* =========================================================
     CHECK LEVEL
  ========================================================= */

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

    /* -----------------------------------------------------
       CHECK
    ----------------------------------------------------- */

    if (checked) {
      if (
        !selectedLevels.includes(
          id
        )
      ) {
        onChange?.([
          ...selectedLevels,
          id,
        ]);
      }

      return;
    }

    /* -----------------------------------------------------
       UNCHECK
    ----------------------------------------------------- */

    onChange?.(
      selectedLevels.filter(
        (item) =>
          item !== id
      )
    );
  };

  /* =========================================================
     SELECT ALL AVAILABLE
  ========================================================= */

  const canUseSelectAll =
    allIds.some(
      (id) =>
        !selectedSet.has(id) &&
        (
          originalSet.has(id) ||
          canCreate
        )
    );

  /* =========================================================
     CLEAR AVAILABLE
  ========================================================= */

  const canUseClear =
    selectedLevels.some(
      (id) =>
        !originalSet.has(id) ||
        canEdit
    );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Card
      loading={
        loading
      }
      title="Supported Position Levels"
      extra={
        <Space>


          <Link href="/admin/position-levels">
            <Button size="small">
              ระดับตำแหน่งทั้งหมด
            </Button>
          </Link>



          {/* =================================================
              SELECT ALL
          ================================================= */}

          <Button
            size="small"
            onClick={
              handleSelectAll
            }
            disabled={
              !canUseSelectAll
            }
          >
            Select All
          </Button>

          {/* =================================================
              CLEAR
          ================================================= */}

          <Button
            size="small"
            onClick={
              handleClearAll
            }
            disabled={
              !canUseClear
            }
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {levels.map(
              (item) => {
                const checked =
                  selectedLevels.includes(
                    item.id
                  );

                const disabled =
                  !canToggleLevel(
                    item.id,
                    !checked
                  );

                /*
                 * Navigation จะแสดงเฉพาะ
                 * Level ที่ถูกเลือกอยู่
                 *
                 * ถ้าไม่ได้ Mapping กับ Family
                 * ยังไม่ควรมี Context ไปหน้าอื่น
                 */
                const showActions =
                  checked;

                return (
                  <div
                    key={
                      item.id
                    }
                    className="flex min-h-[48px] items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
                  >
                    {/* =======================================
                        LEVEL CHECKBOX
                    ======================================= */}

                    <div className="min-w-0">
                      <Checkbox
                        checked={
                          checked
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          e
                        ) =>
                          handleCheck(
                            e.target
                              .checked,
                            item.id
                          )
                        }
                      >
                        <Space
                          size={4}
                        >
                          <Text
                            strong
                          >
                            {
                              item.level_code
                            }
                          </Text>

                          <Text
                            type="secondary"
                          >
                            {
                              item.level_name
                            }
                          </Text>
                        </Space>
                      </Checkbox>
                    </div>

                    {/* =======================================
                        ENTERPRISE NAVIGATION

                        Level
                        ├─ Salary Band
                        └─ Position
                    ======================================= */}

                    {showActions && (
                      <Space
                        size={2}
                      >
                        {/* ===================================
                            SALARY BAND

                            Permission:
                            ems.position_level_bands.view

                            ไป:
                            /admin/position-level-bands
                            ?level_id=...
                        =================================== */}

                        {canViewSalaryBands && (
                          <Tooltip
                            title="ช่วงเงินเดือนตามระดับตำแหน่ง"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <DollarOutlined />
                              }
                              onClick={() =>
                                onOpenSalaryBand?.(
                                  item.id
                                )
                              }
                            />
                          </Tooltip>
                        )}

                        {/* ===================================
                            POSITIONS

                            Permission:
                            ems.positions.view

                            ไป:
                            /admin/positions
                            ?family_id=...
                            &level_id=...
                        =================================== */}

                        {canViewPositions && (
                          <Tooltip
                            title="ตำแหน่งในระดับนี้"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <SolutionOutlined />
                              }
                              onClick={() =>
                                onOpenPositions?.(
                                  item.id
                                )
                              }
                            />
                          </Tooltip>
                        )}
                      </Space>
                    )}
                  </div>
                );
              }
            )}
          </div>

          <Divider />

          <Text type="secondary">
            เลือกแล้ว{" "}
            <b>
              {
                selectedLevels.length
              }
            </b>{" "}
            จาก{" "}
            <b>
              {levels.length}
            </b>{" "}
            ระดับ
          </Text>
        </>
      )}
    </Card>
  );
}