"use client";

import {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import {swalConfirm,swalError,swalSuccess,} from "../../../components/Swal";
import LoadingOrb from "../../../components/LoadingOrb";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import ManagementOrgChart from "../components/ManagementOrgChart";

const initialForm = {
  employee_id: "",
  management_level: "",
  scopes: [],
  supervisor_employee_id: "",
  is_primary: true,
  status: "active",
  sort_order: 0,
};


const SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

const SCOPE_FIELD_BY_TYPE = {
  all: null,
  company: "company_id",
  branch_group: "branch_group_id",
  branch: "branch_id",
  department: "department_id",
  division: "division_id",
  unit: "unit_id",
};

const SCOPE_LABELS = {
  all: "ทั้งองค์กร",
  company: "บริษัท",
  branch_group: "กลุ่มสาขา",
  branch: "สาขา",
  department: "แผนก",
  division: "ฝ่าย",
  unit: "หน่วยงาน",
};

const VIEW_MODES = {
  ORG_CHART: "orgchart",
  TREE: "tree",
  TABLE: "table",
};

const MANAGEMENT_LEVELS = [
  "P12",
  "P11",
  "P10",
  "P9",
];

const SCOPE_BY_LEVEL = {
  P12: "all",
  P11: "company",
  P10: "branch_group",
  P9: "department",
};

const SUPERVISOR_LEVEL_BY_LEVEL = {
  P12: null,
  P11: "P12",
  P10: "P11",
  P9: "P10",
};

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getManagementRank(level = "") {
  const normalizedLevel = String(level)
    .trim()
    .toUpperCase();

  const match = normalizedLevel.match(/^P(\d+)$/);

  if (!match) {
    return 0;
  }

  return Number(match[1]);
}

function resolveEmployeeManagementLevel(employee) {
  if (!employee) {
    return "";
  }
  const level = employee.management_level || employee.jobs?.management_level || employee.position_level || employee.positions?.position_level || "";

  return String(level)
    .trim()
    .toUpperCase();
}

function getEmployeeName(employee) {
  if (!employee) {
    return "-";
  }

  return (
    employee.full_name_th || `${employee.first_name_th || ""} ${
      employee.last_name_th || ""
    }`.trim() ||
    employee.full_name_en ||
    `${employee.first_name_en || ""} ${
      employee.last_name_en || ""
    }`.trim() ||
    "-"
  );
}

function getEmployeePositionName(employee) {
  if (!employee) {
    return "-";
  }

  return (
    employee.position_name ||
    employee.positions?.position_name ||
    employee.job_name ||
    employee.jobs?.job_name ||
    "-"
  );
}

export default function ManagementAssignmentsPage() {
  const router = useRouter();
  const orgChartRef = useRef(null);

  const {user,loadingUser,} = useAuth();
  const canView = hasPermission(user,"ems.management_assignments.view");
  const canCreate = hasPermission(user,"ems.management_assignments.create");
  const canEdit = hasPermission(user,"ems.management_assignments.edit");
  const canDelete = hasPermission(user,"ems.management_assignments.delete");

  const [assignments, setAssignments] =useState([]);
  const [orgChartData, setOrgChartData] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState(VIEW_MODES.ORG_CHART);
  const [loading, setLoading] =useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] =useState(false);
  const [editingAssignment,setEditingAssignment,] = useState(null);
  const [form, setForm] = useState(initialForm);

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

        const result = await safeJson(response);
        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถโหลดสายบังคับบัญชาได้"
          );
        }

        setAssignments(
          Array.isArray(result.data)
            ? result.data
            : []
        );

        setOrgChartData(
          Array.isArray(result.tree)
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
          loadError.message ||
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
          Array.isArray(result.data)
            ? result.data
            : [];

        const managementEmployeeItems =
          employeeItems
            .map((employee) => {
              const managementLevel =
                resolveEmployeeManagementLevel(
                  employee
                );

              return {
                ...employee,

                resolved_management_level:
                  managementLevel,

                resolved_management_rank:
                  getManagementRank(
                    managementLevel
                  ),

                resolved_employee_name:
                  getEmployeeName(employee),

                resolved_position_name:
                  getEmployeePositionName(
                    employee
                  ),
              };
            })
            .filter((employee) =>
              MANAGEMENT_LEVELS.includes(
                employee.resolved_management_level
              )
            )
            .sort((a, b) => {
              if (
                b.resolved_management_rank !==
                a.resolved_management_rank
              ) {
                return (
                  b.resolved_management_rank -
                  a.resolved_management_rank
                );
              }

              return String(
                a.employee_code || ""
              ).localeCompare(
                String(
                  b.employee_code || ""
                ),
                "th"
              );
            });

        setEmployees(
          managementEmployeeItems
        );
      } catch (loadError) {
        console.error(
          "LOAD_MANAGEMENT_EMPLOYEES_ERROR:",
          loadError
        );

        setEmployees([]);

        swalError(
          loadError.message ||
            "ไม่สามารถโหลดข้อมูลผู้บริหารได้"
        );
      } finally {
        setLoadingEmployees(false);
      }
    },
    []
  );

  useEffect(() => {
    if (loadingUser || !user || !canView ) {
      return;
    }

    loadEmployees();
    loadAssignments();
  }, [loadingUser,user,canView,loadEmployees,loadAssignments,]);

  useEffect(() => {
    if (loadingUser || !user || !canView) {
      return;
    }

    const timer = window.setTimeout(() => {
        loadAssignments(search);
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    search,
    loadingUser,
    user,
    canView,
    loadAssignments,
  ]);

  const assignedEmployeeIds =
    useMemo(() => {
      return new Set(
        assignments
          .filter(
            (item) =>
              item.id !==
              editingAssignment?.id
          )
          .map(
            (item) =>
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
                editingAssignment.employee_id
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

  const levelGroups = useMemo(() => {
      return MANAGEMENT_LEVELS.reduce(
        (result, level) => {
          result[level] =
            assignments.filter(
              (item) =>
                item.management_level ===
                level
            );

          return result;
        },
        {}
      );
    }, [assignments]);

  const buildEmployeeScope = useCallback((employee, managementLevel) => {
        const scopeType = SCOPE_BY_LEVEL[managementLevel] || "";
        const scope = {
          scope_type: scopeType,

          company_id: "",
          branch_group_id: "",
          branch_id: "",
          department_id: "",
          division_id: "",
          unit_id: "",

          is_primary: true,

          sort_order: 0,
        };

        if (!employee || !scopeType) {
          return [];
        }

        if (scopeType === "all") {
          return [scope];
        }

        if (scopeType === "company") {
          scope.company_id =
            employee.company_id ||
            employee.branches?.company_id ||
            "";
          return [scope];
        }

        if (scopeType === "branch_group") {
          scope.branch_group_id =
            employee.branch_group_id ||
            employee.branches?.branch_group_id ||
            "";
          return [scope];
        }

        if (scopeType === "branch") {
          scope.branch_id =
            employee.branch_id ||
            employee.branches?.id ||
            "";
          return [scope];
        }

        if (scopeType === "department") {
          scope.department_id =
            employee.department_id ||
            employee.departments?.id ||
            "";
          return [scope];
        }

        if (scopeType === "division") {
          scope.division_id =
            employee.division_id ||
            employee.divisions?.id ||
            "";
          return [scope];
        }

        if (scopeType === "unit") {
          scope.unit_id =
            employee.unit_id ||
            employee.units?.id ||
            "";
          return [scope];
        }
        return [scope];
      },
    []
  );  

  const getEmployeeScopeName = useCallback(
    (employee, scopeType) => {
      if (!employee) {
        return "-";
      }

      if (scopeType === "all") {
        return "ทั้งองค์กร";
      }

      if (scopeType === "company") {
        return (
          employee.company_name ||
          employee.company_name_th ||
          employee.companies?.company_name ||
          employee.companies?.company_name_th ||
          "-"
        );
      }

      if (scopeType === "branch_group") {
        return (
          employee.branch_group_name ||
          employee.branches?.branch_group_name ||
          employee.branch_groups?.group_name ||
          employee.branch_groups?.branch_group_name ||
          "-"
        );
      }

      if (scopeType === "branch") {
        return (
          employee.branch_name ||
          employee.branches?.branch_name ||
          "-"
        );
      }

      if (scopeType === "department") {
        return (
          employee.department_name ||
          employee.departments?.department_name ||
          "-"
        );
      }

      if (scopeType === "division") {
        return (
          employee.division_name ||
          employee.divisions?.division_name ||
          "-"
        );
      }

      if (scopeType === "unit") {
        return (
          employee.unit_name ||
          employee.units?.unit_name ||
          "-"
        );
      }

      return "-";
    },
    []
  );

  const requiredSupervisorLevel = useMemo(() => {
      if (!form.management_level) {
        return "";
      }

      return ( SUPERVISOR_LEVEL_BY_LEVEL[
          form.management_level
        ] || ""
      );
    }, [form.management_level]);

  const supervisorAssignments = useMemo(() => {
      if (!requiredSupervisorLevel) {
        return [];
      }

      return assignments
        .filter((item) => {
          const isCorrectLevel =
            item.management_level ===
            requiredSupervisorLevel;

          const isActive =
            item.status === "active";

          const isNotCurrentEmployee =
            String(item.employee_id) !==
            String(form.employee_id);

          return (
            isCorrectLevel &&
            isActive &&
            isNotCurrentEmployee
          );
        })
        .sort((a, b) => {
          const sortA =
            Number(a.sort_order) || 0;

          const sortB =
            Number(b.sort_order) || 0;

          if (sortA !== sortB) {
            return sortA - sortB;
          }

          return String(
            a.employee_name || ""
          ).localeCompare(
            String(
              b.employee_name || ""
            ),
            "th"
          );
        });
    }, [
      assignments,
      requiredSupervisorLevel,
      form.employee_id,
    ]);

  const supervisorOptions = useMemo(() => {
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
          } (${assignment.management_level})`,

          assignmentId:
            assignment.id,
        })
      );
    }, [supervisorAssignments]);

  const employeeOptions = useMemo(() => {
      return availableEmployees.map(
        (employee) => ({
          value: employee.id,

          label: `${
            employee.employee_code ||
            "-"
          } - ${
            employee.resolved_employee_name ||
            "-"
          } (${
            employee.resolved_management_level ||
            "-"
          })`,

          searchText: [
            employee.employee_code,
            employee.resolved_employee_name,
            employee.resolved_position_name,
            employee.resolved_management_level,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        })
      );
    }, [availableEmployees]);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setEditingAssignment(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มสายบังคับบัญชา"
      );

      return;
    }

    resetForm();
    setOpenModal(true);
  }, [canCreate, resetForm]);

  const handleOpenEdit = useCallback(
    (item) => {
      if (!canEdit) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขสายบังคับบัญชา"
        );

        return;
      }

      setEditingAssignment(item);

      setForm({
        employee_id: item.employee_id || "",
        management_level: item.management_level || "",
        scopes: normalizeScopes(item.management_assignment_scopes),
        supervisor_employee_id: item.supervisor_employee_id ||"",
        is_primary:item.is_primary ?? true,
        status:item.status || "active",
        sort_order:Number(item.sort_order) || 0,
      });

      setOpenModal(true);
    },
    [canEdit]
  );

  const handleCloseModal =
    useCallback(() => {
      if (saving) {
        return;
      }

      setOpenModal(false);
      resetForm();
    }, [saving, resetForm]);

  const handleEmployeeChange = useCallback(
    (employeeId) => {
      if (!employeeId) {
        setForm(initialForm);
        return;
      }
      const employee = employees.find((item) => String(item.id) === String(employeeId));
      if (!employee) {
        swalError(
          "ไม่พบข้อมูลพนักงานที่เลือก"
        );
        return;
      }

      const managementLevel = employee.resolved_management_level || resolveEmployeeManagementLevel(employee);
      if (!MANAGEMENT_LEVELS.includes(managementLevel)) {
        swalError("พนักงานคนนี้ไม่ได้อยู่ในระดับ P9 ถึง P12");
        return;
      }

      const employeeScope = buildEmployeeScope(employee,managementLevel);
      setForm((previous) => ({
        ...previous,
        employee_id: employee.id,
        management_level: managementLevel,
        scopes: employeeScope,
        supervisor_employee_id: "",
        sort_order: previous.sort_order || 0,
      }));
    },
    [
      employees,
      buildEmployeeScope,
    ]
  );

  useEffect(() => {
    if (!form.supervisor_employee_id) {
      return;
    }

    if (
      form.management_level === "P12"
    ) {
      setForm((previous) => ({
        ...previous,
        supervisor_employee_id: "",
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
            form.supervisor_employee_id
          )
      );

    if (!supervisorStillValid) {
      setForm((previous) => ({
        ...previous,
        supervisor_employee_id: "",
      }));
    }
  }, [
    form.management_level,
    form.supervisor_employee_id,
    supervisorAssignments,
  ]);

  const selectedScopeName =
    useMemo(() => {
      if (!selectedEmployee) {
        return "-";
      }

      return getEmployeeScopeName(
        selectedEmployee,
        form.scope_type
      );
    }, [
      selectedEmployee,
      form.scope_type,
      getEmployeeScopeName,
    ]);

  const validateScope = useCallback(
    () => {
      if (!form.scope_type) {
        return "ไม่พบประเภทขอบเขตการดูแล";
      }

      if (form.scope_type === "all") {
        return "";
      }

      const requiredFieldByScope = {
        company: "company_id",
        branch_group: "branch_group_id",
        branch: "branch_id",
        department: "department_id",
        division: "division_id",
        unit: "unit_id",
      };

      const requiredField =
        requiredFieldByScope[
          form.scope_type
        ];

      if (
        requiredField &&
        !form[requiredField]
      ) {
        return `พนักงานคนนี้ไม่มีข้อมูล ${form.scope_type} ใน Employee Master`;
      }

      return "";
    },
    [form]
  );

  const validateForm =
    useCallback(() => {
      if (!form.employee_id) {
        return "กรุณาเลือกพนักงาน";
      }

      if (
        !MANAGEMENT_LEVELS.includes(
          form.management_level
        )
      ) {
        return "ระดับผู้บริหารต้องอยู่ระหว่าง P9 ถึง P12";
      }

      const scopeError =
        validateScope();

      if (scopeError) {
        return scopeError;
      }

      if (
        form.management_level !== "P12" &&
        !form.supervisor_employee_id
      ) {
        return `กรุณาเลือกผู้บังคับบัญชาระดับ ${requiredSupervisorLevel}`;
      }

      if (
        form.management_level === "P12" &&
        form.supervisor_employee_id
      ) {
        return "พนักงานระดับ P12 ไม่ต้องมีผู้บังคับบัญชา";
      }

      if (
        form.supervisor_employee_id &&
        String(
          form.supervisor_employee_id
        ) === String(form.employee_id)
      ) {
        return "พนักงานไม่สามารถเป็นผู้บังคับบัญชาของตัวเองได้";
      }

      if (
        form.management_level !== "P12"
      ) {
        const validSupervisor =
          supervisorAssignments.some(
            (assignment) =>
              String(
                assignment.employee_id
              ) ===
              String(
                form.supervisor_employee_id
              )
          );

        if (!validSupervisor) {
          return `ผู้บังคับบัญชาต้องเป็นระดับ ${requiredSupervisorLevel}`;
        }
      }

      return "";
    },
    [
      form,
      requiredSupervisorLevel,
      supervisorAssignments,
      validateScope,
    ]
  );

  const handleSave = useCallback(async () => {
      const isEdit = Boolean(editingAssignment);

      if (isEdit && !canEdit) {
        swalError(
          "คุณไม่มีสิทธิ์แก้ไขสายบังคับบัญชา"
        );
        return;
      }

      if (!isEdit && !canCreate) {
        swalError(
          "คุณไม่มีสิทธิ์เพิ่มสายบังคับบัญชา"
        );
        return;
      }

      const validationError = validateForm();

      if (validationError) {
        swalError(validationError);
        return;
      }

      try {
        setSaving(true);

        const url = isEdit
          ? `/api/admin/management-assignments/${editingAssignment.id}`
          : "/api/admin/management-assignments";

        const method = isEdit
          ? "PATCH"
          : "POST";

        const payload = {
          employee_id:form.employee_id,
          management_level:form.management_level,
          scope_type: form.scope_type,
          company_id:form.scope_type ==="company"? form.company_id : null,
          branch_group_id:form.scope_type === "branch_group"? form.branch_group_id: null,
          branch_id:form.scope_type ==="branch"? form.branch_id : null,
          department_id:
            form.scope_type ===
            "department"
              ? form.department_id
              : null,

          division_id:
            form.scope_type ===
            "division"
              ? form.division_id
              : null,

          unit_id:
            form.scope_type ===
            "unit"
              ? form.unit_id
              : null,

          supervisor_employee_id:
            form.management_level ===
            "P12"
              ? null
              : form.supervisor_employee_id ||
                null,

          is_primary:
            Boolean(form.is_primary),

          status:
            form.status || "active",

          sort_order:
            Number(form.sort_order) || 0,
        };

        const response = await fetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

        const result =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถบันทึกสายบังคับบัญชาได้"
          );
        }

        swalSuccess(
          isEdit
            ? "อัปเดตสายบังคับบัญชาเรียบร้อยแล้ว"
            : "เพิ่มสายบังคับบัญชาเรียบร้อยแล้ว"
        );

        setOpenModal(false);
        resetForm();

        await loadAssignments(search);
      } catch (saveError) {
        console.error(
          "SAVE_MANAGEMENT_ASSIGNMENT_ERROR:",
          saveError
        );

        swalError(
          saveError.message ||
            "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
        );
      } finally {
        setSaving(false);
      }
    }, [
      editingAssignment,
      canEdit,
      canCreate,
      validateForm,
      form,
      resetForm,
      loadAssignments,
      search,
    ]);

  const handleDelete = useCallback( async (item) => {
        if (!canDelete) {
          swalError("คุณไม่มีสิทธิ์ลบสายบังคับบัญชา");
          return;
        }
        const confirmed =await swalConfirm(`ต้องการลบสายบังคับบัญชาของ "${item.employee_name}" ใช่หรือไม่?`);

        if (!confirmed) {
          return;
        }

        try {
          setDeletingId(item.id);
          const response = await fetch(
            `/api/admin/management-assignments/${item.id}`,
            {
              method: "DELETE",
            }
          );

          const result =
            await safeJson(response);

          if (!response.ok) {
            throw new Error(
              result?.error ||
                "ไม่สามารถลบสายบังคับบัญชาได้"
            );
          }

          swalSuccess(
            "ลบสายบังคับบัญชาเรียบร้อยแล้ว"
          );

          await loadAssignments(search);
        } catch (deleteError) {
          console.error(
            "DELETE_MANAGEMENT_ASSIGNMENT_ERROR:",
            deleteError
          );

          swalError(
            deleteError.message ||
              "เกิดข้อผิดพลาดในการลบข้อมูล"
          );
        } finally {
          setDeletingId("");
        }
      },
      [
        canDelete,
        loadAssignments,
        search,
      ]
    );

  const getScopeLabel = useCallback((item) => {
    if (!item) {
      return "-";
    }

    if (item.scope_type === "all") {
      return "ทั้งองค์กร";
    }

    if (item.scope_type === "company") {
      return (
        item.company_name || "-"
      );
    }

    if (item.scope_type === "branch_group") {
      return (
        item.branch_group_name || "-"
      );
    }

    if ( item.scope_type === "branch") {
      return (
        item.branch_name || "-"
      );
    }

    if (item.scope_type === "department") {
      return (
        item.department_name || "-"
      );
    }

    if (item.scope_type === "division") {
      return (
        item.division_name || "-"
      );
    }

    if (item.scope_type === "unit") {
      return (
        item.unit_name || "-"
      );
    }

    return "-";
  }, []);


  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;
  
    return (
    <div className="space-y-6">
      {/* =================================================
          Header
      ================================================= */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                สายบังคับบัญชา
              </h1>

              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                P12 – P9
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              กำหนดโครงสร้างผู้บริหารและแสดงผลในรูปแบบ Org Chart
            </p>

            <p className="mt-1 text-xs text-slate-400">
              ระดับและขอบเขตการดูแลจะถูกกำหนดอัตโนมัติจากข้อมูลพนักงาน
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <span className="mr-2 text-lg leading-none">
                +
              </span>

              เพิ่มสายบังคับบัญชา
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          Summary
      ================================================= */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {MANAGEMENT_LEVELS.map((level) => (
          <div
            key={level}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Management Level
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-800">
                  {level}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-lg font-black text-sky-700">
                {levelGroups[level]?.length || 0}
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              ทั้งหมด {levelGroups[level]?.length || 0} รายการ
            </p>
          </div>
        ))}
      </div>

      {/* =================================================
          Search / View Mode
      ================================================= */}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ค้นหา: ชื่อพนักงาน / รหัส / ระดับ / ขอบเขต / ผู้บังคับบัญชา"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  VIEW_MODES.ORG_CHART
                )
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                viewMode ===
                VIEW_MODES.ORG_CHART
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Org Chart
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  VIEW_MODES.TREE
                )
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                viewMode ===
                VIEW_MODES.TREE
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tree View
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  VIEW_MODES.TABLE
                )
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                viewMode ===
                VIEW_MODES.TABLE
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          Error
      ================================================= */}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {/* =================================================
          Org Chart Toolbar
      ================================================= */}

      {viewMode ===
        VIEW_MODES.ORG_CHART && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                เครื่องมือ Org Chart
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                เลื่อนเมาส์เพื่อย้ายผัง และใช้ปุ่มเพื่อควบคุมการแสดงผล
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  orgChartRef.current?.zoomIn()
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                Zoom +
              </button>

              <button
                type="button"
                onClick={() =>
                  orgChartRef.current?.zoomOut()
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                Zoom -
              </button>

              <button
                type="button"
                onClick={() =>
                  orgChartRef.current?.fit()
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                Fit Screen
              </button>

              <button
                type="button"
                onClick={() =>
                  orgChartRef.current?.expandAll()
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                Expand All
              </button>

              <button
                type="button"
                onClick={() =>
                  orgChartRef.current?.collapseAll()
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          Org Chart
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
                  String(item.id) ===
                  String(
                    node.assignment_id
                  )
              );

            if (assignment) {
              handleOpenEdit(assignment);
            }
          }}
        />
      )}

      {/* =================================================
          Tree View
      ================================================= */}

      {viewMode ===
        VIEW_MODES.TREE && (
        <div className="space-y-5">
          {MANAGEMENT_LEVELS.map(
            (level) => {
              const items =
                levelGroups[level] || [];

              return (
                <section
                  key={level}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-800">
                          {level}
                        </h2>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {items.length} รายการ
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        ผู้บริหารระดับ {level}
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({
                        length: 3,
                      }).map((_, index) => (
                        <div
                          key={index}
                          className="h-52 animate-pulse rounded-3xl bg-slate-100"
                        />
                      ))}
                    </div>
                  ) : items.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                {item.management_level}
                              </div>

                              <h3 className="mt-3 truncate text-base font-bold text-slate-800">
                                {item.employee_name ||
                                  "-"}
                              </h3>

                              <p className="mt-1 truncate text-xs font-medium text-slate-400">
                                {item.employee_code ||
                                  "-"}
                              </p>

                              {item.position_name ? (
                                <p className="mt-2 truncate text-sm text-slate-500">
                                  {item.position_name}
                                </p>
                              ) : null}
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status ===
                                "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {item.status ===
                              "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Scope
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {getScopeLabel(item)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {item.scope_type ||
                                "-"}
                            </p>
                          </div>

                          <div className="mt-3 rounded-2xl bg-sky-50 px-4 py-3">
                            <p className="text-xs font-semibold text-sky-600">
                              ผู้บังคับบัญชา
                            </p>

                            <p className="mt-1 truncate text-sm font-bold text-sky-800">
                              {item.supervisor_name ||
                                "ไม่มีผู้บังคับบัญชา"}
                            </p>

                            {item.supervisor_code ? (
                              <p className="mt-1 text-xs text-sky-500">
                                {
                                  item.supervisor_code
                                }
                              </p>
                            ) : null}
                          </div>

                          {(canEdit ||
                            canDelete) && (
                            <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenEdit(
                                      item
                                    )
                                  }
                                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                  Edit
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      item
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    item.id
                                  }
                                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deletingId ===
                                  item.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-400">
                        ยังไม่มีข้อมูลระดับ{" "}
                        {level}
                      </p>
                    </div>
                  )}
                </section>
              );
            }
          )}
        </div>
      )}

      {/* =================================================
          Table View
      ================================================= */}

      {viewMode ===
        VIEW_MODES.TABLE && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  รายการสายบังคับบัญชา
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ทั้งหมด{" "}
                  {assignments.length} รายการ
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">
                    พนักงาน
                  </th>

                  <th className="px-6 py-4 text-left font-bold">
                    ระดับ
                  </th>

                  <th className="px-6 py-4 text-left font-bold">
                    ตำแหน่ง
                  </th>

                  <th className="px-6 py-4 text-left font-bold">
                    ขอบเขต
                  </th>

                  <th className="px-6 py-4 text-left font-bold">
                    ผู้บังคับบัญชา
                  </th>

                  <th className="px-6 py-4 text-left font-bold">
                    สถานะ
                  </th>

                  <th className="px-6 py-4 text-right font-bold">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <tr
                      key={index}
                      className="border-t border-slate-200"
                    >
                      <td
                        colSpan={7}
                        className="px-6 py-4"
                      >
                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : assignments.length ? (
                  assignments.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-200 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">
                            {item.employee_name ||
                              "-"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.employee_code ||
                              "-"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                            {
                              item.management_level
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {item.position_name ||
                            "-"}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-700">
                            {getScopeLabel(
                              item
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.scope_type ||
                              "-"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700">
                            {item.supervisor_name ||
                              "-"}
                          </p>

                          {item.supervisor_code ? (
                            <p className="mt-1 text-xs text-slate-400">
                              {
                                item.supervisor_code
                              }
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status ===
                              "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.status ===
                            "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEdit(
                                    item
                                  )
                                }
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  item.id
                                }
                                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                item.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center text-sm text-slate-400"
                    >
                      ไม่พบข้อมูลสายบังคับบัญชา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================
          Create / Edit Modal
      ================================================= */}

      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseModal();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingAssignment
                      ? "แก้ไขสายบังคับบัญชา"
                      : "เพิ่มสายบังคับบัญชา"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    เลือกพนักงานระดับ P9 ถึง P12 ระบบจะกำหนด Level และ Scope ให้อัตโนมัติ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}

            <div className="space-y-6 p-6">
              {/* Employee */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  พนักงาน
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <Select
                  showSearch
                  allowClear
                  loading={loadingEmployees}
                  disabled={
                    loadingEmployees ||
                    Boolean(
                      editingAssignment
                    )
                  }
                  value={
                    form.employee_id ||
                    undefined
                  }
                  placeholder="เลือกพนักงานระดับ P9 ถึง P12"
                  onChange={
                    handleEmployeeChange
                  }
                  options={employeeOptions}
                  optionFilterProp="label"
                  filterOption={(
                    input,
                    option
                  ) => {
                    const searchValue =
                      String(input)
                        .trim()
                        .toLowerCase();

                    const label =
                      String(
                        option?.label || ""
                      ).toLowerCase();

                    const searchText =
                      String(
                        option?.searchText ||
                          ""
                      ).toLowerCase();

                    return (
                      label.includes(
                        searchValue
                      ) ||
                      searchText.includes(
                        searchValue
                      )
                    );
                  }}
                  className="w-full"
                  size="large"
                />

                {editingAssignment ? (
                  <p className="mt-2 text-xs text-amber-600">
                    ไม่สามารถเปลี่ยนพนักงานในรายการเดิมได้ หากเลือกผิดให้ลบแล้วเพิ่มใหม่
                  </p>
                ) : null}
              </div>

              {/* Employee Summary */}

              {selectedEmployee ? (
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-sky-200 text-xl font-black text-sky-700 shadow-sm">
                      {selectedEmployee.employee_photo_url ? (
                        <img
                          src={
                            selectedEmployee.employee_photo_url
                          }
                          alt={
                            selectedEmployee.resolved_employee_name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        selectedEmployee.resolved_employee_name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                        "?"
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-800">
                        {
                          selectedEmployee.resolved_employee_name
                        }
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {selectedEmployee.employee_code ||
                          "-"}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {
                          selectedEmployee.resolved_position_name
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Auto Information */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Management Level
                  </p>

                  <p className="mt-2 text-lg font-black text-slate-800">
                    {form.management_level ||
                      "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    ดึงจากตำแหน่งของพนักงาน
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Scope Type
                  </p>

                  <p className="mt-2 text-lg font-black text-slate-800">
                    {form.scope_type ||
                      "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    กำหนดจาก Management Level
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Scope Target
                  </p>

                  <p className="mt-2 truncate text-base font-black text-slate-800">
                    {selectedScopeName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    ดึงจากสังกัดพนักงาน
                  </p>
                </div>
              </div>

              {/* Mapping Explanation */}

              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                <p className="text-sm font-bold text-blue-800">
                  การกำหนดขอบเขตอัตโนมัติ
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-blue-700 md:grid-cols-4">
                  <div className="rounded-xl bg-white/70 px-3 py-2">
                    <strong>P12</strong>
                    <br />
                    ทั้งองค์กร
                  </div>

                  <div className="rounded-xl bg-white/70 px-3 py-2">
                    <strong>P11</strong>
                    <br />
                    กลุ่มสาขา
                  </div>

                  <div className="rounded-xl bg-white/70 px-3 py-2">
                    <strong>P10</strong>
                    <br />
                    สาขา
                  </div>

                  <div className="rounded-xl bg-white/70 px-3 py-2">
                    <strong>P9</strong>
                    <br />
                    แผนก
                  </div>
                </div>
              </div>

              {/* Supervisor */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  ผู้บังคับบัญชา

                  {form.management_level &&
                  form.management_level !==
                    "P12" ? (
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  ) : null}
                </label>

                {form.management_level ===
                "P12" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                    ระดับ P12 เป็นระดับสูงสุด ไม่ต้องกำหนดผู้บังคับบัญชา
                  </div>
                ) : (
                  <>
                    <Select
                      showSearch
                      allowClear
                      disabled={
                        !form.employee_id ||
                        !requiredSupervisorLevel
                      }
                      value={
                        form.supervisor_employee_id ||
                        undefined
                      }
                      placeholder={
                        requiredSupervisorLevel
                          ? `เลือกผู้บังคับบัญชาระดับ ${requiredSupervisorLevel}`
                          : "กรุณาเลือกพนักงานก่อน"
                      }
                      onChange={(value) =>
                        setForm(
                          (previous) => ({
                            ...previous,

                            supervisor_employee_id:
                              value || "",
                          })
                        )
                      }
                      options={
                        supervisorOptions
                      }
                      optionFilterProp="label"
                      className="w-full"
                      size="large"
                    />

                    {form.employee_id &&
                    requiredSupervisorLevel &&
                    supervisorOptions.length ===
                      0 ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        ยังไม่มีผู้บริหารระดับ{" "}
                        <strong>
                          {
                            requiredSupervisorLevel
                          }
                        </strong>{" "}
                        ที่สามารถเลือกเป็นผู้บังคับบัญชาได้ กรุณาเพิ่มระดับบนก่อน
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Settings */}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.sort_order}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,

                          sort_order:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,

                          status:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              {/* Primary */}

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={Boolean(
                    form.is_primary
                  )}
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,

                        is_primary:
                          event.target
                            .checked,
                      })
                    )
                  }
                  className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    สายบังคับบัญชาหลัก
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    ใช้รายการนี้เป็นสายบังคับบัญชาหลักของพนักงาน
                  </p>
                </div>
              </label>
            </div>

            {/* Modal Footer */}

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  loadingEmployees
                }
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingAssignment
                    ? "อัปเดตข้อมูล"
                    : "บันทึกข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}