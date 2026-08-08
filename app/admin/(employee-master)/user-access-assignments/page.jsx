"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Form,
} from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import useAuth from "@/hooks/useAuth";
import {
  hasPermission,
} from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import UserAccessAssignmentSearch from "./components/UserAccessAssignmentSearch";
import UserAccessAssignmentSummaryCards from "./components/UserAccessAssignmentSummaryCards";
import UserAccessAssignmentTable from "./components/UserAccessAssignmentTable";
import UserAccessAssignmentModal from "./components/UserAccessAssignmentModal";
import {
  getInitialAssignmentValues,
} from "./components/UserAccessAssignmentForm";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import {
  SafetyCertificateOutlined,
} from "@ant-design/icons";

/* =========================================================
   Constants
========================================================= */

const PAGE_SIZE = 20;

const API_URL =
  "/api/admin/user-access-assignments";

const MASTER_ENDPOINTS = {
  userAccounts:
    "/api/admin/user-accounts?all=true",

  roles:
    "/api/admin/roles?all=true",

  companies:
    "/api/admin/companies?all=true&status=active",

  branchGroups:
    "/api/admin/branch-groups?all=true&status=active",

  branches:
    "/api/admin/branches?all=true&status=active",

  departments:
    "/api/admin/departments?all=true&status=active",

  divisions:
    "/api/admin/divisions?all=true&status=active",

  units:
    "/api/admin/units?all=true&status=active",
};

/* =========================================================
   Helpers
========================================================= */

function getRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  return [];
}

function getTotal(
  payload,
  fallback = 0
) {
  return (
    payload?.pagination?.total ??
    payload?.total ??
    fallback
  );
}

function normalizeScope(
  scope,
  index = 0
) {
  return {
    id: scope?.id || null,

    scope_type:
      scope?.scope_type ||
      "branch",

    company_id:
      scope?.company_id ||
      null,

    branch_group_id:
      scope?.branch_group_id ||
      null,

    branch_id:
      scope?.branch_id ||
      null,

    department_id:
      scope?.department_id ||
      null,

    division_id:
      scope?.division_id ||
      null,

    unit_id:
      scope?.unit_id ||
      null,

    status:
      scope?.status ||
      "active",

    sort_order:
      Number.isInteger(
        Number(scope?.sort_order)
      )
        ? Number(
            scope.sort_order
          )
        : index,

    target_code:
      scope?.target_code ||
      null,

    target_name:
      scope?.target_name ||
      null,
  };
}

function makeScopeKey(scope) {
  const targetId =
    scope?.company_id ||
    scope?.branch_group_id ||
    scope?.branch_id ||
    scope?.department_id ||
    scope?.division_id ||
    scope?.unit_id ||
    "all";

  return `${scope?.scope_type}:${targetId}`;
}

function normalizeSubmitScope(
  scope,
  index
) {
  const scopeType =
    scope?.scope_type;

  return {
    scope_type: scopeType,

    company_id:
      scopeType === "company"
        ? scope?.company_id ||
          null
        : null,

    branch_group_id:
      scopeType ===
      "branch_group"
        ? scope?.branch_group_id ||
          null
        : null,

    branch_id:
      scopeType === "branch"
        ? scope?.branch_id ||
          null
        : null,

    department_id:
      scopeType ===
      "department"
        ? scope?.department_id ||
          null
        : null,

    division_id:
      scopeType === "division"
        ? scope?.division_id ||
          null
        : null,

    unit_id:
      scopeType === "unit"
        ? scope?.unit_id ||
          null
        : null,

    status:
      scope?.status ||
      "active",

    sort_order: index,
  };
}

/* =========================================================
   Page
========================================================= */

export default function UserAccessAssignmentsPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const {user,loadingUser} = useAuth();

  const canView = hasPermission(user,"access.user_access_assignments.view");
  const canCreate = hasPermission(user,"access.user_access_assignments.create");
  const canEdit = hasPermission(user,"access.user_access_assignments.edit");
  const canDelete = hasPermission(user,"access.user_access_assignments.delete");

  /* =======================================================
     List State
  ======================================================= */

  const [rows, setRows] =useState([]);
  const [loading, setLoading] =useState(false);
  const [search, setSearch] =useState("");
  const [debouncedSearch,setDebouncedSearch,] = useState("");
  const [roleFilter,setRoleFilter,] = useState("");
  const [statusFilter,setStatusFilter,] = useState("");
  const [page, setPage] = useState(1);
  const [ pageSize,setPageSize,] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  /* =======================================================
     Modal State
  ======================================================= */

  const [modalOpen,setModalOpen,] = useState(false);
  const [modalMode,setModalMode,] = useState("create");
  const [selectedRecord,setSelectedRecord,] = useState(null);
  const [detailLoading,setDetailLoading,] = useState(false);
  const [saving, setSaving] =useState(false);
  const [deletingId,setDeletingId,] = useState(null);

  /* =======================================================
     Master Data State
  ======================================================= */

  const [
    masterLoading,
    setMasterLoading,
  ] = useState(false);

  const [
    masterLoaded,
    setMasterLoaded,
  ] = useState(false);

  const [
    userAccounts,
    setUserAccounts,
  ] = useState([]);

  const [roles, setRoles] =
    useState([]);

  const [
    companies,
    setCompanies,
  ] = useState([]);

  const [
    branchGroups,
    setBranchGroups,
  ] = useState([]);

  const [
    branches,
    setBranches,
  ] = useState([]);

  const [
    departments,
    setDepartments,
  ] = useState([]);

  const [
    divisions,
    setDivisions,
  ] = useState([]);

  const [units, setUnits] =
    useState([]);

  /* =======================================================
     Search Debounce
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setDebouncedSearch(
          search.trim()
        );

        setPage(1);
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /* =======================================================
     Fetch Helper
  ======================================================= */

  const fetchJson =
    useCallback(
      async (
        url,
        options = {}
      ) => {
        const response =
          await fetch(url, {
            cache: "no-store",
            ...options,
          });

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        let payload = null;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          payload =
            await response.json();
        } else {
          const text =
            await response.text();

          throw new Error(
            text ||
              "API ไม่ได้ส่งข้อมูล JSON กลับมา"
          );
        }

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              payload?.error ||
              "เกิดข้อผิดพลาดจาก API"
          );
        }

        return payload;
      },
      []
    );

  /* =======================================================
     Load List
  ======================================================= */

  const loadData =
    useCallback(async () => {
      if (!canView) {
        return;
      }

      setLoading(true);

      try {
        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "pageSize",
          String(pageSize)
        );

        if (debouncedSearch) {
          params.set(
            "search",
            debouncedSearch
          );
        }

        if (roleFilter) {
          params.set(
            "role_id",
            roleFilter
          );
        }

        if (statusFilter) {
          params.set(
            "status",
            statusFilter
          );
        }

        const payload =
          await fetchJson(
            `${API_URL}?${params.toString()}`
          );

        const nextRows =
          getRows(payload);

        setRows(nextRows);

        setTotal(
          getTotal(
            payload,
            nextRows.length
          )
        );
      } catch (error) {
        console.error(
          "LOAD_USER_ACCESS_ASSIGNMENTS_ERROR:",
          error
        );

        await swalError(
          "โหลดข้อมูลไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถโหลดข้อมูลการกำหนดบทบาทผู้ใช้งานได้"
        );
      } finally {
        setLoading(false);
      }
    }, [
      canView,
      debouncedSearch,
      fetchJson,
      page,
      pageSize,
      roleFilter,
      statusFilter,
    ]);

  useEffect(() => {
    if (
      !loadingUser &&
      canView
    ) {
      loadData();
    }
  }, [
    loadingUser,
    canView,
    loadData,
  ]);

  /* =======================================================
     Load Master Data
  ======================================================= */

  const loadMasterData =
    useCallback(async () => {
      if (masterLoaded) {
        return;
      }

      setMasterLoading(true);

      try {
        const [
          userAccountsPayload,
          rolesPayload,
          companiesPayload,
          branchGroupsPayload,
          branchesPayload,
          departmentsPayload,
          divisionsPayload,
          unitsPayload,
        ] = await Promise.all([
          fetchJson(
            MASTER_ENDPOINTS.userAccounts
          ),

          fetchJson(
            MASTER_ENDPOINTS.roles
          ),

          fetchJson(
            MASTER_ENDPOINTS.companies
          ),

          fetchJson(
            MASTER_ENDPOINTS.branchGroups
          ),

          fetchJson(
            MASTER_ENDPOINTS.branches
          ),

          fetchJson(
            MASTER_ENDPOINTS.departments
          ),

          fetchJson(
            MASTER_ENDPOINTS.divisions
          ),

          fetchJson(
            MASTER_ENDPOINTS.units
          ),
        ]);

        setUserAccounts(
          getRows(
            userAccountsPayload
          )
        );

        setRoles(
          getRows(
            rolesPayload
          )
        );

        setCompanies(
          getRows(
            companiesPayload
          )
        );

        setBranchGroups(
          getRows(
            branchGroupsPayload
          )
        );

        setBranches(
          getRows(
            branchesPayload
          )
        );

        setDepartments(
          getRows(
            departmentsPayload
          )
        );

        setDivisions(
          getRows(
            divisionsPayload
          )
        );

        setUnits(
          getRows(
            unitsPayload
          )
        );

        setMasterLoaded(true);
      } catch (error) {
        console.error(
          "LOAD_USER_ACCESS_MASTER_ERROR:",
          error
        );

        await swalError(
          "โหลดข้อมูล Master ไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถโหลดข้อมูลที่ใช้ในแบบฟอร์มได้"
        );

        throw error;
      } finally {
        setMasterLoading(false);
      }
    }, [
      fetchJson,
      masterLoaded,
    ]);

  /* =======================================================
     Detail
  ======================================================= */

  const loadDetail =
    useCallback(
      async (id) => {
        const payload =
          await fetchJson(
            `${API_URL}/${id}`
          );

        return (
          payload?.data ||
          null
        );
      },
      [fetchJson]
    );

  /* =======================================================
     Modal Helpers
  ======================================================= */

  const closeModal =
    useCallback(() => {
      setModalOpen(false);

      setModalMode("create");

      setSelectedRecord(null);

      form.resetFields();
    }, [form]);

  const handleCreate =
    useCallback(async () => {
      if (!canCreate) {
        await swalError(
          "ไม่มีสิทธิ์",
          "คุณไม่มีสิทธิ์เพิ่มบทบาทผู้ใช้งาน"
        );

        return;
      }

      try {
        await loadMasterData();

        setSelectedRecord(null);

        setModalMode("create");

        form.resetFields();

        form.setFieldsValue(
          getInitialAssignmentValues()
        );

        setModalOpen(true);
      } catch {
        // Error ถูกแสดงใน loadMasterData แล้ว
      }
    }, [
      canCreate,
      form,
      loadMasterData,
    ]);

  const openRecord =
    useCallback(
      async (
        record,
        mode
      ) => {
        if (
          mode === "edit" &&
          !canEdit
        ) {
          await swalError(
            "ไม่มีสิทธิ์",
            "คุณไม่มีสิทธิ์แก้ไขบทบาทผู้ใช้งาน"
          );

          return;
        }

        setDetailLoading(true);

        try {
          await loadMasterData();

          const detail =
            await loadDetail(
              record.id
            );

          if (!detail) {
            throw new Error(
              "ไม่พบรายละเอียด Assignment"
            );
          }

          const scopes =
            Array.isArray(
              detail.scopes
            )
              ? detail.scopes
              : [];

          const formValues = {
            user_account_id:
              detail.user_account_id,

            role_id:
              detail.role_id,

            assignment_name:
              detail.assignment_name ||
              "",

            is_primary:
              Boolean(
                detail.is_primary
              ),

            status:
              detail.status ||
              "active",

            effective_from:
              detail.effective_from
                ? dayjs(
                    detail.effective_from
                  )
                : null,

            effective_to:
              detail.effective_to
                ? dayjs(
                    detail.effective_to
                  )
                : null,

            scopes:
              scopes.length > 0
                ? scopes.map(
                    normalizeScope
                  )
                : [
                    {
                      scope_type:
                        "branch",

                      company_id:
                        null,

                      branch_group_id:
                        null,

                      branch_id:
                        null,

                      department_id:
                        null,

                      division_id:
                        null,

                      unit_id:
                        null,

                      status:
                        "active",

                      sort_order: 0,
                    },
                  ],
          };

          setSelectedRecord(
            detail
          );

          setModalMode(mode);

          form.resetFields();

          form.setFieldsValue(
            formValues
          );

          setModalOpen(true);
        } catch (error) {
          console.error(
            "LOAD_USER_ACCESS_ASSIGNMENT_DETAIL_ERROR:",
            error
          );

          await swalError(
            "โหลดรายละเอียดไม่สำเร็จ",
            error?.message ||
              "ไม่สามารถโหลดรายละเอียด Assignment ได้"
          );
        } finally {
          setDetailLoading(false);
        }
      },
      [
        canEdit,
        form,
        loadDetail,
        loadMasterData,
      ]
    );

  const handleView =
    useCallback(
      (record) => {
        openRecord(
          record,
          "view"
        );
      },
      [openRecord]
    );

  const handleEdit =
    useCallback(
      (record) => {
        openRecord(
          record,
          "edit"
        );
      },
      [openRecord]
    );

  /* =======================================================
     Scope Validation
  ======================================================= */

  const validateScopes =
    useCallback(
      (scopes) => {
        if (
          !Array.isArray(
            scopes
          ) ||
          scopes.length === 0
        ) {
          throw new Error(
            "กรุณากำหนดขอบเขตสังกัดอย่างน้อย 1 รายการ"
          );
        }

        const allScopes =
          scopes.filter(
            (scope) =>
              scope.scope_type ===
              "all"
          );

        if (
          allScopes.length > 0 &&
          scopes.length > 1
        ) {
          throw new Error(
            "ขอบเขตทุกสังกัดไม่สามารถใช้ร่วมกับขอบเขตอื่นได้"
          );
        }

        if (
          allScopes.length > 1
        ) {
          throw new Error(
            "สามารถกำหนดขอบเขตทุกสังกัดได้เพียงหนึ่งรายการ"
          );
        }

        const scopeKeys =
          new Set();

        for (
          const scope of scopes
        ) {
          if (
            !scope.scope_type
          ) {
            throw new Error(
              "กรุณาเลือกประเภทขอบเขตให้ครบ"
            );
          }

          const requiredTarget = {
            company:
              scope.company_id,

            branch_group:
              scope.branch_group_id,

            branch:
              scope.branch_id,

            department:
              scope.department_id,

            division:
              scope.division_id,

            unit:
              scope.unit_id,
          };

          if (
            scope.scope_type !==
              "all" &&
            !requiredTarget[
              scope.scope_type
            ]
          ) {
            throw new Error(
              `กรุณาเลือกข้อมูลสำหรับขอบเขต ${scope.scope_type}`
            );
          }

          const scopeKey =
            makeScopeKey(scope);

          if (
            scopeKeys.has(
              scopeKey
            )
          ) {
            throw new Error(
              "พบขอบเขตสังกัดซ้ำในรายการ"
            );
          }

          scopeKeys.add(
            scopeKey
          );
        }
      },
      []
    );

  /* =======================================================
     Build Payload
  ======================================================= */

  const buildPayload =
    useCallback(
      (values) => {
        const scopes =
          (
            values.scopes ||
            []
          ).map(
            normalizeSubmitScope
          );

        validateScopes(scopes);

        return {
          user_account_id:
            values.user_account_id,

          role_id:
            values.role_id,

          assignment_name:
            values.assignment_name
              ?.trim() ||
            null,

          is_primary:
            Boolean(
              values.is_primary
            ),

          status:
            values.status ||
            "active",

          effective_from:
            values.effective_from
              ? values.effective_from.format(
                  "YYYY-MM-DD"
                )
              : null,

          effective_to:
            values.effective_to
              ? values.effective_to.format(
                  "YYYY-MM-DD"
                )
              : null,

          updated_by:
            user?.id ||
            null,

          scopes,
        };
      },
      [
        user?.id,
        validateScopes,
      ]
    );

  /* =======================================================
     Create Assignment
  ======================================================= */

  const createAssignment =
    useCallback(
      async (payload) => {
        /*
         * 1. สร้างตารางแม่ก่อน
         */

        const createResult =
          await fetchJson(
            API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  user_account_id:
                    payload.user_account_id,

                  role_id:
                    payload.role_id,

                  assignment_name:
                    payload.assignment_name,

                  is_primary:
                    payload.is_primary,

                  status:
                    payload.status,

                  effective_from:
                    payload.effective_from,

                  effective_to:
                    payload.effective_to,

                  created_by:
                    user?.id ||
                    null,
                }),
            }
          );

        const assignmentId =
          createResult?.data?.id;

        if (!assignmentId) {
          throw new Error(
            "API ไม่ได้ส่ง Assignment ID กลับมา"
          );
        }

        /*
         * 2. PATCH เพื่อบันทึก Scope
         */

        try {
          return await fetchJson(
            `${API_URL}/${assignmentId}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  ...payload,

                  updated_by:
                    user?.id ||
                    null,
                }),
            }
          );
        } catch (scopeError) {
          /*
           * Rollback ตารางแม่
           * ถ้าบันทึก Scope ไม่สำเร็จ
           */

          try {
            await fetch(
              `${API_URL}/${assignmentId}`,
              {
                method:
                  "DELETE",

                cache:
                  "no-store",
              }
            );
          } catch (
            rollbackError
          ) {
            console.error(
              "ROLLBACK_ASSIGNMENT_ERROR:",
              rollbackError
            );
          }

          throw scopeError;
        }
      },
      [
        fetchJson,
        user?.id,
      ]
    );

  /* =======================================================
     Update Assignment
  ======================================================= */

  const updateAssignment =
    useCallback(
      async (
        assignmentId,
        payload
      ) => {
        return fetchJson(
          `${API_URL}/${assignmentId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );
      },
      [fetchJson]
    );

  /* =======================================================
     Submit
  ======================================================= */

  const handleSubmit =
    useCallback(async () => {
      if (
        modalMode === "view"
      ) {
        closeModal();

        return;
      }

      try {
        const values =
          await form.validateFields();

        const payload =
          buildPayload(values);

        setSaving(true);

        if (
          modalMode === "create"
        ) {
          await createAssignment(
            payload
          );

          await swalSuccess(
            "บันทึกสำเร็จ",
            "เพิ่มบทบาทและขอบเขตสังกัดเรียบร้อยแล้ว"
          );
        } else {
          if (
            !selectedRecord?.id
          ) {
            throw new Error(
              "ไม่พบ Assignment ID"
            );
          }

          await updateAssignment(
            selectedRecord.id,
            payload
          );

          await swalSuccess(
            "บันทึกสำเร็จ",
            "แก้ไขบทบาทและขอบเขตสังกัดเรียบร้อยแล้ว"
          );
        }

        closeModal();

        await loadData();
      } catch (error) {
        if (
          error?.errorFields
        ) {
          return;
        }

        console.error(
          "SAVE_USER_ACCESS_ASSIGNMENT_ERROR:",
          error
        );

        await swalError(
          "บันทึกไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถบันทึกข้อมูลได้"
        );
      } finally {
        setSaving(false);
      }
    }, [
      buildPayload,
      closeModal,
      createAssignment,
      form,
      loadData,
      modalMode,
      selectedRecord?.id,
      updateAssignment,
    ]);

  /* =======================================================
     Delete
  ======================================================= */

  const handleDelete =
    useCallback(
      async (record) => {
        if (!canDelete) {
          await swalError(
            "ไม่มีสิทธิ์",
            "คุณไม่มีสิทธิ์ลบบทบาทผู้ใช้งาน"
          );

          return;
        }

        const confirmed =
          await swalConfirm(
            "ยืนยันการลบ",
            `ต้องการลบ Assignment "${
              record.assignment_name ||
              record.role?.role_name ||
              "-"
            }" ใช่หรือไม่`
          );

        if (!confirmed) {
          return;
        }

        setDeletingId(
          record.id
        );

        try {
          await fetchJson(
            `${API_URL}/${record.id}`,
            {
              method:
                "DELETE",
            }
          );

          await swalSuccess(
            "ลบสำเร็จ",
            "ลบบทบาทและขอบเขตสังกัดเรียบร้อยแล้ว"
          );

          if (
            rows.length === 1 &&
            page > 1
          ) {
            setPage(
              (current) =>
                Math.max(
                  current - 1,
                  1
                )
            );
          } else {
            await loadData();
          }
        } catch (error) {
          console.error(
            "DELETE_USER_ACCESS_ASSIGNMENT_ERROR:",
            error
          );

          await swalError(
            "ลบไม่สำเร็จ",
            error?.message ||
              "ไม่สามารถลบ Assignment ได้"
          );
        } finally {
          setDeletingId(null);
        }
      },
      [
        canDelete,
        fetchJson,
        loadData,
        page,
        rows.length,
      ]
    );

  /* =======================================================
     Table Change
  ======================================================= */

  const handleTableChange =
    useCallback(
      (pagination) => {
        const nextPage =
          pagination?.current ||
          1;

        const nextPageSize =
          pagination?.pageSize ||
          PAGE_SIZE;

        if (
          nextPageSize !==
          pageSize
        ) {
          setPage(1);

          setPageSize(
            nextPageSize
          );

          return;
        }

        setPage(nextPage);
      },
      [pageSize]
    );

  /* =======================================================
     Filters
  ======================================================= */

  const handleRoleChange =
    useCallback((value) => {
      setRoleFilter(
        value || ""
      );

      setPage(1);
    }, []);

  const handleStatusChange =
    useCallback((value) => {
      setStatusFilter(
        value || ""
      );

      setPage(1);
    }, []);

  /* =======================================================
     Summary
  ======================================================= */

  const summary =
    useMemo(() => {
      const active =
        rows.filter(
          (item) =>
            item.status ===
            "active"
        ).length;

      const primary =
        rows.filter(
          (item) =>
            item.is_primary
        ).length;

      const scopes =
        rows.reduce(
          (
            currentTotal,
            item
          ) => {
            const scopeCount =
              Number(
                item.scope_count
              );

            if (
              Number.isFinite(
                scopeCount
              )
            ) {
              return (
                currentTotal +
                scopeCount
              );
            }

            if (
              Array.isArray(
                item.scopes
              )
            ) {
              return (
                currentTotal +
                item.scopes.length
              );
            }

            return currentTotal;
          },
          0
        );

      return {
        active,
        primary,
        scopes,
      };
    }, [rows]);

  /* =======================================================
     Loading
  ======================================================= */

  if (loadingUser) {
    return <LoadingOrb />;
  }

  /* =======================================================
     Permission Guard
  ======================================================= */

  if (!canView) {
    return (
      <MasterLayout>
        <PageInfoAlert
          type="error"
          title="ไม่มีสิทธิ์เข้าใช้งาน"
          description="คุณไม่มีสิทธิ์ดูหน้ากำหนดบทบาทผู้ใช้งาน"
        />
      </MasterLayout>
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <MasterLayout>
      {/* ===================================================
          Header
      =================================================== */}

      <MasterPageHeader
        icon={
          <SafetyCertificateOutlined />
        }
        title="กำหนดบทบาทผู้ใช้งาน"
        subtitle="กำหนด Role และขอบเขตสังกัดที่ผู้ใช้งานแต่ละคนสามารถเข้าถึงได้"
        loading={loading}
        canCreate={canCreate}
        createText="เพิ่มบทบาทผู้ใช้งาน"
        onCreate={handleCreate}
        onRefresh={loadData}
        onBack={() =>
          router.back()
        }
      />

      {/* ===================================================
          Information
      =================================================== */}

      <PageInfoAlert
        title="การกำหนดสิทธิ์ผู้ใช้งาน"
        description="Role กำหนดว่าผู้ใช้งานทำอะไรได้ ส่วนขอบเขตสังกัดกำหนดว่าสามารถทำกับข้อมูลบริษัท กรุ๊ปสังกัด สังกัด แผนก ฝ่าย หรือหน่วยงานใดได้บ้าง"
      />

      {/* ===================================================
          Search
      =================================================== */}

      <UserAccessAssignmentSearch
        search={search}
        roleId={roleFilter}
        status={statusFilter}
        roles={roles}
        loading={loading}
        masterLoading={
          masterLoading
        }
        onSearchChange={
          setSearch
        }
        onRoleChange={
          handleRoleChange
        }
        onStatusChange={
          handleStatusChange
        }
        onRefresh={loadData}
      />

      {/* ===================================================
          Summary
      =================================================== */}

      <UserAccessAssignmentSummaryCards
        total={total}
        active={summary.active}
        primary={
          summary.primary
        }
        scopes={summary.scopes}
      />

      {/* ===================================================
          Table
      =================================================== */}

      <UserAccessAssignmentTable
        rows={rows}
        loading={
          loading ||
          detailLoading
        }
        page={page}
        pageSize={pageSize}
        total={total}
        canEdit={canEdit}
        canDelete={canDelete}
        deletingId={deletingId}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTableChange={
          handleTableChange
        }
      />

      {/* ===================================================
          Modal
      =================================================== */}

      <UserAccessAssignmentModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        saving={saving}
        masterLoading={
          masterLoading
        }
        userAccounts={
          userAccounts
        }
        roles={roles}
        companies={companies}
        branchGroups={
          branchGroups
        }
        branches={branches}
        departments={
          departments
        }
        divisions={divisions}
        units={units}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </MasterLayout>
  );
}