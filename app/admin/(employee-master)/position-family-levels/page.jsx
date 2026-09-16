"use client";

import {
  useState,
  useEffect,
  useMemo,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Card,
  Row,
  Col,
  Result,
  message,
} from "antd";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import PositionFamilyLevelSearch from "./components/PositionFamilyLevelSearch";
import PositionFamilyLevelToolbar from "./components/PositionFamilyLevelToolbar";
import PositionFamilyLevelSummary from "./components/PositionFamilyLevelSummary";
import PositionFamilyLevelTransfer from "./components/PositionFamilyLevelTransfer";

import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

export default function PositionFamilyLevelsPage() {
  const { user } = useAuth();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  /* =======================================================
     URL PARAM

     ตัวอย่าง:
     /admin/position-family-levels?family_id=xxxxxxxx

     ใช้สำหรับเปิดมาจากหน้า Position Families
     แล้วเลือก Family ที่กดมาให้อัตโนมัติ
  ======================================================= */

  const familyIdFromUrl =
    searchParams
      .get("family_id")
      ?.trim() || "";

  /* =======================================================
     PERMISSIONS

     View   = เปิดหน้า / ดู Mapping
     Create = เพิ่ม Level ใหม่เข้า Family
     Edit   = แก้ไข/เอา Level เดิมออกจาก Family

     Navigation:
     Salary Band = ต้องมี ems.position_level_bands.view
     Positions   = ต้องมี ems.positions.view
  ======================================================= */

  const canView =
    hasPermission(
      user,
      "ems.position_family_levels.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.position_family_levels.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.position_family_levels.edit"
    );

  const canViewSalaryBands =
    hasPermission(
      user,
      "ems.position_level_bands.view"
    );

  const canViewPositions =
    hasPermission(
      user,
      "ems.positions.view"
    );

  /* =======================================================
     STATE
  ======================================================= */

  const [
    loadingFamilies,
    setLoadingFamilies,
  ] = useState(false);

  const [
    loadingLevels,
    setLoadingLevels,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    families,
    setFamilies,
  ] = useState([]);

  const [
    levels,
    setLevels,
  ] = useState([]);

  const [
    selectedFamilyId,
    setSelectedFamilyId,
  ] = useState(null);

  const [
    selectedFamily,
    setSelectedFamily,
  ] = useState(null);

  /*
   * originalSelectedLevels
   * = Mapping ที่โหลดจาก Database
   *
   * selectedLevels
   * = Mapping ที่ User กำลังแก้บนหน้าจอ
   *
   * ต้องแยกสองชุดนี้เพื่อรู้ว่า
   * Save ครั้งนี้เป็น Create / Edit อะไรบ้าง
   */

  const [
    originalSelectedLevels,
    setOriginalSelectedLevels,
  ] = useState([]);

  const [
    selectedLevels,
    setSelectedLevels,
  ] = useState([]);

  /* =======================================================
     LOAD POSITION FAMILIES
  ======================================================= */

  const loadFamilies =
    async () => {
      try {
        setLoadingFamilies(
          true
        );

        const res =
          await fetch(
            "/api/admin/position-families?page=1&pageSize=9999"
          );

        const json =
          await res.json();

        if (!json.success) {
          throw new Error(
            json.error ||
              "โหลด Position Family ไม่สำเร็จ"
          );
        }

        const rows =
          json.data || [];

        setFamilies(
          rows
        );

        /* =================================================
           1. ถ้ามี family_id จาก URL
              และยังไม่ได้เลือก Family
              ให้เลือก Family จาก URL ก่อน

           เช่น:
           /admin/position-family-levels?family_id=xxx
        ================================================= */

        if (
          !selectedFamilyId &&
          familyIdFromUrl &&
          rows.length > 0
        ) {
          const targetFamily =
            rows.find(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  familyIdFromUrl
                )
            );

          if (targetFamily) {
            setSelectedFamilyId(
              targetFamily.id
            );

            setSelectedFamily(
              targetFamily
            );

            return;
          }
        }

        /* =================================================
           2. ถ้าไม่มี Param
              หรือหา Family จาก Param ไม่เจอ
              ใช้ Logic เดิม:
              เลือกรายการแรกอัตโนมัติ
        ================================================= */

        if (
          !selectedFamilyId &&
          rows.length > 0
        ) {
          setSelectedFamilyId(
            rows[0].id
          );

          setSelectedFamily(
            rows[0]
          );
        }
      } catch (err) {
        console.error(
          err
        );
      } finally {
        setLoadingFamilies(
          false
        );
      }
    };

  /* =======================================================
     LOAD POSITION LEVELS
  ======================================================= */

  const loadLevels =
    async () => {
      try {
        setLoadingLevels(
          true
        );

        const res =
          await fetch(
            "/api/admin/position-levels?page=1&pageSize=9999"
          );

        const json =
          await res.json();

        if (!json.success) {
          throw new Error(
            json.error ||
              "โหลด Position Level ไม่สำเร็จ"
          );
        }

        setLevels(
          json.data || []
        );
      } catch (err) {
        console.error(
          err
        );
      } finally {
        setLoadingLevels(
          false
        );
      }
    };

  /* =======================================================
     LOAD SELECTED FAMILY LEVELS
  ======================================================= */

  const loadSelectedLevels =
    async (
      familyId
    ) => {
      if (!familyId) {
        setOriginalSelectedLevels(
          []
        );

        setSelectedLevels(
          []
        );

        return;
      }

      try {
        setLoadingLevels(
          true
        );

        const res =
          await fetch(
            `/api/admin/position-family-levels?family_id=${encodeURIComponent(
              familyId
            )}`
          );

        const json =
          await res.json();

        if (!json.success) {
          throw new Error(
            json.error ||
              json.message ||
              "โหลดข้อมูลไม่สำเร็จ"
          );
        }

        const ids =
          (
            json.data ||
            []
          ).map(
            (item) =>
              item.position_level_id
          );

        setOriginalSelectedLevels(
          ids
        );

        setSelectedLevels(
          ids
        );
      } catch (err) {
        console.error(
          err
        );
      } finally {
        setLoadingLevels(
          false
        );
      }
    };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadFamilies();
    loadLevels();
  }, []);

  /* =======================================================
     LOAD MAPPING WHEN FAMILY CHANGED
  ======================================================= */

  useEffect(() => {
    if (
      !selectedFamilyId
    ) {
      return;
    }

    loadSelectedLevels(
      selectedFamilyId
    );
  }, [
    selectedFamilyId,
  ]);

  /* =======================================================
     CHANGE STATE

     ตรวจว่า User:
     - เพิ่ม Mapping ใหม่
     - เอา Mapping เดิมออก
  ======================================================= */

  const changeState =
    useMemo(() => {
      const originalSet =
        new Set(
          originalSelectedLevels
        );

      const selectedSet =
        new Set(
          selectedLevels
        );

      const createIds =
        selectedLevels.filter(
          (id) =>
            !originalSet.has(
              id
            )
        );

      const deleteIds =
        originalSelectedLevels.filter(
          (id) =>
            !selectedSet.has(
              id
            )
        );

      /*
       * ปัจจุบันหน้า UI
       * ยังไม่มี Drag/Reorder
       *
       * แต่เก็บ Edit Permission
       * ไว้รองรับ API/order เดิม
       */

      const hasChanges =
        createIds.length > 0 ||
        deleteIds.length > 0;

      const canSave =
        (
          !createIds.length ||
          canCreate
        ) &&
        (
          !deleteIds.length ||
          canEdit
        );

      return {
        createIds,
        deleteIds,
        hasChanges,
        canSave,
      };
    }, [
      originalSelectedLevels,
      selectedLevels,
      canCreate,
      canEdit,
    ]);

  /* =======================================================
     FAMILY CHANGE
  ======================================================= */

  const handleFamilyChange =
    (
      familyId
    ) => {
      setSelectedFamilyId(
        familyId
      );

      const family =
        families.find(
          (item) =>
            item.id ===
            familyId
        );

      setSelectedFamily(
        family ||
          null
      );
    };

  /* =======================================================
     OPEN POSITIONS BY FAMILY

     ตัวอย่าง:
     /admin/positions?family_id=...
  ======================================================= */

  const handleOpenFamilyPositions =
    () => {
      if (
        !selectedFamilyId
      ) {
        return;
      }

      if (
        !canViewPositions
      ) {
        message.warning(
          "คุณไม่มีสิทธิ์ดูข้อมูลตำแหน่ง"
        );

        return;
      }

      router.push(
        `/admin/positions?family_id=${encodeURIComponent(
          selectedFamilyId
        )}`
      );
    };

  /* =======================================================
     OPEN SALARY BAND BY LEVEL

     ตัวอย่าง:
     /admin/position-level-bands?level_id=...
  ======================================================= */

  const handleOpenSalaryBand =
    (
      levelId
    ) => {
      if (!levelId) {
        return;
      }

      if (
        !canViewSalaryBands
      ) {
        message.warning(
          "คุณไม่มีสิทธิ์ดูช่วงเงินเดือนตามระดับตำแหน่ง"
        );

        return;
      }

      router.push(
        `/admin/position-level-bands?level_id=${encodeURIComponent(
          levelId
        )}`
      );
    };

  /* =======================================================
     OPEN POSITIONS BY FAMILY + LEVEL

     ตัวอย่าง:
     /admin/positions?family_id=...&level_id=...
  ======================================================= */

  const handleOpenLevelPositions =
    (
      levelId
    ) => {
      if (
        !selectedFamilyId ||
        !levelId
      ) {
        return;
      }

      if (
        !canViewPositions
      ) {
        message.warning(
          "คุณไม่มีสิทธิ์ดูข้อมูลตำแหน่ง"
        );

        return;
      }

      router.push(
        `/admin/positions?family_id=${encodeURIComponent(
          selectedFamilyId
        )}&level_id=${encodeURIComponent(
          levelId
        )}`
      );
    };

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {
      await Promise.all([
        loadFamilies(),
        loadLevels(),
      ]);

      if (
        selectedFamilyId
      ) {
        await loadSelectedLevels(
          selectedFamilyId
        );
      }
    };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset =
    async () => {
      if (
        !selectedFamilyId
      ) {
        return;
      }

      await loadSelectedLevels(
        selectedFamilyId
      );
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {
      if (
        !selectedFamilyId
      ) {
        message.warning(
          "กรุณาเลือก Position Family"
        );

        return;
      }

      if (
        !changeState.hasChanges
      ) {
        message.info(
          "ไม่มีข้อมูลที่เปลี่ยนแปลง"
        );

        return;
      }

      /* ---------------------------------------------------
         Create Permission
      --------------------------------------------------- */

      if (
        changeState
          .createIds
          .length > 0 &&
        !canCreate
      ) {
        message.error(
          "คุณไม่มีสิทธิ์เพิ่มระดับตำแหน่งในกลุ่มสายงาน"
        );

        return;
      }

      /* ---------------------------------------------------
         Edit Permission
      --------------------------------------------------- */

      if (
        changeState
          .deleteIds
          .length > 0 &&
        !canEdit
      ) {
        message.error(
          "คุณไม่มีสิทธิ์แก้ไขระดับตำแหน่งของกลุ่มสายงาน"
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const res =
          await fetch(
            "/api/admin/position-family-levels",
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  family_id:
                    selectedFamilyId,

                  level_ids:
                    selectedLevels,
                }),
            }
          );

        const json =
          await res.json();

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
              json.message ||
              "บันทึกไม่สำเร็จ"
          );
        }

        message.success(
          "บันทึกข้อมูลเรียบร้อย"
        );

        await loadSelectedLevels(
          selectedFamilyId
        );
      } catch (err) {
        console.error(
          err
        );

        message.error(
          err.message ||
            "เกิดข้อผิดพลาดในการบันทึก"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     PERMISSION DENIED
  ======================================================= */

  if (!canView) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้"
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-4">
      {/* ===================================================
          SEARCH
      =================================================== */}

      <PositionFamilyLevelSearch
        families={
          families
        }
        loading={
          loadingFamilies
        }
        selectedFamilyId={
          selectedFamilyId
        }
        onChange={
          handleFamilyChange
        }
      />

      <PageInfoAlert
        description="จัดการกลุ่มตำแหน่งงาน ใช้สำหรับจัดหมวดหมู่ตำแหน่งก่อนนำไปผูกกับพนักงาน"
      />

      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <PositionFamilyLevelToolbar
        selectedFamilyId={
          selectedFamilyId
        }
        selectedLevels={
          selectedLevels
        }
        saving={
          saving
        }
        loading={
          loadingFamilies ||
          loadingLevels
        }
        canCreate={
          canCreate
        }
        canEdit={
          canEdit
        }
        canViewPositions={
          canViewPositions
        }
        hasChanges={
          changeState.hasChanges
        }
        canSave={
          changeState.canSave
        }
        onSave={
          handleSave
        }
        onReset={
          handleReset
        }
        onRefresh={
          handleRefresh
        }
        onOpenPositions={
          handleOpenFamilyPositions
        }
      />

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <PositionFamilyLevelSummary
        family={
          selectedFamily
        }
        levels={
          levels.filter(
            (item) =>
              selectedLevels.includes(
                item.id
              )
          )
        }
      />

      {/* ===================================================
          LEVEL MAPPING
      =================================================== */}

      <Row>
        <Col xs={24}>
          <Card>
            <PositionFamilyLevelTransfer
              levels={
                levels
              }
              originalSelectedLevels={
                originalSelectedLevels
              }
              selectedLevels={
                selectedLevels
              }
              loading={
                loadingLevels
              }
              canCreate={
                canCreate
              }
              canEdit={
                canEdit
              }
              canViewSalaryBands={
                canViewSalaryBands
              }
              canViewPositions={
                canViewPositions
              }
              onOpenSalaryBand={
                handleOpenSalaryBand
              }
              onOpenPositions={
                handleOpenLevelPositions
              }
              onChange={
                setSelectedLevels
              }
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}