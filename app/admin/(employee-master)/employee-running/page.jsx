"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Form,
  message,
  Modal,
} from "antd";

import {
  FieldNumberOutlined,
} from "@ant-design/icons";

import { useRouter } from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import EmployeeRunningSearch from "./components/EmployeeRunningSearch";
import EmployeeRunningSummaryCards from "./components/EmployeeRunningSummaryCards";
import EmployeeRunningTable from "./components/EmployeeRunningTable";
import EmployeeRunningModal from "./components/EmployeeRunningModal";

const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_FORM_VALUES = {
  company_id: undefined,

  employee_code_setting_id:
    undefined,

  running_year:
    new Date().getFullYear(),

  running_month: null,

  current_running: 0,

  last_employee_code: null,

  last_employee_id: null,

  last_generated_at: null,

  status: "active",

  remark: "",
};

function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function getApiMessage(
  result,
  fallback
) {
  return (
    result?.message ||
    result?.error ||
    fallback
  );
}

function normalizeListResponse(result) {
  const rows = Array.isArray(
    result?.data
  )
    ? result.data
    : [];

  const pagination =
    result?.pagination || {};

  return {
    rows,

    total:
      Number(pagination.total) ||
      Number(result?.total) ||
      rows.length,

    page:
      Number(pagination.page) || 1,

    pageSize:
      Number(pagination.pageSize) ||
      DEFAULT_PAGE_SIZE,

    totalPages:
      Number(
        pagination.totalPages
      ) || 1,
  };
}

function normalizeNullableText(value) {
  const cleaned = cleanText(value);

  return cleaned || null;
}

function normalizeInteger(
  value,
  fallback = 0
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return parsed;
}

function normalizeMonth(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > 12
  ) {
    return null;
  }

  return parsed;
}

function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value?.toISOString ===
    "function"
  ) {
    return value.toISOString();
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value
      .toDate()
      .toISOString();
  }

  return null;
}

function buildSubmitPayload(values) {
  return {
    company_id:
      normalizeNullableText(
        values.company_id
      ),

    employee_code_setting_id:
      normalizeNullableText(
        values.employee_code_setting_id
      ),

    running_year:
      normalizeInteger(
        values.running_year,
        new Date().getFullYear()
      ),

    running_month:
      normalizeMonth(
        values.running_month
      ),

    current_running:
      normalizeInteger(
        values.current_running,
        0
      ),

    last_employee_code:
      normalizeNullableText(
        values.last_employee_code
      ),

    last_employee_id:
      normalizeNullableText(
        values.last_employee_id
      ),

    last_generated_at:
      normalizeDateTime(
        values.last_generated_at
      ),

    status:
      cleanText(values.status) ||
      "active",

    remark:
      normalizeNullableText(
        values.remark
      ),
  };
}

export default function EmployeeRunningPage() {
  const router = useRouter();
  const {user,loadingUser: authLoading,} = useAuth();
  const [form] = Form.useForm();

  const canView = useMemo(() =>hasPermission(user,"ems.employee_running.view"),[user]);
  const canCreate = useMemo(() =>hasPermission(user,"ems.employee_running.create"),[user]);
  const canEdit = useMemo(() =>hasPermission(user,"ems.employee_running.edit"),[user]);
  const canDelete = useMemo(() =>hasPermission(user,"ems.employee_running.delete"),[user]);

  const [employeeRunningNumbers,setEmployeeRunningNumbers,] = useState([]);
  const [companies,setCompanies,] = useState([]);
  const [settings,setSettings,] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [debouncedSearch,setDebouncedSearch] = useState("");
  const [companyId,setCompanyId,] = useState("");
  const [settingId,setSettingId,] = useState("");
  const [runningYear,setRunningYear,] = useState("");
  const [runningMonth,setRunningMonth,] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyLoading,setCompanyLoading,] = useState(false);
  const [settingLoading,setSettingLoading,] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId,setDeletingId,] = useState(null);
  const [modalOpen,setModalOpen,] = useState(false);
  const [modalMode,setModalMode,] = useState("create");
  const [selectedRecord,setSelectedRecord,] = useState(null);
  const modalDisabled = modalMode === "view";

  const modalTitle = useMemo(() => {
    if (modalMode === "view") {
      return "รายละเอียด Running Number";
    }

    if (modalMode === "edit") {
      return "แก้ไข Running Number";
    }

    return "เพิ่ม Running Number";
  }, [modalMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(
        search.trim()
      );

      setPage(1);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (authLoading) {
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
    authLoading,
    user,
    canView,
    router,
  ]);

  const fetchCompanies =
    useCallback(async () => {
      if (!canView) {
        return;
      }

      setCompanyLoading(true);

      try {
        const response = await fetch(
          "/api/admin/companies?all=true&status=active",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          message.error(
            getApiMessage(
              result,
              "ไม่สามารถโหลดข้อมูลบริษัทได้"
            )
          );

          return;
        }

        setCompanies(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          "fetchCompanies error:",
          error
        );

        message.error(
          error?.message ||
            "ไม่สามารถโหลดข้อมูลบริษัทได้"
        );
      } finally {
        setCompanyLoading(false);
      }
    }, [canView]);

  const fetchSettings =
    useCallback(async () => {
      if (!canView) {
        return;
      }

      setSettingLoading(true);

      try {
        const params =
          new URLSearchParams();

        params.set("all", "true");
        params.set(
          "status",
          "active"
        );

        const response = await fetch(
          `/api/admin/employee-code-settings?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          message.error(
            getApiMessage(
              result,
              "ไม่สามารถโหลดรูปแบบรหัสพนักงานได้"
            )
          );

          return;
        }

        setSettings(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          "fetchSettings error:",
          error
        );

        message.error(
          error?.message ||
            "ไม่สามารถโหลดรูปแบบรหัสพนักงานได้"
        );
      } finally {
        setSettingLoading(false);
      }
    }, [canView]);

  const fetchEmployeeRunningNumbers =
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

        if (companyId) {
          params.set(
            "company_id",
            companyId
          );
        }

        if (settingId) {
          params.set(
            "employee_code_setting_id",
            settingId
          );
        }

        if (runningYear !== "") {
          params.set(
            "running_year",
            String(runningYear)
          );
        }

        if (runningMonth !== "") {
          params.set(
            "running_month",
            String(runningMonth)
          );
        }

        if (status) {
          params.set(
            "status",
            status
          );
        }

        const response = await fetch(
          `/api/admin/employee-running?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          message.error(
            getApiMessage(
              result,
              "ไม่สามารถโหลดข้อมูล Running Number ได้"
            )
          );

          setEmployeeRunningNumbers(
            []
          );

          setTotal(0);

          return;
        }

        const normalized =
          normalizeListResponse(result);

        setEmployeeRunningNumbers(
          normalized.rows
        );

        setTotal(normalized.total);

        const totalPages = Math.max(
          Math.ceil(
            normalized.total /
              pageSize
          ),
          1
        );

        if (page > totalPages) {
          setPage(totalPages);
        }
      } catch (error) {
        console.error(
          "fetchEmployeeRunningNumbers error:",
          error
        );

        setEmployeeRunningNumbers(
          []
        );

        setTotal(0);

        message.error(
          error?.message ||
            "ไม่สามารถโหลดข้อมูล Running Number ได้"
        );
      } finally {
        setLoading(false);
      }
    }, [
      canView,
      page,
      pageSize,
      debouncedSearch,
      companyId,
      settingId,
      runningYear,
      runningMonth,
      status,
    ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchCompanies();
    fetchSettings();
  }, [
    authLoading,
    user,
    canView,
    fetchCompanies,
    fetchSettings,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchEmployeeRunningNumbers();
  }, [
    authLoading,
    user,
    canView,
    fetchEmployeeRunningNumbers,
  ]);

  const summary = useMemo(() => {
    const active =
      employeeRunningNumbers.filter(
        (item) =>
          item.status === "active"
      ).length;

    const inactive =
      employeeRunningNumbers.filter(
        (item) =>
          item.status === "inactive"
      ).length;

    const maxRunning =
      employeeRunningNumbers.reduce(
        (max, item) =>
          Math.max(
            max,
            Number(
              item.current_running || 0
            )
          ),
        0
      );

    return {
      total,
      active,
      inactive,
      maxRunning,
    };
  }, [
    employeeRunningNumbers,
    total,
  ]);

  const handleCreate =
    useCallback(() => {
      if (!canCreate) {
        message.warning(
          "คุณไม่มีสิทธิ์เพิ่มข้อมูล"
        );

        return;
      }

      setSelectedRecord(null);
      setModalMode("create");

      form.resetFields();

      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
      });

      setModalOpen(true);
    }, [
      canCreate,
      form,
    ]);

  const handleView =
    useCallback(
      (record) => {
        setSelectedRecord(record);
        setModalMode("view");

        form.resetFields();

        form.setFieldsValue({
          company_id:
            record.company_id,

          employee_code_setting_id:
            record.employee_code_setting_id,

          running_year:
            Number(
              record.running_year
            ),

          running_month:
            record.running_month ===
              null ||
            record.running_month ===
              undefined
              ? null
              : Number(
                  record.running_month
                ),

          current_running:
            Number(
              record.current_running ||
                0
            ),

          last_employee_code:
            record.last_employee_code ||
            null,

          last_employee_id:
            record.last_employee_id ||
            null,

          last_generated_at:
            record.last_generated_at ||
            null,

          status:
            record.status ||
            "active",

          remark:
            record.remark || "",
        });

        setModalOpen(true);
      },
      [form]
    );

  const handleEdit =
    useCallback(
      (record) => {
        if (!canEdit) {
          message.warning(
            "คุณไม่มีสิทธิ์แก้ไขข้อมูล"
          );

          return;
        }

        setSelectedRecord(record);
        setModalMode("edit");

        form.resetFields();

        form.setFieldsValue({
          company_id:
            record.company_id,

          employee_code_setting_id:
            record.employee_code_setting_id,

          running_year:
            Number(
              record.running_year
            ),

          running_month:
            record.running_month ===
              null ||
            record.running_month ===
              undefined
              ? null
              : Number(
                  record.running_month
                ),

          current_running:
            Number(
              record.current_running ||
                0
            ),

          last_employee_code:
            record.last_employee_code ||
            null,

          last_employee_id:
            record.last_employee_id ||
            null,

          last_generated_at:
            record.last_generated_at ||
            null,

          status:
            record.status ||
            "active",

          remark:
            record.remark || "",
        });

        setModalOpen(true);
      },
      [
        canEdit,
        form,
      ]
    );

  const handleEditFromView =
    useCallback(() => {
      if (!canEdit) {
        message.warning(
          "คุณไม่มีสิทธิ์แก้ไขข้อมูล"
        );

        return;
      }

      setModalMode("edit");
    }, [canEdit]);

  const handleCloseModal =
    useCallback(() => {
      if (saving) {
        return;
      }

      setModalOpen(false);
      setSelectedRecord(null);
      setModalMode("create");

      form.resetFields();
    }, [
      saving,
      form,
    ]);

  const handleSubmit =
    useCallback(async () => {
      if (modalMode === "view") {
        handleCloseModal();
        return;
      }

      if (
        modalMode === "create" &&
        !canCreate
      ) {
        message.warning(
          "คุณไม่มีสิทธิ์เพิ่มข้อมูล"
        );

        return;
      }

      if (
        modalMode === "edit" &&
        !canEdit
      ) {
        message.warning(
          "คุณไม่มีสิทธิ์แก้ไขข้อมูล"
        );

        return;
      }

      try {
        const values =
          await form.validateFields();

        const payload =
          buildSubmitPayload(values);

        if (!payload.company_id) {
          message.warning(
            "กรุณาเลือกบริษัท"
          );

          return;
        }

        if (
          !payload.employee_code_setting_id
        ) {
          message.warning(
            "กรุณาเลือกรูปแบบรหัสพนักงาน"
          );

          return;
        }

        const selectedSetting =
          settings.find(
            (item) =>
              item.id ===
              payload.employee_code_setting_id
          );

        if (!selectedSetting) {
          message.warning(
            "ไม่พบรูปแบบรหัสพนักงานที่เลือก"
          );

          return;
        }

        if (
          selectedSetting.company_id !==
          payload.company_id
        ) {
          message.warning(
            "รูปแบบรหัสพนักงานไม่ได้อยู่ในบริษัทที่เลือก"
          );

          return;
        }

        if (
          selectedSetting.reset_policy ===
          "monthly"
        ) {
          if (
            payload.running_month ===
            null
          ) {
            message.warning(
              "กรุณาเลือกเดือน Running"
            );

            return;
          }
        }

        if (
          selectedSetting.reset_policy ===
          "yearly"
        ) {
          payload.running_month =
            null;
        }

        if (
          selectedSetting.reset_policy ===
          "never"
        ) {
          payload.running_year = 0;
          payload.running_month =
            null;
        }

        if (
          payload.current_running < 0
        ) {
          message.warning(
            "เลข Running ปัจจุบันต้องไม่น้อยกว่า 0"
          );

          return;
        }

        const isEdit =
          modalMode === "edit";

        if (
          isEdit &&
          !selectedRecord?.id
        ) {
          message.error(
            "ไม่พบรหัสรายการที่ต้องการแก้ไข"
          );

          return;
        }

        setSaving(true);

        const url = isEdit
          ? `/api/admin/employee-running/${selectedRecord.id}`
          : "/api/admin/employee-running";

        const response = await fetch(
          url,
          {
            method: isEdit
              ? "PATCH"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

        let result = null;

        try {
          result =
            await response.json();
        } catch {
          result = null;
        }

        if (!response.ok) {
          message.error(
            getApiMessage(
              result,
              isEdit
                ? "ไม่สามารถแก้ไข Running Number ได้"
                : "ไม่สามารถเพิ่ม Running Number ได้"
            )
          );

          return;
        }

        message.success(
          result?.message ||
            (isEdit
              ? "แก้ไข Running Number เรียบร้อยแล้ว"
              : "เพิ่ม Running Number เรียบร้อยแล้ว")
        );

        setModalOpen(false);
        setSelectedRecord(null);
        setModalMode("create");

        form.resetFields();

        if (!isEdit && page !== 1) {
          setPage(1);
          return;
        }

        await fetchEmployeeRunningNumbers();
      } catch (error) {
        if (error?.errorFields) {
          return;
        }

        console.error(
          "handleSubmit unexpected error:",
          error
        );

        message.error(
          error?.message ||
            "เกิดข้อผิดพลาดในการบันทึก Running Number"
        );
      } finally {
        setSaving(false);
      }
    }, [
      modalMode,
      canCreate,
      canEdit,
      handleCloseModal,
      form,
      settings,
      selectedRecord,
      page,
      fetchEmployeeRunningNumbers,
    ]);

  const executeDelete =
    useCallback(
      async (record) => {
        setDeletingId(record.id);

        try {
          const response = await fetch(
            `/api/admin/employee-running/${record.id}`,
            {
              method: "DELETE",
            }
          );

          let result = null;

          try {
            result =
              await response.json();
          } catch {
            result = null;
          }

          if (!response.ok) {
            message.error(
              getApiMessage(
                result,
                "ไม่สามารถลบ Running Number ได้"
              )
            );

            return;
          }

          message.success(
            result?.message ||
              "ลบ Running Number เรียบร้อยแล้ว"
          );

          if (
            employeeRunningNumbers.length ===
              1 &&
            page > 1
          ) {
            setPage(
              (current) =>
                Math.max(
                  current - 1,
                  1
                )
            );

            return;
          }

          await fetchEmployeeRunningNumbers();
        } catch (error) {
          console.error(
            "executeDelete error:",
            error
          );

          message.error(
            error?.message ||
              "เกิดข้อผิดพลาดในการลบ Running Number"
          );
        } finally {
          setDeletingId(null);
        }
      },
      [
        employeeRunningNumbers.length,
        page,
        fetchEmployeeRunningNumbers,
      ]
    );

  const handleDelete =useCallback((record) => {
      if (!canDelete) {
        message.warning(
          "คุณไม่มีสิทธิ์ลบข้อมูล"
        );

        return;
      }

      if (
        Number(
          record.current_running || 0
        ) > 0 ||
        record.last_employee_code ||
        record.last_employee_id
      ) {
        message.warning(
          "ไม่สามารถลบ Running Number ที่ถูกใช้งานแล้ว กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน"
        );

        return;
      }

      Modal.confirm({
        title:
          "ยืนยันการลบ Running Number",

        content: (
          <div>
            ต้องการลบ Running Number ของ{" "}
            <strong>
              {record
                ?.employee_code_settings
                ?.code_name || "-"}
            </strong>{" "}
            ใช่หรือไม่
          </div>
        ),

        okText: "ลบ",

        cancelText: "ยกเลิก",

        okButtonProps: {
          danger: true,
        },

        centered: true,

        onOk: async () => {
          await executeDelete(
            record
          );
        },
      });
    },
    [
      canDelete,
      executeDelete,
    ]
  );

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleCompanyChange = useCallback((value) => {
    setCompanyId(value || "");
    setSettingId("");
    setPage(1);
  }, []);

  const handleSettingChange = useCallback((value) => {
    setSettingId(value || "");
    setPage(1);
  }, []);

  const handleRunningYearChange = useCallback((value) => {
    setRunningYear(
      value === undefined ||
        value === null
        ? ""
        : String(value)
    );

    setPage(1);
  }, []);

  const handleRunningMonthChange = useCallback((value) => {
    setRunningMonth(
      value === undefined ||
        value === null
        ? ""
        : String(value)
    );

    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value || "");
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");

    setCompanyId("");
    setSettingId("");

    setRunningYear("");
    setRunningMonth("");

    setStatus("");

    setPage(1);
  }, []);

  const handleTableChange = useCallback((pagination) => {
    const nextPage =  pagination?.current || 1;
    const nextPageSize = pagination?.pageSize || DEFAULT_PAGE_SIZE;
      if (nextPageSize !== pageSize) {
        setPageSize(
          nextPageSize
        );
        setPage(1);
        return;
      }
      setPage(nextPage);
    },
    [pageSize]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchCompanies(),
      fetchSettings(),
      fetchEmployeeRunningNumbers(),
    ]);
  }, [
    fetchCompanies,
    fetchSettings,
    fetchEmployeeRunningNumbers,
  ]);

  if (authLoading) {
    return <LoadingOrb />;
  }

  if (!user || !canView) {
    return <LoadingOrb />;
  }

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            icon={
              <FieldNumberOutlined className="text-blue-600" />
            }
            title="Running Number"
            subtitle="จัดการเลข Running สำหรับสร้างรหัสพนักงาน แยกตามบริษัท รูปแบบรหัส ปี และเดือน"
            loading={loading}
            canRefresh
            canCreate={canCreate}
            createText="เพิ่ม Running Number"
            onRefresh={handleRefresh}
            onCreate={handleCreate}
          />
        
          <PageInfoAlert
            title="การจัดการ Running Number"
            description="Running Number ใช้เก็บเลขล่าสุดของรูปแบบรหัสพนักงานแต่ละบริษัท ระบบที่รีเซ็ตรายปีจะแยกตามปี ระบบที่รีเซ็ตรายเดือนจะแยกตามปีและเดือน ส่วนแบบไม่รีเซ็ตจะใช้ Running ต่อเนื่อง"
          />
        
        </>
      }

      search={
        <EmployeeRunningSearch
          search={search}
          companyId={companyId}
          settingId={settingId}
          runningYear={runningYear}
          runningMonth={
            runningMonth
          }
          status={status}
          companies={companies}
          settings={settings}
          loading={loading}
          companyLoading={
            companyLoading
          }
          settingLoading={
            settingLoading
          }
          onSearchChange={
            handleSearchChange
          }
          onCompanyChange={
            handleCompanyChange
          }
          onSettingChange={
            handleSettingChange
          }
          onRunningYearChange={
            handleRunningYearChange
          }
          onRunningMonthChange={
            handleRunningMonthChange
          }
          onStatusChange={
            handleStatusChange
          }
          onClear={
            handleClearFilters
          }
          onRefresh={
            handleRefresh
          }
        />
      }

      summary={
        <EmployeeRunningSummaryCards
          summary={summary}
          loading={loading}
        />
      }

      table={
        <>
          <div className="mt-6">
            <EmployeeRunningTable
              dataSource={
                employeeRunningNumbers
              }
              loading={loading}
              deletingId={deletingId}
              page={page}
              pageSize={pageSize}
              total={total}
              canView={canView}
              canEdit={canEdit}
              canDelete={canDelete}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={
                handleDelete
              }
              onChange={
                handleTableChange
              }
            />
          </div>
        </>
      }

      modal={
        <EmployeeRunningModal
          open={modalOpen}
          title={modalTitle}
          mode={modalMode}
          form={form}
          companies={companies}
          settings={settings}
          companyLoading={
            companyLoading
          }
          settingLoading={
            settingLoading
          }
          saving={saving}
          disabled={
            modalDisabled
          }
          canEdit={canEdit}
          selectedRecord={
            selectedRecord
          }
          onCancel={
            handleCloseModal
          }
          onSubmit={
            handleSubmit
          }
          onEdit={
            handleEditFromView
          }
        />
      }
    />
  );
}
