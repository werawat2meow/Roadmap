"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Select, Spin } from "antd";

const PAGE_SIZE = 20;

function useDebouncedCallback(callback, delay) {
  const timerRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

export default function UnitSelector({
  value,
  onChange,
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const requestIdRef = useRef(0);
  const keywordRef = useRef("");
  const fetchingRef = useRef(false); // guard แบบ synchronous กันยิงซ้ำระหว่างรอ state อัปเดต

  const fetchUnits = useCallback(
    async (keyword = "", nextPage = 1, append = false) => {
      if (fetchingRef.current) return; // มี request กำลังทำงานอยู่แล้ว ไม่ยิงซ้ำ
      fetchingRef.current = true;

      const requestId = ++requestIdRef.current;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const params = new URLSearchParams();
        if (keyword) params.set("search", keyword);
        params.set("page", String(nextPage));
        params.set("pageSize", String(PAGE_SIZE));

        const res = await fetch(`/api/admin/units?${params.toString()}`);
        const json = await res.json();

        // กัน response เก่ามาทับ response ใหม่ (race condition)
        if (requestId !== requestIdRef.current) return;

        if (json.success) {
          const newRows = json.data || [];

          setOptions((prev) => {
            const base = append ? prev : [];
            const merged = [...base, ...newRows];

            // dedupe กันเหนียว เผื่อมี id ซ้ำหลุดมาจาก request ที่ทับกัน
            const seen = new Set();
            return merged.filter((item) => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
          });

          setPage(nextPage);
          setHasMore(nextPage < (json.pagination?.totalPages || 1));
        }
      } catch (err) {
        console.error("LOAD_UNITS_ERROR", err);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        fetchingRef.current = false;
      }
    },
    []
  );

  const debouncedSearch = useDebouncedCallback((keyword) => {
    keywordRef.current = keyword;
    fetchUnits(keyword, 1, false);
  }, 300);

  // โหลดชุดแรกตอน mount
  useEffect(() => {
    fetchUnits("", 1, false);
  }, [fetchUnits]);

  const handlePopupScroll = (e) => {
    const target = e.target;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 24;

    if (nearBottom && hasMore && !loading && !loadingMore) {
      fetchUnits(keywordRef.current, page + 1, true);
    }
  };

  return (
    <Select
      showSearch
      allowClear
      value={value}
      loading={loading}
      disabled={disabled}
      placeholder="พิมพ์เพื่อค้นหาหน่วยงาน"
      filterOption={false} // ปิด client-side filter เพราะ search ทำที่ server แล้ว
      onSearch={debouncedSearch}
      onChange={onChange}
      onPopupScroll={handlePopupScroll}
      notFoundContent={loading ? <Spin size="small" /> : "ไม่พบข้อมูล"}
      popupRender={(menu) => (
        <>
          {menu}
          {loadingMore && (
            <div style={{ textAlign: "center", padding: 8 }}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}
    >
      {options.map((item) => (
        <Select.Option key={item.id} value={item.id}>
          <div>
            <div>{item.unit_name}</div>

            <div style={{ fontSize: 12, color: "#999" }}>
              {item.department_name}
              {" / "}
              {item.division_name}
            </div>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
}