"use client";

import {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import { useRouter } from "next/navigation";
import {swalConfirm,swalError,swalSuccess,} from "../../../components/Swal";
import LoadingOrb from "../../../components/LoadingOrb";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import ManagementOrgChart from "../components/ManagementOrgChart";

import ManagementHeader from "./components/ManagementHeader";
import ManagementSummary from "./components/ManagementSummary";
import ManagementToolbar from "./components/ManagementToolbar";
import ManagementAssignmentTree from "./components/ManagementAssignmentTree";
import ManagementAssignmentTable from "./components/ManagementAssignmentTable";
import ManagementAssignmentModal from "./components/ManagementAssignmentModal";
import {
  INITIAL_MANAGEMENT_FORM,
  MANAGEMENT_LEVELS,
  VIEW_MODES,
  SUPERVISOR_LEVEL_BY_LEVEL,
  safeJson,
  getManagementRank,
  resolveEmployeeManagementLevel,
  getEmployeeName,
  getEmployeePositionName,
  mapManagementEmployee,
  sortManagementEmployees,
  buildEmployeeInitialScopes,
  normalizeScopes,
  createEmptyScope,
  validateManagementScopes,
  buildManagementAssignmentPayload,
} from "./utils/scopeUtils";

export default function ManagementAssignmentsPage() {
  const router = useRouter();
  const orgChartRef = useRef(null);
  const {user,loadingUser,} = useAuth();

  const canView = hasPermission(user,"ems.management_assignments.view");
  const canCreate = hasPermission(user,"ems.management_assignments.create");
  const canEdit = hasPermission(user,"ems.management_assignments.edit");
  const canDelete = hasPermission(user,"ems.management_assignments.delete");

  const [assignments,setAssignments] = useState([]);

  const [orgChartData,setOrgChartData,] = useState([]);
  const [employees,setEmployees,] = useState([]);
  const [scopeOptions,setScopeOptions,] = useState({companies: [],branchGroups: [],branches: [],departments: [],divisions: [],units: [],});
  const [search,setSearch,] = useState("");

  const [viewMode,setViewMode,] = useState(VIEW_MODES.ORG_CHART);
  const [loading,setLoading,] = useState(true);
  const [loadingEmployees,setLoadingEmployees,] = useState(false);
  const [loadingScopeOptions,setLoadingScopeOptions,] = useState(false);
  const [saving,setSaving,] = useState(false);
  const [deletingId,setDeletingId,] = useState("");
  const [error,setError,] = useState("");
  const [openModal,setOpenModal,] = useState(false);
  const [editingAssignment,setEditingAssignment,] = useState(null);
  const [form,setForm,] = useState(INITIAL_MANAGEMENT_FORM);

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [
    loadingUser,
    user,
    canView,
    router,
  ]);

  const loadAssignments = useCallback(
    async (keyword = "") => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set("tree", "true");

        if (keyword.trim()) {
          params.set(
            "search",
            keyword.trim()
          );
        }

        const response = await fetch(
          `/api/admin/management-assignments?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถโหลดสายบังคับบัญชาได้"
          );
        }

        const assignmentItems =
          Array.isArray(result?.data)
            ? result.data.map(
                (item) => ({
                  ...item,

                  management_assignment_scopes:
                    normalizeScopes(
                      item
                        .management_assignment_scopes ||
                        item.scopes
                    ),
                })
              )
            : [];

        setAssignments(
          assignmentItems
        );

        setOrgChartData(
          Array.isArray(result?.tree)
            ? result.tree
            : []
        );
      } catch (loadError) {
        console.error(
          "LOAD_MANAGEMENT_ASSIGNMENTS_ERROR:",
          loadError
        );

        setAssignments([]);
        setOrgChartData([]);

        setError(
          loadError?.message ||
            "เกิดข้อผิดพลาดในการโหลดสายบังคับบัญชา"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadEmployees = useCallback(
    async () => {
      try {
        setLoadingEmployees(true);

        const response = await fetch(
          "/api/admin/employees?all=true",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถโหลดข้อมูลพนักงานได้"
          );
        }

        const employeeItems =
          Array.isArray(result?.data)
            ? result.data
            : [];

        const managementEmployees =
          employeeItems
            .map((employee) => {
              const mappedEmployee =
                mapManagementEmployee(
                  employee
                );

              return mappedEmployee;
            })
            .filter((employee) =>
              MANAGEMENT_LEVELS.includes(
                employee
                  .resolved_management_level
              )
            );

        setEmployees(
          [...managementEmployees].sort(
            sortManagementEmployees
          )
        );
      } catch (loadError) {
        console.error(
          "LOAD_MANAGEMENT_EMPLOYEES_ERROR:",
          loadError
        );

        setEmployees([]);

        swalError(
          loadError?.message ||
            "ไม่สามารถโหลดข้อมูลผู้บริหารได้"
        );
      } finally {
        setLoadingEmployees(false);
      }
    },
    []
  );

  const loadScopeOptions = useCallback(async () => {
    try {
      setLoadingScopeOptions(true);
      const endpoints = [
        [
          "companies",
          "/api/admin/companies?all=true",
        ],
        [
          "branchGroups",
          "/api/admin/branch-groups?all=true",
        ],
        [
          "branches",
          "/api/admin/branches?all=true",
        ],
        [
          "departments",
          "/api/admin/departments?all=true",
        ],
        [
          "divisions",
          "/api/admin/divisions?all=true",
        ],
        [
          "units",
          "/api/admin/units?all=true",
        ],
      ];

      const responses = await Promise.all(
          endpoints.map(
            async ([key, url]) => {
              try {
                const response =
                  await fetch(url, {
                    method: "GET",
                    cache: "no-store",
                  });

                const result =
                  await safeJson(
                    response
                  );

                if (!response.ok) {
                  console.warn(
                    `LOAD_SCOPE_OPTION_${key.toUpperCase()}_ERROR:`,
                    result?.error
                  );

                  return [
                    key,
                    [],
                  ];
                }

                return [
                  key,
                  Array.isArray(
                    result?.data
                  )
                    ? result.data
                    : [],
                ];
              } catch (
                optionError
              ) {
                console.error(
                  `LOAD_SCOPE_OPTION_${key.toUpperCase()}_ERROR:`,
                  optionError
                );

                return [
                  key,
                  [],
                ];
              }
            }
          )
        );

      const nextOptions = responses.reduce(
          (
            result,
            [key, items]
          ) => {
            result[key] = items;
            return result;
          },
          {
            companies: [],
            branchGroups: [],
            branches: [],
            departments: [],
            divisions: [],
            units: [],
          }
        );

      setScopeOptions(
        nextOptions
      );
    } finally {
      setLoadingScopeOptions(false);
    }
  }, []);

  /* =========================================================
      Initial Load
  ========================================================= */

  useEffect(() => {
    if (loadingUser || !user || !canView) {
      return;
    }
    loadEmployees();
    loadScopeOptions();
    loadAssignments();
  }, [loadingUser,user,canView,loadEmployees,loadScopeOptions,loadAssignments,]);

  /* =========================================================
      Search Debounce
  ========================================================= */

  useEffect(() => {
    if (loadingUser || !user || !canView) {
      return;
    }

    const timer = window.setTimeout(() => {
        const keyword =
          viewMode ===  VIEW_MODES.ORG_CHART ? "": search;
        loadAssignments(keyword);
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search,viewMode,loadingUser,user,canView,loadAssignments,]);

  const assignedEmployeeIds =
    useMemo(() => {
      return new Set(
        assignments
          .filter(
            (item) =>
              String(item.id) !==
              String(
                editingAssignment?.id ||
                  ""
              )
          )
          .map((item) =>
            String(item.employee_id)
          )
      );
    }, [
      assignments,
      editingAssignment,
    ]);

  const availableEmployees =
    useMemo(() => {
      return employees.filter(
        (employee) => {
          if (
            editingAssignment &&
            String(employee.id) ===
              String(
                editingAssignment
                  .employee_id
              )
          ) {
            return true;
          }

          return !assignedEmployeeIds.has(
            String(employee.id)
          );
        }
      );
    }, [
      employees,
      assignedEmployeeIds,
      editingAssignment,
    ]);

  const selectedEmployee =
    useMemo(() => {
      if (!form.employee_id) {
        return null;
      }

      return (
        employees.find(
          (employee) =>
            String(employee.id) ===
            String(form.employee_id)
        ) || null
      );
    }, [
      employees,
      form.employee_id,
    ]);

  const levelGroups =
    useMemo(() => {
      return MANAGEMENT_LEVELS.reduce(
        (result, level) => {
          result[level] =
            assignments.filter(
              (item) =>
                String(
                  item.management_level ||
                    ""
                )
                  .trim()
                  .toUpperCase() ===
                level
            );

          return result;
        },
        {}
      );
    }, [assignments]);

  /* =========================================================
      Employee Select Options
  ========================================================= */

  const employeeOptions =
    useMemo(() => {
      return availableEmployees.map(
        (employee) => ({
          value: employee.id,

          label: `${
            employee.employee_code ||
            "-"
          } - ${
            employee
              .resolved_employee_name ||
            "-"
          } (${
            employee
              .resolved_management_level ||
            "-"
          })`,

          searchText: [
            employee.employee_code,
            employee
              .resolved_employee_name,
            employee
              .resolved_position_name,
            employee
              .resolved_management_level,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        })
      );
    }, [availableEmployees]);

  /* =========================================================
      Required Supervisor Level
  ========================================================= */

  const requiredSupervisorLevel =
    useMemo(() => {
      if (!form.management_level) {
        return "";
      }

      return (
        SUPERVISOR_LEVEL_BY_LEVEL[
          form.management_level
        ] || ""
      );
    }, [form.management_level]);

  /* =========================================================
      Supervisor Assignments
  ========================================================= */

  const supervisorAssignments =
    useMemo(() => {
      if (
        !requiredSupervisorLevel
      ) {
        return [];
      }

      return assignments
        .filter((assignment) => {
          const assignmentLevel =
            String(
              assignment.management_level ||
                ""
            )
              .trim()
              .toUpperCase();

          const isCorrectLevel =
            assignmentLevel ===
            requiredSupervisorLevel;

          const isActive =
            assignment.status ===
            "active";

          const isNotCurrentEmployee =
            String(
              assignment.employee_id
            ) !==
            String(
              form.employee_id || ""
            );

          return (
            isCorrectLevel &&
            isActive &&
            isNotCurrentEmployee
          );
        })
        .sort(
          (
            firstAssignment,
            secondAssignment
          ) => {
            const firstSortOrder =
              Number(
                firstAssignment.sort_order
              ) || 0;

            const secondSortOrder =
              Number(
                secondAssignment.sort_order
              ) || 0;

            if (
              firstSortOrder !==
              secondSortOrder
            ) {
              return (
                firstSortOrder -
                secondSortOrder
              );
            }

            return String(
              firstAssignment.employee_name ||
                ""
            ).localeCompare(
              String(
                secondAssignment.employee_name ||
                  ""
              ),
              "th"
            );
          }
        );
    }, [
      assignments,
      requiredSupervisorLevel,
      form.employee_id,
    ]);

  /* =========================================================
      Supervisor Select Options
  ========================================================= */

  const supervisorOptions =
    useMemo(() => {
      return supervisorAssignments.map(
        (assignment) => ({
          value:
            assignment.employee_id,

          label: `${
            assignment.employee_code ||
            "-"
          } - ${
            assignment.employee_name ||
            "-"
          } (${
            assignment.management_level ||
            "-"
          })`,

          assignmentId:
            assignment.id,

          managementLevel:
            assignment.management_level,
        })
      );
    }, [supervisorAssignments]);

  /* =========================================================
      Supervisor Lookup Map
  ========================================================= */

  const supervisorsByEmployeeId =
    useMemo(() => {
      return assignments.reduce(
        (result, assignment) => {
          const employeeId =
            assignment.employee_id ||
            assignment.employees?.id;

          if (!employeeId) {
            return result;
          }

          result[String(employeeId)] = {
            id: employeeId,

            employee_name:
              assignment.employee_name ||
              [
                assignment.employees
                  ?.first_name_th,
                assignment.employees
                  ?.last_name_th,
              ]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              "-",

            employee_code:
              assignment.employee_code ||
              assignment.employees
                ?.employee_code ||
              "-",

            management_level:
              assignment.management_level ||
              "",
          };

          return result;
        },
        {}
      );
    }, [assignments]);

  /* =========================================================
      Reset Form
  ========================================================= */

  const resetForm =
    useCallback(() => {
      setForm({
        ...INITIAL_MANAGEMENT_FORM,

        scopes: [],
      });

      setEditingAssignment(null);
    }, []);

  /* =========================================================
      Open Create Modal
  ========================================================= */

  const handleOpenCreate =
    useCallback(() => {
      if (!canCreate) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มสายบังคับบัญชา"
        );

        return;
      }

      resetForm();
      setOpenModal(true);
    }, [
      canCreate,
      resetForm,
    ]);

  /* =========================================================
      Open Edit Modal
  ========================================================= */

  const handleOpenEdit =
    useCallback(
      (assignment) => {
        if (!canEdit) {
          swalError(
            "คุณไม่มีสิทธิ์แก้ไขสายบังคับบัญชา"
          );

          return;
        }

        if (!assignment) {
          swalError(
            "ไม่พบข้อมูลสายบังคับบัญชา"
          );

          return;
        }

        const normalizedScopes =
          normalizeScopes(
            assignment
              .management_assignment_scopes ||
              assignment.scopes
          );

        setEditingAssignment(
          assignment
        );

        setForm({
          employee_id:
            assignment.employee_id ||
            assignment.employees?.id ||
            "",

          management_level:
            String(
              assignment.management_level ||
                ""
            )
              .trim()
              .toUpperCase(),

          scopes:
            normalizedScopes.length > 0
              ? normalizedScopes
              : [
                  createEmptyScope({
                    isPrimary: true,
                    sort_order: 0,
                  }),
                ],

          supervisor_employee_id:
            assignment
              .supervisor_employee_id ||
            assignment.supervisor_id ||
            "",

          is_primary:
            assignment.is_primary ??
            true,

          status:
            assignment.status ||
            "active",

          sort_order:
            Number(
              assignment.sort_order
            ) || 0,
        });

        setOpenModal(true);
      },
      [canEdit]
    );

  /* =========================================================
      Close Modal
  ========================================================= */

  const handleCloseModal =
    useCallback(() => {
      if (saving) {
        return;
      }

      setOpenModal(false);
      resetForm();
    }, [
      saving,
      resetForm,
    ]);

  /* =========================================================
      Employee Change
  ========================================================= */

  const handleEmployeeChange =
    useCallback(
      (employeeId) => {
        if (!employeeId) {
          setForm({
            ...INITIAL_MANAGEMENT_FORM,

            scopes: [],
          });

          return;
        }

        const employee =
          employees.find(
            (item) =>
              String(item.id) ===
              String(employeeId)
          );

        if (!employee) {
          swalError(
            "ไม่พบข้อมูลพนักงานที่เลือก"
          );

          return;
        }

        const managementLevel =
          employee
            .resolved_management_level ||
          resolveEmployeeManagementLevel(
            employee
          );

        if (
          !MANAGEMENT_LEVELS.includes(
            managementLevel
          )
        ) {
          swalError(
            "พนักงานคนนี้ไม่ได้อยู่ในระดับ P9 ถึง P12"
          );

          return;
        }

        const initialScopes =
          buildEmployeeInitialScopes(
            employee,
            managementLevel
          );

        setForm((previous) => ({
          ...previous,

          employee_id:
            employee.id,

          management_level:
            managementLevel,

          scopes:
            Array.isArray(
              initialScopes
            ) &&
            initialScopes.length > 0
              ? initialScopes
              : [
                  createEmptyScope({
                    isPrimary: true,
                    sort_order: 0,
                  }),
                ],

          supervisor_employee_id:
            "",

          is_primary:
            previous.is_primary ??
            true,

          status:
            previous.status ||
            "active",

          sort_order:
            Number(
              previous.sort_order
            ) || 0,
        }));
      },
      [employees]
    );

  /* =========================================================
      Keep Supervisor Valid
  ========================================================= */

  useEffect(() => {
    if (!form.supervisor_employee_id ) {
      return;
    }

    if (form.management_level === "P12") {
      setForm((previous) => ({
        ...previous,
        supervisor_employee_id:
          "",
      }));

      return;
    }

    const supervisorStillValid =
      supervisorAssignments.some(
        (assignment) =>
          String(
            assignment.employee_id
          ) ===
          String(
            form
              .supervisor_employee_id
          )
      );

    if (!supervisorStillValid) {
      setForm((previous) => ({
        ...previous,

        supervisor_employee_id:
          "",
      }));
    }
  }, [
    form.management_level,
    form.supervisor_employee_id,
    supervisorAssignments,
  ]);

  /* =========================================================
      Supervisor Change
  ========================================================= */

  const handleSupervisorChange =
    useCallback((employeeId) => {
      setForm((previous) => ({
        ...previous,

        supervisor_employee_id:
          employeeId || "",
      }));
    }, []);

  /* =========================================================
      Assignment Settings Change
  ========================================================= */

  const handleStatusChange =
    useCallback((status) => {
      setForm((previous) => ({
        ...previous,

        status:
          status || "active",
      }));
    }, []);

  const handleSortOrderChange =
    useCallback((sortOrder) => {
      setForm((previous) => ({
        ...previous,

        sort_order:
          sortOrder === ""
            ? ""
            : Number(sortOrder),
      }));
    }, []);

  const handlePrimaryChange =
    useCallback((checked) => {
      setForm((previous) => ({
        ...previous,

        is_primary:
          Boolean(checked),
      }));
    }, []);

  /* =========================================================
      Add Scope
  ========================================================= */

  const handleAddScope = useCallback(() => {
      setForm((previous) => {
        const currentScopes =
          Array.isArray(
            previous.scopes
          )
            ? previous.scopes
            : [];

        const hasPrimaryScope =
          currentScopes.some(
            (scope) =>
              Boolean(
                scope.is_primary
              )
          );

        const newScope =
          createEmptyScope({
            is_primary:
              !hasPrimaryScope,

            sort_order:
              currentScopes.length,
          });

        return {
          ...previous,

          scopes: [
            ...currentScopes,
            newScope,
          ],
        };
      });
    }, []);

  /* =========================================================
      Remove Scope
  ========================================================= */

  const handleRemoveScope = useCallback((scopeIndex) => {
    setForm((previous) => {
      const currentScopes =
        Array.isArray(
          previous.scopes
        )
          ? previous.scopes
          : [];

      if (
        currentScopes.length <= 1
      ) {
        swalError(
          "ต้องมีขอบเขตการดูแลอย่างน้อย 1 รายการ"
        );

        return previous;
      }

      const removedScope =
        currentScopes[
          scopeIndex
        ];

      const nextScopes =
        currentScopes
          .filter(
            (_, index) =>
              index !==
              scopeIndex
          )
          .map(
            (scope, index) => ({
              ...scope,

              sort_order:
                index,
            })
          );

      if (
        removedScope?.is_primary &&
        nextScopes.length > 0
      ) {
        nextScopes[0] = {
          ...nextScopes[0],

          is_primary: true,
        };
      }

      return {
        ...previous,

        scopes: nextScopes,
      };
    });
  }, []);

  /* =========================================================
      Update Scope
  ========================================================= */

  const handleScopeChange = useCallback((scopeIndex,fieldName,value) => {
      setForm((previous) => {
        const currentScopes =
          Array.isArray(
            previous.scopes
          )
            ? previous.scopes
            : [];

        const nextScopes =
          currentScopes.map(
            (scope, index) => {
              if (index !== scopeIndex) {
                return scope;
              }
              return {
                ...scope,

                [fieldName]:
                  value,
              };
            }
          );

        return {
          ...previous,

          scopes:
            nextScopes,
        };
      });
    },
    []
  );

  /* =========================================================
      Change Scope Type
  ========================================================= */

  const handleScopeTypeChange = useCallback((scopeIndex,scopeType) => {
        setForm((previous) => {
          const currentScopes =
            Array.isArray(
              previous.scopes
            )
              ? previous.scopes
              : [];

          const nextScopes = currentScopes.map((scope, index) => {
                if (index !== scopeIndex) {
                  return scope;
                }
                return {
                  ...createEmptyScope({
                    scope_type: scopeType,
                    is_primary:Boolean(scope.is_primary),
                    sort_order:Number(scope.sort_order) || scopeIndex,
                  }),
                  scope_type: scopeType,
                };
              }
            );
          return {
            ...previous,
            scopes: nextScopes,
          };
        });
      },
      []
    );

  /* =========================================================
      Change Scope Target
  ========================================================= */

  const handleScopeTargetChange = useCallback((scopeIndex,fieldName,value) => {
        setForm((previous) => {
          const currentScopes =
            Array.isArray(previous.scopes) ? previous.scopes : [];
          const nextScopes =
            currentScopes.map(
              (scope, index) => {
                if (
                  index !==
                  scopeIndex
                ) {
                  return scope;
                }
                return {
                  ...scope,

                  [fieldName]:
                    value || "",
                };
              }
            );

          return {
            ...previous,

            scopes:
              nextScopes,
          };
        });
      },
      []
    );

  /* =========================================================
      Set Primary Scope
  ========================================================= */

  const handleSetPrimaryScope = useCallback((scopeIndex) => {
      setForm((previous) => {
        const currentScopes =
          Array.isArray(
            previous.scopes
          )
            ? previous.scopes
            : [];

        const nextScopes =
          currentScopes.map(
            (scope, index) => ({
              ...scope,

              is_primary:
                index ===
                scopeIndex,
            })
          );

        return {
          ...previous,

          scopes:
            nextScopes,
        };
      });
    }, []);

  /* =========================================================
      Scope Sort Order
  ========================================================= */

  const handleScopeSortOrderChange = useCallback((scopeIndex,sortOrder) => {
        setForm((previous) => {
          const currentScopes =
            Array.isArray(
              previous.scopes
            )
              ? previous.scopes
              : [];

          const nextScopes =
            currentScopes.map(
              (scope, index) => {
                if (
                  index !==
                  scopeIndex
                ) {
                  return scope;
                }

                return {
                  ...scope,
                  sort_order: sortOrder === "" ? "" : Number(sortOrder),
                };
              }
            );
          return {
            ...previous,
            scopes:
              nextScopes,
          };
        });
      },
      []
    );
  /* =========================================================
      Validate Form
  ========================================================= */

  const validateForm = useCallback(() => {
    if (!form.employee_id) {
      swalError("กรุณาเลือกผู้บริหาร");
      return false;
    }

    if (!form.management_level) {
      swalError("กรุณาเลือกระดับผู้บริหาร");
      return false;
    }

    const scopeError = validateManagementScopes(
      form.scopes
    );

    if (scopeError) {
      swalError(scopeError);
      return false;
    }

    if (
      form.management_level !== "P12" &&
      !form.supervisor_employee_id
    ) {
      swalError("กรุณาเลือกผู้บังคับบัญชา");
      return false;
    }

    return true;
  }, [form]);

  /* =========================================================
      Save
  ========================================================= */

  const handleSave = useCallback(async () => {
    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload =
        buildManagementAssignmentPayload(form);

      const isEdit =
        Boolean(editingAssignment?.id);

      const response = await fetch(
        isEdit
          ? `/api/admin/management-assignments/${editingAssignment.id}`
          : "/api/admin/management-assignments",
        {
          method: isEdit ? "PATCH" : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const result =
        await safeJson(response);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      swalSuccess(
        isEdit
          ? "แก้ไขสายบังคับบัญชาเรียบร้อย"
          : "เพิ่มสายบังคับบัญชาเรียบร้อย"
      );

      setOpenModal(false);

      setEditingAssignment(null);

      setForm(
        INITIAL_MANAGEMENT_FORM
      );

      await loadAssignments(viewMode ===  VIEW_MODES.ORG_CHART ? "" : search);

    } catch (error) {
      console.error(
        "SAVE_MANAGEMENT_ASSIGNMENT_ERROR",
        error
      );

      swalError(
        error?.message ||
          "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setSaving(false);
    }
  }, [form,saving,editingAssignment,validateForm,loadAssignments,search,viewMode,]);
    /* =========================================================
      Delete
  ========================================================= */

  const handleDelete = useCallback(
    async (assignment) => {
      if (!canDelete) {
        swalError(
          "คุณไม่มีสิทธิ์ลบสายบังคับบัญชา"
        );
        return;
      }

      if (!assignment?.id) {
        swalError("ไม่พบข้อมูล");
        return;
      }

      const confirmed =
        await swalConfirm({
          title: "ลบสายบังคับบัญชา ?",
          text:
            "เมื่อลบแล้วจะไม่สามารถกู้คืนได้",
          confirmButtonText: "ลบ",
        });

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(assignment.id);

        const response = await fetch(
          `/api/admin/management-assignments/${assignment.id}`,
          {
            method: "DELETE",
          }
        );

        const result =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถลบข้อมูลได้"
          );
        }

        swalSuccess(
          "ลบสายบังคับบัญชาเรียบร้อย"
        );

        await loadAssignments(viewMode === VIEW_MODES.ORG_CHART? "": search);


      } catch (error) {
        console.error(
          "DELETE_MANAGEMENT_ASSIGNMENT_ERROR",
          error
        );

        swalError(
          error?.message ||
            "เกิดข้อผิดพลาดในการลบข้อมูล"
        );
      } finally {
        setDeletingId("");
      }
    },[canDelete,loadAssignments,search,viewMode,]
  );

  /* =========================================================
      Refresh
  ========================================================= */

  const handleRefresh = useCallback(async () => {
    const keyword =
      viewMode ===
      VIEW_MODES.ORG_CHART
        ? ""
        : search;

    await Promise.all([
      loadAssignments(keyword),
      loadEmployees(),
      loadScopeOptions(),
    ]);
  }, [search,viewMode,loadAssignments,loadEmployees,loadScopeOptions,]);

  /* =========================================================
      Export Org Chart
  ========================================================= */

  const handleExportOrgChart = useCallback(() => {
    if (orgChartRef.current?.exportPNG) {
      orgChartRef.current.exportPNG();
    }
  }, []);

  const summary = {
    total: assignments.length,
    active: assignments.filter(
        (item) =>
          item.status === "active"
      ).length,

    inactive:
      assignments.filter(
        (item) =>
          item.status !== "active"
      ).length,

    p12:
      levelGroups.P12?.length || 0,

    p11:
      levelGroups.P11?.length || 0,

    p10:
      levelGroups.P10?.length || 0,

    p9:
      levelGroups.P9?.length || 0,
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user ) return null;
  if (!canView) return null;

  return (
    <>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* =================================================
              Header
          ================================================= */}
          <ManagementHeader
            canCreate={canCreate}
            onCreate={
              handleOpenCreate
            }
          />

          {/* =================================================
              Summary
          ================================================= */}

          <ManagementSummary
            levelGroups={
              levelGroups
            }
          />

          {/* =================================================
              Toolbar
          ================================================= */}

          <ManagementToolbar
            search={search}
            onSearch={setSearch}
            viewMode={viewMode}
            onChangeView={
              setViewMode
            }
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {/* =================================================
              Org Chart Controls
          ================================================= */}

          {viewMode ===
            VIEW_MODES.ORG_CHART && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="text-base font-black text-slate-800">
                    เครื่องมือ Org Chart
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    ซูม ปรับขนาด
                    และแสดงโครงสร้างทั้งหมด
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      orgChartRef.current?.zoomIn?.()
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    Zoom +
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      orgChartRef.current?.zoomOut?.()
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    Zoom -
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      orgChartRef.current?.fit?.()
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    Fit Screen
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      orgChartRef.current?.expandAll?.()
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    Expand All
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      orgChartRef.current?.collapseAll?.()
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    Collapse All
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleExportOrgChart
                    }
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Export PNG
                  </button>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      loadingEmployees ||
                      loadingScopeOptions
                    }
                    onClick={
                      handleRefresh
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              Org Chart View
          ================================================= */}
          
          {viewMode ===
            VIEW_MODES.ORG_CHART && (
              
            <ManagementOrgChart
              ref={orgChartRef}
              data={orgChartData}
              loading={loading}
              onNodeClick={(node) => {
                if (!canEdit) {
                  return;
                }

                const assignment =
                  assignments.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        node?.assignment_id ||
                          node?.id ||
                          ""
                      )
                  );

                if (assignment) {
                  handleOpenEdit(
                    assignment
                  );
                }
              }}
            />
          )}

          {/* =================================================
              Tree View
          ================================================= */}

          {viewMode ===
            VIEW_MODES.TREE && (
            <ManagementAssignmentTree
              assignments={
                assignments
              }
              supervisors={
                supervisorsByEmployeeId
              }
              loading={loading}
              onEdit={
                canEdit
                  ? handleOpenEdit
                  : undefined
              }
              onDelete={
                canDelete
                  ? handleDelete
                  : undefined
              }
            />
          )}

          {/* =================================================
              Table View
          ================================================= */}

          {viewMode ===
            VIEW_MODES.TABLE && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <ManagementAssignmentTable
                assignments={
                  assignments
                }
                loading={loading}
                onEdit={
                  canEdit
                    ? handleOpenEdit
                    : undefined
                }
                onDelete={
                  canDelete
                    ? handleDelete
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </main>

      {/* =================================================
          Create / Edit Modal
      ================================================= */}

      <ManagementAssignmentModal
        open={openModal}
        mode={ editingAssignment ? "edit": "create"}
        loading={loadingEmployees || loadingScopeOptions}
        saving={saving}
        loadingEmployees={loadingEmployees}
        loadingScopeOptions={loadingScopeOptions}
        form={form}
        selectedEmployee={selectedEmployee}
        employees={availableEmployees}
        supervisorOptions={supervisorOptions}
        scopeOptions={scopeOptions}
        onClose={handleCloseModal}
        onSubmit={handleSave}
        onFormChange={(field,value) => {
          setForm(
            (previous) => ({
              ...previous,
              [field]: value,
            })
          );
        }}
        onEmployeeChange={
          handleEmployeeChange
        }
        onAddScope={
          handleAddScope
        }
        onRemoveScope={
          handleRemoveScope
        }
        onUpdateScope={(
          scopeIndex,
          field,
          value
        ) => {
          if (
            field ===
            "scope_type"
          ) {
            handleScopeTypeChange(
              scopeIndex,
              value
            );

            return;
          }

          if (field ==="sort_order") {
            handleScopeSortOrderChange(
              scopeIndex,
              value
            );
            return;
          }
          handleScopeTargetChange(scopeIndex,field,value);
        }}
        onSetPrimaryScope={
          handleSetPrimaryScope
        }
      />
    </>
  );
}
    