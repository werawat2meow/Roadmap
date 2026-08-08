"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Form } from "antd";
import usePermissions from "@/hooks/usePermissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import RoleSearch from "./components/RoleSearch";
import RoleSummaryCards from "./components/RoleSummaryCards";
import RoleTable from "./components/RoleTable";
import RoleModal from "./components/RoleModal";
import {getInitialRoleValues,} from "./components/RoleForm";
import {swalError,swalSuccess,} from "@/components/Swal";
import {SafetyOutlined,} from "@ant-design/icons";


const API_URL =
  "/api/admin/roles";

const PERMISSION_API_URL =
  "/api/admin/permissions";

const ROLE_PERMISSION_API_URL =
  "/api/admin/role-permissions";

const DEFAULT_PAGE_SIZE = 20;

function getRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.data?.items
    )
  ) {
    return payload.data.items;
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

function getSavedRoleId(payload) {
  return (
    payload?.data?.id ||
    payload?.data?.role?.id ||
    payload?.role?.id ||
    payload?.id ||
    null
  );
}

function normalizeRoleDetail(role) {
  return {
    id: role?.id || null,

    role_code:
      role?.role_code || "",

    role_name:
      role?.role_name || "",

    description:
      role?.description || "",

    is_active:
      role?.is_active !== false,

    is_system:
      Boolean(role?.is_system),

    permission_ids:
      Array.isArray(
        role?.permission_ids
      )
        ? role.permission_ids
        : Array.isArray(
              role?.permissions
            )
          ? role.permissions
              .map(
                (permission) =>
                  permission?.id
              )
              .filter(Boolean)
          : [],
  };
}

export default function RolesPage() {
  // const router = useRouter();
  const [form] = Form.useForm();
  // const {user,loadingUser,} = useAuth();

  // const canView = hasPermission(user,"access.roles.view");
  // const canCreate = hasPermission(user,"access.roles.create");
  // const canEdit = hasPermission(user,"access.roles.edit");
  // const canDelete = hasPermission(user,"access.roles.delete");
  // const canManagePermissions = hasPermission(user,"access.role_permissions.manage");
  const { user, loadingUser, canView, canCreate, canEdit, canDelete } = usePermissions("access.roles");

  const canEditRole = canEdit;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch,setDebouncedSearch,] = useState("");
  const [statusFilter,setStatusFilter,] = useState("");
  const [roleTypeFilter,setRoleTypeFilter,] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize,setPageSize,] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] =useState(0);

  const [permissions,setPermissions,] = useState([]);
  const [permissionLoading,setPermissionLoading,] = useState(false);
  const [permissionsLoaded,setPermissionsLoaded,] = useState(false);
  const [modalOpen,setModalOpen,] = useState(false);
  const [modalMode,setModalMode,] = useState("create");
  const [selectedRecord,setSelectedRecord,] = useState(null);
  const [detailLoading,setDetailLoading,] = useState(false);
  const [saving, setSaving] =useState(false);
  const [deletingId,setDeletingId,] = useState(null);

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

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          throw new Error(
            text ||
              "API ไม่ได้ส่งข้อมูล JSON กลับมา"
          );
        }

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "เกิดข้อผิดพลาดจาก API"
          );
        }

        return payload;
      },
      []
    );

  /* =======================================================
     Load Roles
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

        if (statusFilter) {
          params.set(
            "is_active",
            statusFilter ===
              "active"
              ? "true"
              : "false"
          );
        }

        const payload =
          await fetchJson(
            `${API_URL}?${params.toString()}`
          );

        let nextRows =
          getRows(payload);

        /*
         * roleTypeFilter กรอง System / Custom
         * ฝั่ง Frontend เพราะ API ปัจจุบัน
         * ยังไม่ได้รับ query is_system
         */

        if (
          roleTypeFilter ===
          "system"
        ) {
          nextRows =
            nextRows.filter(
              (item) =>
                item.is_system === true
            );
        }

        if (
          roleTypeFilter ===
          "custom"
        ) {
          nextRows =
            nextRows.filter(
              (item) =>
                item.is_system !== true
            );
        }

        setRows(nextRows);

        setTotal(
          roleTypeFilter === "all"
            ? getTotal(
                payload,
                nextRows.length
              )
            : nextRows.length
        );
      } catch (error) {
        console.error(
          "LOAD_ROLES_ERROR:",
          error
        );

        await swalError(
          "โหลดข้อมูลไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถโหลดข้อมูล Role ได้"
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
      roleTypeFilter,
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

  const loadPermissions =
    useCallback(async () => {
      if (permissionsLoaded) {
        return;
      }

      setPermissionLoading(true);

      try {
        const payload =
          await fetchJson(
            `${PERMISSION_API_URL}?all=true`
          );

        const permissionRows =
          getRows(payload);

        setPermissions(
          permissionRows.filter(
            (permission) =>
              permission?.is_active !==
              false
          )
        );

        setPermissionsLoaded(true);
      } catch (error) {
        console.error(
          "LOAD_PERMISSION_MASTER_ERROR:",
          error
        );

        await swalError(
          "โหลด Permission ไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถโหลดข้อมูล Permission ได้"
        );

        throw error;
      } finally {
        setPermissionLoading(false);
      }
    }, [
      fetchJson,
      permissionsLoaded,
    ]);

  /* =======================================================
     Load Role Detail
  ======================================================= */

  const loadDetail = useCallback(
    async (roleId) => {
      const roleParams =
        new URLSearchParams();

      roleParams.set(
        "role_id",
        roleId
      );

      const permissionParams =
        new URLSearchParams();

      permissionParams.set(
        "role_id",
        roleId
      );

      const [
        rolePayload,
        rolePermissionPayload,
      ] = await Promise.all([
        fetchJson(
          `${API_URL}?${roleParams.toString()}`
        ),

        fetchJson(
          `${ROLE_PERMISSION_API_URL}?${permissionParams.toString()}`
        ),
      ]);

      const role =
        rolePayload?.data ||
        rolePayload?.role ||
        null;

      if (!role) {
        return null;
      }

      const permissionIds =
        Array.isArray(
          rolePermissionPayload
            ?.permission_ids
        )
          ? rolePermissionPayload
              .permission_ids
          : Array.isArray(
                rolePermissionPayload
                  ?.data
              )
            ? rolePermissionPayload.data
                .map(
                  (item) =>
                    item?.permission_id
                )
                .filter(Boolean)
            : [];

      return {
        ...role,

        permission_ids:
          permissionIds,
      };
    },
    [fetchJson]
  );

  /* =======================================================
     Close Modal
  ======================================================= */

  const closeModal =
    useCallback(() => {
      setModalOpen(false);

      setModalMode("create");

      setSelectedRecord(null);

      form.resetFields();
    }, [form]);

  /* =======================================================
     Create
  ======================================================= */

  const handleCreate =
    useCallback(async () => {
      if (!canCreate) {
        await swalError(
          "ไม่มีสิทธิ์",
          "คุณไม่มีสิทธิ์เพิ่ม Role"
        );

        return;
      }

      try {
        await loadPermissions();

        setSelectedRecord(null);

        setModalMode("create");

        form.resetFields();

        form.setFieldsValue(
          getInitialRoleValues()
        );

        setModalOpen(true);
      } catch {
        /*
         * Error ถูกแสดงใน
         * loadPermissions แล้ว
         */
      }
    }, [
      canCreate,
      form,
      loadPermissions,
    ]);

  /* =======================================================
     Open View / Edit
  ======================================================= */

  const openRecord =
    useCallback(
      async (
        record,
        mode
      ) => {
        if (
          mode === "edit" &&
          !canEditRole
        ) {
          await swalError(
            "ไม่มีสิทธิ์",
            "คุณไม่มีสิทธิ์แก้ไข Role"
          );

          return;
        }

        setDetailLoading(true);

        try {
          await loadPermissions();

          const detail =
            await loadDetail(
              record.id
            );

          if (!detail) {
            throw new Error(
              "ไม่พบรายละเอียด Role"
            );
          }

          const values =
            normalizeRoleDetail(
              detail
            );

          setSelectedRecord(detail);

          setModalMode(mode);

          form.resetFields();

          form.setFieldsValue(
            values
          );

          setModalOpen(true);
        } catch (error) {
          console.error(
            "LOAD_ROLE_DETAIL_ERROR:",
            error
          );

          await swalError(
            "โหลดรายละเอียดไม่สำเร็จ",
            error?.message ||
              "ไม่สามารถโหลดรายละเอียด Role ได้"
          );
        } finally {
          setDetailLoading(false);
        }
      },
      [
        canEditRole,
        form,
        loadDetail,
        loadPermissions,
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
     Build Payload
  ======================================================= */

  const buildPayload = useCallback((values) => {
    const permissionIds =
      Array.isArray(
        values?.permission_ids
      )
        ? [
            ...new Set(
              values.permission_ids
                .map((id) =>
                  String(
                    id || ""
                  ).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    const rolePayload = {
      role_code:
        values?.role_code
          ?.trim()
          .toUpperCase() || "",

      role_name:
        values?.role_name
          ?.trim() || "",

      description:
        values?.description
          ?.trim() || null,

      is_active:
        Boolean(
          values?.is_active
        ),

      is_system:
        Boolean(
          values?.is_system
        ),
    };

    return {
      rolePayload,
      permissionIds,
    };
  }, []);

  const saveRolePermissions = useCallback(
    async (
      roleId,
      permissionIds = []
    ) => {
      if (!roleId) {
        throw new Error(
          "ไม่พบ Role ID สำหรับบันทึก Permission"
        );
      }

      const payload =
        await fetchJson(
          ROLE_PERMISSION_API_URL,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              role_id: roleId,

              permission_ids:
                Array.isArray(
                  permissionIds
                )
                  ? permissionIds
                  : [],
            }),
          }
        );

      if (
        payload?.success !== true
      ) {
        throw new Error(
          payload?.error ||
            "ไม่สามารถบันทึก Permission ได้"
        );
      }

      return payload;
    },
    [fetchJson]
  );

  /* =======================================================
     Submit
  ======================================================= */

  const handleSubmit = useCallback(
    async (
      submittedValues = null
    ) => {
      if (
        modalMode === "view"
      ) {
        closeModal();
        return;
      }

      try {
        const values =
          submittedValues &&
          typeof submittedValues ===
            "object" &&
          !Array.isArray(
            submittedValues
          )
            ? submittedValues
            : await form
                .validateFields();

        const {
          rolePayload,
          permissionIds,
        } = buildPayload(values);

        setSaving(true);

        let savedRoleId = null;

        if (
          modalMode === "create"
        ) {
          const createPayload =
            await fetchJson(
              API_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    rolePayload
                  ),
              }
            );

          savedRoleId =
            getSavedRoleId(
              createPayload
            );

          if (!savedRoleId) {
            throw new Error(
              "สร้าง Role สำเร็จ แต่ API ไม่ได้ส่ง Role ID กลับมา"
            );
          }

          await saveRolePermissions(
            savedRoleId,
            permissionIds
          );

          await swalSuccess(
            "บันทึกสำเร็จ",
            "เพิ่ม Role และ Permission เรียบร้อยแล้ว"
          );
        } else {
          savedRoleId =
            selectedRecord?.id;

          if (!savedRoleId) {
            throw new Error(
              "ไม่พบ Role ID"
            );
          }

          await fetchJson(
            API_URL,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  id: savedRoleId,

                  ...rolePayload,
                }),
            }
          );

          await saveRolePermissions(
            savedRoleId,
            permissionIds
          );

          await swalSuccess(
            "บันทึกสำเร็จ",
            "แก้ไข Role และ Permission เรียบร้อยแล้ว"
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
          "SAVE_ROLE_ERROR:",
          error
        );

        await swalError(
          "บันทึกไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถบันทึก Role และ Permission ได้"
        );
      } finally {
        setSaving(false);
      }
    },
    [
      buildPayload,
      closeModal,
      fetchJson,
      form,
      loadData,
      modalMode,
      saveRolePermissions,
      selectedRecord?.id,
    ]
  );

  /* =======================================================
     Delete

     RoleTable ใช้ DeleteConfirm อยู่แล้ว
     จึงไม่ต้อง Confirm ซ้ำใน page.jsx
  ======================================================= */

  const handleDelete =
    useCallback(
      async (record) => {
        if (!canDelete) {
          await swalError(
            "ไม่มีสิทธิ์",
            "คุณไม่มีสิทธิ์ลบ Role"
          );

          return;
        }

        if (record?.is_system) {
          await swalError(
            "ไม่สามารถลบได้",
            "System Role ไม่สามารถลบได้"
          );

          return;
        }

        setDeletingId(record.id);

        try {
          const params =
            new URLSearchParams();

          params.set(
            "id",
            record.id
          );

          await fetchJson(
            `${API_URL}?${params.toString()}`,
            {
              method: "DELETE",
            }
          );

          await swalSuccess(
            "ลบสำเร็จ",
            "ลบ Role และ Permission เรียบร้อยแล้ว"
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
            "DELETE_ROLE_ERROR:",
            error
          );

          await swalError(
            "ลบไม่สำเร็จ",
            error?.message ||
              "ไม่สามารถลบ Role ได้"
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
          pagination?.current || 1;

        const nextPageSize =
          pagination?.pageSize ||
          DEFAULT_PAGE_SIZE;

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

  const handleStatusChange = useCallback((value) => {
      setStatusFilter(
        value || ""
      );

      setPage(1);
    }, []);

  const handleRoleTypeChange = useCallback((value) => {
    setRoleTypeFilter(
      value || "all"
    );

    setPage(1);
  }, []);

  /* =======================================================
     Summary
  ======================================================= */

  const summary = useMemo(() => {
    const active = rows.filter((role) => role.is_active === true).length;
    const system = rows.filter((role) => role.is_system === true).length;
    const permissionCount = rows.reduce((currentTotal,role) => {
      const count = Number(role?.permission_count);
        if (Number.isFinite(count)) {
          return (
            currentTotal + count
          );
        }

        if (Array.isArray(role?.permission_ids)) {
          return (
            currentTotal +
            role.permission_ids
              .length
          );
        }

        if (Array.isArray(role?.permissions)) {
          return (
            currentTotal +
            role.permissions
              .length
          );
        }
        return currentTotal;
      },0
    );

    return {
      active,
      system,
      permissions:
        permissionCount,
    };
  }, [rows]);

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) {
    return (
      <MasterLayout>
        <PageInfoAlert
          type="error"
          title="ไม่มีสิทธิ์เข้าใช้งาน"
          description="คุณไม่มีสิทธิ์ดูหน้าบทบาทและสิทธิ์ผู้ใช้งาน"
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
        icon={<SafetyOutlined />}
        title="บทบาทและสิทธิ์ผู้ใช้งาน"
        subtitle="จัดการ Role และกำหนด Permission สำหรับการเข้าถึงเมนูและ Action ภายในระบบ"
        loading={loading}
        canCreate={canCreate}
        createText="เพิ่ม Role"
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
        title="Role และ Permission"
        description="Role คือชุดบทบาทของผู้ใช้งาน ส่วน Permission กำหนดว่า Role สามารถเข้าเมนูใดและทำ Action ใดได้ ขอบเขตบริษัทหรือสังกัดจะกำหนดแยกในหน้ากำหนดบทบาทผู้ใช้งาน"
      />

      {/* ===================================================
          Search
      =================================================== */}

      <RoleSearch
        search={search}
        status={statusFilter}
        roleType={
          roleTypeFilter
        }
        loading={loading}
        onSearchChange={
          setSearch
        }
        onStatusChange={
          handleStatusChange
        }
        onRoleTypeChange={
          handleRoleTypeChange
        }
        onRefresh={loadData}
      />

      {/* ===================================================
          Summary
      =================================================== */}

      <RoleSummaryCards
        total={total}
        active={summary.active}
        system={summary.system}
        permissions={
          summary.permissions
        }
      />

      {/* ===================================================
          Table
      =================================================== */}

      <RoleTable
        rows={rows}
        loading={
          loading ||
          detailLoading
        }
        page={page}
        pageSize={pageSize}
        total={total}
        canEdit={canEditRole}
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

      <RoleModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        saving={saving}
        permissionLoading={
          permissionLoading
        }
        permissions={
          permissions
        }
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </MasterLayout>
  );
}