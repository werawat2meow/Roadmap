"use client";

import {
  Alert,
  Button,
  Card,
  Result,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  DollarOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import SalaryStructureModal from "./components/SalaryStructureModal";
import SalaryStructureSearch from "./components/SalaryStructureSearch";
import SalaryStructureSummaryCards from "./components/SalaryStructureSummaryCards";
import SalaryStructureTable from "./components/SalaryStructureTable";

const { Title, Text } = Typography;
const DEFAULT_PAGE_SIZE = 20;

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? "รูปแบบข้อมูลจาก API ไม่ถูกต้อง"
        : `API ตอบกลับผิดรูปแบบ (${response.status})`
    );
  }
}

function getApiError(payload, fallback) {
  return payload?.error || payload?.message || fallback;
}

export default function SalaryStructuresPage() {
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.salary_structures.view");
  const canCreate = hasPermission(user, "ems.salary_structures.create");
  const canEdit = hasPermission(user, "ems.salary_structures.edit");
  const canDelete = hasPermission(user, "ems.salary_structures.delete");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (search) {
      params.set("search", search);
    }

    return params.toString();
  }, [page, pageSize, search]);

  const loadData = useCallback(async () => {
    if (!canView) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/salary-structures?${queryString}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiError(payload, "ไม่สามารถโหลดข้อมูลโครงสร้างเงินเดือนได้")
        );
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      const pagination = payload?.pagination || {};

      setRows(data);
      setTotal(Number(pagination?.total ?? payload?.total ?? 0));
    } catch (error) {
      console.error("load salary structures error:", error);

      await Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        text: error?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    } finally {
      setLoading(false);
    }
  }, [canView, queryString]);

  useEffect(() => {
    if (!loadingUser && user && canView) {
      loadData();
    }
  }, [loadingUser, user, canView, loadData]);

  const openCreate = () => {
    if (!canCreate) return;

    setSelectedRecord(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openView = (record) => {
    setSelectedRecord(record);
    setModalMode("view");
    setModalOpen(true);
  };

  const openEdit = (record) => {
    if (!canEdit) return;

    setSelectedRecord(record);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setSelectedRecord(null);
  };

  const handleSubmit = async (values) => {
    const isEdit = modalMode === "edit";

    if (isEdit && !selectedRecord?.id) return;

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/salary-structures/${selectedRecord.id}`
        : "/api/admin/salary-structures";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiError(
            payload,
            isEdit
              ? "ไม่สามารถแก้ไขโครงสร้างเงินเดือนได้"
              : "ไม่สามารถเพิ่มโครงสร้างเงินเดือนได้"
          )
        );
      }

      setModalOpen(false);
      setSelectedRecord(null);

      await Swal.fire({
        icon: "success",
        title: isEdit ? "แก้ไขเรียบร้อยแล้ว" : "เพิ่มเรียบร้อยแล้ว",
        text: payload?.message || undefined,
        timer: 1400,
        showConfirmButton: false,
      });

      if (!isEdit && page !== 1) {
        setPage(1);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error("save salary structure error:", error);

      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!canDelete || !record?.id) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: `ต้องการลบโครงสร้างเงินเดือน \"${record.name}\" ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(record.id);

      const response = await fetch(
        `/api/admin/salary-structures/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiError(payload, "ไม่สามารถลบโครงสร้างเงินเดือนได้")
        );
      }

      await Swal.fire({
        icon: "success",
        title: "ลบข้อมูลเรียบร้อยแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });

      if (rows.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        await loadData();
      }
    } catch (error) {
      console.error("delete salary structure error:", error);

      await Swal.fire({
        icon: "error",
        title: "ลบข้อมูลไม่สำเร็จ",
        text: error?.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handlePageChange = (nextPage, nextPageSize) => {
    const normalizedPageSize = Number(nextPageSize || DEFAULT_PAGE_SIZE);

    if (normalizedPageSize !== pageSize) {
      setPageSize(normalizedPageSize);
      setPage(1);
      return;
    }

    setPage(nextPage);
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  if (!canView) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="คุณไม่มีสิทธิ์เข้าถึงหน้าโครงสร้างเงินเดือน"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Tag icon={<DollarOutlined />} color="blue">
                  PAYROLL SETUP
                </Tag>
                <Tag icon={<ApartmentOutlined />}>
                  Salary Structure Master
                </Tag>
              </div>

              <Title level={2} className="!mb-1 !text-slate-800">
                โครงสร้างเงินเดือน
              </Title>

              <Text className="text-slate-500">
                จัดการ Master โครงสร้างเงินเดือนสำหรับเชื่อมต่อกับข้อมูลค่าตอบแทนพนักงาน
              </Text>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
                loading={loading}
              >
                รีเฟรช
              </Button>

              {canCreate ? (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreate}
                >
                  เพิ่มโครงสร้างเงินเดือน
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Alert
          type="info"
          showIcon
          title="ขอบเขตข้อมูลของ Salary Structure ปัจจุบัน"
          description="ตาราง salary_structures ปัจจุบันมีเพียง id, name และ created_at หน้านี้จึงจัดการเฉพาะ Master ตาม Schema จริง และยังไม่สร้าง Field ระดับตำแหน่งหรือ Salary Band เพิ่มเอง"
        />

        <SalaryStructureSummaryCards
          total={total}
          currentPageCount={rows.length}
          loading={loading}
        />

        <SalaryStructureSearch
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        <Card
          title="รายการโครงสร้างเงินเดือน"
          className="rounded-2xl border-slate-200 shadow-sm"
          styles={{ body: { padding: 0 } }}
        >
          <SalaryStructureTable
            rows={rows}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onView={openView}
            onEdit={openEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            deletingId={deletingId}
          />
        </Card>
      </div>

      <SalaryStructureModal
        open={modalOpen}
        mode={modalMode}
        record={selectedRecord}
        saving={saving}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
