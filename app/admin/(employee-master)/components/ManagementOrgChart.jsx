"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { OrgChart } from "d3-org-chart";

import "./ManagementOrgChart.css";

/* =====================================================
   Management Org Chart
===================================================== */
const ManagementOrgChart = forwardRef(
  function ManagementOrgChart(
    {
      data = [],
      loading = false,
      onNodeClick,
    },
    ref
  ) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    /*
     * เก็บข้อมูลล่าสุดไว้ใน Ref
     * เพื่อใช้ค้นหา Node ตอนคลิก
     */
    const latestDataRef = useRef([]);

    /*
     * เก็บ requestAnimationFrame และ Timer
     * สำหรับ Cleanup ตอน Component ถูกถอดออก
     */
    const animationFrameRef = useRef(null);
    const styleTimersRef = useRef([]);

    /* =====================================================
       Method ที่ Page ภายนอกเรียกใช้ได้
    ===================================================== */
    useImperativeHandle(
      ref,
      () => ({
        fit() {
          const chart = chartRef.current;

          if (!chart) return;

          chart.fit();
        },

        zoomIn() {
          const chart = chartRef.current;

          if (!chart) return;

          chart.zoomIn();
        },

        zoomOut() {
          const chart = chartRef.current;

          if (!chart) return;

          chart.zoomOut();
        },

        expandAll() {
          const chart = chartRef.current;

          if (!chart) return;

          chart
            .expandAll()
            .render();

          scheduleChartUpdate({
            container:
              containerRef.current,
            chart,
            fitChart: true,
          });
        },

        collapseAll() {
          const chart = chartRef.current;

          if (!chart) return;

          chart
            .collapseAll()
            .render();

          scheduleChartUpdate({
            container:
              containerRef.current,
            chart,
            fitChart: true,
          });
        },

        refresh() {
          const chart = chartRef.current;

          if (!chart) return;

          chart.render();

          scheduleChartUpdate({
            container:
              containerRef.current,
            chart,
            fitChart: false,
          });
        },

        highlightNode(nodeId) {
          const chart = chartRef.current;

          if (!chart || !nodeId) return;

          const targetId =
            String(nodeId);

          if (
            typeof chart.setHighlighted ===
            "function"
          ) {
            chart
              .setHighlighted(targetId)
              .render();
          }

          scheduleChartUpdate({
            container:
              containerRef.current,
            chart,
            fitChart: false,
          });
        },

        clearHighlight() {
          const chart = chartRef.current;

          if (!chart) return;

          if (
            typeof chart.clearHighlighting ===
            "function"
          ) {
            chart
              .clearHighlighting()
              .render();
          }

          scheduleChartUpdate({
            container:
              containerRef.current,
            chart,
            fitChart: false,
          });
        },
      }),
      []
    );

    /* =====================================================
       สร้างและ Render Org Chart
    ===================================================== */
    useEffect(() => {
      const container =
        containerRef.current;

      if (!container) {
        return undefined;
      }

      const chartData =
        normalizeChartData(data);

      latestDataRef.current =
        chartData;

      /*
       * ไม่มีข้อมูล ให้ล้าง SVG เก่าออก
       */
      if (!chartData.length) {
        container.innerHTML = "";

        return undefined;
      }

      /*
       * สร้าง OrgChart เพียงครั้งเดียว
       */
      if (!chartRef.current) {
        chartRef.current =
          new OrgChart();
      }

      const chart =
        chartRef.current;

      chart
        .container(container)

        .data(chartData)

        /*
         * d3-org-chart ส่งข้อมูลดิบเข้ามา
         * จึงใช้ item.id ได้โดยตรง
         */
        .nodeId((item) =>
          String(item.id)
        )

        .parentNodeId((item) =>
          item.parentId
            ? String(item.parentId)
            : null
        )

        /*
         * ผังจากบนลงล่าง
         */
        .layout("top")

        /*
         * ขนาดพื้นที่ Node
         * Card จริงจะอยู่ใน CSS
         */
        .nodeWidth(() => 400)

        .nodeHeight(() => 174)

        /*
         * ระยะห่างระหว่าง Parent และ Child
         */
        .childrenMargin(() => 48)

        /*
         * ระยะห่าง Node ระดับเดียวกัน
         */
        .siblingsMargin(() => 48)

        /*
         * ระยะห่างระหว่างกลุ่ม
         */
        .neighbourMargin(() => 65)

        /*
         * ระยะ Compact Layout
         */
        .compactMarginBetween(
          () => 40
        )

        .compactMarginPair(
          () => 85
        )

        /*
         * Animation
         */
        .duration(350)

        /*
         * Zoom เริ่มต้น
         */
        .initialZoom(0.9)

        /*
         * HTML ของ Card พนักงาน
         */
        .nodeContent((node) =>
          buildEmployeeNode(
            node.data
          )
        )

        /*
         * ปุ่ม Expand / Collapse
         */
        .buttonContent(
          ({ node }) =>
            buildExpandButton(node)
        )

        /*
         * เมื่อคลิก Card
         */
        .onNodeClick((nodeId) => {
          const selectedNode =
            latestDataRef.current.find(
              (item) =>
                String(item.id) ===
                String(nodeId)
            );

          if (!selectedNode) {
            return;
          }

          onNodeClick?.(
            selectedNode
          );
        })

        .render();

      /*
       * จัด Style ของ Connector
       * หลัง d3-org-chart Render เสร็จ
       */
      scheduleChartUpdate({
        container,
        chart,
        fitChart: true,
        animationFrameRef,
        styleTimersRef,
      });

      /*
       * เฝ้าดูการเปลี่ยนแปลงของ SVG
       * เช่น Expand / Collapse หรือ Transition
       */
      const cleanupObserver =
        observeChartChanges(
          container
        );

      return () => {
        cleanupObserver?.();

        if (
          animationFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animationFrameRef.current
          );

          animationFrameRef.current =
            null;
        }

        styleTimersRef.current.forEach(
          (timer) => {
            window.clearTimeout(timer);
          }
        );

        styleTimersRef.current = [];
      };
    }, [data, onNodeClick]);

    /* =====================================================
       Loading
    ===================================================== */
    if (loading) {
      return (
        <div className="management-chart-state">
          <div className="management-chart-state-content">
            <div className="management-chart-spinner" />

            <div className="management-chart-state-title">
              กำลังโหลดผังองค์กร...
            </div>
          </div>
        </div>
      );
    }

    /* =====================================================
       Empty
    ===================================================== */
    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return (
        <div className="management-chart-empty">
          <div className="management-chart-state-content">
            <div className="management-chart-empty-icon">
              ⎇
            </div>

            <div className="management-chart-state-title">
              ยังไม่มีข้อมูลผังองค์กร
            </div>

            <div className="management-chart-state-description">
              กรุณาเพิ่มสายบังคับบัญชา
              P12 ถึง P9
            </div>
          </div>
        </div>
      );
    }

    /* =====================================================
       Chart Container
    ===================================================== */
    return (
      <div className="management-chart-wrapper">
        <div
          ref={containerRef}
          className="management-chart-container"
        />
      </div>
    );
  }
);

ManagementOrgChart.displayName = "ManagementOrgChart";

export default ManagementOrgChart;

/* =====================================================
   Normalize Chart Data
===================================================== */
function normalizeChartData(data = []) {
  if (!Array.isArray(data)) {
    return [];
  }

  const normalizedData = data
    .filter(
      (item) =>
        item &&
        (item.id || item.employee_id)
    )
    .map((item) => {
      /*
       * API Tree ควรส่ง:
       * id = employee_id
       * parentId = supervisor_employee_id
       *
       * แต่รองรับ mappedData เดิมด้วย
       */
      const rawId =
        item.id ||
        item.employee_id;

      const rawParentId =
        item.parentId ||
        item.parent_id ||
        item.supervisor_employee_id ||
        null;

      const id = String(rawId);

      const parentId =
        rawParentId &&
        String(rawParentId) !== id
          ? String(rawParentId)
          : null;

      return {
        ...item,

        id,
        parentId,

        assignment_id:
          item.assignment_id ||
          item.assignmentId ||
          "",

        employee_id:
          item.employee_id ||
          item.employeeId ||
          id,

        employee_name:
          item.employee_name ||
          item.name ||
          "-",

        employee_code:
          item.employee_code ||
          "-",

        employee_photo_url:
          item.employee_photo_url ||
          item.imageUrl ||
          "",

        position_name:
          item.position_name ||
          item.positionName ||
          "-",
      };
    });

  /*
   * d3-org-chart ไม่สามารถรับ parentId
   * ที่ไม่มีอยู่ในชุดข้อมูลได้
   *
   * ถ้า Supervisor ไม่อยู่ในข้อมูลที่โหลดมา
   * ให้ Node นั้นเป็น Root ชั่วคราว
   */
  const existingIds = new Set(
    normalizedData.map(
      (item) => item.id
    )
  );

  return normalizedData.map(
    (item) => ({
      ...item,

      parentId:
        item.parentId &&
        existingIds.has(item.parentId)
          ? item.parentId
          : null,
    })
  );
}

/* =====================================================
   Build Employee Node
===================================================== */
function buildEmployeeNode(item = {}) {
  const employeeName =
    item.employee_name ||
    item.name ||
    "-";

  const employeeCode =
    item.employee_code ||
    "-";

  const positionName =
    item.position_name ||
    item.positionName ||
    "-";

  const photoUrl =
    item.employee_photo_url ||
    item.imageUrl ||
    "";

  const initial =
    employeeName
      .trim()
      .charAt(0)
      .toUpperCase() || "?";

  const safeName =
    escapeHtml(employeeName);

  const safeCode =
    escapeHtml(employeeCode);

  const safePosition =
    escapeHtml(positionName);

  const safePhotoUrl =
    escapeHtml(photoUrl);

  const avatarContent = photoUrl
    ? `
      <img
        src="${safePhotoUrl}"
        alt="${safeName}"
        class="management-avatar-image"
        onerror="
          this.style.display='none';
          const placeholder =
            this.nextElementSibling;

          if (placeholder) {
            placeholder.style.display='flex';
          }
        "
      />

      <div
        class="management-avatar-placeholder"
        style="display:none;"
      >
        ${escapeHtml(initial)}
      </div>
    `
    : `
      <div
        class="management-avatar-placeholder"
      >
        ${escapeHtml(initial)}
      </div>
    `;

  return `
    <div
      class="management-node"
      data-node-id="${escapeHtml(
        item.id || ""
      )}"
      data-assignment-id="${escapeHtml(
        item.assignment_id || ""
      )}"
    >
      <!-- ขอบ Gradient ด้านนอก -->
      <div
        class="management-node-border"
      ></div>

      <!-- พื้นขาวด้านใน -->
      <div
        class="management-node-body"
      >
        <!-- รูปพนักงาน -->
        <div
          class="management-avatar-wrapper"
        >
          ${avatarContent}
        </div>

        <!-- ข้อมูลพนักงาน -->
        <div
          class="management-node-content"
        >
          <div
            class="management-node-name"
            title="${safeName}"
          >
            ${safeName}
          </div>

          <div
            class="management-node-code"
            title="${safeCode}"
          >
            ${safeCode}
          </div>

          <div
            class="management-node-position"
            title="${safePosition}"
          >
            ${safePosition}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =====================================================
   Build Expand / Collapse Button
===================================================== */
function buildExpandButton(node) {
  const visibleChildren =
    Array.isArray(node?.children)
      ? node.children.length
      : 0;

  const hiddenChildren =
    Array.isArray(node?._children)
      ? node._children.length
      : 0;

  const childCount =
    visibleChildren ||
    hiddenChildren;

  if (!childCount) {
    return "";
  }

  const isExpanded =
    visibleChildren > 0;

  return `
    <div
      class="management-expand-button"
      title="${
        isExpanded
          ? "ย่อสายบังคับบัญชา"
          : "ขยายสายบังคับบัญชา"
      }"
    >
      <span
        class="management-expand-symbol"
      >
        ${isExpanded ? "−" : "+"}
      </span>

      <span
        class="management-expand-count"
      >
        ${childCount}
      </span>
    </div>
  `;
}

/* =====================================================
   Escape HTML
===================================================== */
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =====================================================
   Schedule Chart Update
===================================================== */

function scheduleChartUpdate({
  container,
  chart,
  fitChart = true,
  animationFrameRef,
  styleTimersRef,
}) {
  if (!container) return;

  if (
    animationFrameRef &&
    animationFrameRef.current
  ) {
    cancelAnimationFrame(
      animationFrameRef.current
    );
  }

  if (styleTimersRef) {
    styleTimersRef.current.forEach((t) =>
      clearTimeout(t)
    );

    styleTimersRef.current = [];
  }

  const update = () => {
    applyConnectorStyles(container);

    applyExpandButtonPosition(
      container
    );

    if (fitChart) {
      chart?.fit?.();
    }
  };

  if (animationFrameRef) {
    animationFrameRef.current =
      requestAnimationFrame(update);
  } else {
    requestAnimationFrame(update);
  }

  if (styleTimersRef) {
    [100, 250, 450].forEach((ms) => {
      const timer =
        setTimeout(update, ms);

      styleTimersRef.current.push(
        timer
      );
    });
  }
}

/* =====================================================
   Connector
===================================================== */

function applyConnectorStyles(
  container
) {
  if (!container) return;

  const paths =
    container.querySelectorAll(
      "svg path"
    );

  paths.forEach((path) => {
    path.style.stroke =
      "#38bdf8";

    path.style.strokeWidth =
      "2.5";

    path.style.fill =
      "none";

    path.style.strokeLinecap =
      "round";

    path.style.strokeLinejoin =
      "round";

    path.style.opacity =
      "1";

    path.removeAttribute(
      "marker-start"
    );

    path.removeAttribute(
      "marker-mid"
    );

    path.removeAttribute(
      "marker-end"
    );
  });
}

/* =====================================================
   Expand Button
===================================================== */

function applyExpandButtonPosition(
  container
) {
  if (!container) return;

  const buttons =
    container.querySelectorAll(
      ".management-expand-button"
    );

  buttons.forEach((button) => {
    button.style.position =
      "relative";

    button.style.top = "-8px";

    button.style.zIndex =
      "99";
  });
}

/* =====================================================
   Observe SVG
===================================================== */

function observeChartChanges(
  container
) {
  if (!container) {
    return () => {};
  }

  let frame = null;

  const observer =
    new MutationObserver(() => {
      if (frame) {
        cancelAnimationFrame(
          frame
        );
      }

      frame =
        requestAnimationFrame(() => {
          applyConnectorStyles(
            container
          );

          applyExpandButtonPosition(
            container
          );
        });
    });

  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  return () => {
    observer.disconnect();

    if (frame) {
      cancelAnimationFrame(
        frame
      );
    }
  };
}
