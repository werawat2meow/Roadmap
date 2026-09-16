"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Card,
  Form,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  BarsOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import useScopedPermissions from "@/hooks/useScopedPermissions";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";

import EmployeeBusinessStructureSearch from "./components/EmployeeBusinessStructureSearch";
import EmployeeBusinessStructureSummaryCards from "./components/EmployeeBusinessStructureSummaryCards";
import EmployeeBusinessStructureTable from "./components/EmployeeBusinessStructureTable";
import EmployeeBusinessStructureTree from "./components/EmployeeBusinessStructureTree";
import EmployeeBusinessStructureModal from "./components/EmployeeBusinessStructureModal";

const { Text } = Typography;

const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FORM_VALUES = {
  employee_id: undefined,
  management_level: undefined,
  supervisor_employee_id: undefined,
  is_primary: true,
  status: "active",
  sort_order: 0,
  scopes: [],
};

function normalizeScopeForForm(scope = {}, index = 0) {
  return {
    scope_type: scope.scope_type || undefined,
    company_id: scope.company_id || undefined,
    branch_group_id: scope.branch_group_id || undefined,
    branch_id: scope.branch_id || undefined,
    department_id: scope.department_id || undefined,
    division_id: scope.division_id || undefined,
    unit_id: scope.unit_id || undefined,
    is_primary: scope.is_primary ?? index === 0,
    status: scope.status || "active",
    sort_order: Number(scope.sort_order ?? index) || 0,
  };
}

function recordToForm(record = {}) {
  const scopes = Array.isArray(record.scopes) && record.scopes.length
    ? record.scopes.map(normalizeScopeForForm)
    : record.scope_type
      ? [
          normalizeScopeForForm(
            {
              scope_type: record.scope_type,
              company_id: record.company_id,
              branch_group_id: record.branch_group_id,
              branch_id: record.branch_id,
              department_id: record.department_id,
              division_id: record.division_id,
              unit_id: record.unit_id,
              is_primary: true,
              status: record.status,
            },
            0
          ),
        ]
      : [];

  return {
    employee_id: record.employee_id || undefined,
    management_level: record.management_level || undefined,
    supervisor_employee_id: record.supervisor_employee_id || undefined,
    is_primary: record.is_primary ?? true,
    status: record.status || "active",
    sort_order: Number(record.sort_order || 0),
    scopes,
  };
}

function normalizePayload(values = {}) {
  return {
    employee_id: values.employee_id || null,
    management_level: values.management_level || null,
    supervisor_employee_id: values.supervisor_employee_id || null,
    is_primary: Boolean(values.is_primary),
    status: values.status || "active",
    sort_order: Number(values.sort_order || 0),
    scopes: (values.scopes || []).map((scope, index) => ({
      scope_type: scope.scope_type || null,
      company_id: scope.company_id || null,
      branch_group_id: scope.branch_group_id || null,
      branch_id: scope.branch_id || null,
      department_id: scope.department_id || null,
      division_id: scope.division_id || null,
      unit_id: scope.unit_id || null,
      is_primary: Boolean(scope.is_primary),
      status: scope.status || "active",
      sort_order: Number(scope.sort_order ?? index) || 0,
    })),
  };
}

function getRoleLabel(user) {
  return (
    user?.role_name ||
    user?.role ||
    user?.role_code ||
    user?.roles?.role_name ||
    user?.roles?.role_code ||
    "-"
  );
}

export default function EmployeeBusinessStructurePage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const {
    user,
    loadingUser,

    canView,
    canCreate,
    canEdit,
    canDelete,

    canEditRecord,
    canDeleteRecord,

    hasAllScope,
    accessibleCompanyIds = [],
    accessibleBranchGroupIds = [],
    accessibleBranchIds = [],
    accessibleDepartmentIds = [],
    accessibleDivisionIds = [],
    accessibleUnitIds = [],
  } = useScopedPermissions(
    "ems.employee_business_structure",
    {
      scopeType: "employee",
    }
  );

  const [rows, setRows] = useState([]);
  const [treeRows, setTreeRows] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState("");
  const [viewMode, setViewMode] = useState("tree");

  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    P12: 0,
    P11: 0,
    P10: 0,
    P9: 0,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [managementLevel, setManagementLevel] = useState("");
  const [scopeType, setScopeType] = useState("");
  const [status, setStatus] = useState("");

  const [masterData, setMasterData] = useState({
    companies: [],
    branchGroups: [],
    branches: [],
    departments: [],
    branchDepartments: [],
    divisions: [],
    units: [],
  });

  const [loading, setLoading] = useState(false);
  const [masterLoading, setMasterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [canView, loadingUser, router, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMasterData = useCallback(async () => {
    if (!user || !canView) return;

    try {
      setMasterLoading(true);

      const response = await fetch(
        "/api/admin/employee-business-structure/options",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error || "ไม่สามารถโหลดข้อมูลโครงสร้างองค์กรได้"
        );
      }

      setMasterData({
        companies: result?.data?.companies || [],
        branchGroups: result?.data?.branchGroups || [],
        branches: result?.data?.branches || [],
        departments: result?.data?.departments || [],
        branchDepartments: result?.data?.branchDepartments || [],
        divisions: result?.data?.divisions || [],
        units: result?.data?.units || [],
      });
    } catch (error) {
      console.error("LOAD_EMPLOYEE_BUSINESS_STRUCTURE_MASTER_ERROR:", error);
      swalError(error?.message || "ไม่สามารถโหลดข้อมูลโครงสร้างองค์กรได้");
    } finally {
      setMasterLoading(false);
    }
  }, [canView, user]);

  const loadTreeRows = useCallback(async () => {
    if (!user || !canView) return;

    try {
      setTreeLoading(true);
      setTreeError("");

      const collectedRows = [];
      const treePageSize = 100;
      let treePage = 1;
      let expectedTotal = 0;

      while (true) {
        const params = new URLSearchParams();
        params.set("page", String(treePage));
        params.set("pageSize", String(treePageSize));

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (managementLevel) params.set("management_level", managementLevel);
        if (scopeType) params.set("scope_type", scopeType);
        if (status) params.set("status", status);

        const response = await fetch(
          `/api/admin/employee-business-structure?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result?.error || "ไม่สามารถโหลดผังสายบริหารพนักงานได้"
          );
        }

        const batch = Array.isArray(result?.data) ? result.data : [];
        collectedRows.push(...batch);

        expectedTotal = Number(
          result?.pagination?.total || collectedRows.length
        );

        if (
          batch.length === 0 ||
          collectedRows.length >= expectedTotal ||
          batch.length < treePageSize
        ) {
          break;
        }

        treePage += 1;
      }

      setTreeRows(collectedRows);
    } catch (error) {
      console.error("LOAD_EMPLOYEE_BUSINESS_STRUCTURE_TREE_ERROR:", error);
      setTreeRows([]);
      setTreeError(
        error?.message || "ไม่สามารถโหลดผังสายบริหารพนักงานได้"
      );
    } finally {
      setTreeLoading(false);
    }
  }, [
    canView,
    debouncedSearch,
    managementLevel,
    scopeType,
    status,
    user,
  ]);

  const loadRows = useCallback(async () => {
    if (!user || !canView) return;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (managementLevel) params.set("management_level", managementLevel);
      if (scopeType) params.set("scope_type", scopeType);
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/admin/employee-business-structure?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error || "ไม่สามารถโหลดโครงสร้างบริหารพนักงานได้"
        );
      }

      setRows(Array.isArray(result?.data) ? result.data : []);
      setSummary(result?.summary || {});
      setTotal(Number(result?.pagination?.total || 0));

      const returnedPage = Number(result?.pagination?.page || page);
      if (returnedPage !== page) {
        setPage(returnedPage);
      }
    } catch (error) {
      console.error("LOAD_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);
      setRows([]);
      setTotal(0);
      swalError(error?.message || "ไม่สามารถโหลดโครงสร้างบริหารพนักงานได้");
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    debouncedSearch,
    managementLevel,
    page,
    pageSize,
    scopeType,
    status,
    user,
  ]);

  useEffect(() => {
    if (!user || !canView) return;
    loadMasterData();
  }, [canView, loadMasterData, user]);

  useEffect(() => {
    if (!user || !canView) return;
    loadRows();
  }, [canView, loadRows, user]);

  useEffect(() => {
    if (!user || !canView || viewMode !== "tree") return;
    loadTreeRows();
  }, [canView, loadTreeRows, user, viewMode]);

  const handleRefresh = useCallback(async () => {
    const tasks = [loadMasterData(), loadRows()];

    if (viewMode === "tree") {
      tasks.push(loadTreeRows());
    }

    await Promise.all(tasks);
  }, [loadMasterData, loadRows, loadTreeRows, viewMode]);

  const loadDetail = useCallback(async (record) => {
    if (!record?.id) return record || null;

    const response = await fetch(
      `/api/admin/employee-business-structure/${record.id}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || "ไม่สามารถโหลดรายละเอียดได้");
    }

    return result?.data || record;
  }, []);

  const handleCreate = useCallback(() => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มโครงสร้างบริหารพนักงาน");
      return;
    }

    setSelectedRecord(null);
    setModalMode("create");
    form.resetFields();
    form.setFieldsValue(INITIAL_FORM_VALUES);
    setModalOpen(true);
  }, [canCreate, form]);

  const openRecord = useCallback(
    async (record, mode) => {
      try {
        if (mode === "edit") {
          if (!canEdit) {
            swalError("คุณไม่มีสิทธิ์แก้ไขโครงสร้างบริหารพนักงาน");
            return;
          }

          if (
            typeof canEditRecord === "function" &&
            !canEditRecord(record?.employee_scope || record)
          ) {
            swalError("คุณไม่มีสิทธิ์แก้ไขพนักงานรายนี้ภายใต้ Scope ที่ได้รับ");
            return;
          }
        }

        const detail = await loadDetail(record);

        setSelectedRecord(detail);
        setModalMode(mode);
        form.resetFields();
        form.setFieldsValue(recordToForm(detail));
        setModalOpen(true);
      } catch (error) {
        console.error("OPEN_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);
        swalError(error?.message || "ไม่สามารถเปิดรายละเอียดได้");
      }
    },
    [canEdit, canEditRecord, form, loadDetail]
  );

  const handleView = useCallback(
    (record) => openRecord(record, "view"),
    [openRecord]
  );

  const handleEdit = useCallback(
    (record) => openRecord(record, "edit"),
    [openRecord]
  );

  const handleSave = useCallback(async () => {
    if (modalMode === "view") return;

    if (modalMode === "create" && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มโครงสร้างบริหารพนักงาน");
      return;
    }

    if (modalMode === "edit" && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขโครงสร้างบริหารพนักงาน");
      return;
    }

    try {
      const values = await form.validateFields();
      const payload = normalizePayload(values);

      setSaving(true);

      const isEdit = modalMode === "edit";
      const response = await fetch(
        isEdit
          ? `/api/admin/employee-business-structure/${selectedRecord?.id}`
          : "/api/admin/employee-business-structure",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      swalSuccess(
        result?.message ||
          (isEdit
            ? "แก้ไขโครงสร้างบริหารพนักงานเรียบร้อยแล้ว"
            : "เพิ่มโครงสร้างบริหารพนักงานเรียบร้อยแล้ว")
      );

      setModalOpen(false);
      setSelectedRecord(null);
      setModalMode("create");
      form.resetFields();

      await loadRows();

      if (viewMode === "tree") {
        await loadTreeRows();
      }
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      console.error("SAVE_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);
      swalError(error?.message || "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  }, [
    canCreate,
    canEdit,
    form,
    loadRows,
    loadTreeRows,
    modalMode,
    selectedRecord?.id,
    viewMode,
  ]);

  const handleDelete = useCallback(
    async (record) => {
      if (!canDelete) {
        swalError("คุณไม่มีสิทธิ์ยกเลิกโครงสร้างบริหารพนักงาน");
        return;
      }

      if (
        typeof canDeleteRecord === "function" &&
        !canDeleteRecord(record?.employee_scope || record)
      ) {
        swalError("คุณไม่มีสิทธิ์ยกเลิกรายการนี้ภายใต้ Scope ที่ได้รับ");
        return;
      }

      const confirmed = await swalConfirm(
        `ต้องการยกเลิกโครงสร้างบริหารของ \"${record?.employee_name || "พนักงาน"}\" ใช่หรือไม่?\n\nการดำเนินการนี้ลบเฉพาะ Management Assignment และไม่ลบข้อมูลพนักงาน`
      );

      if (!confirmed) return;

      try {
        setDeletingId(record.id);

        const response = await fetch(
          `/api/admin/employee-business-structure/${record.id}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result?.error || "ไม่สามารถยกเลิกโครงสร้างบริหารพนักงานได้"
          );
        }

        swalSuccess(
          result?.message || "ยกเลิกโครงสร้างบริหารพนักงานเรียบร้อยแล้ว"
        );

        const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
        if (nextPage !== page) {
          setPage(nextPage);
        } else {
          await loadRows();
        }

        if (viewMode === "tree") {
          await loadTreeRows();
        }
      } catch (error) {
        console.error("DELETE_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);
        swalError(
          error?.message || "ไม่สามารถยกเลิกโครงสร้างบริหารพนักงานได้"
        );
      } finally {
        setDeletingId("");
      }
    },
    [
      canDelete,
      canDeleteRecord,
      loadRows,
      loadTreeRows,
      page,
      rows.length,
      viewMode,
    ]
  );

  const handleTableChange = useCallback(
    (pagination) => {
      const nextPage = Number(pagination?.current || 1);
      const nextPageSize = Number(pagination?.pageSize || DEFAULT_PAGE_SIZE);

      if (nextPageSize !== pageSize) {
        setPageSize(nextPageSize);
        setPage(1);
        return;
      }

      setPage(nextPage);
    },
    [pageSize]
  );

  const handleClear = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setManagementLevel("");
    setScopeType("");
    setStatus("");
    setPage(1);
  }, []);

  const canEditRow = useCallback(
    (record) => {
      if (!canEdit) return false;
      if (typeof canEditRecord !== "function") return true;
      return canEditRecord(record?.employee_scope || record);
    },
    [canEdit, canEditRecord]
  );

  const canDeleteRow = useCallback(
    (record) => {
      if (!canDelete) return false;
      if (typeof canDeleteRecord !== "function") return true;
      return canDeleteRecord(record?.employee_scope || record);
    },
    [canDelete, canDeleteRecord]
  );

  const permissionSummary = useMemo(
    () => (
      <Space wrap>
        <Tag color={canView ? "green" : undefined}>VIEW</Tag>
        <Tag color={canCreate ? "green" : undefined}>CREATE</Tag>
        <Tag color={canEdit ? "green" : undefined}>EDIT</Tag>
        <Tag color={canDelete ? "green" : undefined}>DELETE</Tag>
      </Space>
    ),
    [canCreate, canDelete, canEdit, canView]
  );

  const scopeSummary = useMemo(() => {
    if (hasAllScope) {
      return <Tag color="green">All Scope</Tag>;
    }

    return (
      <Space wrap size={[4, 4]}>
        <Tag>Company {accessibleCompanyIds.length}</Tag>
        <Tag>Branch Group {accessibleBranchGroupIds.length}</Tag>
        <Tag>Branch {accessibleBranchIds.length}</Tag>
        <Tag>Department {accessibleDepartmentIds.length}</Tag>
        <Tag>Division {accessibleDivisionIds.length}</Tag>
        <Tag>Unit {accessibleUnitIds.length}</Tag>
      </Space>
    );
  }, [
    accessibleBranchGroupIds.length,
    accessibleBranchIds.length,
    accessibleCompanyIds.length,
    accessibleDepartmentIds.length,
    accessibleDivisionIds.length,
    accessibleUnitIds.length,
    hasAllScope,
  ]);

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return <LoadingOrb />;

  return (
    <>
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              icon={<ApartmentOutlined className="text-blue-600" />}
              title="จัดการข้อมูลพนักงานตามโครงสร้างบริหารงาน"
              subtitle="Employee Business Structure — สายการบริหาร ผู้บังคับบัญชา Reporting Line และขอบเขตความรับผิดชอบ"
              loading={loading || masterLoading}
              canRefresh
              canCreate={canCreate}
              createText="เพิ่มโครงสร้างบริหาร"
              onRefresh={handleRefresh}
              onCreate={handleCreate}
              onBack={() => router.back()}
            />

            <PageInfoAlert
              title="Employee Business Structure"
              description="ใช้ค้นหา เพิ่ม ดู แก้ไข และยกเลิก Management Assignment ของพนักงาน พร้อมกำหนดผู้บังคับบัญชา ความสัมพันธ์ในการรายงาน และ Company / Branch Group / Branch / Department / Division / Unit ที่รับผิดชอบ โดย Backend ตรวจ Role + Permission + Scope ทุก Action"
            />
          </>
        }
        search={
          <EmployeeBusinessStructureSearch
            search={search}
            managementLevel={managementLevel}
            scopeType={scopeType}
            status={status}
            loading={loading}
            onSearchChange={setSearch}
            onManagementLevelChange={(value) => {
              setManagementLevel(value);
              setPage(1);
            }}
            onScopeTypeChange={(value) => {
              setScopeType(value);
              setPage(1);
            }}
            onStatusChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            onClear={handleClear}
            onRefresh={handleRefresh}
          />
        }
        summary={
          <Space orientation="vertical" size={12} style={{ width: "100%" }}>
            <Alert
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              title={`Role: ${getRoleLabel(user)}`}
              description={
                <Space orientation="vertical" size={6}>
                  <div>
                    <Text type="secondary">Permission: </Text>
                    {permissionSummary}
                  </div>
                  <div>
                    <Text type="secondary">Scope: </Text>
                    {scopeSummary}
                  </div>
                </Space>
              }
            />

            <EmployeeBusinessStructureSummaryCards summary={summary} />
          </Space>
        }
        table={
          <Card
            title="มุมมองโครงสร้างบริหาร"
            extra={
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: "tree",
                    label: "ผังสายบริหาร",
                    icon: <NodeIndexOutlined />,
                  },
                  {
                    value: "list",
                    label: "รายการ",
                    icon: <BarsOutlined />,
                  },
                ]}
              />
            }
          >
            {viewMode === "tree" ? (
              <EmployeeBusinessStructureTree
                data={treeRows}
                loading={treeLoading}
                error={treeError}
                deletingId={deletingId}
                canEditRecord={canEditRow}
                canDeleteRecord={canDeleteRow}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <EmployeeBusinessStructureTable
                data={rows}
                loading={loading}
                page={page}
                pageSize={pageSize}
                total={total}
                deletingId={deletingId}
                canEditRecord={canEditRow}
                canDeleteRecord={canDeleteRow}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onChange={handleTableChange}
              />
            )}
          </Card>
        }
      />

      <EmployeeBusinessStructureModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        masterData={masterData}
        selectedRecord={selectedRecord}
        saving={saving}
        onCancel={() => {
          setModalOpen(false);
          setSelectedRecord(null);
          setModalMode("create");
          form.resetFields();
        }}
        onSubmit={handleSave}
      />
    </>
  );
}
