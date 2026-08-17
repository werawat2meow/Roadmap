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

function normalizePosition(
  item
) {
  if (!item) {
    return null;
  }

  const id =
    item.id ||
    item.position_id;

  if (!id) {
    return null;
  }

  return {
    id,

    position_name:
      item.position_name ||
      item.name ||
      "",

    position_code:
      item.position_code ||
      "",

    default_level:
      item.default_level ||
      (
        item.position_level
          ? {
              level_code:
                item.position_level,
            }
          : null
      ),
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
      normalizePosition(
        item
      );

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

export default function PositionSelector({
  value,
  onChange,

  disabled = false,

  /*
   * ใช้ตอน Edit
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
    positions,
    setPositions,
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

  const initialOptionRef =
    useRef(null);

  /* =======================================================
     Edit Mode
  ======================================================= */

  useEffect(() => {
    const normalized =
      normalizePosition(
        initialOption
      );

    initialOptionRef.current =
      normalized;

    if (!normalized?.id) {
      return;
    }

    setPositions((prev) =>
      mergeUnique(
        prev,
        [normalized]
      )
    );
  }, [
    initialOption?.id,
    initialOption?.position_id,
    initialOption?.position_name,
    initialOption?.position_code,
    initialOption?.position_level,
  ]);

  /* =======================================================
     Fetch
  ======================================================= */

  const fetchPositions =
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
              `/api/admin/positions?${params.toString()}`,
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
                "ไม่สามารถโหลดตำแหน่งได้"
            );
          }

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

          setPositions(
            (prev) => {
              /*
               * Infinite Scroll
               */
              if (append) {
                return mergeUnique(
                  prev,
                  newRows
                );
              }

              /*
               * Search / page 1
               *
               * Preserve selected
               * record ตอน Edit
               */
              const selected =
                initialOptionRef.current;

              const base =
                selected?.id &&
                selected.id ===
                  value
                  ? [selected]
                  : [];

              return mergeUnique(
                base,
                newRows
              );
            }
          );

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
            "LOAD_POSITIONS_ERROR",
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

        fetchPositions(
          keyword,
          1,
          false
        );
      },
      300
    );

  /* =======================================================
     First Load
  ======================================================= */

  useEffect(() => {
    fetchPositions(
      "",
      1,
      false
    );
  }, [fetchPositions]);

  /* =======================================================
     Infinite Scroll
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

    fetchPositions(
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

      placeholder="พิมพ์เพื่อค้นหาตำแหน่ง"

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

      options={positions.map(
        (item) => ({
          value:
            item.id,

          label: (
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 12,
              }}
            >
              <span>
                {item.position_name ||
                  "-"}
              </span>

              <span
                style={{
                  color: "#999",
                }}
              >
                {item.default_level
                  ?.level_code ||
                  "-"}
              </span>
            </div>
          ),
        })
      )}
    />
  );
}