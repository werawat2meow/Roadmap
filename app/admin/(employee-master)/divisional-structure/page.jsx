"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Tooltip,
} from "antd";
import {
  CompressOutlined,
  ExpandOutlined,
  FullscreenOutlined,
  MinusOutlined,
  PartitionOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import LoadingOrb from "../../../components/LoadingOrb";
import { swalError, swalSuccess } from "../../../components/Swal";
import useScopedPermissions from "@/hooks/useScopedPermissions";

import DivisionalOrgChart from "./components/DivisionalOrgChart";
import EmployeeAssignmentModal from "./components/EmployeeAssignmentModal";
import OrgPositionSlotModal from "./components/OrgPositionSlotModal";
import OrgStructureDrawer from "./components/OrgStructureDrawer";
import OrgStructureFilter from "./components/OrgStructureFilter";

const INITIAL_FILTERS = {
  search: "",
  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
};

export default function DivisionalStructurePage() {
  const chartRef = useRef(null);

  const {
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useScopedPermissions("ems.org_structure");

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [options, setOptions] = useState({
    companies: [],
    branch_groups: [],
    branches: [],
    branch_departments: [],
    departments: [],
    divisions: [],
    units: [],
    positions: [],
    employees: [],
  });

  const [flatSlots, setFlatSlots] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [error, setError] = useState("");

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotModalMode, setSlotModalMode] = useState("create");
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotSeed, setSlotSeed] = useState({});
  const [savingSlot, setSavingSlot] = useState(false);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentSlot, setAssignmentSlot] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState("");

  const loadOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);

      const response = await fetch("/api/admin/org-structure/options", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "ไม่สามารถโหลด Master Data ได้");
      }

      setOptions(payload.data || {});
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลด Master Data ได้");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadTree = useCallback(async (nextFilters = filters) => {
    try {
      setLoadingTree(true);
      setError("");

      const params = new URLSearchParams();
      params.set("tree", "true");
      params.set("status", "active");

      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const response = await fetch(
        `/api/admin/org-position-slots?${params.toString()}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "ไม่สามารถโหลดโครงสร้างองค์กรได้");
      }

      const rows = payload.flat_data || [];
      setFlatSlots(rows);

      setSelectedSlot((current) => {
        if (!current?.id) return current;
        return rows.find((row) => row.id === current.id) || null;
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดโครงสร้างองค์กร");
      setFlatSlots([]);
    } finally {
      setLoadingTree(false);
    }
  }, [filters]);

  useEffect(() => {
    if (loadingUser || !canView) return;
    loadOptions();
  }, [loadingUser, canView, loadOptions]);

  useEffect(() => {
    if (loadingUser || !canView) return undefined;

    const timer = window.setTimeout(() => {
      loadTree(filters);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters, loadingUser, canView, loadTree]);

  const summary = useMemo(() => {
    const rows = flatSlots.filter((item) => !item.is_context_ancestor);
    const today = getBangkokToday();

    let capacity = 0;
    let filled = 0;

    rows.forEach((slot) => {
      capacity += Number(slot.employment_capacity || 1);

      filled += (slot.employee_position_assignments || []).filter((item) => {
        if (!item.is_primary) return false;
        if (item.status !== "active") return false;
        if (item.effective_from && item.effective_from > today) return false;
        if (item.effective_to && item.effective_to < today) return false;
        return true;
      }).length;
    });

    return {
      slots: rows.length,
      capacity,
      filled,
      vacant: Math.max(capacity - filled, 0),
    };
  }, [flatSlots]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "company_id") {
        next.branch_group_id = "";
        next.branch_id = "";
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      } else if (field === "branch_group_id") {
        next.branch_id = "";
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      } else if (field === "branch_id") {
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      } else if (field === "department_id") {
        next.division_id = "";
        next.unit_id = "";
      } else if (field === "division_id") {
        next.unit_id = "";
      }

      return next;
    });
  };

  const handleNodeClick = useCallback((slot) => {
    setSelectedSlot(slot);
    setDrawerOpen(true);
  }, []);

  const openCreateSlot = (parent = null) => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Position Slot");
      return;
    }

    const seed = parent
      ? {
          company_id: parent.company_id,
          branch_group_id: parent.branch_group_id,
          branch_id: parent.branch_id,
          department_id: parent.department_id,
          division_id: parent.division_id,
          unit_id: parent.unit_id,
          parent_slot_id: parent.id,
        }
      : {
          company_id: filters.company_id || "",
          branch_group_id: filters.branch_group_id || "",
          branch_id: filters.branch_id || "",
          department_id: filters.department_id || "",
          division_id: filters.division_id || "",
          unit_id: filters.unit_id || "",
        };

    setEditingSlot(null);
    setSlotModalMode("create");
    setSlotSeed(seed);
    setSlotModalOpen(true);
  };

  const openEditSlot = (slot) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Position Slot");
      return;
    }

    setEditingSlot(slot);
    setSlotModalMode("edit");
    setSlotSeed({});
    setSlotModalOpen(true);
  };

  const saveSlot = async (values) => {
    try {
      setSavingSlot(true);

      const isEdit = slotModalMode === "edit" && editingSlot?.id;
      const url = isEdit
        ? `/api/admin/org-position-slots/${editingSlot.id}`
        : "/api/admin/org-position-slots";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "บันทึก Position Slot ไม่สำเร็จ");
      }

      swalSuccess(payload.message || "บันทึก Position Slot เรียบร้อยแล้ว");
      setSlotModalOpen(false);
      setEditingSlot(null);
      await loadTree(filters);
    } catch (err) {
      console.error(err);
      swalError(err.message || "บันทึก Position Slot ไม่สำเร็จ");
    } finally {
      setSavingSlot(false);
    }
  };

  const deleteSlot = async (slot) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Position Slot");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/org-position-slots/${slot.id}`,
        { method: "DELETE" }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "ลบ Position Slot ไม่สำเร็จ");
      }

      swalSuccess(payload.message || "ลบ Position Slot เรียบร้อยแล้ว");
      setDrawerOpen(false);
      setSelectedSlot(null);
      await loadTree(filters);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ลบ Position Slot ไม่สำเร็จ");
    }
  };

  const loadEmployeesForSlot = useCallback(async ({
    slot,
    search = "",
    isPrimary = true,
  }) => {
    try {
      const params = new URLSearchParams();
      params.set("mode", "employees");
      params.set("limit", "50");

      if (search) params.set("search", search);
      if (slot?.company_id) params.set("company_id", slot.company_id);
      if (slot?.branch_group_id) params.set("branch_group_id", slot.branch_group_id);
      if (slot?.branch_id) params.set("branch_id", slot.branch_id);
      if (slot?.department_id) params.set("department_id", slot.department_id);
      if (slot?.division_id) params.set("division_id", slot.division_id);
      if (slot?.unit_id) params.set("unit_id", slot.unit_id);
      if (isPrimary && slot?.position_id) {
        params.set("position_id", slot.position_id);
      }

      const response = await fetch(
        `/api/admin/org-structure/options?${params.toString()}`,
        { cache: "no-store" }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "ไม่สามารถค้นหาพนักงานได้");
      }

      return payload.data?.employees || [];
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถค้นหาพนักงานได้");
      return [];
    }
  }, []);

  const openAssignment = (slot, assignment = null) => {
    if (assignment && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Employee Position Assignment");
      return;
    }

    if (!assignment && !canCreate) {
      swalError("คุณไม่มีสิทธิ์กำหนดพนักงานเข้า Position Slot");
      return;
    }

    setAssignmentSlot(slot);
    setEditingAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  const saveAssignment = async (values) => {
    try {
      setSavingAssignment(true);

      const isEdit = Boolean(editingAssignment?.id);
      const url = isEdit
        ? `/api/admin/employee-position-assignments/${editingAssignment.id}`
        : "/api/admin/employee-position-assignments";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "บันทึก Assignment ไม่สำเร็จ");
      }

      swalSuccess(payload.message || "บันทึก Assignment เรียบร้อยแล้ว");
      setAssignmentModalOpen(false);
      setEditingAssignment(null);
      await loadTree(filters);
    } catch (err) {
      console.error(err);
      swalError(err.message || "บันทึก Assignment ไม่สำเร็จ");
    } finally {
      setSavingAssignment(false);
    }
  };

  const deleteAssignment = async (assignment) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Employee Position Assignment");
      return;
    }

    try {
      setDeletingAssignmentId(assignment.id);

      const response = await fetch(
        `/api/admin/employee-position-assignments/${assignment.id}`,
        { method: "DELETE" }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "ลบ Assignment ไม่สำเร็จ");
      }

      swalSuccess(payload.message || "ลบ Assignment เรียบร้อยแล้ว");
      await loadTree(filters);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ลบ Assignment ไม่สำเร็จ");
    } finally {
      setDeletingAssignmentId("");
    }
  };

  useEffect(() => {
    if (!selectedSlot?.id) return;

    const updated = flatSlots.find((row) => row.id === selectedSlot.id);
    if (updated) setSelectedSlot(updated);
  }, [flatSlots, selectedSlot?.id]);

  if (loadingUser) {
    return <LoadingOrb />;
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          showIcon
          title="คุณไม่มีสิทธิ์เข้าถึงโครงสร้างองค์กรตามแผนก"
          description="ต้องมี permission ems.org_structure.view"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <div className="flex flex-col gap-3 rounded-3xl bg-[#123A63] p-5 text-white shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <PartitionOutlined />
              โครงสร้างองค์กรตามแผนก (Divisional Structure)
            </div>
            <div className="mt-1 text-sm text-slate-200">
              วาง Position Slot และพนักงานตาม Scope: บริษัท → กลุ่มสังกัด → สังกัด → แผนก → ฝ่าย → หน่วย
            </div>
          </div>

          <Space wrap>
            <Button
              ghost
              icon={<ReloadOutlined />}
              loading={loadingTree || loadingOptions}
              onClick={() => Promise.all([loadOptions(), loadTree(filters)])}
            >
              Refresh
            </Button>

            {canCreate ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreateSlot()}
              >
                เพิ่ม Position Slot
              </Button>
            ) : null}
          </Space>
        </div>

        <OrgStructureFilter
          filters={filters}
          options={options}
          loading={loadingTree}
          onChange={handleFilterChange}
          onSearchChange={(value) =>
            setFilters((prev) => ({ ...prev, search: value }))
          }
          onReload={() => loadTree(filters)}
        />

        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}>
            <Card>
              <Statistic title="Position Slots" value={summary.slots} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card>
              <Statistic title="Planned Headcount" value={summary.capacity} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card>
              <Statistic title="Filled" value={summary.filled} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card>
              <Statistic title="Vacant" value={summary.vacant} />
            </Card>
          </Col>
        </Row>

        {error ? <Alert type="error" showIcon title={error} /> : null}

        <Card
          title="Organization Chart"
          extra={
            <Space>
              <Tooltip title="Zoom In">
                <Button icon={<PlusOutlined />} onClick={() => chartRef.current?.zoomIn()} />
              </Tooltip>
              <Tooltip title="Zoom Out">
                <Button icon={<MinusOutlined />} onClick={() => chartRef.current?.zoomOut()} />
              </Tooltip>
              <Tooltip title="Fit">
                <Button icon={<FullscreenOutlined />} onClick={() => chartRef.current?.fit()} />
              </Tooltip>
              <Tooltip title="Expand All">
                <Button icon={<ExpandOutlined />} onClick={() => chartRef.current?.expandAll()} />
              </Tooltip>
              <Tooltip title="Collapse All">
                <Button icon={<CompressOutlined />} onClick={() => chartRef.current?.collapseAll()} />
              </Tooltip>
            </Space>
          }
        >
          {loadingOptions && !options.companies?.length ? (
            <div className="py-16">
              <LoadingOrb />
            </div>
          ) : flatSlots.length || loadingTree ? (
            <DivisionalOrgChart
              ref={chartRef}
              data={flatSlots}
              loading={loadingTree}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <Empty description="ยังไม่มีข้อมูล Position Slot ใน Scope นี้" />
          )}
        </Card>
      </div>

      <OrgStructureDrawer
        open={drawerOpen}
        slot={selectedSlot}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        deletingAssignmentId={deletingAssignmentId}
        onClose={() => setDrawerOpen(false)}
        onAddChild={openCreateSlot}
        onEditSlot={openEditSlot}
        onDeleteSlot={deleteSlot}
        onAssignEmployee={(slot) => openAssignment(slot)}
        onEditAssignment={(assignment) => openAssignment(selectedSlot, assignment)}
        onDeleteAssignment={deleteAssignment}
      />

      <OrgPositionSlotModal
        open={slotModalOpen}
        mode={slotModalMode}
        slot={editingSlot}
        seed={slotSeed}
        options={options}
        slots={flatSlots}
        saving={savingSlot}
        onCancel={() => setSlotModalOpen(false)}
        onSubmit={saveSlot}
      />

      <EmployeeAssignmentModal
        open={assignmentModalOpen}
        slot={assignmentSlot}
        assignment={editingAssignment}
        employees={options.employees || []}
        loadEmployees={loadEmployeesForSlot}
        saving={savingAssignment}
        onCancel={() => {
          setAssignmentModalOpen(false);
          setEditingAssignment(null);
        }}
        onSubmit={saveAssignment}
      />
    </div>
  );
}

function getBangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
