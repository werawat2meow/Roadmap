"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import OrgPositionSlotSearch from "./components/OrgPositionSlotSearch";
import OrgPositionSlotSummaryCards from "./components/OrgPositionSlotSummaryCards";
import OrgPositionSlotTable from "./components/OrgPositionSlotTable";
import OrgPositionSlotModal from "./components/OrgPositionSlotModal";
import OrgPositionSlotDrawer from "./components/OrgPositionSlotDrawer";

/* =========================================================
   Constants
========================================================= */

const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  search: "",

  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",

  position_id: "",
  parent_slot_id: "",

  slot_type: "",
  status: "active",
};

/* =========================================================
   Helpers
========================================================= */

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function extractRows(payload = {}) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.flat_data)) {
    return payload.flat_data;
  }

  return [];
}

function getBangkokToday() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

function getCurrentPrimaryAssignments(
  slot
) {
  const today =
    getBangkokToday();

  const assignments =
    slot?.employee_position_assignments ||
    [];

  return assignments.filter(
    (assignment) => {
      if (
        assignment?.status !==
        "active"
      ) {
        return false;
      }

      if (
        assignment?.is_primary !==
        true
      ) {
        return false;
      }

      if (
        assignment?.effective_from &&
        assignment.effective_from >
          today
      ) {
        return false;
      }

      if (
        assignment?.effective_to &&
        assignment.effective_to <
          today
      ) {
        return false;
      }

      return true;
    }
  );
}

function calculateSummary(
  rows = []
) {
  let capacity = 0;
  let filled = 0;
  let vacant = 0;
  let rootSlots = 0;

  for (const row of rows) {
    const slotCapacity =
      Math.max(
        Number(
          row?.employment_capacity ||
            1
        ),
        1
      );

    const currentFilled =
      getCurrentPrimaryAssignments(
        row
      ).length;

    capacity +=
      slotCapacity;

    filled +=
      currentFilled;

    vacant +=
      Math.max(
        slotCapacity -
          currentFilled,
        0
      );

    if (
      !row?.parent_slot_id
    ) {
      rootSlots += 1;
    }
  }

  return {
    total:
      rows.length,

    capacity,

    filled,

    vacant,

    rootSlots,
  };
}

/* =========================================================
   Page
========================================================= */

export default function OrgPositionSlotsPage() {
  const router =
    useRouter();

  /* =======================================================
     Permission + Scope

     ไม่ใส่ scopeType เดี่ยว
     เพราะ org_position_slots ใช้ Lineage Scope:
     company -> group -> branch -> department
     -> division -> unit
  ======================================================= */

  const {
    user,
    loadingUser,

    canView,
    canCreate,
    canEdit,
    canDelete,
  } =
    useScopedPermissions(
      "ems.org_structure"
    );

  /* =======================================================
     State
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    total: 0,
    capacity: 0,
    filled: 0,
    vacant: 0,
    rootSlots: 0,
  });

  const [
    options,
    setOptions,
  ] = useState({
    companies: [],
    branch_groups: [],
    branches: [],
    branch_departments: [],
    departments: [],
    divisions: [],
    units: [],
    positions: [],
  });

  /*
   * เก็บ Slot ทั้งหมดที่ User
   * สามารถเข้าถึงได้
   *
   * ใช้สำหรับ Parent Slot Dropdown
   * ไม่ผูกกับ Filter หน้าปัจจุบัน
   */
  const [
    parentSlotPool,
    setParentSlotPool,
  ] = useState([]);

  const [
    filters,
    setFilters,
  ] = useState(
    INITIAL_FILTERS
  );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(
    DEFAULT_PAGE_SIZE
  );

  const [
    total,
    setTotal,
  ] = useState(0);

  /* =======================================================
     Modal / Drawer
  ======================================================= */

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(null);

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(null);

  /* =======================================================
     Build Query Params
  ======================================================= */

  const buildParams =
    useCallback(
      ({
        nextFilters =
          filters,

        nextPage =
          page,

        nextPageSize =
          pageSize,

        all = false,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (all) {
          params.set(
            "all",
            "true"
          );
        } else {
          params.set(
            "page",
            String(
              nextPage
            )
          );

          params.set(
            "pageSize",
            String(
              nextPageSize
            )
          );
        }

        const search =
          String(
            nextFilters
              ?.search ||
              ""
          ).trim();

        if (search) {
          params.set(
            "search",
            search
          );
        }

        [
          "company_id",
          "branch_group_id",
          "branch_id",
          "department_id",
          "division_id",
          "unit_id",
          "position_id",
          "parent_slot_id",
          "slot_type",
          "status",
        ].forEach(
          (key) => {
            const value =
              nextFilters?.[
                key
              ];

            if (
              value !==
                undefined &&
              value !==
                null &&
              value !==
                ""
            ) {
              params.set(
                key,
                String(
                  value
                )
              );
            }
          }
        );

        return params;
      },
      [
        filters,
        page,
        pageSize,
      ]
    );

  /* =======================================================
     Load Master Options
  ======================================================= */

  const loadOptions =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/admin/org-structure/options",
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const payload =
            await safeJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลดข้อมูลโครงสร้างองค์กรได้"
            );
          }

          setOptions({
            companies:
              payload?.data
                ?.companies ||
              [],

            branch_groups:
              payload?.data
                ?.branch_groups ||
              [],

            branches:
              payload?.data
                ?.branches ||
              [],

            branch_departments:
              payload?.data
                ?.branch_departments ||
              [],

            departments:
              payload?.data
                ?.departments ||
              [],

            divisions:
              payload?.data
                ?.divisions ||
              [],

            units:
              payload?.data
                ?.units ||
              [],

            positions:
              payload?.data
                ?.positions ||
              [],
          });
        } catch (error) {
          console.error(
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลด Master Data ได้"
          );
        }
      },
      []
    );

  /* =======================================================
     Load Parent Slot Pool
  ======================================================= */

  const loadParentSlotPool =
    useCallback(
      async () => {
        try {
          const params =
            new URLSearchParams({
              all: "true",
              status:
                "active",
            });

          const response =
            await fetch(
              `/api/admin/org-position-slots?${params.toString()}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const payload =
            await safeJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลด Parent Position Slot ได้"
            );
          }

          setParentSlotPool(
            extractRows(
              payload
            )
          );
        } catch (error) {
          console.error(
            error
          );

          setParentSlotPool(
            []
          );
        }
      },
      []
    );

  /* =======================================================
     Load Table
  ======================================================= */

  const loadSlots =
    useCallback(
      async ({
        nextFilters =
          filters,

        nextPage =
          page,

        nextPageSize =
          pageSize,
      } = {}) => {
        if (!canView) {
          return;
        }

        try {
          setLoading(
            true
          );

          const params =
            buildParams({
              nextFilters,
              nextPage,
              nextPageSize,
            });

          const response =
            await fetch(
              `/api/admin/org-position-slots?${params.toString()}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const payload =
            await safeJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลด Position Slot ได้"
            );
          }

          setRows(
            extractRows(
              payload
            )
          );

          setTotal(
            Number(
              payload
                ?.pagination
                ?.total ||
                payload?.total ||
                0
            )
          );
        } catch (error) {
          console.error(
            error
          );

          setRows([]);

          setTotal(0);

          swalError(
            error?.message ||
              "เกิดข้อผิดพลาดในการโหลด Position Slot"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        canView,
        filters,
        page,
        pageSize,
        buildParams,
      ]
    );

  /* =======================================================
     Load Summary

     ใช้ all=true เพื่อ Summary
     ไม่ขึ้นกับ Page ปัจจุบัน
  ======================================================= */

  const loadSummary =
    useCallback(
      async (
        nextFilters =
          filters
      ) => {
        if (!canView) {
          return;
        }

        try {
          const params =
            buildParams({
              nextFilters,
              all: true,
            });

          const response =
            await fetch(
              `/api/admin/org-position-slots?${params.toString()}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const payload =
            await safeJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลด Summary ได้"
            );
          }

          const allRows =
            extractRows(
              payload
            );

          setSummary(
            calculateSummary(
              allRows
            )
          );
        } catch (error) {
          console.error(
            error
          );

          setSummary({
            total: 0,
            capacity: 0,
            filled: 0,
            vacant: 0,
            rootSlots: 0,
          });
        }
      },
      [
        canView,
        filters,
        buildParams,
      ]
    );

  /* =======================================================
     Initial Permission Redirect
  ======================================================= */

  useEffect(() => {
    if (loadingUser) {
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
    loadingUser,
    user,
    canView,
    router,
  ]);

  /* =======================================================
     Initial Data
  ======================================================= */

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canView
    ) {
      return;
    }

    loadOptions();

    loadParentSlotPool();

    loadSlots({
      nextPage: 1,
    });

    loadSummary();
  }, [
    loadingUser,
    user,
    canView,
  ]);

  /* =======================================================
     Filter Change
  ======================================================= */

  const handleFilterChange =
    (
      field,
      value
    ) => {
      setFilters(
        (
          current
        ) => {
          const next = {
            ...current,

            [field]:
              value ??
              "",
          };

          /*
           * Strict Cascade
           */

          if (
            field ===
            "company_id"
          ) {
            next.branch_group_id =
              "";

            next.branch_id =
              "";

            next.department_id =
              "";

            next.division_id =
              "";

            next.unit_id =
              "";

            next.parent_slot_id =
              "";
          }

          if (
            field ===
            "branch_group_id"
          ) {
            next.branch_id =
              "";

            next.department_id =
              "";

            next.division_id =
              "";

            next.unit_id =
              "";

            next.parent_slot_id =
              "";
          }

          if (
            field ===
            "branch_id"
          ) {
            next.department_id =
              "";

            next.division_id =
              "";

            next.unit_id =
              "";

            next.parent_slot_id =
              "";
          }

          if (
            field ===
            "department_id"
          ) {
            next.division_id =
              "";

            next.unit_id =
              "";

            next.parent_slot_id =
              "";
          }

          if (
            field ===
            "division_id"
          ) {
            next.unit_id =
              "";

            next.parent_slot_id =
              "";
          }

          if (
            field ===
            "unit_id"
          ) {
            next.parent_slot_id =
              "";
          }

          return next;
        }
      );
    };

  /* =======================================================
     Search
  ======================================================= */

  const handleSearch =
    async () => {
      setPage(1);

      await Promise.all([
        loadSlots({
          nextFilters:
            filters,

          nextPage: 1,
        }),

        loadSummary(
          filters
        ),
      ]);
    };

  /* =======================================================
     Reset Search
  ======================================================= */

  const handleReset =
    async () => {
      const reset =
        INITIAL_FILTERS;

      setFilters(
        reset
      );

      setPage(1);

      await Promise.all([
        loadSlots({
          nextFilters:
            reset,

          nextPage: 1,
        }),

        loadSummary(
          reset
        ),
      ]);
    };

  /* =======================================================
     Refresh
  ======================================================= */

  const handleRefresh =
    async () => {
      await Promise.all([
        loadSlots(),

        loadSummary(),

        loadParentSlotPool(),
      ]);
    };

  /* =======================================================
     Create
  ======================================================= */

  const handleCreate =
    () => {
      if (!canCreate) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่ม Position Slot"
        );

        return;
      }

      setEditing(
        null
      );

      setModalOpen(
        true
      );
    };

  /* =======================================================
     View
  ======================================================= */

  const handleView =
    (
      record
    ) => {
      setSelectedSlot(
        record
      );

      setDrawerOpen(
        true
      );
    };

  /* =======================================================
     Edit
  ======================================================= */

  const handleEdit =
    (
      record
    ) => {
      if (!canEdit) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไข Position Slot"
        );

        return;
      }

      if (
        record
          ?.is_context_ancestor
      ) {
        swalError(
          "Context Ancestor ใช้สำหรับแสดงสายโครงสร้างเท่านั้น ไม่สามารถแก้ไขได้"
        );

        return;
      }

      setEditing(
        record
      );

      setDrawerOpen(
        false
      );

      setModalOpen(
        true
      );
    };

  /* =======================================================
     Save
  ======================================================= */

  const handleSubmit =
    async (
      values
    ) => {
      const isEdit =
        Boolean(
          editing?.id
        );

      if (
        isEdit &&
        !canEdit
      ) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไข Position Slot"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่ม Position Slot"
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const url =
          isEdit
            ? `/api/admin/org-position-slots/${editing.id}`
            : "/api/admin/org-position-slots";

        const method =
          isEdit
            ? "PATCH"
            : "POST";

        const response =
          await fetch(
            url,
            {
              method,

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  values
                ),
            }
          );

        const payload =
          await safeJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ||
              "ไม่สามารถบันทึก Position Slot ได้"
          );
        }

        await swalSuccess(
          payload?.message ||
            (
              isEdit
                ? "แก้ไข Position Slot เรียบร้อยแล้ว"
                : "เพิ่ม Position Slot เรียบร้อยแล้ว"
            )
        );

        setModalOpen(
          false
        );

        setEditing(
          null
        );

        await Promise.all([
          loadSlots(),

          loadSummary(),

          loadParentSlotPool(),
        ]);
      } catch (error) {
        console.error(
          error
        );

        swalError(
          error?.message ||
            "เกิดข้อผิดพลาดในการบันทึก Position Slot"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     Delete
  ======================================================= */

  const handleDelete =
    async (
      record
    ) => {
      if (!canDelete) {
        swalError(
          "คุณไม่มีสิทธิ์ลบ Position Slot"
        );

        return;
      }

      if (
        record
          ?.is_context_ancestor
      ) {
        swalError(
          "ไม่สามารถลบ Context Ancestor ได้"
        );

        return;
      }

      const confirmed =
        await swalConfirm(
          `ต้องการลบ Position Slot "${record.slot_code}" ใช่หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          record.id
        );

        const response =
          await fetch(
            `/api/admin/org-position-slots/${record.id}`,
            {
              method:
                "DELETE",
            }
          );

        const payload =
          await safeJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ||
              "ไม่สามารถลบ Position Slot ได้"
          );
        }

        await swalSuccess(
          payload?.message ||
            "ลบ Position Slot เรียบร้อยแล้ว"
        );

        setDrawerOpen(
          false
        );

        await Promise.all([
          loadSlots(),

          loadSummary(),

          loadParentSlotPool(),
        ]);
      } catch (error) {
        console.error(
          error
        );

        swalError(
          error?.message ||
            "เกิดข้อผิดพลาดในการลบ Position Slot"
        );
      } finally {
        setDeletingId(
          ""
        );
      }
    };

  /* =======================================================
     Pagination
  ======================================================= */

  const handleTableChange =
    (
      pagination
    ) => {
      const nextPage =
        pagination.current ||
        1;

      const nextPageSize =
        pagination.pageSize ||
        DEFAULT_PAGE_SIZE;

      setPage(
        nextPage
      );

      setPageSize(
        nextPageSize
      );

      loadSlots({
        nextPage,
        nextPageSize,
      });
    };

  /* =======================================================
     Guards
  ======================================================= */

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (!user) {
    return null;
  }

  if (!canView) {
    return null;
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="Position Slot"
            subtitle="Organization Position Slot Master"
            loading={
              loading
            }
            canCreate={
              canCreate
            }
            createText="เพิ่ม Position Slot"
            onCreate={
              handleCreate
            }
            onRefresh={
              handleRefresh
            }
          />

          <PageInfoAlert
            description="กำหนดอัตราตำแหน่งจริงหรือ Seat ในโครงสร้างองค์กร โดย Position Slot แต่ละรายการผูกกับ Company → Branch Group → Branch → Department → Division → Unit, Position และ Parent Slot เพื่อใช้สร้าง Org Chart และกำหนดผู้ครองตำแหน่ง"
          />
        </>
      }

      search={
        <OrgPositionSlotSearch
          filters={
            filters
          }

          options={
            options
          }

          parentSlots={
            parentSlotPool
          }

          loading={
            loading
          }

          onChange={
            handleFilterChange
          }

          onSearch={
            handleSearch
          }

          onReset={
            handleReset
          }

          onRefresh={
            handleRefresh
          }
        />
      }

      summary={
        <OrgPositionSlotSummaryCards
          summary={
            summary
          }
        />
      }

      toolbar={
        null
      }

      table={
        <OrgPositionSlotTable
          data={
            rows
          }

          loading={
            loading
          }

          page={
            page
          }

          pageSize={
            pageSize
          }

          total={
            total
          }

          deletingId={
            deletingId
          }

          canEdit={
            canEdit
          }

          canDelete={
            canDelete
          }

          onChange={
            handleTableChange
          }

          onView={
            handleView
          }

          onEdit={
            handleEdit
          }

          onDelete={
            handleDelete
          }
        />
      }

      modal={
        <>
          <OrgPositionSlotModal
            open={
              modalOpen
            }

            editing={
              editing
            }

            filters={
              filters
            }

            options={
              options
            }

            parentSlots={
              parentSlotPool
            }

            saving={
              saving
            }

            onCancel={() => {
              setModalOpen(
                false
              );

              setEditing(
                null
              );
            }}

            onSubmit={
              handleSubmit
            }
          />

          <OrgPositionSlotDrawer
            open={
              drawerOpen
            }

            slot={
              selectedSlot
            }

            canEdit={
              canEdit
            }

            onClose={() => {
              setDrawerOpen(
                false
              );

              setSelectedSlot(
                null
              );
            }}

            onEdit={
              handleEdit
            }
          />
        </>
      }
    />
  );
}