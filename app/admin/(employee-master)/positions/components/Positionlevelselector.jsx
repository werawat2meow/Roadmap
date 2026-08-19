"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Select,
} from "antd";

/* =========================================================
   Normalize Level
========================================================= */

function normalizeLevel(item) {
  if (!item) {
    return null;
  }

  /*
   * รองรับ response หลาย shape
   *
   * {
   *   position_levels: {...}
   * }
   *
   * {
   *   position_level: {...}
   * }
   *
   * {
   *   id,
   *   level_code,
   *   level_name
   * }
   */

  const raw =
    item.position_levels ||
    item.position_level ||
    item;

  const id =
    raw?.id ||
    item?.position_level_id;

  if (!id) {
    return null;
  }

  return {
    id,

    level_code:
      raw?.level_code ||
      item?.level_code ||
      "",

    level_name:
      raw?.level_name ||
      item?.level_name ||
      "",

    sort_order:
      Number(
        raw?.sort_order ??
          item?.sort_order ??
          0
      ),
  };
}

/* =========================================================
   Merge Unique
========================================================= */

function mergeLevels(
  current = [],
  incoming = []
) {
  const map = new Map();

  [
    ...current,
    ...incoming,
  ].forEach((item) => {
    const normalized =
      normalizeLevel(item);

    if (!normalized?.id) {
      return;
    }

    map.set(
      normalized.id,
      normalized
    );
  });

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      Number(a.sort_order || 0) -
      Number(b.sort_order || 0)
  );
}

/* =========================================================
   Component
========================================================= */

export default function PositionLevelSelector({
  value,
  onChange,

  familyId,

  /*
   * สำคัญสำหรับ Edit Mode
   *
   * [
   *   {
   *     id,
   *     level_code,
   *     level_name
   *   }
   * ]
   */
  initialOptions = [],

  disabled = false,

  allowClear = true,

  placeholder =
    "เลือกระดับตำแหน่ง",

  style = {
    width: "100%",
  },
}) {
  /* =======================================================
     State
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  /*
   * ให้ Edit Mode มี Label ทันที
   */
  const [levels, setLevels] =
    useState(() =>
      mergeLevels(
        [],
        initialOptions
      )
    );

  const previousFamilyRef =
    useRef(familyId);

  const requestIdRef =
    useRef(0);

  /* =======================================================
     initialOptions changed
  ======================================================= */

  useEffect(() => {
    if (
      !Array.isArray(
        initialOptions
      ) ||
      initialOptions.length === 0
    ) {
      return;
    }

    setLevels((current) =>
      mergeLevels(
        current,
        initialOptions
      )
    );
  }, [initialOptions]);

  /* =======================================================
     Family Changed
  ======================================================= */

  useEffect(() => {
    /*
     * ไม่มี Family
     */
    if (!familyId) {
      setLevels([]);

      previousFamilyRef.current =
        familyId;

      return;
    }

    /*
     * ถ้าผู้ใช้เปลี่ยน Family จริง ๆ
     * ไม่ใช่ตอนเปิด Edit ครั้งแรก
     */
    if (
      previousFamilyRef.current &&
      previousFamilyRef.current !==
        familyId
    ) {
      setLevels([]);
    }

    previousFamilyRef.current =
      familyId;

    loadLevels(familyId);
  }, [familyId]);

  /* =======================================================
     Load Levels
  ======================================================= */

  async function loadLevels(
    targetFamilyId
  ) {
    const requestId =
      ++requestIdRef.current;

    try {
      setLoading(true);

      const params =
        new URLSearchParams({
          family_id:
            targetFamilyId,
        });

      const res = await fetch(
        `/api/admin/position-family-levels?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json =
        await res.json();

      if (
        !res.ok ||
        !json.success
      ) {
        throw new Error(
          json?.error ||
            "ไม่สามารถโหลดระดับตำแหน่งได้"
        );
      }

      /*
       * Request เก่าไม่ต้องทำอะไร
       */
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      const rows =
        Array.isArray(json.data)
          ? json.data
          : [];

      const mappedLevels =
        rows
          .map(normalizeLevel)
          .filter(Boolean);

      /*
       * หลัง API มาแล้ว
       * ใช้รายการจริงของ Family นี้
       */
      setLevels(
        mappedLevels.sort(
          (a, b) =>
            Number(
              a.sort_order || 0
            ) -
            Number(
              b.sort_order || 0
            )
        )
      );
    } catch (err) {
      console.error(
        "LOAD_POSITION_LEVELS_ERROR",
        err
      );

      /*
       * Edit Mode:
       * ถ้า API fail
       * ยังเก็บ initialOptions ไว้
       * จะได้ไม่แสดง UUID
       */
      setLevels((current) => {
        if (
          current.length > 0
        ) {
          return current;
        }

        return mergeLevels(
          [],
          initialOptions
        );
      });
    } finally {
      if (
        requestId ===
        requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Select
      mode="multiple"

      showSearch

      allowClear={
        allowClear
      }

      disabled={
        disabled ||
        !familyId
      }

      loading={loading}

      value={value}

      style={style}

      placeholder={
        placeholder
      }

      optionFilterProp="label"

      onChange={onChange}

      maxTagCount="responsive"

      filterOption={(
        input,
        option
      ) =>
        String(
          option?.label || ""
        )
          .toLowerCase()
          .includes(
            input.toLowerCase()
          )
      }

      options={levels.map(
        (level) => ({
          value:
            level.id,

          label:
            `${level.level_code} - ${level.level_name}`,
        })
      )}
    />
  );
}