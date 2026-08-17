"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Select,
  Spin,
} from "antd";

const PAGE_SIZE = 20;

/* =========================================================
   Debounce
========================================================= */

function useDebouncedCallback(
  callback,
  delay
) {
  const timerRef =
    useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(
          timerRef.current
        );
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(
          timerRef.current
        );
      }

      timerRef.current =
        setTimeout(() => {
          callback(...args);
        }, delay);
    },
    [
      callback,
      delay,
    ]
  );
}

/* =========================================================
   Normalize
========================================================= */

function normalizeUnit(item) {
  if (!item) {
    return null;
  }

  const id =
    item.id ||
    item.unit_id;

  if (!id) {
    return null;
  }

  return {
    id,

    unit_name:
      item.unit_name ||
      item.name ||
      "",

    department_name:
      item.department_name ||
      "",

    division_name:
      item.division_name ||
      "",
  };
}

/* =========================================================
   Merge Unique
========================================================= */

function mergeUnique(
  current = [],
  incoming = []
) {
  const map =
    new Map();

  [
    ...current,
    ...incoming,
  ].forEach((item) => {
    const normalized =
      normalizeUnit(item);

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
  );
}

/* =========================================================
   Component
========================================================= */

export default function UnitSelector({
  value,
  onChange,

  disabled = false,

  /*
   * ใช้ตอน Edit
   *
   * {
   *   id,
   *   unit_name,
   *   division_name,
   *   department_name
   * }
   */
  initialOption = null,
}) {
  const [loading, setLoading] =
    useState(false);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    options,
    setOptions,
  ] = useState([]);

  const [page, setPage] =
    useState(1);

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const requestIdRef =
    useRef(0);

  const keywordRef =
    useRef("");

  /*
   * เก็บ selected option เดิม
   * เพื่อไม่ให้ search/page 1 ลบทิ้ง
   */
  const initialOptionRef =
    useRef(null);

  /* =======================================================
     Initial Option / Edit Mode
  ======================================================= */

  useEffect(() => {
    const normalized =
      normalizeUnit(
        initialOption
      );

    initialOptionRef.current =
      normalized;

    if (!normalized?.id) {
      return;
    }

    setOptions((prev) =>
      mergeUnique(
        prev,
        [normalized]
      )
    );
  }, [
    initialOption?.id,
    initialOption?.unit_id,
    initialOption?.unit_name,
    initialOption?.division_name,
    initialOption?.department_name,
  ]);

  /* =======================================================
     Fetch Units
  ======================================================= */

  const fetchUnits =
    useCallback(
      async (
        keyword = "",
        nextPage = 1,
        append = false
      ) => {
        const requestId =
          ++requestIdRef.current;

        try {
          if (append) {
            setLoadingMore(true);
          } else {
            setLoading(true);
          }

          const params =
            new URLSearchParams();

          if (keyword?.trim()) {
            params.set(
              "search",
              keyword.trim()
            );
          }

          params.set(
            "page",
            String(nextPage)
          );

          params.set(
            "pageSize",
            String(PAGE_SIZE)
          );

          const res =
            await fetch(
              `/api/admin/units?${params.toString()}`,
              {
                cache:
                  "no-store",
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
                "ไม่สามารถโหลดหน่วยงานได้"
            );
          }

          /*
           * กัน response เก่า
           */
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          const newRows =
            Array.isArray(
              json.data
            )
              ? json.data
              : [];

          setOptions((prev) => {
            /*
             * Scroll page ถัดไป
             */
            if (append) {
              return mergeUnique(
                prev,
                newRows
              );
            }

            /*
             * Search / Page 1
             *
             * สำคัญ:
             * ต้อง preserve selected record
             * ตอน Edit เอาไว้
             */
            const selected =
              initialOptionRef.current;

            const base =
              selected?.id &&
              selected.id === value
                ? [selected]
                : [];

            return mergeUnique(
              base,
              newRows
            );
          });

          setPage(nextPage);

          const totalPages =
            Number(
              json.pagination
                ?.totalPages ||
                1
            );

          setHasMore(
            nextPage <
              totalPages
          );
        } catch (err) {
          console.error(
            "LOAD_UNITS_ERROR",
            err
          );
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      },
      [value]
    );

  /* =======================================================
     Search
  ======================================================= */

  const debouncedSearch =
    useDebouncedCallback(
      (keyword) => {
        keywordRef.current =
          keyword;

        setPage(1);
        setHasMore(true);

        fetchUnits(
          keyword,
          1,
          false
        );
      },
      300
    );

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    fetchUnits(
      "",
      1,
      false
    );
  }, [fetchUnits]);

  /* =======================================================
     Scroll
  ======================================================= */

  const handlePopupScroll = (
    e
  ) => {
    const target =
      e.currentTarget;

    const nearBottom =
      target.scrollTop +
        target.clientHeight >=
      target.scrollHeight - 24;

    if (
      !nearBottom ||
      !hasMore ||
      loading ||
      loadingMore
    ) {
      return;
    }

    fetchUnits(
      keywordRef.current,
      page + 1,
      true
    );
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Select
      showSearch
      allowClear
      value={value}
      loading={loading}
      disabled={disabled}
      placeholder="พิมพ์เพื่อค้นหาหน่วยงาน"

      filterOption={false}

      onSearch={
        debouncedSearch
      }

      onChange={
        onChange
      }

      onPopupScroll={
        handlePopupScroll
      }

      notFoundContent={
        loading ? (
          <Spin size="small" />
        ) : (
          "ไม่พบข้อมูล"
        )
      }

      popupRender={(menu) => (
        <>
          {menu}

          {loadingMore && (
            <div
              style={{
                textAlign:
                  "center",
                padding: 8,
              }}
            >
              <Spin size="small" />
            </div>
          )}
        </>
      )}

      options={options.map(
        (item) => ({
          value:
            item.id,

          label: (
            <div>
              <div>
                {item.unit_name ||
                  "-"}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#999",
                }}
              >
                {item.department_name ||
                  "-"}
                {" / "}
                {item.division_name ||
                  "-"}
              </div>
            </div>
          ),

          /*
           * เอาไว้เผื่อ Antd
           * ต้องการ text
           */
          searchText:
            `${item.unit_name || ""} ${item.department_name || ""} ${item.division_name || ""}`,
        })
      )}
    />
  );
}