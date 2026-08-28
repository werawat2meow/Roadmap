"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Card,
  Empty,
  Flex,
} from "antd";

import {
  useRouter,
} from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import {
  swalError,
} from "@/components/Swal";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import OrgChartFilter from "./components/OrgChartFilter";
import OrgChartSummaryCards from "./components/OrgChartSummaryCards";
import OrgChartToolbar from "./components/OrgChartToolbar";
import OrgChartCanvas from "./components/OrgChartCanvas";
import OrgChartTreeView from "./components/OrgChartTreeView";
import OrgChartTable from "./components/OrgChartTable";

import {
  buildOrgChartTree,
} from "./components/orgChartUtils";

/* =========================================================
   Helpers
========================================================= */

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/* =========================================================
   Page
========================================================= */

export default function OrgChartPage() {
  const router =
    useRouter();

  /* =========================================================
     Permission + Organization Lineage Scope
  ========================================================= */

  const {
    user,

    loadingUser:
      authLoading,

    canView,

    hasAllScope,

    accessibleCompanyIds,
    accessibleBranchGroupIds,
    accessibleBranchIds,
    accessibleDepartmentIds,
    accessibleDivisionIds,
    accessibleUnitIds,
  } =
    useScopedPermissions(
      "ems.org_chart",
      {
        scopeType:
          "employee",
      }
    );

  /* =========================================================
     State
  ========================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    optionsLoading,
    setOptionsLoading,
  ] =
    useState(false);

  const [
    rows,
    setRows,
  ] =
    useState([]);

  const [
    summary,
    setSummary,
  ] =
    useState({
      total_slots: 0,
      total_capacity: 0,
      filled: 0,
      vacant: 0,
      occupied_slots: 0,
      vacant_slots: 0,
      roots: 0,
    });

  const [
    options,
    setOptions,
  ] =
    useState({
      companies: [],
      branch_groups: [],
      branches: [],
      departments: [],
      divisions: [],
      units: [],
    });

  /* =========================================================
     Filters
  ========================================================= */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    companyId,
    setCompanyId,
  ] =
    useState();

  const [
    branchGroupId,
    setBranchGroupId,
  ] =
    useState();

  const [
    branchId,
    setBranchId,
  ] =
    useState();

  const [
    departmentId,
    setDepartmentId,
  ] =
    useState();

  const [
    divisionId,
    setDivisionId,
  ] =
    useState();

  const [
    unitId,
    setUnitId,
  ] =
    useState();

  const [
    occupancy,
    setOccupancy,
  ] =
    useState(
      "all"
    );

  const [
    viewMode,
    setViewMode,
  ] =
    useState(
      "chart"
    );

  const [
    zoom,
    setZoom,
  ] =
    useState(1);

  /* =========================================================
     Tree
  ========================================================= */

  const roots =
    useMemo(
      () =>
        buildOrgChartTree(
          rows
        ),
      [
        rows,
      ]
    );

  /* =========================================================
     Load Options
  ========================================================= */

  const loadOptions =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setOptionsLoading(
            true
          );

          const response =
            await fetch(
              "/api/admin/org-chart/options",
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "ไม่สามารถโหลดตัวเลือกผังองค์กรได้"
            );
          }

          setOptions(
            json.data ||
              {
                companies: [],
                branch_groups:
                  [],
                branches: [],
                departments:
                  [],
                divisions: [],
                units: [],
              }
          );
        } catch (error) {
          console.error(
            "LOAD_ORG_CHART_OPTIONS_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถโหลดตัวเลือกผังองค์กรได้"
          );
        } finally {
          setOptionsLoading(
            false
          );
        }
      },
      [
        canView,
      ]
    );

  /* =========================================================
     Load Chart
  ========================================================= */

  const loadChart =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setLoading(true);

          const params =
            new URLSearchParams();

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (companyId) {
            params.set(
              "company_id",
              companyId
            );
          }

          if (
            branchGroupId
          ) {
            params.set(
              "branch_group_id",
              branchGroupId
            );
          }

          if (branchId) {
            params.set(
              "branch_id",
              branchId
            );
          }

          if (
            departmentId
          ) {
            params.set(
              "department_id",
              departmentId
            );
          }

          if (divisionId) {
            params.set(
              "division_id",
              divisionId
            );
          }

          if (unitId) {
            params.set(
              "unit_id",
              unitId
            );
          }

          if (
            occupancy &&
            occupancy !==
              "all"
          ) {
            params.set(
              "occupancy",
              occupancy
            );
          }

          const query =
            params.toString();

          const response =
            await fetch(
              query
                ? `/api/admin/org-chart?${query}`
                : "/api/admin/org-chart",
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "ไม่สามารถโหลดผังโครงสร้างองค์กรได้"
            );
          }

          setRows(
            Array.isArray(
              json.data
            )
              ? json.data
              : []
          );

          setSummary(
            json.summary ||
              {
                total_slots:
                  0,
                total_capacity:
                  0,
                filled: 0,
                vacant: 0,
                occupied_slots:
                  0,
                vacant_slots:
                  0,
                roots: 0,
              }
          );
        } catch (error) {
          console.error(
            "LOAD_ORG_CHART_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถโหลดผังโครงสร้างองค์กรได้"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        search,
        companyId,
        branchGroupId,
        branchId,
        departmentId,
        divisionId,
        unitId,
        occupancy,
      ]
    );

  /* =========================================================
     Auth / Permission
  ========================================================= */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (!canView) {
      router.replace(
        "/admin"
      );
    }
  }, [
    authLoading,
    user,
    canView,
    router,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    loadOptions();
  }, [
    authLoading,
    user,
    canView,
    loadOptions,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    loadChart();
  }, [
    authLoading,
    user,
    canView,
    loadChart,
  ]);

  /* =========================================================
     Filter Handlers
  ========================================================= */

  function handleCompanyChange(
    value
  ) {
    setCompanyId(value);

    setBranchGroupId(
      undefined
    );

    setBranchId(
      undefined
    );

    setDepartmentId(
      undefined
    );

    setDivisionId(
      undefined
    );

    setUnitId(
      undefined
    );
  }

  function handleBranchGroupChange(
    value
  ) {
    setBranchGroupId(
      value
    );

    setBranchId(
      undefined
    );

    setDepartmentId(
      undefined
    );

    setDivisionId(
      undefined
    );

    setUnitId(
      undefined
    );
  }

  function handleBranchChange(
    value
  ) {
    setBranchId(value);

    setDepartmentId(
      undefined
    );

    setDivisionId(
      undefined
    );

    setUnitId(
      undefined
    );
  }

  function handleDepartmentChange(
    value
  ) {
    setDepartmentId(
      value
    );

    setDivisionId(
      undefined
    );

    setUnitId(
      undefined
    );
  }

  function handleDivisionChange(
    value
  ) {
    setDivisionId(
      value
    );

    setUnitId(
      undefined
    );
  }

  /* =========================================================
     Render
  ========================================================= */

  if (authLoading) {
    return (
      <LoadingOrb />
    );
  }

  if (
    !user ||
    !canView
  ) {
    return null;
  }

  const busy =
    loading ||
    optionsLoading;

  return (
    <div
      style={{
        width: "100%",
        maxWidth:
          "100%",
        minWidth: 0,
        overflowX:
          "hidden",
      }}
    >
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="ผังโครงสร้างองค์กร"
              subtitle="Organization Chart"
              loading={busy}
              canRefresh
              canCreate={
                false
              }
              onRefresh={() => {
                loadOptions();
                loadChart();
              }}
            />

            <PageInfoAlert
              description="แสดงโครงสร้างจริงจาก Position Slot + การครองตำแหน่งองค์กร โดยไม่สร้างข้อมูล Org Chart ซ้ำ ระบบใช้สายบังคับบัญชาจาก Parent Slot ก่อน และ fallback จาก supervisor_employee_id พร้อมจำกัดข้อมูลตาม Organization Lineage Scope"
            />
          </>
        }

        search={
          <OrgChartFilter
            search={search}
            companyId={
              companyId
            }
            branchGroupId={
              branchGroupId
            }
            branchId={
              branchId
            }
            departmentId={
              departmentId
            }
            divisionId={
              divisionId
            }
            unitId={unitId}
            occupancy={
              occupancy
            }
            options={options}
            loading={busy}
            onSearch={
              setSearch
            }
            onCompanyChange={
              handleCompanyChange
            }
            onBranchGroupChange={
              handleBranchGroupChange
            }
            onBranchChange={
              handleBranchChange
            }
            onDepartmentChange={
              handleDepartmentChange
            }
            onDivisionChange={
              handleDivisionChange
            }
            onUnitChange={
              setUnitId
            }
            onOccupancyChange={
              setOccupancy
            }
          />
        }

        summary={
          <OrgChartSummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <Flex
            vertical
            gap={16}
            style={{
              width: "100%",
              minWidth: 0,
            }}
          >
            <Card>
              <OrgChartToolbar
                viewMode={
                  viewMode
                }
                zoom={zoom}
                onViewModeChange={
                  setViewMode
                }
                onZoomChange={
                  setZoom
                }
              />
            </Card>

            <Card
              loading={loading}
              styles={{
                body: {
                  minHeight:
                    560,
                },
              }}
            >
              {!loading &&
              !roots.length ? (
                <Empty
                  description="ไม่พบข้อมูลผังองค์กรตาม Scope / ตัวกรอง"
                />
              ) : viewMode ===
                "tree" ? (
                <OrgChartTreeView
                  roots={roots}
                />
              ) : viewMode ===
                "table" ? (
                <OrgChartTable
                  roots={roots}
                  loading={
                    loading
                  }
                />
              ) : (
                <OrgChartCanvas
                  roots={roots}
                  zoom={zoom}
                />
              )}
            </Card>
          </Flex>
        }
      />
    </div>
  );
}
