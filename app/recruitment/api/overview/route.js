import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const TIME_ZONE = "Asia/Bangkok";

function getBangkokDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year").value),
    month: Number(parts.find((p) => p.type === "month").value),
    day: Number(parts.find((p) => p.type === "day").value),
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getMonthRange(year, month) {
  const start = `${year}-${pad(month)}-01`;

  const nextMonth = new Date(Date.UTC(year, month, 1));

  const endYear = nextMonth.getUTCFullYear();
  const endMonth = nextMonth.getUTCMonth() + 1;

  const end = `${endYear}-${pad(endMonth)}-01`;

  return {
    start,
    end,
  };
}

function getPreviousMonth(year, month) {
  if (month === 1) {
    return {
      year: year - 1,
      month: 12,
    };
  }

  return {
    year,
    month: month - 1,
  };
}

function getPreviousDate(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

function getNextDate(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

function getMonday(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);

  const day = date.getUTCDay();

  // Sunday = 0
  // Monday = 1
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

function getSunday(dateString) {
  const monday = getMonday(dateString);

  const date = new Date(`${monday}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + 6);

  return date.toISOString().slice(0, 10);
}

function calculateChangePercent(current, previous) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }

  return Number(
    (((current - previous) / previous) * 100).toFixed(2)
  );
}

function createDateRange(start, end) {
  const result = [];

  let current = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  while (current < endDate) {
    result.push(current.toISOString().slice(0, 10));

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const monthParam = searchParams.get("month");

    const todayParts = getBangkokDateParts();

    const selectedYear = monthParam
      ? Number(monthParam.split("-")[0])
      : todayParts.year;

    const selectedMonth = monthParam
      ? Number(monthParam.split("-")[1])
      : todayParts.month;

    if (
      !selectedYear ||
      !selectedMonth ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid month",
        },
        { status: 400 }
      );
    }

    const today = formatDate(
      todayParts.year,
      todayParts.month,
      todayParts.day
    );

    const {
      start: monthStart,
      end: monthEnd,
    } = getMonthRange(selectedYear, selectedMonth);

    const previousMonth = getPreviousMonth(
      selectedYear,
      selectedMonth
    );

    const {
      start: previousMonthStart,
      end: previousMonthEnd,
    } = getMonthRange(
      previousMonth.year,
      previousMonth.month
    );

    /*
     * -------------------------------------------------------
     * MONTH
     * -------------------------------------------------------
     */

    const { count: monthTotal, error: monthError } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("created_at", `${monthStart}T00:00:00+07:00`)
        .lt("created_at", `${monthEnd}T00:00:00+07:00`);

    if (monthError) {
      throw monthError;
    }

    /*
     * -------------------------------------------------------
     * PREVIOUS MONTH
     * -------------------------------------------------------
     */

    const {
      count: previousMonthTotal,
      error: previousMonthError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .gte(
        "created_at",
        `${previousMonthStart}T00:00:00+07:00`
      )
      .lt(
        "created_at",
        `${previousMonthEnd}T00:00:00+07:00`
      );

    if (previousMonthError) {
      throw previousMonthError;
    }

    /*
     * -------------------------------------------------------
     * TODAY
     * -------------------------------------------------------
     */

    const tomorrow = getNextDate(today);

    const { count: todayTotal, error: todayError } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("created_at", `${today}T00:00:00+07:00`)
        .lt(
          "created_at",
          `${tomorrow}T00:00:00+07:00`
        );

    if (todayError) {
      throw todayError;
    }

    /*
     * -------------------------------------------------------
     * YESTERDAY
     * -------------------------------------------------------
     */

    const yesterday = getPreviousDate(today);

    const {
      count: yesterdayTotal,
      error: yesterdayError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .gte(
        "created_at",
        `${yesterday}T00:00:00+07:00`
      )
      .lt(
        "created_at",
        `${today}T00:00:00+07:00`
      );

    if (yesterdayError) {
      throw yesterdayError;
    }

    /*
     * -------------------------------------------------------
     * CURRENT WEEK
     * Monday -> Sunday
     * -------------------------------------------------------
     */

    const weekStart = getMonday(today);
    const weekEnd = getNextDate(getSunday(today));

    const {
      count: weekTotal,
      error: weekError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .gte(
        "created_at",
        `${weekStart}T00:00:00+07:00`
      )
      .lt(
        "created_at",
        `${weekEnd}T00:00:00+07:00`
      );

    if (weekError) {
      throw weekError;
    }

    /*
     * -------------------------------------------------------
     * PREVIOUS WEEK
     * -------------------------------------------------------
     */

    const previousWeekEnd = weekStart;
    const previousWeekStart = getPreviousDate(
      getPreviousDate(
        getPreviousDate(
          getPreviousDate(
            getPreviousDate(
              getPreviousDate(weekStart)
            )
          )
        )
      )
    );

    const {
      count: previousWeekTotal,
      error: previousWeekError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .gte(
        "created_at",
        `${previousWeekStart}T00:00:00+07:00`
      )
      .lt(
        "created_at",
        `${previousWeekEnd}T00:00:00+07:00`
      );

    if (previousWeekError) {
      throw previousWeekError;
    }

    /*
     * -------------------------------------------------------
     * DAILY DATA
     * -------------------------------------------------------
     */

    const { data: dailyData, error: dailyError } =
      await supabaseAdmin
        .from("recruit_application_daily_stats")
        .select("application_date, application_count")
        .gte("application_date", monthStart)
        .lt("application_date", monthEnd)
        .order("application_date", {
          ascending: true,
        });

    if (dailyError) {
      throw dailyError;
    }

    const dailyMap = new Map(
      (dailyData || []).map((item) => [
        item.application_date,
        Number(item.application_count),
      ])
    );

    const dailyDates = createDateRange(
      monthStart,
      monthEnd
    );

    const daily = dailyDates.map((date) => ({
      date,
      count: dailyMap.get(date) || 0,
    }));

    /*
     * -------------------------------------------------------
     * WEEKLY DATA
     * -------------------------------------------------------
     */

    const weeklyDates = createDateRange(
      weekStart,
      weekEnd
    );

    const weeklyMap = new Map(
      daily.map((item) => [item.date, item.count])
    );

    /*
     * Need data outside selected month when
     * current week overlaps previous month.
     */

    const { data: weeklyData, error: weeklyDataError } =
      await supabaseAdmin
        .from("recruit_application_daily_stats")
        .select("application_date, application_count")
        .gte("application_date", weekStart)
        .lt("application_date", weekEnd)
        .order("application_date", {
          ascending: true,
        });

    if (weeklyDataError) {
      throw weeklyDataError;
    }

    for (const item of weeklyData || []) {
      weeklyMap.set(
        item.application_date,
        Number(item.application_count)
      );
    }

    const dayNames = [
      "อาทิตย์",
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
    ];

    const weekly = weeklyDates.map((date) => {
      const dateObj = new Date(`${date}T00:00:00Z`);

      return {
        date,
        day: dayNames[dateObj.getUTCDay()],
        count: weeklyMap.get(date) || 0,
      };
    });

    return NextResponse.json({
      success: true,

      period: {
        month: `${selectedYear}-${pad(selectedMonth)}`,
        today,
        weekStart,
        weekEnd: getSunday(today),
      },

      month: {
        total: monthTotal || 0,
        previousTotal: previousMonthTotal || 0,
        changePercent: calculateChangePercent(
          monthTotal || 0,
          previousMonthTotal || 0
        ),
      },

      today: {
        total: todayTotal || 0,
        previousTotal: yesterdayTotal || 0,
        changePercent: calculateChangePercent(
          todayTotal || 0,
          yesterdayTotal || 0
        ),
      },

      week: {
        total: weekTotal || 0,
        previousTotal: previousWeekTotal || 0,
        changePercent: calculateChangePercent(
          weekTotal || 0,
          previousWeekTotal || 0
        ),
      },

      daily,

      weekly,
    });
  } catch (error) {
    console.error("GET /recruitment/api/overview:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลดข้อมูล Overview ได้",
        error:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}