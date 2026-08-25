"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import UserAccountSearch from "./components/UserAccountSearch";
import UserAccountSummaryCards from "./components/UserAccountSummaryCards";
import UserAccountTable from "./components/UserAccountTable";
import UserAccountModal from "./components/UserAccountModal";

const DEFAULT_PAGE_SIZE = 20;
const OPTION_PAGE_SIZE = 20;

function mergeOptions(...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const option of group || []) {
      if (!option?.value) {
        continue;
      }

      map.set(String(option.value), option);
    }
  }

  return [...map.values()];
}

function employeeFallbackOption(record) {
  if (!record?.employee_id) {
    return [];
  }

  return [
    {
      value: record.employee_id,
      label: `${
        record.employee_code || "-"
      } - ${record.employee_name || "-"}`,
    },
  ];
}

function roleFallbackOption(record) {
  if (!record?.role_id) {
    return [];
  }

  return [
    {
      value: record.role_id,
      label: `${record.role_code || "-"} - ${
        record.role_name || "-"
      }`,
    },
  ];
}

export default function UserAccountsPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const { user, loadingUser, refreshUser } =
    useAuth();

  const canView = hasPermission(
    user,
    "access.user_accounts.view"
  );
  const canCreate = hasPermission(
    user,
    "access.user_accounts.create"
  );
  const canEdit = hasPermission(
    user,
    "access.user_accounts.edit"
  );
  const canDelete = hasPermission(
    user,
    "access.user_accounts.delete"
  );
  const canResetPassword = hasPermission(
    user,
    "access.user_accounts.reset_password"
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    DEFAULT_PAGE_SIZE
  );
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const [employeeOptions, setEmployeeOptions] =
    useState([]);
  const [employeeLoading, setEmployeeLoading] =
    useState(false);
  const [employeePage, setEmployeePage] =
    useState(1);
  const [employeeTotalPages, setEmployeeTotalPages] =
    useState(1);
  const [employeeKeyword, setEmployeeKeyword] =
    useState("");

  const [roleOptions, setRoleOptions] =
    useState([]);
  const [roleLoading, setRoleLoading] =
    useState(false);

  const employeeSearchTimerRef = useRef(null);
  const roleSearchTimerRef = useRef(null);

  const optionAction = useMemo(() => {
    if (viewMode) {
      return "view";
    }

    return editing ? "edit" : "create";
  }, [editing, viewMode]);

  const fetchUserAccounts = useCallback(
    async () => {
      if (!canView) {
        return;
      }

      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        const response = await fetch(
          `/api/admin/user-accounts?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถโหลดบัญชีผู้ใช้งานได้"
          );
        }

        setRows(result.data || []);
        setSummary(result.summary || {});
        setTotal(result.pagination?.total || 0);
      } catch (error) {
        console.error(error);
        swalError(
          error?.message ||
            "ไม่สามารถโหลดบัญชีผู้ใช้งานได้"
        );
      } finally {
        setLoading(false);
      }
    }, [
      canView,
      page,
      pageSize,
      search,
      status,
    ]
  );

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
    user,
    loadingUser,
    canView,
    router,
  ]);

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchUserAccounts();
  }, [
    loadingUser,
    user,
    canView,
    fetchUserAccounts,
  ]);

  useEffect(() => {
    return () => {
      if (employeeSearchTimerRef.current) {
        clearTimeout(
          employeeSearchTimerRef.current
        );
      }

      if (roleSearchTimerRef.current) {
        clearTimeout(
          roleSearchTimerRef.current
        );
      }
    };
  }, []);

  const loadEmployeeOptions = useCallback(
    async ({
      keyword = "",
      nextPage = 1,
      append = false,
      action = optionAction,
      fallbackRecord = editing,
    } = {}) => {
      try {
        setEmployeeLoading(true);

        const params = new URLSearchParams({
          type: "employees",
          action,
          page: String(nextPage),
          pageSize: String(OPTION_PAGE_SIZE),
        });

        if (keyword.trim()) {
          params.set("search", keyword.trim());
        }

        const response = await fetch(
          `/api/admin/user-accounts/options?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถโหลดรายชื่อพนักงานได้"
          );
        }

        setEmployeeOptions((previous) => {
          const fallback =
            employeeFallbackOption(
              fallbackRecord
            );

          return append
            ? mergeOptions(
                fallback,
                previous,
                result.data || []
              )
            : mergeOptions(
                fallback,
                result.data || []
              );
        });

        setEmployeePage(
          result.pagination?.page || nextPage
        );
        setEmployeeTotalPages(
          result.pagination?.totalPages || 1
        );
        setEmployeeKeyword(keyword);
      } catch (error) {
        console.error(error);
        swalError(
          error?.message ||
            "ไม่สามารถโหลดรายชื่อพนักงานได้"
        );
      } finally {
        setEmployeeLoading(false);
      }
    },
    [editing, optionAction]
  );

  const loadRoleOptions = useCallback(
    async ({
      keyword = "",
      action = optionAction,
      fallbackRecord = editing,
    } = {}) => {
      try {
        setRoleLoading(true);

        const params = new URLSearchParams({
          type: "roles",
          action,
          page: "1",
          pageSize: "100",
        });

        if (keyword.trim()) {
          params.set("search", keyword.trim());
        }

        const response = await fetch(
          `/api/admin/user-accounts/options?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "ไม่สามารถโหลด Role ได้"
          );
        }

        setRoleOptions(
          mergeOptions(
            roleFallbackOption(
              fallbackRecord
            ),
            result.data || []
          )
        );
      } catch (error) {
        console.error(error);
        swalError(
          error?.message ||
            "ไม่สามารถโหลด Role ได้"
        );
      } finally {
        setRoleLoading(false);
      }
    },
    [editing, optionAction]
  );

  const resetModal = useCallback(() => {
    form.resetFields();
    setEditing(null);
    setViewMode(false);
    setEmployeeOptions([]);
    setRoleOptions([]);
    setEmployeePage(1);
    setEmployeeTotalPages(1);
    setEmployeeKeyword("");
  }, [form]);

  const handleCreate = async () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มบัญชีผู้ใช้งาน"
      );
      return;
    }

    resetModal();

    form.setFieldsValue({
      employee_id: null,
      role_id: null,
      username: "",
      password: "",
      is_active: true,
    });

    setOpen(true);

    await Promise.all([
      loadEmployeeOptions({
        action: "create",
        fallbackRecord: null,
      }),
      loadRoleOptions({
        action: "create",
        fallbackRecord: null,
      }),
    ]);
  };

  const handleView = (record) => {
    setEditing(record);
    setViewMode(true);

    setEmployeeOptions(
      employeeFallbackOption(record)
    );
    setRoleOptions(
      roleFallbackOption(record)
    );

    form.setFieldsValue({
      employee_id: record.employee_id || null,
      role_id: record.role_id || null,
      username: record.username || "",
      is_active: Boolean(record.is_active),
    });

    setOpen(true);
  };

  const handleEdit = async (record) => {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขบัญชีผู้ใช้งาน"
      );
      return;
    }

    if (
      record?.username?.toLowerCase() ===
      "admin"
    ) {
      swalError(
        "ไม่สามารถแก้ไขผู้ใช้งาน admin ได้"
      );
      return;
    }

    setEditing(record);
    setViewMode(false);

    setEmployeeOptions(
      employeeFallbackOption(record)
    );
    setRoleOptions(
      roleFallbackOption(record)
    );

    form.setFieldsValue({
      employee_id: record.employee_id || null,
      role_id: record.role_id || null,
      username: record.username || "",
      is_active: Boolean(record.is_active),
    });

    setOpen(true);

    await Promise.all([
      loadEmployeeOptions({
        action: "edit",
        fallbackRecord: record,
      }),
      loadRoleOptions({
        action: "edit",
        fallbackRecord: record,
      }),
    ]);
  };

  const handleClose = () => {
    setOpen(false);
    resetModal();
  };

  const handleSubmit = async (values) => {
    const isEdit = Boolean(editing);

    if (isEdit && !canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขบัญชีผู้ใช้งาน"
      );
      return;
    }

    if (!isEdit && !canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มบัญชีผู้ใช้งาน"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        isEdit
          ? `/api/admin/user-accounts/${editing.id}`
          : "/api/admin/user-accounts",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id:
              values.employee_id || null,
            role_id: values.role_id || null,
            username: String(
              values.username || ""
            ).trim(),
            password: isEdit
              ? null
              : String(
                  values.password || ""
                ).trim(),
            is_active:
              values.is_active ?? true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "ไม่สามารถบันทึกบัญชีผู้ใช้งานได้"
        );
      }

      await swalSuccess(
        result?.message ||
          "บันทึกบัญชีผู้ใช้งานสำเร็จ"
      );

      const editedCurrentUser =
        isEdit &&
        String(editing?.id || "") ===
          String(user?.id || "");

      handleClose();

      if (editedCurrentUser) {
        await refreshUser?.({
          silent: true,
        });
      }

      await fetchUserAccounts();
    } catch (error) {
      console.error(error);
      swalError(
        error?.message ||
          "ไม่สามารถบันทึกบัญชีผู้ใช้งานได้"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete) {
      swalError(
        "คุณไม่มีสิทธิ์ลบบัญชีผู้ใช้งาน"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/user-accounts/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "ไม่สามารถลบบัญชีผู้ใช้งานได้"
        );
      }

      await swalSuccess(
        result?.message ||
          "ลบบัญชีผู้ใช้งานสำเร็จ"
      );

      if (rows.length === 1 && page > 1) {
        setPage((current) =>
          Math.max(current - 1, 1)
        );
        return;
      }

      await fetchUserAccounts();
    } catch (error) {
      console.error(error);
      swalError(
        error?.message ||
          "ไม่สามารถลบบัญชีผู้ใช้งานได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (record) => {
    if (!canResetPassword) {
      swalError(
        "คุณไม่มีสิทธิ์ Reset Password"
      );
      return;
    }

    const confirmed = await swalConfirm({
      title: "ยืนยัน Reset Password",
      text: `Reset Password ของ "${
        record.username || "-"
      }" กลับเป็นรหัสพนักงานใช่หรือไม่`,
    });

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/user-accounts/${record.id}/reset-password`,
        {
          method: "PATCH",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "ไม่สามารถ Reset Password ได้"
        );
      }

      const temporaryPassword =
        result?.data?.temporary_password;

      await swalSuccess(
        temporaryPassword
          ? `Reset Password สำเร็จ รหัสผ่านชั่วคราว: ${temporaryPassword}`
          : result?.message ||
              "Reset Password สำเร็จ"
      );

      await fetchUserAccounts();
    } catch (error) {
      console.error(error);
      swalError(
        error?.message ||
          "ไม่สามารถ Reset Password ได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSearch = (value) => {
    if (employeeSearchTimerRef.current) {
      clearTimeout(
        employeeSearchTimerRef.current
      );
    }

    employeeSearchTimerRef.current =
      setTimeout(() => {
        loadEmployeeOptions({
          keyword: value,
          nextPage: 1,
          append: false,
        });
      }, 300);
  };

  const handleEmployeePopupScroll = (event) => {
    const target = event.currentTarget;

    const nearBottom =
      target.scrollTop + target.offsetHeight >=
      target.scrollHeight - 24;

    if (
      !nearBottom ||
      employeeLoading ||
      employeePage >= employeeTotalPages
    ) {
      return;
    }

    loadEmployeeOptions({
      keyword: employeeKeyword,
      nextPage: employeePage + 1,
      append: true,
    });
  };

  const handleRoleSearch = (value) => {
    if (roleSearchTimerRef.current) {
      clearTimeout(roleSearchTimerRef.current);
    }

    roleSearchTimerRef.current = setTimeout(
      () => {
        loadRoleOptions({
          keyword: value,
        });
      },
      300
    );
  };

  const handleSearch = (value) => {
    setRows([]);
    setPage(1);
    setSearch(value);
  };

  const handleStatusChange = (value) => {
    setRows([]);
    setPage(1);
    setStatus(value);
  };

  const handleTableChange = (pagination) => {
    setRows([]);
    setPage(pagination.current || 1);
    setPageSize(
      pagination.pageSize || DEFAULT_PAGE_SIZE
    );
  };

  if (loadingUser) {
    return <LoadingOrb />;
  }

  if (!user || !canView) {
    return null;
  }

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            title="บัญชีผู้ใช้งาน"
            subtitle="User Account Management"
            loading={loading}
            canCreate={canCreate}
            createText="เพิ่มผู้ใช้งาน"
            onCreate={handleCreate}
            onRefresh={fetchUserAccounts}
          />

          <PageInfoAlert description="หน้านี้ใช้จัดการบัญชีเข้าสู่ระบบ โดย Permission ควบคุมสิทธิ์ View / Create / Edit / Delete / Reset Password และข้อมูลพนักงานถูกจำกัดตาม Scope Company → Branch Group → Branch → Department → Division → Unit" />
        </>
      }
      search={
        <UserAccountSearch
          loading={loading}
          search={search}
          status={status}
          onSearch={handleSearch}
          onStatusChange={
            handleStatusChange
          }
          onRefresh={fetchUserAccounts}
        />
      }
      summary={
        <UserAccountSummaryCards
          summary={summary}
        />
      }
      toolbar={null}
      table={
        <UserAccountTable
          data={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          canResetPassword={
            canResetPassword
          }
          currentUserAccountId={user?.id}
          onChange={handleTableChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={
            handleResetPassword
          }
        />
      }
      modal={
        <UserAccountModal
          open={open}
          form={form}
          editing={editing}
          viewMode={viewMode}
          saving={saving}
          employeeOptions={employeeOptions}
          employeeLoading={employeeLoading}
          onEmployeeSearch={
            handleEmployeeSearch
          }
          onEmployeePopupScroll={
            handleEmployeePopupScroll
          }
          roleOptions={roleOptions}
          roleLoading={roleLoading}
          onRoleSearch={handleRoleSearch}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      }
    />
  );
}
