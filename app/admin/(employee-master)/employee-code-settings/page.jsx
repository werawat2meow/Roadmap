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
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import EmployeeCodeSettingSearch from "./components/EmployeeCodeSettingSearch";
import EmployeeCodeSettingSummaryCards from "./components/EmployeeCodeSettingSummaryCards";
import EmployeeCodeSettingTable from "./components/EmployeeCodeSettingTable";
import EmployeeCodeSettingModal from "./components/EmployeeCodeSettingModal";

/* =========================================================
   Constants
========================================================= */

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PATTERN = "{TYPE}{YY}{RUNNING}";

const DEFAULT_FORM_VALUES = {
  company_id: undefined,
  code_name: "DEFAULT",
  code_pattern: "{TYPE}{YY}{RUNNING}",
  running_digits: 4,
  year_digits: 2,
  executive_digit: "9",
  thai_digit: "1",
  non_b_digit: "2",
  myanmar_digit: "3",
  parttime_digit: "4",
  running_start: 1,
  reset_policy: "yearly",
  is_default: false,

  effective_date: dayjs(),

  expire_date: null,
  status: "active",
  remark: "",
};

function formatDateForApi(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value?.format === "function"
  ) {
    return value.format("YYYY-MM-DD");
  }

  return null;
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
  const rows = Array.isArray(result?.data)
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
      Number(pagination.totalPages) ||
      1,
  };
}

function buildSubmitPayload(values) {
  return {
    company_id:
      values.company_id || null,

    code_name:
      String(
        values.code_name || ""
      ).trim(),

    code_pattern:
      String(
        values.code_pattern ||
          DEFAULT_PATTERN
      ).trim(),

    running_digits:
      Number(values.running_digits) || 4,

    year_digits:
      Number(values.year_digits) || 2,

    executive_digit:
      String(
        values.executive_digit || ""
      ).trim(),

    thai_digit:
      String(
        values.thai_digit || ""
      ).trim(),

    non_b_digit:
      String(
        values.non_b_digit || ""
      ).trim(),

    myanmar_digit:
      String(
        values.myanmar_digit || ""
      ).trim(),

    parttime_digit:
      String(
        values.parttime_digit || ""
      ).trim(),

    running_start:
      Number(values.running_start) || 1,

    reset_policy:
      values.reset_policy || "yearly",

    is_default:
      Boolean(values.is_default),

    effective_date:
      formatDateForApi(
        values.effective_date
      ),

    expire_date:
      formatDateForApi(
        values.expire_date
      ),

    status:
      values.status || "active",

    remark:
      String(
        values.remark || ""
      ).trim() || null,
  };
}

export default function EmployeeCodeSettingsPage() {
  const router = useRouter();
  const {user,loadingUser: authLoading,} = useAuth();

  const [form] = Form.useForm();
  /* =======================================================
     Permission
  ======================================================= */

  const canView = useMemo(
    () =>
      hasPermission(
        user,
        "ems.employee_code_settings.view"
      ),
    [user]
  );

  const canCreate = useMemo(
    () =>
      hasPermission(
        user,
        "ems.employee_code_settings.create"
      ),
    [user]
  );

  const canEdit = useMemo(
    () =>
      hasPermission(
        user,
        "ems.employee_code_settings.edit"
      ),
    [user]
  );

  const canDelete = useMemo(
    () =>
      hasPermission(
        user,
        "ems.employee_code_settings.delete"
      ),
    [user]
  );

  const [employeeCodeSettings,setEmployeeCodeSettings,] = useState([]);
  const [companies,setCompanies,] = useState([]);
  const [total, setTotal] =useState(0);
  const [page, setPage] =useState(1);
  const [pageSize, setPageSize] =useState(DEFAULT_PAGE_SIZE);

  const [search, setSearch] = useState("");
  const [debouncedSearch,setDebouncedSearch,] = useState("");
  const [companyId,setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [resetPolicy,setResetPolicy,] = useState("");
  const [isDefault,setIsDefault] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyLoading,setCompanyLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId,setDeletingId,] = useState(null);

  const [modalOpen,setModalOpen,] = useState(false);
  const [modalMode,setModalMode] = useState("create");
  const [selectedRecord,setSelectedRecord,] = useState(null);

  const modalDisabled = modalMode === "view";

  const modalTitle = useMemo(() => {
    if (modalMode === "view") {
      return "รายละเอียดการตั้งค่ารหัสพนักงาน";
    }

    if (modalMode === "edit") {
      return "แก้ไขการตั้งค่ารหัสพนักงาน";
    }

    return "เพิ่มการตั้งค่ารหัสพนักงาน";
  }, [modalMode]);

  /* =======================================================
     Search Debounce
  ======================================================= */

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

  /* =======================================================
     Authorization
  ======================================================= */

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

  /* =======================================================
     Fetch Companies
  ======================================================= */

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
          throw new Error(
            getApiMessage(
              result,
              "ไม่สามารถโหลดข้อมูลบริษัทได้"
            )
          );
        }

        const rows = Array.isArray(
          result?.data
        )
          ? result.data
          : [];

        setCompanies(rows);
      } catch (error) {
        console.error(
          "fetchCompanies error:",
          error
        );

        message.error(
          error.message ||
            "ไม่สามารถโหลดข้อมูลบริษัทได้"
        );
      } finally {
        setCompanyLoading(false);
      }
    }, [
      canView,
      message,
    ]);

  const fetchEmployeeCodeSettings = useCallback(async () => {
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

      if (status) {
        params.set(
          "status",
          status
        );
      }

      if (resetPolicy) {
        params.set(
          "reset_policy",
          resetPolicy
        );
      }

      if (
        isDefault === "true" ||
        isDefault === "false"
      ) {
        params.set(
          "is_default",
          isDefault
        );
      }

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
        throw new Error(
          getApiMessage(
            result,
            "ไม่สามารถโหลดการตั้งค่ารหัสพนักงานได้"
          )
        );
      }

      const normalized =
        normalizeListResponse(result);

      setEmployeeCodeSettings(
        normalized.rows
      );

      setTotal(normalized.total);

      /*
        กรณีลบรายการสุดท้ายของหน้าปัจจุบัน
        แล้วหน้าปัจจุบันเกินจำนวนหน้าจริง
      */

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
        "fetchEmployeeCodeSettings error:",
        error
      );

      setEmployeeCodeSettings([]);
      setTotal(0);

      message.error(
        error.message ||
          "ไม่สามารถโหลดการตั้งค่ารหัสพนักงานได้"
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
    status,
    resetPolicy,
    isDefault,
    message,
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
  }, [
    authLoading,
    user,
    canView,
    fetchCompanies,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchEmployeeCodeSettings();
  }, [
    authLoading,
    user,
    canView,
    fetchEmployeeCodeSettings,
  ]);

  const summary = useMemo(() => {
    const active =
      employeeCodeSettings.filter(
        (item) =>
          item.status === "active"
      ).length;

    const inactive =
      employeeCodeSettings.filter(
        (item) =>
          item.status === "inactive"
      ).length;

    const defaultCount =
      employeeCodeSettings.filter(
        (item) =>
          item.is_default === true
      ).length;

    const yearly =
      employeeCodeSettings.filter(
        (item) =>
          item.reset_policy ===
          "yearly"
      ).length;

    const monthly =
      employeeCodeSettings.filter(
        (item) =>
          item.reset_policy ===
          "monthly"
      ).length;

    const never =
      employeeCodeSettings.filter(
        (item) =>
          item.reset_policy ===
          "never"
      ).length;

    return {
      total,
      active,
      inactive,
      defaultCount,
      yearly,
      monthly,
      never,
    };
  }, [
    employeeCodeSettings,
    total,
  ]);

  const handleCreate =
    useCallback(() => {
      setSelectedRecord(null);
      setModalMode("create");

      form.resetFields();

      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
      });

      setModalOpen(true);
    }, [form]);

  const handleView =
    useCallback(
      (record) => {
        setSelectedRecord(record);
        setModalMode("view");

        form.resetFields();

        form.setFieldsValue({
          company_id:
            record.company_id,

          code_name:
            record.code_name,

          code_pattern:
            record.code_pattern,

          running_digits:
            record.running_digits,

          year_digits:
            record.year_digits,

          executive_digit:
            record.executive_digit,

          thai_digit:
            record.thai_digit,

          non_b_digit:
            record.non_b_digit,

          myanmar_digit:
            record.myanmar_digit,

          parttime_digit:
            record.parttime_digit,

          running_start:
            record.running_start,

          reset_policy:
            record.reset_policy,

          is_default:
            record.is_default,

          effective_date:
            record.effective_date,

          expire_date:
            record.expire_date,

          status:
            record.status,

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

          code_name:
            record.code_name,

          code_pattern:
            record.code_pattern,

          running_digits:
            record.running_digits,

          year_digits:
            record.year_digits,

          executive_digit:
            record.executive_digit,

          thai_digit:
            record.thai_digit,

          non_b_digit:
            record.non_b_digit,

          myanmar_digit:
            record.myanmar_digit,

          parttime_digit:
            record.parttime_digit,

          running_start:
            record.running_start,

          reset_policy:
            record.reset_policy,

          is_default:
            record.is_default,

          effective_date:
            record.effective_date,

          expire_date:
            record.expire_date,

          status:
            record.status,

          remark:
            record.remark || "",
        });

        setModalOpen(true);
      },
      [
        canEdit,
        form,
        message,
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
    }, [
      canEdit,
      message,
    ]);

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

  const handleSubmit = useCallback(async () => {
    if (modalMode === "view") {
      handleCloseModal();
      return;
    }
    if (modalMode === "create" && !canCreate) {
      message.warning(
        "คุณไม่มีสิทธิ์เพิ่มข้อมูล"
      );
      return;
    }

    if (modalMode === "edit" && !canEdit) {
      message.warning(
        "คุณไม่มีสิทธิ์แก้ไขข้อมูล"
      );
      return;
    }

    try {
      const values = await form.validateFields();
      const payload = buildSubmitPayload(values);
      if (
        payload.expire_date &&
        payload.effective_date &&
        payload.expire_date <
          payload.effective_date
      ) {
        message.warning(
          "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้งาน"
        );
        return;
      }

      const typeDigits = [
        payload.executive_digit,
        payload.thai_digit,
        payload.non_b_digit,
        payload.myanmar_digit,
        payload.parttime_digit,
      ];

      const hasEmptyDigit =
        typeDigits.some(
          (value) =>
            !String(value || "").trim()
        );

      if (hasEmptyDigit) {
        message.warning(
          "กรุณากรอกรหัสประเภทพนักงานให้ครบ"
        );
        return;
      }

      const normalizedTypeDigits =
        typeDigits.map((value) =>
          String(value).trim()
        );

      if (
        new Set(normalizedTypeDigits)
          .size !==
        normalizedTypeDigits.length
      ) {
        message.warning(
          "รหัสประเภทพนักงานแต่ละประเภทต้องไม่ซ้ำกัน"
        );
        return;
      }

      const isEdit = modalMode === "edit";

      if ( isEdit && !selectedRecord?.id
      ) {
        message.error(
          "ไม่พบรหัสรายการที่ต้องการแก้ไข"
        );
        return;
      }

      setSaving(true);

      const url = isEdit
        ? `/api/admin/employee-code-settings/${selectedRecord.id}`
        : "/api/admin/employee-code-settings";

      const response = await fetch(url, {
        method: isEdit
          ? "PATCH"
          : "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),
      });

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        message.error(
          getApiMessage(
            result,
            isEdit
              ? "ไม่สามารถแก้ไขการตั้งค่ารหัสพนักงานได้"
              : "ไม่สามารถเพิ่มการตั้งค่ารหัสพนักงานได้"
          )
        );

        return;
      }

      message.success(
        result?.message ||
          (isEdit
            ? "แก้ไขการตั้งค่ารหัสพนักงานเรียบร้อยแล้ว"
            : "เพิ่มการตั้งค่ารหัสพนักงานเรียบร้อยแล้ว")
      );
      setModalOpen(false);
      setSelectedRecord(null);
      setModalMode("create");
      form.resetFields();
      if (!isEdit && page !== 1) {
        setPage(1);
        return;
      }
      await fetchEmployeeCodeSettings();
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
          "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setSaving(false);
    }
  }, [modalMode,canCreate,canEdit,handleCloseModal,form,selectedRecord,page,fetchEmployeeCodeSettings,]);

  /* =======================================================
     Delete
  ======================================================= */

  const executeDelete =
    useCallback(
      async (record) => {
        setDeletingId(record.id);

        try {
          const response = await fetch(
            `/api/admin/employee-code-settings/${record.id}`,
            {
              method: "DELETE",
            }
          );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              getApiMessage(
                result,
                "ไม่สามารถลบการตั้งค่ารหัสพนักงานได้"
              )
            );
          }

          message.success(
            result?.message ||
              "ลบการตั้งค่ารหัสพนักงานเรียบร้อยแล้ว"
          );

          /*
            ถ้าหน้าปัจจุบันมีเพียงหนึ่งรายการ
            และไม่ใช่หน้าแรก ให้ถอยกลับหนึ่งหน้า
          */

          if (
            employeeCodeSettings.length ===
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
          } else {
            await fetchEmployeeCodeSettings();
          }
        } catch (error) {
          console.error(
            "executeDelete error:",
            error
          );

          message.error(
            error.message ||
              "เกิดข้อผิดพลาดในการลบข้อมูล"
          );
        } finally {
          setDeletingId(null);
        }
      },
      [
        employeeCodeSettings.length,
        page,
        fetchEmployeeCodeSettings,
        message,
      ]
    );

  const handleDelete =
    useCallback(
      (record) => {
        if (!canDelete) {
          message.warning(
            "คุณไม่มีสิทธิ์ลบข้อมูล"
          );

          return;
        }

        Modal.confirm({
          title:
            "ยืนยันการลบการตั้งค่ารหัสพนักงาน",

          content: (
            <div>
              ต้องการลบรูปแบบรหัส{" "}
              <strong>
                {record.code_name}
              </strong>{" "}
              ใช่หรือไม่
              {record.is_default && (
                <div className="mt-2 text-orange-600">
                  รายการนี้เป็นรูปแบบรหัสหลักของบริษัท
                  ระบบจะเลือกรายการอื่นเป็นค่าเริ่มต้นให้อัตโนมัติ
                </div>
              )}
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

  /* =======================================================
     Search Handlers
  ======================================================= */

  const handleSearchChange =
    useCallback((value) => {
      setSearch(value);
    }, []);

  const handleCompanyChange =
    useCallback((value) => {
      setCompanyId(value || "");
      setPage(1);
    }, []);

  const handleStatusChange =
    useCallback((value) => {
      setStatus(value || "");
      setPage(1);
    }, []);

  const handleResetPolicyChange =
    useCallback((value) => {
      setResetPolicy(value || "");
      setPage(1);
    }, []);

  const handleDefaultChange =
    useCallback((value) => {
      setIsDefault(value || "");
      setPage(1);
    }, []);

  const handleClearFilters =
    useCallback(() => {
      setSearch("");
      setDebouncedSearch("");

      setCompanyId("");
      setStatus("");
      setResetPolicy("");
      setIsDefault("");

      setPage(1);
    }, []);

  /* =======================================================
     Pagination
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
          nextPageSize !== pageSize
        ) {
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

  /* =======================================================
     Refresh
  ======================================================= */

  const handleRefresh =
    useCallback(async () => {
      await Promise.all([
        fetchCompanies(),
        fetchEmployeeCodeSettings(),
      ]);
    }, [
      fetchCompanies,
      fetchEmployeeCodeSettings,
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
              <SettingOutlined className="text-blue-600" />
            }
            title="ตั้งค่ารหัสพนักงาน"
            subtitle="กำหนดรูปแบบรหัสพนักงาน เลข Running ประเภทพนักงาน และนโยบายการเริ่มเลขใหม่แยกตามบริษัท"
            loading={loading}
            canRefresh
            canCreate={canCreate}
            createText="เพิ่มรูปแบบรหัส"
            onRefresh={handleRefresh}
            onCreate={handleCreate}
          />
        
          <PageInfoAlert
            title="การตั้งค่ารหัสพนักงาน"
            description="บริษัทหนึ่งสามารถมีรูปแบบรหัสพนักงานได้หลายรายการ แต่มีรูปแบบหลักได้เพียงหนึ่งรายการ รหัสพนักงานจะสร้างจาก Pattern เช่น {TYPE}{YY}{RUNNING}"
          />
        
        
        </>
      }

      search={
        <EmployeeCodeSettingSearch
          search={search}
          companyId={companyId}
          status={status}
          resetPolicy={resetPolicy}
          isDefault={isDefault}
          companies={companies}
          loading={
            loading ||
            companyLoading
          }
          onSearchChange={
            handleSearchChange
          }
          onCompanyChange={
            handleCompanyChange
          }
          onStatusChange={
            handleStatusChange
          }
          onResetPolicyChange={
            handleResetPolicyChange
          }
          onDefaultChange={
            handleDefaultChange
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
        <EmployeeCodeSettingSummaryCards
          summary={summary}
          loading={loading}
        />
      }

      table={
        <>
          <div className="mt-6">
            <EmployeeCodeSettingTable
              dataSource={
                employeeCodeSettings
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
        <EmployeeCodeSettingModal
          open={modalOpen}
          title={modalTitle}
          mode={modalMode}
          form={form}
          companies={companies}
          companyLoading={
            companyLoading
          }
          saving={saving}
          disabled={modalDisabled}
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






/*

ตัวอย่างข้อมูล:

type_code	type_name	code_value
executive	ผู้บริหาร	9
thai	พนักงานไทย	1
non_b	พนักงาน Non-B	2
myanmar	พนักงานเมียนมา	3
parttime	พนักงาน Part-time	4
intern	นักศึกษาฝึกงาน	5

สรุปตรง ๆ: 
ตารางที่ทำอยู่เปลี่ยนรหัส 5 ประเภทเดิมได้แน่นอน 
แต่ยังไม่ใช่โครงสร้างที่เพิ่มประเภทพนักงานใหม่ได้โดยไม่แก้โค้ด 
หากต้องการรองรับอนาคตเต็มรูปแบบ 
ควรแยกเป็น  employee_code_setting_types ครับ




*/