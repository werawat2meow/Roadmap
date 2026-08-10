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

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 100;

/* =========================================================
   HELPERS
========================================================= */

function getApiMessage(
  result,
  fallback
) {
  return (
    result?.message ||
    result?.error ||
    fallback
  );
}

async function readApiResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  throw new Error(
    `API ตอบกลับไม่ใช่ JSON (${response.status}): ${text.slice(
      0,
      120
    )}`
  );
}

function mapNationalityOption(
  item
) {
  const name =
    item?.nationality_name_th ||
    item?.nationality_name_en ||
    "-";

  const code =
    item?.nationality_code ||
    item?.iso2 ||
    item?.iso3 ||
    "";

  return {
    value: item.id,

    label: code
      ? `${code} - ${name}`
      : name,

    item,
  };
}

function mergeOptions(
  currentOptions = [],
  nextOptions = []
) {
  const optionMap =
    new Map();

  for (const option of [
    ...currentOptions,
    ...nextOptions,
  ]) {
    if (!option?.value) {
      continue;
    }

    optionMap.set(
      option.value,
      option
    );
  }

  return Array.from(
    optionMap.values()
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function LazyNationalitySelect({
  value,

  onChange,

  disabled = false,

  placeholder =
    "เลือกสัญชาติ",

  allowClear = true,

  initialOption = null,
}) {
  const [
    options,
    setOptions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    initialized,
    setInitialized,
  ] = useState(false);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    currentSearch,
    setCurrentSearch,
  ] = useState("");

  const searchTimerRef =
    useRef(null);

  const requestControllerRef =
    useRef(null);

  const loadMoreControllerRef =
    useRef(null);

  const loadingMoreRef =
    useRef(false);

  const pageRef =
    useRef(1);

  const hasMoreRef =
    useRef(true);

  /* =======================================================
     FETCH OPTIONS
  ======================================================= */

  const fetchOptions =
    useCallback(
      async ({
        search = "",
        pageNumber = 1,
        append = false,
      } = {}) => {
        /*
          ป้องกันการโหลดหน้าถัดไปซ้ำ
          หาก Scroll event ถูกยิงหลายครั้ง
        */

        if (
          append &&
          loadingMoreRef.current
        ) {
          return;
        }

        /*
          Search ใหม่หรือเปิด Dropdown ใหม่
          ให้ยกเลิก Request เดิม
        */

        if (!append) {
          if (
            requestControllerRef.current
          ) {
            requestControllerRef.current.abort();
          }
        }

        const controller =
          new AbortController();

        if (append) {
          loadMoreControllerRef.current =
            controller;

          loadingMoreRef.current =
            true;

          setLoadingMore(true);
        } else {
          requestControllerRef.current =
            controller;

          setLoading(true);
        }

        try {
          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(pageNumber)
          );

          params.set(
            "pageSize",
            String(PAGE_SIZE)
          );

          params.set(
            "status",
            "active"
          );

          const cleanSearch =
            String(search || "")
              .trim();

          if (cleanSearch) {
            params.set(
              "search",
              cleanSearch
            );
          }

          const response =
            await fetch(
              `/api/admin/nationalities?${params.toString()}`,
              {
                method: "GET",
                cache: "no-store",
                signal:
                  controller.signal,
              }
            );

          const result =
            await readApiResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                result,
                "ไม่สามารถโหลดข้อมูลสัญชาติได้"
              )
            );
          }

          const rows =
            Array.isArray(
              result?.data
            )
              ? result.data
              : [];

          const pagination =
            result?.pagination || {};

          const currentPage =
            Number(
              pagination.page
            ) || pageNumber;

          const responsePageSize =
            Number(
              pagination.pageSize
            ) || PAGE_SIZE;

          const total =
            Number(
              pagination.total
            ) || 0;

          const totalPages =
            Number(
              pagination.totalPages
            ) ||
            (
              total > 0
                ? Math.ceil(
                    total /
                      responsePageSize
                  )
                : 0
            );

          const nextOptions =
            rows.map(
              mapNationalityOption
            );

          setOptions(
            (current) => {
              let baseOptions =
                append
                  ? current
                  : [];

              if (
                initialOption?.value
              ) {
                baseOptions =
                  mergeOptions(
                    baseOptions,
                    [
                      initialOption,
                    ]
                  );
              }

              return mergeOptions(
                baseOptions,
                nextOptions
              );
            }
          );

          /*
            อัปเดต Ref ทันที
            ไม่ต้องรอ React State
          */

          pageRef.current =
            currentPage;

          /*
            ถ้า API มี totalPages
            ให้ใช้ค่าจาก API

            ถ้าไม่มี pagination
            ให้ประเมินจากจำนวน rows
          */

          const nextHasMore =
            totalPages > 0
              ? currentPage <
                totalPages
              : rows.length ===
                responsePageSize;

          hasMoreRef.current =
            nextHasMore;

          setInitialized(true);
        } catch (error) {
          if (
            error?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "LazyNationalitySelect fetch error:",
            error
          );

          if (!append) {
            setOptions(
              initialOption
                ? [initialOption]
                : []
            );
          }
        } finally {
          if (append) {
            if (
              loadMoreControllerRef.current ===
              controller
            ) {
              loadMoreControllerRef.current =
                null;
            }

            loadingMoreRef.current =
              false;

            setLoadingMore(false);
          } else {
            if (
              requestControllerRef.current ===
              controller
            ) {
              requestControllerRef.current =
                null;

              setLoading(false);
            }
          }
        }
      },
      [initialOption]
    );

  /* =======================================================
     PRESERVE INITIAL OPTION
  ======================================================= */

  useEffect(() => {
    if (
      !initialOption?.value
    ) {
      return;
    }

    setOptions(
      (current) =>
        mergeOptions(
          current,
          [initialOption]
        )
    );
  }, [initialOption]);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (
        searchTimerRef.current
      ) {
        clearTimeout(
          searchTimerRef.current
        );
      }

      if (
        requestControllerRef.current
      ) {
        requestControllerRef.current.abort();
      }

      if (
        loadMoreControllerRef.current
      ) {
        loadMoreControllerRef.current.abort();
      }
    };
  }, []);

  /* =======================================================
     OPEN DROPDOWN
  ======================================================= */

  const handleOpenChange =
    useCallback(
      (nextOpen) => {
        setOpen(nextOpen);

        /*
          Lazy Load จริง
          โหลดครั้งแรกเมื่อเปิด Dropdown
        */

        if (
          nextOpen &&
          !initialized &&
          !loading
        ) {
          setCurrentSearch("");

          pageRef.current = 1;
          hasMoreRef.current =
            true;

          fetchOptions({
            search: "",
            pageNumber: 1,
            append: false,
          });
        }
      },
      [
        initialized,
        loading,
        fetchOptions,
      ]
    );

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearch =
    useCallback(
      (searchValue) => {
        if (
          searchTimerRef.current
        ) {
          clearTimeout(
            searchTimerRef.current
          );
        }

        searchTimerRef.current =
          setTimeout(() => {
            const nextSearch =
              String(
                searchValue || ""
              ).trim();

            setCurrentSearch(
              nextSearch
            );

            pageRef.current = 1;
            hasMoreRef.current =
              true;

            fetchOptions({
              search:
                nextSearch,

              pageNumber: 1,

              append: false,
            });
          }, 350);
      },
      [fetchOptions]
    );

  /* =======================================================
     INFINITE SCROLL
  ======================================================= */

  const handlePopupScroll = useCallback(
    (event) => {
      const target =
        event?.target ||
        event?.currentTarget;

      if (!target) {
        return;
      }

      if (
        loading ||
        loadingMoreRef.current ||
        !hasMoreRef.current
      ) {
        return;
      }

      const scrollTop =
        Number(target.scrollTop) || 0;

      const scrollHeight =
        Number(target.scrollHeight) || 0;

      const clientHeight =
        Number(target.clientHeight) || 0;

      const distanceFromBottom =
        scrollHeight -
        scrollTop -
        clientHeight;

      console.log(
        "Nationality scroll:",
        {
          scrollTop,
          scrollHeight,
          clientHeight,
          distanceFromBottom,
          currentPage:
            pageRef.current,
          hasMore:
            hasMoreRef.current,
        }
      );

      if (
        distanceFromBottom > 80
      ) {
        return;
      }

      fetchOptions({
        search: currentSearch,
        pageNumber:
          pageRef.current + 1,
        append: true,
      });
    },
    [
      loading,
      currentSearch,
      fetchOptions,
    ]
  );

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange =
    useCallback(
      (
        nextValue,
        option
      ) => {
        onChange?.(
          nextValue,
          option
        );
      },
      [onChange]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Select
      showSearch
      allowClear={allowClear}
      value={value || undefined}
      open={open}
      disabled={disabled}
      loading={loading || loadingMore}
      options={options}
      placeholder={placeholder}
      filterOption={false}
      optionFilterProp="label"
      virtual={false}
      listHeight={256}
      notFoundContent={
        loading ? (
          <div className="py-3 text-center">
            <Spin size="small" />

            <span className="ml-2">
              กำลังโหลดข้อมูล...
            </span>
          </div>
        ) : initialized ? (
          "ไม่พบข้อมูลสัญชาติ"
        ) : (
          "เปิดรายการเพื่อโหลดข้อมูล"
        )
      }

      onOpenChange={handleOpenChange}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      onChange={handleChange}
    />
  );
}
