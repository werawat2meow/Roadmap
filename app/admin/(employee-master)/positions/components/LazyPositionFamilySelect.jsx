"use client";

import {
  Select,
  Spin,
} from "antd";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const PAGE_SIZE = 20;
const SEARCH_DELAY = 400;

/* =========================================================
   Helper
========================================================= */

function mergeUniqueItems(
  current = [], 
  incoming = []
) {


  const map = new Map();
  [...current, ...incoming].forEach((item) => {
    if (!item?.id) return;

    map.set(item.id, item);
  });

  return Array.from(map.values());
}

function makeLabel(item) {
  if (!item) return "-";

  const code =
    item.family_code ||
    item.code ||
    "";

  const name =
    item.family_name ||
    item.name ||
    "";

  if (code && name) {
    return `${code} - ${name}`;
  }

  return code || name || "-";
}

/* =========================================================
   LazyPositionFamilySelect
========================================================= */

export default function LazyPositionFamilySelect({
  value,
  onChange,
  afterChange,
  disabled = false,

  allowClear = true,

  placeholder = "เลือกกลุ่มสายงาน",

  initialOption = null,

  style = {
    width: "100%",
  },
}) {
  /* =======================================================
     State
  ======================================================= */

  const [options, setOptions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  /* =======================================================
     Refs
  ======================================================= */

  const requestIdRef =
    useRef(0);

  const debounceRef =
    useRef(null);

  /* =======================================================
     Add initial selected option
     ใช้สำหรับ Edit Mode

     เช่น initialOption:
     {
       id: "...",
       family_code: "OPS",
       family_name: "Operations"
     }
  ======================================================= */

  useEffect(() => {
    if (!initialOption?.id) {
      return;
    }

    setOptions((current) =>
      mergeUniqueItems(
        current,
        [initialOption]
      )
    );
  }, [
    initialOption?.id,
    initialOption?.family_code,
    initialOption?.family_name,
  ]);

  /* =======================================================
     Load Families
  ======================================================= */

  const loadFamilies =
    useCallback(
      async ({
        targetPage = 1,
        keyword = "",
        append = false,
      } = {}) => {
        const requestId =
          ++requestIdRef.current;

        try {
          if (append) {
            setLoadingMore(true);
          } else {
            setLoading(true);
          }

          /* -----------------------------------------------
             Query
          ----------------------------------------------- */

          const params =
            new URLSearchParams({
              page: String(targetPage),

              pageSize:
                String(PAGE_SIZE),

              status: "active",
            });

          const trimmedKeyword =
            String(
              keyword || ""
            ).trim();

          if (trimmedKeyword) {
            params.set(
              "search",
              trimmedKeyword
            );
          }

          /* -----------------------------------------------
             Request
          ----------------------------------------------- */

          const res = await fetch(
            `/api/admin/position-families?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const json =
            await res.json();

          if (!res.ok || !json.success) {
            throw new Error(
              json?.error ||
                "ไม่สามารถโหลดกลุ่มสายงานได้"
            );
          }

          /*
           * กัน request เก่าที่ตอบกลับช้ากว่า
           * request ล่าสุด
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

          /* -----------------------------------------------
             Set Options
          ----------------------------------------------- */

          setOptions((current) => {
            /*
             * Search ใหม่ / Page 1
             */
            if (!append) {
              /*
               * Edit Mode:
               * เก็บ selected item เดิมไว้ด้วย
               * ป้องกัน Select แสดง UUID
               */
              if (
                initialOption?.id &&
                value === initialOption.id
              ) {
                return mergeUniqueItems(
                  [initialOption],
                  rows
                );
              }

              return rows;
            }

            /*
             * Infinite Scroll
             */
            return mergeUniqueItems(
              current,
              rows
            );
          });

          /* -----------------------------------------------
             Pagination
          ----------------------------------------------- */

          const pagination =
            json.pagination || {};

          const totalPages =
            Number(
              pagination.totalPages ||
                pagination.total_pages ||
                0
            );

          const total =
            Number(
              pagination.total ||
                json.total ||
                0
            );

          /*
           * รองรับ API ได้หลายรูปแบบ
           */
          if (totalPages > 0) {
            setHasMore(
              targetPage < totalPages
            );
          } else if (total > 0) {
            setHasMore(
              targetPage *
                PAGE_SIZE <
                total
            );
          } else {
            /*
             * ถ้า API ไม่ส่ง total มา
             * ใช้จำนวน record ของ page ปัจจุบัน
             */
            setHasMore(
              rows.length ===
                PAGE_SIZE
            );
          }

          setPage(targetPage);
        } catch (err) {
          console.error(
            "LOAD_POSITION_FAMILIES_ERROR",
            err
          );

          if (!append) {
            /*
             * อย่าล้าง selected option ตอน Edit
             */
            if (initialOption?.id) {
              setOptions([
                initialOption,
              ]);
            } else {
              setOptions([]);
            }
          }

          setHasMore(false);
        } finally {
          /*
           * request ล่าสุดเท่านั้น
           * ที่มีสิทธิ์ปิด Loading
           */
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      },
      [
        initialOption,
        value,
      ]
    );

  /* =======================================================
     Open Dropdown / Search Debounce
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(
        debounceRef.current
      );
    }

    debounceRef.current =
      setTimeout(() => {
        loadFamilies({
          targetPage: 1,
          keyword: search,
          append: false,
        });
      }, SEARCH_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(
          debounceRef.current
        );
      }
    };
  }, [
    open,
    search,
    loadFamilies,
  ]);

  /* =======================================================
     Popup Scroll
  ======================================================= */

  function handlePopupScroll(event) {
    const target =
      event.currentTarget;

    /*
     * เหลือประมาณ 40px ก่อนสุด
     * ให้โหลดหน้าถัดไป
     */
    const nearBottom =
      target.scrollTop +
        target.offsetHeight >=
      target.scrollHeight - 40;

    if (!nearBottom) {
      return;
    }

    if (
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    loadFamilies({
      targetPage: page + 1,
      keyword: search,
      append: true,
    });
  }

  /* =======================================================
     Open Change
  ======================================================= */

  function handleOpenChange(
    nextOpen
  ) {
    setOpen(nextOpen);

    if (!nextOpen) {
      /*
       * ปิด Dropdown แล้ว reset search
       * ครั้งหน้าเปิดใหม่จะเริ่มจาก page 1
       */
      setSearch("");
      setPage(1);
      setHasMore(true);
    }
  }

  /* =======================================================
     Search
  ======================================================= */

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
    setHasMore(true);
  }

  /* =======================================================
     Change
  ======================================================= */

  function handleChange(
  nextValue
  ) {
    /*
    * onChange ตัวนี้ Ant Design Form
    * เป็นคน inject เข้ามา
    */
    onChange?.(nextValue);

    /*
    * callback สำหรับ business logic
    * เช่น clear position_levels
    */
    afterChange?.(nextValue);
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Select
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      value={value}
      open={open}
      loading={loading}
      style={style}
      placeholder={placeholder}

      /*
       * สำคัญ:
       * Search ที่ Server
       * ไม่ให้ Antd filter ซ้ำเอง
       */
      filterOption={false}

      onSearch={handleSearch}
      onChange={handleChange}
      onOpenChange={
        handleOpenChange
      }
      onPopupScroll={
        handlePopupScroll
      }

      notFoundContent={
        loading ? (
          <div
            style={{
              padding: 12,
              textAlign: "center",
            }}
          >
            <Spin size="small" />
          </div>
        ) : (
          "ไม่พบกลุ่มสายงาน"
        )
      }

      options={options.map(
        (item) => ({
          value: item.id,

          label:
            makeLabel(item),
        })
      )}

      popupRender={(menu) => (
        <>
          {menu}

          {loadingMore && (
            <div
              style={{
                padding: 10,
                textAlign:
                  "center",
              }}
            >
              <Spin size="small" />

              <span
                style={{
                  marginLeft: 8,
                }}
              >
                กำลังโหลดเพิ่ม...
              </span>
            </div>
          )}
        </>
      )}
    />
  );
}