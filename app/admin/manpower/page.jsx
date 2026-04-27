"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Progress, Skeleton, Tag, Input } from "antd";
import {
  WarningOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

export default function ManpowerPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "dashboard.view");

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dashboard, setDashboard] = useState({
    shortage_unit_positions: [],
    shortage_unit_positions_total: 0,
    headcount_target_total: 0,
    headcount_actual_total: 0,
    headcount_vacant_total: 0,
  });

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, loadingUser, canView, router]);

  const loadManpower = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/dashboard?page=1&pageSize=10", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load manpower failed");
      }

      setDashboard(
        data.data || {
          shortage_unit_positions: [],
          shortage_unit_positions_total: 0,
          headcount_target_total: 0,
          headcount_actual_total: 0,
          headcount_vacant_total: 0,
        }
      );
    } catch (error) {
      console.error("LOAD_MANPOWER_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser) return;
    if (!user) return;
    if (!canView) return;

    loadManpower();
  }, [loadingUser, user, canView]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return dashboard.shortage_unit_positions || [];

    return (dashboard.shortage_unit_positions || []).filter((item) => {
      return (
        item.unit_name?.toLowerCase().includes(keyword) ||
        item.position_name?.toLowerCase().includes(keyword)
      );
    });
  }, [dashboard.shortage_unit_positions, search]);

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="space-y-6 p-4 lg:p-6">
        <Card
          variant="borderless"
          className="overflow-hidden rounded-[32px] border border-slate-200 shadow-sm"
          styles={{ body: { padding: 0 } }}
        >
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-amber-50 via-white to-red-50 px-6 py-8 lg:px-8 lg:py-10">
            <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-red-200/30 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Tag className="m-0 rounded-full border-0 bg-amber-100 px-4 py-1 text-amber-700">
                    กำลังคนตามแผน
                  </Tag>
                  <Tag className="m-0 rounded-full border-0 bg-red-100 px-4 py-1 text-red-700">
                    Shortage Positions
                  </Tag>
                </div>

                <h1 className="text-3xl font-bold text-slate-800">
                  ตำแหน่งที่ยังขาดทั้งหมด
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                  ดูตำแหน่งที่ยังมีจำนวนไม่ครบตามแผน พร้อมเปรียบเทียบ
                  Target, Actual และ Vacant ในแต่ละหน่วยงาน
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/admin")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    <ArrowLeftOutlined />
                    กลับหน้า Dashboard
                  </button>

                  <a
                    href="/api/admin/dashboard/export"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <DownloadOutlined />
                    Export Excel
                  </a>
                </div>
              </div>

              <div className="grid min-w-[300px] grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl">
                  <div className="text-sm text-slate-500">Target</div>
                  <div className="mt-1 text-2xl font-bold text-sky-700">
                    {dashboard.headcount_target_total || 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl">
                  <div className="text-sm text-slate-500">Actual</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-700">
                    {dashboard.headcount_actual_total || 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl">
                  <div className="text-sm text-slate-500">Vacant</div>
                  <div className="mt-1 text-2xl font-bold text-amber-700">
                    {dashboard.headcount_vacant_total || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          variant="borderless"
          className="rounded-[24px] shadow-sm"
          styles={{ body: { padding: 16 } }}
        >
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder="ค้นหา Unit หรือ Position"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-2xl"
          />
        </Card>

        <Card
          variant="borderless"
          className="rounded-[24px] shadow-sm"
          title={
            <div>
              <div className="text-lg font-semibold text-slate-800">
                รายการตำแหน่งที่ยังขาด
              </div>
              <div className="text-sm font-normal text-slate-400">
                ทั้งหมด {filteredRows.length} รายการ
              </div>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
              ))}
            </div>
          ) : filteredRows.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredRows.map((item, index) => (
                <div
                  key={`${item.unit_id}-${item.position_id}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag className="m-0 rounded-full border-0 bg-slate-100 px-3 py-1 text-slate-600">
                          #{index + 1}
                        </Tag>

                        <Tag className="m-0 rounded-full border-0 bg-red-100 px-3 py-1 text-red-600">
                          <WarningOutlined /> ขาด {item.headcount_vacant} คน
                        </Tag>
                      </div>

                      <div className="mt-3 text-lg font-bold text-slate-800">
                        {item.position_name}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Unit: {item.unit_name}
                      </div>
                    </div>

                    <div className="grid min-w-[220px] grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-sky-50 p-3 text-center">
                        <div className="text-xs text-slate-500">Target</div>
                        <div className="mt-1 text-lg font-bold text-sky-700">
                          {item.headcount_target}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                        <div className="text-xs text-slate-500">Actual</div>
                        <div className="mt-1 text-lg font-bold text-emerald-700">
                          {item.headcount_actual}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-amber-50 p-3 text-center">
                        <div className="text-xs text-slate-500">Vacant</div>
                        <div className="mt-1 text-lg font-bold text-amber-700">
                          {item.headcount_vacant}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                      <span>ความครอบคลุมอัตรากำลัง</span>
                      <span>
                        {item.headcount_target > 0
                          ? Math.round(
                              (item.headcount_actual / item.headcount_target) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>

                    <Progress
                      percent={
                        item.headcount_target > 0
                          ? Math.round(
                              (item.headcount_actual / item.headcount_target) *
                                100
                            )
                          : 0
                      }
                      showInfo={false}
                      status={
                        item.headcount_actual >= item.headcount_target
                          ? "success"
                          : "active"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
              ไม่พบข้อมูลตำแหน่งที่ขาด
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}