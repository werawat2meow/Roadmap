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
    item.position_id ||
    item.id;

  if (!id) {
    return null;
  }

  return {
    id,

    position_code:
      item.position_code ||
      "",

    position_name:
      item.position_name ||
      item.name ||
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

  className,

  placeholder =
    "พิมพ์เพื่อค้นหาตำแหน่ง",

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

  const valueRef =
    useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

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
    initialOption?.position_code,
    initialOption?.position_name,
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
              `/api/admin/org-position-slots/positions?${params.toString()}`,
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
              if (append) {
                return mergeUnique(
                  prev,
                  newRows
                );
              }

              /*
               * Preserve ตำแหน่งเดิมตอน Edit
               * แม้ไม่อยู่ในหน้าแรกของ Lazy Load
               */
              const selected =
                initialOptionRef.current;

              const base =
                selected?.id &&
                String(
                  selected.id
                ) ===
                  String(
                    valueRef.current || ""
                  )
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
            "LOAD_ORG_SLOT_POSITIONS_ERROR",
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
      []
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

      className={className}

      placeholder={placeholder}

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

          label:
            `${
              item.position_code ||
              "-"
            } - ${
              item.position_name ||
              "-"
            }`,
        })
      )}
    />
  );
}
