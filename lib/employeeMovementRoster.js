
import {
  db,
  visibleEmployeeIds,
  parseDate,
} from "@/lib/employeeMovements";

/* =========================================================
   Organization Master
========================================================= */

const ORGS = [
  ["company_id", "companies", "company_name_th"],
  ["branch_group_id", "branch_groups", "group_name"],
  ["branch_id", "branches", "branch_name"],
  ["department_id", "departments", "department_name"],
  ["division_id", "divisions", "division_name"],
  ["unit_id", "units", "unit_name"],
];

const FIELDS =
  "id,employee_code,first_name_th,last_name_th," +
  "hire_date,resignation_date,employee_status_id,position_level_id,is_deleted," +
  ORGS.map((x) => x[0]).join(",");

export const orgKeys = ORGS.map((x) => x[0]);

/* =========================================================
   Date Helpers
========================================================= */

function getTodayTH() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dayDiff(a, b) {
  return Math.round(
    (
      Date.parse(`${a}T00:00:00Z`) -
      Date.parse(`${b}T00:00:00Z`)
    ) / 86400000
  );
}

/* =========================================================
   Orientation Eligibility

   เฉพาะพนักงานที่เริ่มงานวันนี้เท่านั้น
========================================================= */

export function orientationEligible(row, today) {
  if (!row.hire_date) {
    return false;
  }

  const days = dayDiff(
    today,
    row.hire_date
  );

  const statusCode = String(
    row.status_code || ""
  ).toUpperCase();

  const blockedStatuses = [
    "RESIGNED",
    "RETIRED",
    "TERMINATED",
    "SUSPENDED",
  ];

  return (
    days === 0 &&
    !blockedStatuses.includes(statusCode) &&
    !(
      row.resignation_date &&
      row.resignation_date <= today
    )
  );
}

/* =========================================================
   Employee Movement Event

   แยกประเภทเหตุการณ์ออกจาก Employee Status Master
========================================================= */

export function eventOf(row, today) {
  const code = String(
    row.status_code || ""
  ).toUpperCase();

  if (["RESIGNED", "RETIRED", "TERMINATED"].includes(code)) {
    return "EXITED";
  }

  if (code === "NOTICE") {
    return "NOTICE";
  }

  if (
    row.resignation_date &&
    row.resignation_date > today
  ) {
    return "EXIT_PENDING";
  }

  if (
    (
      row.hire_date &&
      row.hire_date > today
    ) ||
    (
      code === "PRE_HIRE" &&
      !row.hire_date
    )
  ) {
    return "UPCOMING";
  }

  if (orientationEligible(row, today)) {
    return "STARTED";
  }

  if (code === "PROBATION") {
    return "PROBATION";
  }

  return "OTHER";
}

/* =========================================================
   Employee Roster
========================================================= */

export async function roster(guard, params) {
  const today = getTodayTH();

  /* -------------------------------------------------------
     1. Permission + Employee Scope
  ------------------------------------------------------- */

  const ids = await visibleEmployeeIds(guard);


  /* -------------------------------------------------------
     2. Employee Status Master
  ------------------------------------------------------- */

  const {
    data: statuses,
    error: statusError,
  } = await db
    .from("employee_statuses")
    .select(
      "id,status_code,status_name,color,is_working,is_headcount"
    )
    .order("sort_order", {
      ascending: true,
    });

  if (statusError) {
    throw statusError;
  }

  const statusMap = Object.fromEntries(
    (statuses || []).map((item) => [
      item.id,
      item,
    ])
  );

  /* -------------------------------------------------------
     3. Employees
  ------------------------------------------------------- */

  let rows = [];

  for (
    let start = 0;
    start <= 5000 && ids?.length !== 0;
    start += 500
  ) {
    let query = db
      .from("employees")
      .select(FIELDS)
      .eq("is_deleted", false)
      .order("id")
      .range(start, start + 499);

    if (ids) {
      query = query.in("id", ids);
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    rows.push(...(data || []));

    if ((data || []).length < 500) {
      break;
    }

    if (start === 5000) {
      throw new Error(
        "Roster exceeds 5000; server pagination required"
      );
    }
  }

  const allIds = rows.map(
    (item) => item.id
  );

  /* -------------------------------------------------------
     4. Orientation Followups
  ------------------------------------------------------- */

  const orientationMap = {};

  for (
    let index = 0;
    index < allIds.length;
    index += 300
  ) {
    const employeeIds = allIds.slice(
      index,
      index + 300
    );

    const {
      data,
      error,
    } = await db
      .from("employee_movement_followups")
      .select(
        "employee_id,orientation_status,orientation_date," +
        "orientation_location,notes,updated_at"
      )
      .in("employee_id", employeeIds);

    if (error) {
      throw error;
    }

    for (const item of data || []) {
      orientationMap[item.employee_id] = item;
    }
  }

  /* -------------------------------------------------------
     5. Exit Report Tracking

     แยกจาก employee_statuses
  ------------------------------------------------------- */

  const exitMap = {};

  for (
    let index = 0;
    index < allIds.length;
    index += 300
  ) {
    const employeeIds = allIds.slice(
      index,
      index + 300
    );

    const {
      data,
      error,
    } = await db
      .from("employee_exit_report_tracking")
      .select(
        "employee_id,report_state,sent_at,closed_at"
      )
      .in("employee_id", employeeIds);

    if (error) {
      throw error;
    }

    for (const item of data || []) {
      exitMap[item.employee_id] = item;
    }
  }

  /* -------------------------------------------------------
     6. Merge Employee + Status + Tracking
  ------------------------------------------------------- */

  rows = rows.map((employee) => {
    const status =
      statusMap[employee.employee_status_id] || {};

    const orientation =
      orientationMap[employee.id] || {};

    const exit =
      exitMap[employee.id] || {};

    return {
      ...employee,
      ...status,
      ...orientation,

      id: employee.id,

      employee_status_id:
        employee.employee_status_id,

      orientation_status:
        orientation.orientation_status ||
        "NOT_STARTED",

      exit_report_state:
        exit.report_state ||
        "PENDING",

      exit_report_sent_at:
        exit.sent_at || null,

      exit_report_closed_at:
        exit.closed_at || null,
    };
  });

  /* -------------------------------------------------------
     6B. Recruitment: status=17 means pending start.
     start_date is the recruitment first-day date.

     Applicant-only rows are READ ONLY. Never treat the
     recruitment UUID as an employee UUID in write APIs.
  ------------------------------------------------------- */

  // Keep just the fields needed for this dashboard. Do not fetch
  // recruitment identity documents, contact data or salary.
  const applications = [];
  for (let start = 0; start <= 5000; start += 500) {
    const { data, error } = await db.from("recruit_job_applications")
      .select(
        "id,emp_id,emp_code,first_name,last_name,start_date,status," +
        "company_id,branch_group_id,branch_id,department_id,division_id,unit_id,position_level_id"
      )
      .or("status.eq.17,start_date.not.is.null")
      .order("created_at", { ascending: false })
      .range(start, start + 499);
    if (error) throw error;
    applications.push(...(data || []));
    if ((data || []).length < 500) break;
    if (start === 5000) throw new Error("Recruitment roster exceeds 5000; pagination required");
  }

  const linkedEmployeeIds = new Set(rows.map(item => item.id));
  const linkedStartDates = new Map();
  const candidateRows = [];
  const preHireMaster = (statuses || []).find(s => s.status_code === "PRE_HIRE");

  for (const application of applications) {
    // Fail closed: even recruitment-only rows must be within
    // the current caller's authorized organizational scope.
    if (!guard.hasAllScope) {
      if (application.emp_id && ids && !ids.includes(application.emp_id)) continue;
      if (typeof guard.canAccessEmployee !== "function") continue;
      const org = Object.fromEntries(orgKeys.map(k => [k, application[k] || null]));
      if (!guard.canAccessEmployee({ id: application.emp_id || null, ...org })) continue;
    }

    if (application.emp_id && linkedEmployeeIds.has(application.emp_id)) {
      // Prefer Employee Master for linked persons, but use the
      // recruitment start_date for the first-day event where present.
      if (application.start_date && !linkedStartDates.has(application.emp_id)) linkedStartDates.set(application.emp_id, application.start_date);
      continue;
    }

    // Only status 17 applicants appear without an Employee Master link.
    if (Number(application.status) !== 17) continue;
    candidateRows.push({
      ...Object.fromEntries(orgKeys.map(k => [k, application[k] || null])),
      id: application.id,
      recruitment_application_id: application.id,
      recruitment_only: true,
      employee_code: application.emp_code || null,
      first_name_th: application.first_name || "",
      last_name_th: application.last_name || "",
      hire_date: application.start_date || null,
      start_date: application.start_date || null,
      resignation_date: null,
      position_level_id: application.position_level_id || null,
      employee_status_id: preHireMaster?.id || null,
      status_code: "PRE_HIRE",
      status_name: "รอเริ่มงาน",
      color: preHireMaster?.color || "default",
      orientation_status: "NOT_STARTED",
      exit_report_state: "PENDING",
    });
  }

  rows = rows.map(row => ({
    ...row,
    start_date: linkedStartDates.get(row.id) || row.hire_date || null,
    recruitment_only: false,
  }));
  rows.push(...candidateRows);

  /* -------------------------------------------------------
     7. Organization Filters
  ------------------------------------------------------- */

  for (const key of orgKeys) {
    const value = params.get(key);

    if (value) {
      rows = rows.filter(
        (employee) =>
          employee[key] === value
      );
    }
  }

  /* -------------------------------------------------------
     8. Employee Status Filter
  ------------------------------------------------------- */

  const employeeIdFilter = params.get("employee_id");
  if (employeeIdFilter) {
    rows = rows.filter(item => item.id === employeeIdFilter);
  }

  const employeeStatusId = params.get(
    "employee_status_id"
  );

  if (employeeStatusId) {
    rows = rows.filter(
      (employee) =>
        employee.employee_status_id ===
        employeeStatusId
    );
  }

  /* -------------------------------------------------------
     9. Auto Search Filters

     ค้นหาชื่อและรหัสแยกกัน
  ------------------------------------------------------- */

  const employeeName = String(
    params.get("employee_name") || ""
  )
    .trim()
    .toLocaleLowerCase("th");

  const employeeCode = String(
    params.get("employee_code") || ""
  )
    .trim()
    .toLocaleLowerCase("th");

  const legacySearch = String(
    params.get("search") || ""
  )
    .trim()
    .toLocaleLowerCase("th");

  if (employeeName) {
    rows = rows.filter((employee) => {
      const fullName = `${
        employee.first_name_th || ""
      } ${
        employee.last_name_th || ""
      }`.toLocaleLowerCase("th");

      return fullName.includes(
        employeeName
      );
    });
  }

  if (employeeCode) {
    rows = rows.filter((employee) =>
      String(
        employee.employee_code || ""
      )
        .toLocaleLowerCase("th")
        .includes(employeeCode)
    );
  }

  if (legacySearch) {
    rows = rows.filter((employee) => {
      const searchText = [
        employee.employee_code,
        employee.first_name_th,
        employee.last_name_th,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("th");

      return searchText.includes(
        legacySearch
      );
    });
  }

  /* -------------------------------------------------------
     10. Date Filters
  ------------------------------------------------------- */

  const eventFilter =
    params.get("event") || "";
  // KPI cards do not use arbitrary date filters; STARTED is strictly today's hire.
  const kpiToday = params.get("kpi_today") === "1";

  const fromValue =
    params.get("from");

  const toValue =
    params.get("to");

  const from =
    parseDate(fromValue)
      ? fromValue
      : null;

  const to =
    parseDate(toValue)
      ? toValue
      : null;

  const within = (date) =>
    Boolean(date) &&
    (!from || date >= from) &&
    (!to || date <= to);

  const relevant = (employee, event) => {
    const hireEvents = [
      "UPCOMING",
      "STARTED",
      "ORIENTATION_PENDING",
      "PROBATION",
      "OTHER",
    ];

    return hireEvents.includes(event)
      ? employee.hire_date
      : employee.resignation_date;
  };

  /* -------------------------------------------------------
     11. Determine Movement + Orientation
  ------------------------------------------------------- */

  rows = rows.map((employee) => {
    const event = eventOf(
      employee,
      today
    );

    const eligible =
      orientationEligible(
        employee,
        today
      ) &&
      event === "STARTED";

    const events = [event];

    // Historical first-day tracking is an event, not the current employee status.
    // Do not widen today's Orientation eligibility.
    if (
      employee.start_date &&
      employee.start_date <= today &&
      !events.includes("STARTED")
    ) {
      events.push("STARTED");
    }


    if (
      employee.status_code === "PROBATION" &&
      ![
        "PROBATION",
        "EXITED",
        "EXIT_PENDING",
        "NOTICE",
      ].includes(event)
    ) {
      events.push("PROBATION");
    }

    const statusCode = String(
      employee.status_code || ""
    ).toUpperCase();

    return {
      ...employee,

      event,

      event_types: events,

      orientation_applicable:
        !employee.recruitment_only && eligible,

      orientation_can_prepare:
        !employee.recruitment_only &&
        statusCode === "PRE_HIRE" &&
        (
          !employee.hire_date ||
          employee.hire_date >= today
        ) &&
        !(
          employee.resignation_date &&
          employee.resignation_date <= today
        ) &&
        employee.orientation_status ===
          "NOT_STARTED",

      orientation_can_complete:
        !employee.recruitment_only && eligible &&
        employee.orientation_status ===
          "PENDING",

      orientation_report_ready:
        !employee.recruitment_only && employee.orientation_status ===
        "COMPLETED",
    };
  });

  /* -------------------------------------------------------
     12. Exit Report Filter

     ไม่บังคับ Last Day = วันนี้

     pending = ยังไม่ปิดงาน
     closed  = ปิดงานแล้ว
     all     = ทั้งหมด

     ถ้าไม่เลือก from/to:
     แสดงทุกวันที่อยู่ใน Scope
  ------------------------------------------------------- */

  if (
    params.get("exit_last_day") === "1"
  ) {
    const view =
      params.get("exit_view") ||
      "pending";

    const exitStatuses = [
      "RESIGNED",
      "RETIRED",
      "TERMINATED",
    ];

    rows = rows.filter((employee) => {
      const statusCode = String(
        employee.status_code || ""
      ).toUpperCase();

      const isExited =
        exitStatuses.includes(
          statusCode
        );

      const lastDay =
        employee.resignation_date;

      // Employee Status Master determines whether the person has exited.
      // An absent resignation_date must not hide an exited employee.
      const matchesDate =
        (!from && !to) ||
        (Boolean(lastDay) &&
          (!from || lastDay >= from) &&
          (!to || lastDay <= to));

      let matchesWorkflow = false;

      if (view === "all") {
        matchesWorkflow = true;
      } else if (view === "closed") {
        matchesWorkflow =
          employee.exit_report_state ===
          "CLOSED";
      } else {
        matchesWorkflow =
          employee.exit_report_state !==
          "CLOSED";
      }

      return (
        isExited &&
        matchesDate &&
        matchesWorkflow
      );
    });
  } else {
    /* -----------------------------------------------------
       13. Standard Movement Filters
    ----------------------------------------------------- */

    rows = rows.filter((employee) => {
      // Event category determines which date column the range applies to.
      // A former employee can still be found in historical STARTED results,
      // while EXITED/NOTICE use Last Working Day, not hire_date.
      const events = employee.event_types || [employee.event];
      if (kpiToday) {
        // Last working day is an HR task, not the generic EXITED status.
        // Include NOTICE so HR can prepare the report during the last day;
        // RESIGNED remains visible after the final status is recorded.
        if (eventFilter === "LAST_WORKING_DAY") {
          return !employee.recruitment_only &&
            ["NOTICE", "RESIGNED"].includes(employee.status_code) &&
            employee.resignation_date === today;
        }
        if (eventFilter === "STARTED") {
          // First-day HR KPI uses the confirmed Employee Master hire date,
          // not Recruitment's potentially different start_date.
          return !employee.recruitment_only &&
            employee.status_code === "PROBATION" &&
            employee.hire_date === today;
        }
        if (eventFilter === "UPCOMING") {
          return employee.status_code === "PRE_HIRE" ||
            (Boolean(employee.hire_date) && employee.hire_date > today &&
              !["RESIGNED", "RETIRED", "TERMINATED"].includes(employee.status_code));
        }
        if (eventFilter === "PROBATION") return employee.status_code === "PROBATION";
        if (eventFilter === "NOTICE") return employee.status_code === "NOTICE";
        if (eventFilter === "EXITED") return ["RESIGNED", "RETIRED", "TERMINATED"].includes(employee.status_code);
      }
      // Allow date-range lookups for last working days outside KPI-today mode.
      if (eventFilter === "LAST_WORKING_DAY") {
        return !employee.recruitment_only &&
          ["NOTICE", "RESIGNED"].includes(employee.status_code) &&
          within(employee.resignation_date);
      }
      if (eventFilter && !events.includes(eventFilter)) return false;
      // Without a chosen date window, STARTED means employees starting today.
      // Choosing from/to explicitly enables historical first-day lookup.
      if (eventFilter === "STARTED" && !from && !to) {
        return employee.start_date === today;
      }
      if (!from && !to) return true;

      if (eventFilter === "STARTED") {
        return within(employee.start_date) && employee.start_date <= today;
      }
      if (["NOTICE", "EXIT_PENDING", "EXITED"].includes(eventFilter)) {
        return within(employee.resignation_date);
      }
      if (["UPCOMING", "PROBATION"].includes(eventFilter)) {
        return within(employee.hire_date);
      }

      // Without an event selection, either an entry date or Last Day in
      // the selected period is relevant. No fabricated status/date matches.
      return (
        within(employee.hire_date) ||
        within(employee.resignation_date)
      );
    });
  }

  /* -------------------------------------------------------
     14. Organization Name Lookups
  ------------------------------------------------------- */

  const lookups = {};

  for (const [
    key,
    table,
    label,
  ] of ORGS) {
    const keys = [
      ...new Set(
        rows
          .map((employee) => employee[key])
          .filter(Boolean)
      ),
    ];

    if (!keys.length) {
      continue;
    }

    const {
      data,
      error,
    } = await db
      .from(table)
      .select(`id,${label}`)
      .in("id", keys);

    if (error) {
      throw error;
    }

    lookups[key] =
      Object.fromEntries(
        (data || []).map((item) => [
          item.id,
          item[label],
        ])
      );
  }

  /* -------------------------------------------------------
     14B. Position level (real Master data)
  ------------------------------------------------------- */
  const levelIds = [...new Set(rows.map(row => row.position_level_id).filter(Boolean))];
  const levels = {};
  for (let index = 0; index < levelIds.length; index += 300) {
    const { data, error } = await db.from("position_levels")
      .select("id,level_code,level_name")
      .in("id", levelIds.slice(index, index + 300));
    if (error) throw error;
    for (const level of data || []) levels[level.id] = level;
  }

  /* -------------------------------------------------------
     15. Merge Organization Names + Days
  ------------------------------------------------------- */

  rows = rows.map((employee) => ({
    ...employee,

    organization:
      Object.fromEntries(
        orgKeys.map((key) => [
          key,
          lookups[key]?.[
            employee[key]
          ] || "-",
        ])
      ),

    level_p: levels[employee.position_level_id]?.level_code || null,
    level_name: levels[employee.position_level_id]?.level_name || null,

    days_until_start:
      employee.hire_date
        ? dayDiff(
            employee.hire_date,
            today
          )
        : null,

    days_until_exit:
      employee.resignation_date
        ? dayDiff(
            employee.resignation_date,
            today
          )
        : null,
  }));

  const requestedLevel = String(params.get("level_p") || "").trim().toLowerCase();
  if (requestedLevel) {
    rows = rows.filter(row => String(row.level_p || "").toLowerCase().includes(requestedLevel));
  }

  /* -------------------------------------------------------
     16. Sort
  ------------------------------------------------------- */

  rows.sort((a, b) =>
    (
      b.resignation_date ||
      b.hire_date ||
      ""
    ).localeCompare(
      a.resignation_date ||
      a.hire_date ||
      ""
    )
  );

  return {
    rows,
    today,
  };
}
