"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
  Space,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

import { useAuth } from "@/contexts/AuthContext";

import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;

type DailyData = {
  date: string;
  count: number;
};

type WeeklyData = {
  date: string;
  day: string;
  count: number;
};

type OverviewResponse = {
  success: boolean;

  period: {
    month: string;
    today: string;
    weekStart: string;
    weekEnd: string;
  };

  month: {
    total: number;
    previousTotal: number;
    changePercent: number;
  };

  today: {
    total: number;
    previousTotal: number;
    changePercent: number;
  };

  week: {
    total: number;
    previousTotal: number;
    changePercent: number;
  };

  daily: DailyData[];

  weekly: WeeklyData[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function formatDate(date: string) {
  return dayjs(date).format("DD/MM/YYYY");
}

function ChangePercent({ value }: { value: number }) {
  if (value === 0) {
    return <Tag>ไม่เปลี่ยนแปลง</Tag>;
  }

  const isUp = value > 0;

  return (
    <Tag
      icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      color={isUp ? "green" : "red"}
    >
      {Math.abs(value)}%
    </Tag>
  );
}

export default function RecruitmentPage() {
  const { user, loadingUser } = useAuth();

  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  const [data, setData] = useState<OverviewResponse | null>(null);

  const [loading, setLoading] = useState(true);

  /*
   * -------------------------------------------------------
   * Authentication
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loadingUser, router]);

  /*
   * -------------------------------------------------------
   * Load Overview
   * -------------------------------------------------------
   */

  const monthParam = useMemo(() => selectedMonth.format("YYYY-MM"), [selectedMonth]);

  useEffect(() => {
    if (loadingUser || !user) return;

    async function loadOverview() {
      try {
        setLoading(true);

        const response = await fetch(`/recruitment/api/overview?month=${monthParam}`, {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "ไม่สามารถโหลดข้อมูล Overview ได้");
        }

        setData(result);
      } catch (error) {
        console.error("Load recruitment overview error:", error);

        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [monthParam, user, loadingUser]);

  /*
   * -------------------------------------------------------
   * Daily Chart
   * -------------------------------------------------------
   */

  const dailyChartData = useMemo(() => {
    if (!data?.daily) return [];

    return data.daily.map((item) => ({
      date: dayjs(item.date).format("DD"),
      fullDate: item.date,
      count: item.count,
    }));
  }, [data]);

  /*
   * -------------------------------------------------------
   * Weekly Chart
   * -------------------------------------------------------
   */

  const weeklyChartData = useMemo(() => {
    if (!data?.weekly) return [];

    return data.weekly.map((item) => ({
      day: item.day,
      date: item.date,
      count: item.count,
    }));
  }, [data]);

  /*
   * -------------------------------------------------------
   * Loading / Authentication
   * -------------------------------------------------------
   */

  if (loadingUser) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /*
   * -------------------------------------------------------
   * Page
   * -------------------------------------------------------
   */

  return (
    <div className="flex h-full w-full">
      <div className="w-full overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50 p-6">
        {/* =================================================
            HEADER
        ================================================= */}
        <Card
          className="mb-6 overflow-hidden rounded-2xl border-0 shadow-lg shadow-indigo-200/50"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-6 py-7">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Title level={2} style={{ margin: 0, color: "#ffffff" }}>
                    Recruitment Overview
                  </Title>
                </div>

                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  ภาพรวมจำนวนผู้สมัครงานและแนวโน้มการสมัคร
                </Text>
              </div>

              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(value) => {
                  if (value) {
                    setSelectedMonth(value);
                  }
                }}
                allowClear={false}
                format="MMMM YYYY"
                size="large"
                className="rounded-xl"
              />
            </div>
          </div>
        </Card>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="mt-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <div className="flex min-h-[400px] items-center justify-center">
                <Spin size="large" />
              </div>
            </Card>
          </div>          
        ) : !data ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <Empty description="ไม่สามารถโหลดข้อมูลได้" />
          </Card>
        ) : (
          <>
            {/* =================================================
                KPI CARDS
            ================================================= */}

            <Row gutter={[16, 16]} className="mb-6 pt-4">
              {/* TODAY */}
              <Col xs={24} md={8}>
                <Card
                  className="h-full overflow-hidden rounded-2xl border-0 shadow-md shadow-orange-100"
                  styles={{
                    body: {
                      padding: 24,
                      background:
                        "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                    },
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Text type="secondary" className="text-sm">
                        สมัครวันนี้
                      </Text>

                      <Statistic
                        value={data.today.total}
                        suffix="คน"
                        formatter={(value) => formatNumber(Number(value))}
                        styles={{
                          content: {
                            marginTop: 8,
                            fontSize: 36,
                            fontWeight: 700,
                            background:
                              "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          },
                        }}
                      />
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-md shadow-orange-300/50">
                      <ClockCircleOutlined className="text-xl text-white" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <ChangePercent value={data.today.changePercent} />

                    <Text type="secondary">เทียบกับเมื่อวาน</Text>
                  </div>
                </Card>
              </Col>

              {/* WEEK */}
              <Col xs={24} md={8}>
                <Card
                  className="h-full overflow-hidden rounded-2xl border-0 shadow-md shadow-violet-100"
                  styles={{
                    body: {
                      padding: 24,
                      background:
                        "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                    },
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Text type="secondary" className="text-sm">
                        สมัครสัปดาห์นี้
                      </Text>

                      <Statistic
                        value={data.week.total}
                        suffix="คน"
                        formatter={(value) => formatNumber(Number(value))}
                        styles={{
                          content: {
                            marginTop: 8,
                            fontSize: 36,
                            fontWeight: 700,
                            background:
                              "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          },
                        }}
                      />
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-300/50">
                      <BarChartOutlined className="text-xl text-white" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <ChangePercent value={data.week.changePercent} />

                    <Text type="secondary">เทียบกับสัปดาห์ก่อน</Text>
                  </div>
                </Card>
              </Col>

              {/* MONTH */}
              <Col xs={24} md={8}>
                <Card
                  className="h-full overflow-hidden rounded-2xl border-0 shadow-md shadow-blue-100"
                  styles={{
                    body: {
                      padding: 24,
                      background:
                        "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    },
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Text type="secondary" className="text-sm">
                        การสมัครเดือนนี้
                      </Text>

                      <Statistic
                        value={data.month.total}
                        suffix="คน"
                        formatter={(value) => formatNumber(Number(value))}
                        styles={{
                          content: {
                            marginTop: 8,
                            fontSize: 36,
                            fontWeight: 700,
                            background:
                              "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          },
                        }}
                      />
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-md shadow-blue-300/50">
                      <CalendarOutlined className="text-xl text-white" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <ChangePercent value={data.month.changePercent} />

                    <Text type="secondary">เทียบกับเดือนก่อน</Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* =================================================
                CHARTS
            ================================================= */}

            <Row gutter={[16, 16]} className="mb-6">
              {/* DAILY */}

              <Col xs={24} lg={16}>
                <Card
                  title={
                    <span className="font-semibold text-slate-700">
                      แนวโน้มการสมัครรายวัน
                    </span>
                  }
                  className="rounded-2xl border-0 shadow-sm"
                >
                  {dailyChartData.length > 0 ? (
                    <div style={{ width: "100%", height: 360 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dailyChartData}
                          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient
                              id="dailyFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#6366f1"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="95%"
                                stopColor="#06b6d4"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                            <linearGradient
                              id="dailyStroke"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />

                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

                          <Tooltip
                            formatter={(value) => [
                              `${Number(value).toLocaleString("th-TH")} คน`,
                              "ผู้สมัคร",
                            ]}
                            labelFormatter={(label) => `วันที่ ${label}`}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="count"
                            name="ผู้สมัคร"
                            stroke="url(#dailyStroke)"
                            strokeWidth={3}
                            fill="url(#dailyFill)"
                            dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: "#4338ca" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <Empty description="ไม่มีข้อมูล" />
                  )}
                </Card>
              </Col>

              {/* WEEKLY */}

              <Col xs={24} lg={8}>
                <Card
                  title={
                    <span className="font-semibold text-slate-700">
                      ผู้สมัครรายสัปดาห์
                    </span>
                  }
                  className="rounded-2xl border-0 shadow-sm"
                >
                  {weeklyChartData.length > 0 ? (
                    <div style={{ width: "100%", height: 360 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyChartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient
                              id="weeklyBar"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#d946ef" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />

                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

                          <Tooltip
                            formatter={(value) => [
                              `${Number(value).toLocaleString("th-TH")} คน`,
                              "ผู้สมัคร",
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                            }}
                          />

                          <Bar
                            dataKey="count"
                            name="ผู้สมัคร"
                            fill="url(#weeklyBar)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <Empty description="ไม่มีข้อมูล" />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  );
}