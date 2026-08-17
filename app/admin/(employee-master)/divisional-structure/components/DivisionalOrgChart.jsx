"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { OrgChart } from "d3-org-chart";

import "./DivisionalOrgChart.css";

const DivisionalOrgChart = forwardRef(function DivisionalOrgChart(
  {
    data = [],
    loading = false,
    onNodeClick,
  },
  ref
) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const latestDataRef = useRef([]);

  useImperativeHandle(
    ref,
    () => ({
      fit() {
        chartRef.current?.fit();
      },
      zoomIn() {
        chartRef.current?.zoomIn();
      },
      zoomOut() {
        chartRef.current?.zoomOut();
      },
      expandAll() {
        const chart = chartRef.current;
        if (!chart) return;
        chart.expandAll().render();
        requestAnimationFrame(() => chart.fit());
      },
      collapseAll() {
        const chart = chartRef.current;
        if (!chart) return;
        chart.collapseAll().render();
        requestAnimationFrame(() => chart.fit());
      },
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chartData = normalizeChartData(data);
    latestDataRef.current = chartData;

    if (!chartData.length) {
      container.innerHTML = "";
      return undefined;
    }

    if (!chartRef.current) {
      chartRef.current = new OrgChart();
    }

    const chart = chartRef.current;

    chart
      .container(container)
      .data(chartData)
      .nodeId((item) => String(item.id))
      .parentNodeId((item) =>
        item.parentId ? String(item.parentId) : null
      )
      .layout("top")
      .nodeWidth(() => 310)
      .nodeHeight(() => 178)
      .childrenMargin(() => 54)
      .siblingsMargin(() => 34)
      .neighbourMargin(() => 52)
      .compactMarginBetween(() => 30)
      .compactMarginPair(() => 68)
      .duration(300)
      .initialZoom(0.85)
      .nodeContent((node) => buildNodeContent(node.data))
      .buttonContent(({ node }) => buildExpandButton(node))
      .onNodeClick((nodeId) => {
        const item =
          latestDataRef.current.find(
            (row) =>
              String(row.id) ===
              String(nodeId)
          );

        if (!item) {
          return;
        }

        if (item.is_virtual_root) {
          return;
        }

        onNodeClick?.(item);
      })
      .render();

    requestAnimationFrame(() => chart.fit());

    return undefined;
  }, [data, onNodeClick]);

  if (loading) {
    return (
      <div className="divisional-chart-state">
        <div className="divisional-chart-spinner" />
        <div className="divisional-chart-state-title">
          กำลังโหลดโครงสร้างองค์กร...
        </div>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="divisional-chart-empty">
        <div className="divisional-chart-empty-icon">⌘</div>
        <div className="divisional-chart-state-title">
          ยังไม่มี Position Slot ใน Scope นี้
        </div>
        <div className="divisional-chart-state-description">
          เพิ่ม Position Slot แล้วเชื่อม Parent Slot เพื่อสร้างผัง
        </div>
      </div>
    );
  }

  return (
    <div className="divisional-chart-wrapper">
      <div ref={containerRef} className="divisional-chart-container" />
    </div>
  );
});

DivisionalOrgChart.displayName = "DivisionalOrgChart";
export default DivisionalOrgChart;

function normalizeChartData(data = []) {
  const rows = (
    Array.isArray(data)
      ? data
      : []
  )
    .filter((item) => item?.id)
    .map((item) => {
      const id = String(item.id);

      const rawParentId =
        item.parent_slot_id
          ? String(item.parent_slot_id)
          : null;

      return {
        ...item,

        id,

        parentId:
          rawParentId &&
          rawParentId !== id
            ? rawParentId
            : null,
      };
    });

  if (!rows.length) {
    return [];
  }

  /* =====================================================
     ตรวจว่า Parent อยู่ในข้อมูลที่ Chart ได้รับหรือไม่
  ===================================================== */

  const ids = new Set(
    rows.map((item) => item.id)
  );

  const normalizedRows =
    rows.map((item) => ({
      ...item,

      parentId:
        item.parentId &&
        ids.has(item.parentId)
          ? item.parentId
          : null,
    }));

  /* =====================================================
     หา Root ทั้งหมด

     Root =
     - ไม่มี parent_slot_id
     - หรือ Parent ไม่อยู่ใน dataset ปัจจุบัน
  ===================================================== */

  const roots =
    normalizedRows.filter(
      (item) => !item.parentId
    );

  /* =====================================================
     Root เดียว
     d3-org-chart ใช้งานได้ตามปกติ
  ===================================================== */

  if (roots.length <= 1) {
    return normalizedRows;
  }

  /* =====================================================
     หลาย Root

     d3-org-chart ไม่รองรับ Forest
     จึงสร้าง Virtual Root เพื่อรวมทุก Tree
  ===================================================== */

  const virtualRootId =
    "__DIVISIONAL_ORG_ROOT__";

  const virtualRoot = {
    id: virtualRootId,

    parentId: null,
    parent_slot_id: null,

    slot_code: "ORG",
    slot_name: "โครงสร้างองค์กร",

    position_id: null,

    employment_capacity: 0,

    status: "active",

    sort_order: -999999,

    is_virtual_root: true,

    employee_position_assignments: [],

    positions: {
      id: null,
      position_code: "",
      position_name:
        "โครงสร้างองค์กร",
    },
  };

  const rootIds =
    new Set(
      roots.map((item) => item.id)
    );

  const connectedRows =
    normalizedRows.map((item) => {
      if (
        rootIds.has(item.id)
      ) {
        return {
          ...item,
          parentId:
            virtualRootId,
        };
      }

      return item;
    });

  return [
    virtualRoot,
    ...connectedRows,
  ];
}

function buildNodeContent(item) {
  /* =====================================================
     Virtual Root
     ใช้สำหรับรวมหลาย Root ให้ d3-org-chart เห็น Root เดียว
     ไม่ใช่ record จริงใน org_position_slots
  ===================================================== */

  if (item?.is_virtual_root) {
    return `
      <div class="divisional-org-root">
        <div class="divisional-org-root-icon">
          ⎇
        </div>

        <div class="divisional-org-root-content">
          <div class="divisional-org-root-title">
            โครงสร้างองค์กร
          </div>

          <div class="divisional-org-root-subtitle">
            Organization Structure
          </div>
        </div>
      </div>
    `;
  }

  /* =====================================================
     Current Assignments
  ===================================================== */

  const activeAssignments =
    getCurrentAssignments(item);

  const primary =
    activeAssignments.find(
      (row) => row.is_primary
    ) ||
    activeAssignments[0] ||
    null;

  const employee =
    primary?.employees || null;

  /* =====================================================
     Slot / Position
  ===================================================== */

  const positionName =
    item?.positions?.position_name ||
    "-";

  const slotCode =
    item?.slot_code ||
    "-";

  const capacity =
    Math.max(
      Number(
        item?.employment_capacity || 1
      ),
      1
    );

  /* =====================================================
     Filled / Vacant

     นับเฉพาะ Primary Assignment
     เพื่อไม่ให้ Acting / Secondary ทำ Headcount เพี้ยน
  ===================================================== */

  const filled =
    activeAssignments.filter(
      (row) =>
        row?.is_primary === true
    ).length;

  const vacant =
    Math.max(
      capacity - filled,
      0
    );

  /* =====================================================
     Context Ancestor
  ===================================================== */

  const isContext =
    Boolean(
      item?.is_context_ancestor
    );

  /* =====================================================
     Employee Name
  ===================================================== */

  const employeeNameTH =
    employee
      ? [
          employee.first_name_th,
          employee.last_name_th,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

  const employeeNameEN =
    employee
      ? [
          employee.first_name_en,
          employee.last_name_en,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

  let employeeName = "-";

  if (employee) {
    employeeName =
      employeeNameTH ||
      employeeNameEN ||
      "-";
  } else if (vacant > 0) {
    employeeName =
      "VACANT";
  } else {
    employeeName =
      "ตำแหน่งเต็ม";
  }

  /* =====================================================
     Employee Code
  ===================================================== */

  const employeeCode =
    employee?.employee_code ||
    "";

  /* =====================================================
     Avatar
  ===================================================== */

  const photo =
    employee?.employee_photo_url ||
    "";

  const initial =
    employeeName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "?";

  const avatar =
    photo
      ? `
        <img
          src="${escapeHtml(photo)}"
          alt="${escapeHtml(employeeName)}"
          class="divisional-node-avatar-img"
          onerror="
            this.style.display='none';
            const fallback = this.nextElementSibling;
            if (fallback) {
              fallback.style.display='flex';
            }
          "
        />

        <div
          class="divisional-node-avatar-fallback"
          style="display:none;"
        >
          ${escapeHtml(initial)}
        </div>
      `
      : `
        <div
          class="divisional-node-avatar-fallback"
        >
          ${escapeHtml(initial)}
        </div>
      `;

  /* =====================================================
     Context Badge
  ===================================================== */

  const contextBadge =
    isContext
      ? `
        <span
          class="divisional-node-badge context"
        >
          Context
        </span>
      `
      : "";

  /* =====================================================
     Vacancy / Filled Badge
  ===================================================== */

  const vacancyBadge =
    vacant > 0
      ? `
        <span
          class="divisional-node-badge vacant"
        >
          ว่าง ${vacant}
        </span>
      `
      : `
        <span
          class="divisional-node-badge filled"
        >
          ครบ ${filled}/${capacity}
        </span>
      `;

  /* =====================================================
     Organization Labels
  ===================================================== */

  const companyName =
    item?.companies?.company_name_th ||
    item?.companies?.company_name_en ||
    "";

  const branchGroupName =
    item?.branch_groups?.group_name ||
    "";

  const branchName =
    item?.branches?.branch_name ||
    "";

  const departmentName =
    item?.departments?.department_name ||
    "";

  const divisionName =
    item?.divisions?.division_name ||
    "";

  const unitName =
    item?.units?.unit_name ||
    "";

  const organizationLabel =
    divisionName ||
    departmentName ||
    branchName ||
    branchGroupName ||
    companyName ||
    "-";

  /* =====================================================
     Slot Name
  ===================================================== */

  const slotName =
    item?.slot_name ||
    "";

  /* =====================================================
     CSS Classes
  ===================================================== */

  const nodeClasses = [
    "divisional-org-node",

    isContext
      ? "is-context"
      : "",

    !employee && vacant > 0
      ? "is-vacant"
      : "",

    employee
      ? "is-filled"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* =====================================================
     Render
  ===================================================== */

  return `
    <div
      class="${nodeClasses}"
      data-slot-id="${escapeHtml(
        item?.id || ""
      )}"
      data-position-id="${escapeHtml(
        item?.position_id || ""
      )}"
      data-employee-id="${escapeHtml(
        employee?.id || ""
      )}"
    >
      <!-- ===============================================
           Header
      ================================================ -->

      <div class="divisional-node-head">

        <div class="divisional-node-slot-wrap">

          <div class="divisional-node-slot">
            ${escapeHtml(slotCode)}
          </div>

          ${
            slotName
              ? `
                <div class="divisional-node-slot-name">
                  ${escapeHtml(slotName)}
                </div>
              `
              : ""
          }

        </div>

        <div class="divisional-node-badges">
          ${contextBadge}
          ${vacancyBadge}
        </div>

      </div>

      <!-- ===============================================
           Body
      ================================================ -->

      <div class="divisional-node-body">

        <div class="divisional-node-avatar">
          ${avatar}
        </div>

        <div class="divisional-node-info">

          <div
            class="divisional-node-name ${
              !employee &&
              vacant > 0
                ? "vacant"
                : ""
            }"
          >
            ${escapeHtml(employeeName)}
          </div>

          <div class="divisional-node-position">
            ${escapeHtml(positionName)}
          </div>

          <div class="divisional-node-meta">

            ${
              employeeCode
                ? `
                  <span class="divisional-node-employee-code">
                    ${escapeHtml(employeeCode)}
                  </span>
                `
                : `
                  <span class="divisional-node-vacant-text">
                    ยังไม่มีผู้ครองตำแหน่ง
                  </span>
                `
            }

          </div>

        </div>

      </div>

      <!-- ===============================================
           Footer
      ================================================ -->

      <div class="divisional-node-foot">

        <span
          class="divisional-node-org"
          title="${escapeHtml(
            organizationLabel
          )}"
        >
          ${escapeHtml(
            organizationLabel
          )}
        </span>

        ${
          unitName
            ? `
              <span
                class="divisional-node-unit"
                title="${escapeHtml(
                  unitName
                )}"
              >
                ${escapeHtml(
                  unitName
                )}
              </span>
            `
            : ""
        }

      </div>

    </div>
  `;
}

function buildExpandButton(node) {
  const count = node?.children?.length || node?._children?.length || 0;
  if (!count) return "";

  const expanded = Boolean(node?.children?.length);

  return `
    <div class="divisional-expand-button">
      ${expanded ? "−" : "+"}
      <span>${count}</span>
    </div>
  `;
}

function getCurrentAssignments(slot) {
  const today = getBangkokToday();

  return (slot?.employee_position_assignments || []).filter((row) => {
    if (row?.status !== "active") return false;
    if (row?.effective_from && row.effective_from > today) return false;
    if (row?.effective_to && row.effective_to < today) return false;
    return true;
  });
}

function getBangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
