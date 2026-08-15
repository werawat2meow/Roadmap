"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Button,
  Card,
  Empty,
  Space,
  Typography,
} from "antd";

import {
  PlusOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";

import LoadingOrb from "../../../components/LoadingOrb";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import EmployeePositionAssignmentDrawer from "./components/EmployeePositionAssignmentDrawer";
import EmployeePositionAssignmentModal from "./components/EmployeePositionAssignmentModal";
import EmployeePositionAssignmentSearch from "./components/EmployeePositionAssignmentSearch";
import EmployeePositionAssignmentSummaryCards from "./components/EmployeePositionAssignmentSummaryCards";
import EmployeePositionAssignmentTable from "./components/EmployeePositionAssignmentTable";

const {
  Title,
  Text,
} = Typography;

/* =========================================================
   Initial Filters
========================================================= */

const INITIAL_FILTERS = {
  employee_id: "",
  position_slot_id: "",

  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",

  assignment_type: "",
  is_primary: "",
  status: "",
};

/* =========================================================
   Page
========================================================= */

export default function EmployeePositionAssignmentsPage() {
  /* =======================================================
     Permission
  ======================================================= */

  const {
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useScopedPermissions(
    "ems.org_structure"
  );

  /* =======================================================
     Filters
  ======================================================= */

  const [
    filters,
    setFilters,
  ] = useState(
    INITIAL_FILTERS
  );

  /* =======================================================
     Master Options
  ======================================================= */

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

  /* =======================================================
     Position Slots
  ======================================================= */

  const [
    slots,
    setSlots,
  ] = useState([]);

  /* =======================================================
     Assignment Data
  ======================================================= */

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     Summary
  ======================================================= */

  const [
    summaryLoading,
    setSummaryLoading,
  ] = useState(false);

  const [
    summary,
    setSummary,
  ] = useState({
    total: 0,
    primary: 0,
    acting: 0,
    active: 0,
  });

  /* =======================================================
     Pagination
  ======================================================= */

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  /* =======================================================
     Employee Search
  ======================================================= */

  const [
    employeeOptions,
    setEmployeeOptions,
  ] = useState([]);

  const [
    employeeLoading,
    setEmployeeLoading,
  ] = useState(false);

  /* =======================================================
     Modal
  ======================================================= */

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingAssignment,
    setEditingAssignment,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  /* =======================================================
     Drawer
  ======================================================= */

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    selectedAssignment,
    setSelectedAssignment,
  ] = useState(null);

  /* =======================================================
     Delete
  ======================================================= */

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  /* =======================================================
     Option Maps
  ======================================================= */

  const optionMaps =
    useMemo(() => {
      const toMap = (
        rows,
        nameGetter
      ) =>
        new Map(
          (rows || []).map(
            (row) => [
              String(row.id),
              nameGetter(row),
            ]
          )
        );

      return {
        companies:
          toMap(
            options.companies,
            (row) =>
              row.company_name_th ||
              row.company_name_en ||
              row.company_code ||
              "-"
          ),

        branchGroups:
          toMap(
            options.branch_groups,
            (row) =>
              row.group_name ||
              "-"
          ),

        branches:
          toMap(
            options.branches,
            (row) =>
              row.branch_name ||
              "-"
          ),

        departments:
          toMap(
            options.departments,
            (row) =>
              row.department_name ||
              "-"
          ),

        divisions:
          toMap(
            options.divisions,
            (row) =>
              row.division_name ||
              "-"
          ),

        units:
          toMap(
            options.units,
            (row) =>
              row.unit_name ||
              "-"
          ),
      };
    }, [
      options,
    ]);

  /* =======================================================
     Decorate Organization Path
  ======================================================= */

  const decorateRows =
    useCallback(
      (
        rows = []
      ) =>
        rows.map(
          (row) => {
            const slot =
              row.org_position_slots ||
              {};

            const parts = [
              optionMaps.companies.get(
                String(
                  slot.company_id ||
                    ""
                )
              ),

              optionMaps.branchGroups.get(
                String(
                  slot.branch_group_id ||
                    ""
                )
              ),

              optionMaps.branches.get(
                String(
                  slot.branch_id ||
                    ""
                )
              ),

              optionMaps.departments.get(
                String(
                  slot.department_id ||
                    ""
                )
              ),

              optionMaps.divisions.get(
                String(
                  slot.division_id ||
                    ""
                )
              ),

              optionMaps.units.get(
                String(
                  slot.unit_id ||
                    ""
                )
              ),
            ].filter(Boolean);

            return {
              ...row,

              organization_path:
                parts.join(
                  " → "
                ) ||
                "-",
            };
          }
        ),
      [
        optionMaps,
      ]
    );

  /* =======================================================
     Load Scope Options
  ======================================================= */

  const loadOptions =
    useCallback(
      async () => {
        try {
          setLoadingOptions(
            true
          );

          const response =
            await fetch(
              "/api/admin/org-structure/options",
              {
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
                "ไม่สามารถโหลดข้อมูล Scope ได้"
            );
          }

          setOptions(
            payload.data ||
              {}
          );
        } catch (err) {
          console.error(
            err
          );

          swalError(
            err.message ||
              "ไม่สามารถโหลดข้อมูล Scope ได้"
          );
        } finally {
          setLoadingOptions(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     Load Position Slots
  ======================================================= */

  const loadSlots =
    useCallback(
      async (
        nextFilters =
          filters
      ) => {
        try {
          const params =
            new URLSearchParams({
              all: "true",
              status:
                "active",
            });

          [
            "company_id",
            "branch_group_id",
            "branch_id",
            "department_id",
            "division_id",
            "unit_id",
          ].forEach(
            (key) => {
              if (
                nextFilters[
                  key
                ]
              ) {
                params.set(
                  key,
                  nextFilters[
                    key
                  ]
                );
              }
            }
          );

          const response =
            await fetch(
              `/api/admin/org-position-slots?${params.toString()}`,
              {
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

          setSlots(
            payload.data ||
              payload.flat_data ||
              []
          );
        } catch (err) {
          console.error(
            err
          );

          setSlots([]);
        }
      },
      [
        filters,
      ]
    );

  /* =======================================================
     Build Assignment Params
  ======================================================= */

  const buildAssignmentParams =
    useCallback(
      ({
        nextFilters =
          filters,

        page =
          pagination.page,

        pageSize =
          pagination.pageSize,

        overrides = {},
      } = {}) => {
        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "pageSize",
          String(
            pageSize
          )
        );

        const merged = {
          ...nextFilters,
          ...overrides,
        };

        Object.entries(
          merged
        ).forEach(
          ([
            key,
            value,
          ]) => {
            if (
              value !==
                "" &&
              value !==
                null &&
              value !==
                undefined
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
        pagination.page,
        pagination.pageSize,
      ]
    );

  /* =======================================================
     Load Assignments
  ======================================================= */

  const loadAssignments =
    useCallback(
      async ({
        nextFilters =
          filters,

        page =
          pagination.page,

        pageSize =
          pagination.pageSize,
      } = {}) => {
        try {
          setLoading(
            true
          );

          setError("");

          const params =
            buildAssignmentParams({
              nextFilters,
              page,
              pageSize,
            });

          const response =
            await fetch(
              `/api/admin/employee-position-assignments?${params.toString()}`,
              {
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
                "ไม่สามารถโหลด Employee Position Assignment ได้"
            );
          }

          setAssignments(
            decorateRows(
              payload.data ||
                []
            )
          );

          setPagination(
            payload.pagination ||
              {
                page,
                pageSize,
                total: 0,
                totalPages: 1,
              }
          );
        } catch (err) {
          console.error(
            err
          );

          setAssignments(
            []
          );

          setError(
            err.message ||
              "เกิดข้อผิดพลาดในการโหลดข้อมูล"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        filters,
        pagination.page,
        pagination.pageSize,
        buildAssignmentParams,
        decorateRows,
      ]
    );

  /* =======================================================
     Load Summary
  ======================================================= */

  const loadSummary =
    useCallback(
      async (
        nextFilters =
          filters
      ) => {
        try {
          setSummaryLoading(
            true
          );

          const requestTotal =
            async (
              overrides =
                {}
            ) => {
              const params =
                buildAssignmentParams({
                  nextFilters,
                  page: 1,
                  pageSize: 1,
                  overrides,
                });

              const response =
                await fetch(
                  `/api/admin/employee-position-assignments?${params.toString()}`,
                  {
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
                    "ไม่สามารถโหลดสรุป Assignment ได้"
                );
              }

              return Number(
                payload
                  .pagination
                  ?.total ||
                  0
              );
            };

          const [
            total,
            primary,
            acting,
            active,
          ] =
            await Promise.all(
              [
                requestTotal(),

                requestTotal({
                  is_primary:
                    "true",
                }),

                requestTotal({
                  assignment_type:
                    "acting",
                }),

                requestTotal({
                  status:
                    "active",
                }),
              ]
            );

          setSummary({
            total,
            primary,
            acting,
            active,
          });
        } catch (err) {
          console.error(
            err
          );
        } finally {
          setSummaryLoading(
            false
          );
        }
      },
      [
        filters,
        buildAssignmentParams,
      ]
    );

  /* =======================================================
     Employee Search
  ======================================================= */

  const loadEmployeeOptions =
    useCallback(
      async ({
        search = "",
        slot = null,
        isPrimary = false,
        usePageFilters = false,
      } = {}) => {
        try {
          setEmployeeLoading(
            true
          );

          const params =
            new URLSearchParams({
              mode:
                "employees",
              limit: "50",
            });

          if (
            search
          ) {
            params.set(
              "search",
              search
            );
          }

          const source =
            slot ||
            (
              usePageFilters
                ? filters
                : {}
            );

          [
            "company_id",
            "branch_group_id",
            "branch_id",
            "department_id",
            "division_id",
            "unit_id",
          ].forEach(
            (key) => {
              if (
                source?.[
                  key
                ]
              ) {
                params.set(
                  key,
                  String(
                    source[
                      key
                    ]
                  )
                );
              }
            }
          );

          /*
           * Primary:
           * Employee ต้อง Position ตรงกับ Position Slot
           */

          if (
            slot &&
            isPrimary &&
            slot.position_id
          ) {
            params.set(
              "position_id",
              String(
                slot.position_id
              )
            );
          }

          const response =
            await fetch(
              `/api/admin/org-structure/options?${params.toString()}`,
              {
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
                "ไม่สามารถค้นหาพนักงานได้"
            );
          }

          const rows =
            payload.data
              ?.employees ||
            [];

          /*
           * ใช้สำหรับ Filter บนหน้า
           */

          if (
            usePageFilters
          ) {
            setEmployeeOptions(
              rows.map(
                (
                  employee
                ) => ({
                  value:
                    employee.id,

                  label:
                    `${
                      employee.employee_code ||
                      ""
                    } - ${getEmployeeName(
                      employee
                    )}`,
                })
              )
            );
          }

          return rows;
        } catch (err) {
          console.error(
            err
          );

          if (
            usePageFilters
          ) {
            setEmployeeOptions(
              []
            );
          }

          return [];
        } finally {
          setEmployeeLoading(
            false
          );
        }
      },
      [
        filters,
      ]
    );

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    if (
      loadingUser ||
      !canView
    ) {
      return;
    }

    loadOptions();
  }, [
    loadingUser,
    canView,
    loadOptions,
  ]);

  /* =======================================================
     Reload When Filters Change
  ======================================================= */

  useEffect(() => {
    if (
      loadingUser ||
      !canView
    ) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          loadSlots(
            filters
          );

          loadAssignments({
            nextFilters:
              filters,
            page: 1,
          });

          loadSummary(
            filters
          );
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    filters,
    loadingUser,
    canView,
  ]);

  /* =======================================================
     Update Organization Path After Options Load
  ======================================================= */

  useEffect(() => {
    if (
      !assignments.length
    ) {
      return;
    }

    setAssignments(
      (
        current
      ) =>
        decorateRows(
          current
        )
    );
  }, [
    decorateRows,
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
          prev
        ) => {
          const next = {
            ...prev,
            [field]:
              value,
          };

          /*
           * Company -> Branch Group -> Branch
           * -> Department -> Division -> Unit
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

            next.position_slot_id =
              "";

            next.employee_id =
              "";
          } else if (
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

            next.position_slot_id =
              "";

            next.employee_id =
              "";
          } else if (
            field ===
            "branch_id"
          ) {
            next.department_id =
              "";

            next.division_id =
              "";

            next.unit_id =
              "";

            next.position_slot_id =
              "";

            next.employee_id =
              "";
          } else if (
            field ===
            "department_id"
          ) {
            next.division_id =
              "";

            next.unit_id =
              "";

            next.position_slot_id =
              "";

            next.employee_id =
              "";
          } else if (
            field ===
            "division_id"
          ) {
            next.unit_id =
              "";

            next.position_slot_id =
              "";

            next.employee_id =
              "";
          } else if (
            field ===
            "unit_id"
          ) {
            next.position_slot_id =
              "";

            next.employee_id =
              "";
          }

          return next;
        }
      );

      setPagination(
        (
          prev
        ) => ({
          ...prev,
          page: 1,
        })
      );
    };

  /* =======================================================
     Employee Search From Page Filter
  ======================================================= */

  const handleEmployeeSearch =
    (
      search
    ) => {
      loadEmployeeOptions({
        search,
        usePageFilters:
          true,
      });
    };

  /* =======================================================
     Reset
  ======================================================= */

  const handleReset =
    () => {
      setFilters(
        INITIAL_FILTERS
      );

      setEmployeeOptions(
        []
      );

      setPagination(
        (
          prev
        ) => ({
          ...prev,
          page: 1,
        })
      );
    };

  /* =======================================================
     Refresh
  ======================================================= */

  const handleRefresh =
    () => {
      loadSlots(
        filters
      );

      loadAssignments({
        nextFilters:
          filters,
      });

      loadSummary(
        filters
      );
    };

  /* =======================================================
     Open Create
  ======================================================= */

  const openCreate =
    () => {
      if (
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่ม Employee Position Assignment"
        );

        return;
      }

      setEditingAssignment(
        null
      );

      setModalOpen(
        true
      );
    };

  /* =======================================================
     Open Edit
  ======================================================= */

  const openEdit =
    (
      row
    ) => {
      if (
        !canEdit
      ) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไข Employee Position Assignment"
        );

        return;
      }

      setEditingAssignment(
        row
      );

      setModalOpen(
        true
      );

      setDrawerOpen(
        false
      );
    };

  /* =======================================================
     Open View
  ======================================================= */

  const openView =
    (
      row
    ) => {
      setSelectedAssignment(
        row
      );

      setDrawerOpen(
        true
      );
    };

  /* =======================================================
     Save
  ======================================================= */

  const handleSave =
    async (
      values
    ) => {
      const isEdit =
        Boolean(
          editingAssignment?.id
        );

      if (
        isEdit &&
        !canEdit
      ) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไข Employee Position Assignment"
        );

        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่ม Employee Position Assignment"
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const url =
          isEdit
            ? `/api/admin/employee-position-assignments/${editingAssignment.id}`
            : "/api/admin/employee-position-assignments";

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
              "ไม่สามารถบันทึก Assignment ได้"
          );
        }

        swalSuccess(
          isEdit
            ? "แก้ไข Employee Position Assignment เรียบร้อยแล้ว"
            : "เพิ่ม Employee Position Assignment เรียบร้อยแล้ว"
        );

        setModalOpen(
          false
        );

        setEditingAssignment(
          null
        );

        await Promise.all(
          [
            loadAssignments({
              nextFilters:
                filters,
            }),

            loadSummary(
              filters
            ),
          ]
        );
      } catch (err) {
        console.error(
          err
        );

        swalError(
          err.message ||
            "เกิดข้อผิดพลาดในการบันทึก"
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
      row
    ) => {
      if (
        !canDelete
      ) {
        swalError(
          "คุณไม่มีสิทธิ์ลบ Employee Position Assignment"
        );

        return;
      }

      const employeeName =
        getEmployeeName(
          row.employees ||
            {}
        );

      const slotCode =
        row
          .org_position_slots
          ?.slot_code ||
        "-";

      const confirmed =
        await swalConfirm(
          `ต้องการลบ Assignment ของ "${employeeName}" จาก Slot "${slotCode}" ใช่หรือไม่?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setDeletingId(
          row.id
        );

        const response =
          await fetch(
            `/api/admin/employee-position-assignments/${row.id}`,
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
              "ไม่สามารถลบ Assignment ได้"
          );
        }

        swalSuccess(
          "ลบ Employee Position Assignment เรียบร้อยแล้ว"
        );

        setDrawerOpen(
          false
        );

        await Promise.all(
          [
            loadAssignments({
              nextFilters:
                filters,
            }),

            loadSummary(
              filters
            ),
          ]
        );
      } catch (err) {
        console.error(
          err
        );

        swalError(
          err.message ||
            "เกิดข้อผิดพลาดในการลบ Assignment"
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

  const handlePageChange =
    (
      page,
      pageSize
    ) => {
      setPagination(
        (
          prev
        ) => ({
          ...prev,
          page,
          pageSize,
        })
      );

      loadAssignments({
        nextFilters:
          filters,
        page,
        pageSize,
      });
    };

  /* =======================================================
     Loading User
  ======================================================= */

  if (
    loadingUser
  ) {
    return (
      <LoadingOrb />
    );
  }

  /* =======================================================
     Permission Denied
  ======================================================= */

  if (
    !canView
  ) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          showIcon
          title="ไม่มีสิทธิ์เข้าถึง"
          description="ต้องมี permission ems.org_structure.view และ Scope ของโครงสร้างองค์กร"
        />
      </div>
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-4">

        {/* =================================================
            Header
        ================================================= */}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <Space align="center">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <UserSwitchOutlined className="text-xl" />
              </div>

              <div>
                <Title
                  level={3}
                  className="!mb-0"
                >
                  Employee Position Assignments
                </Title>

                <Text type="secondary">
                  จัดการผู้ครอง Position Slot, Primary, Acting,
                  Secondary และประวัติช่วงเวลาการครองตำแหน่ง
                </Text>
              </div>

            </Space>
          </div>

          {canCreate && (
            <Button
              type="primary"
              icon={
                <PlusOutlined />
              }
              onClick={
                openCreate
              }
            >
              เพิ่ม Assignment
            </Button>
          )}

        </div>

        {/* =================================================
            Summary
        ================================================= */}

        <EmployeePositionAssignmentSummaryCards
          summary={
            summary
          }
          loading={
            summaryLoading
          }
        />

        {/* =================================================
            Search
        ================================================= */}

        <EmployeePositionAssignmentSearch
          filters={
            filters
          }
          options={
            options
          }
          slots={
            slots
          }
          loading={
            loading ||
            loadingOptions
          }
          employeeLoading={
            employeeLoading
          }
          employeeOptions={
            employeeOptions
          }
          onEmployeeSearch={
            handleEmployeeSearch
          }
          onChange={
            handleFilterChange
          }
          onReset={
            handleReset
          }
          onRefresh={
            handleRefresh
          }
        />

        {/* =================================================
            Error
        ================================================= */}

        {error && (
          <Alert
            type="error"
            showIcon
            title="โหลดข้อมูลไม่สำเร็จ"
            description={
              error
            }
          />
        )}

        {/* =================================================
            Table
        ================================================= */}

        <Card
          className="shadow-sm"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          {!loading &&
          assignments.length ===
            0 ? (
            <div className="p-12">
              <Empty description="ยังไม่มี Employee Position Assignment ตามเงื่อนไขที่เลือก" />
            </div>
          ) : (
            <EmployeePositionAssignmentTable
              data={
                assignments
              }
              loading={
                loading
              }
              pagination={
                pagination
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
              onView={
                openView
              }
              onEdit={
                openEdit
              }
              onDelete={
                handleDelete
              }
              onPageChange={
                handlePageChange
              }
            />
          )}
        </Card>

      </div>

      {/* ===================================================
          Modal
      =================================================== */}

      <EmployeePositionAssignmentModal
        open={
          modalOpen
        }
        assignment={
          editingAssignment
        }
        slots={
          slots
        }
        saving={
          saving
        }
        loadEmployees={({
          slot,
          search,
          isPrimary,
        }) =>
          loadEmployeeOptions(
            {
              slot,
              search,
              isPrimary,
            }
          )
        }
        onCancel={() => {
          setModalOpen(
            false
          );

          setEditingAssignment(
            null
          );
        }}
        onSubmit={
          handleSave
        }
      />

      {/* ===================================================
          Drawer
      =================================================== */}

      <EmployeePositionAssignmentDrawer
        open={
          drawerOpen
        }
        assignment={
          selectedAssignment
        }
        canEdit={
          canEdit
        }
        onClose={() =>
          setDrawerOpen(
            false
          )
        }
        onEdit={
          openEdit
        }
      />

    </div>
  );
}

/* =========================================================
   Safe JSON
========================================================= */

async function safeJson(
  response
) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/* =========================================================
   Employee Name
========================================================= */

function getEmployeeName(
  employee = {}
) {
  return (
    [
      employee.first_name_th,
      employee.last_name_th,
    ]
      .filter(Boolean)
      .join(" ") ||

    [
      employee.first_name_en,
      employee.last_name_en,
    ]
      .filter(Boolean)
      .join(" ") ||

    "-"
  );
}