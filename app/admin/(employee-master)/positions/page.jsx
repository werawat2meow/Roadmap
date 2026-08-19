"use client";

import { useEffect, useState } from "react";
import { Card, Pagination, Alert } from "antd";
import { useRouter } from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import {swalConfirm,swalError,swalSuccess} from "../../../components/Swal";

import PositionSearch from "./components/PositionSearch";
import PositionTable from "./components/PositionTable";
import PositionModal from "./components/PositionModal";
import PositionViewDrawer from "./components/PositionViewDrawer";

export default function PositionsPage() {
  const router = useRouter();
  const { user, loadingUser: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showGuide, setShowGuide] = useState(true);

  async function loadData() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (appliedSearch?.trim()) {
        params.set("search", appliedSearch.trim());
      }

      const res = await fetch(
        `/api/admin/positions?${params.toString()}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error || "Load Error"
        );
      }

      setItems(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "โหลดข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMasters() {
  try {
    const jobRes = await fetch(
      "/api/admin/jobs?all=true"
    );

    const jobJson =
      await jobRes.json();

    if (jobJson.success) {
      setJobs(jobJson.data || []);
    }
  } catch (err) {
    console.error(
      "LOAD_MASTER_ERROR",
      err
    );

    swalError(
      "โหลดข้อมูล Master ไม่สำเร็จ"
    );
  }
}

  async function handleSubmit(values) {
    try {
      setSaving(true);
      const isEdit = !!editingItem;
      const url = isEdit
        ? `/api/admin/positions/${editingItem.id}`
        : "/api/admin/positions";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error || "Save Error"
        );
      }

      await swalSuccess(
        isEdit
          ? "แก้ไขตำแหน่งสำเร็จ"
          : "เพิ่มตำแหน่งสำเร็จ"
      );

      closeModal();

      await loadData();
    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "บันทึกข้อมูลไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSearch() {
    setAppliedSearch(searchInput);
    setPage(1);
  }

  function handleReset() {
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
  }

  function handleCreate() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function handleEdit(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function handleView(item) {
    setViewItem(item);
    setDrawerOpen(true);
  }

  function closeModal() {
    setEditingItem(null);
    setModalOpen(false);
  }

  async function handleDelete(item) {
    const result = await swalConfirm(
      "ยืนยันการลบ",
      `ต้องการลบ "${item.position_name}" ใช่หรือไม่ ?`
    );

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/positions/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error || "Delete Error"
        );
      }

      await swalSuccess("ลบตำแหน่งสำเร็จ");

      await loadData();
    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "ลบข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }

  const canView = hasPermission(user, "ems.positions.view");
  const canCreate = hasPermission(user, "ems.positions.create");
  const canEdit = hasPermission(user, "ems.positions.edit");
  const canDelete = hasPermission(user, "ems.positions.delete");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && !canView) {
      router.replace("/admin");
    }
  }, [authLoading, user, canView, router]);

  useEffect(() => {
    if (!authLoading && user && canView) {
      loadData();
    }
  }, [
    authLoading,
    user,
    canView,
    page,
    pageSize,
    appliedSearch,
  ]);

  useEffect(() => {
    if (!authLoading && user && canView) {
      loadMasters();
    }
  }, [authLoading, user, canView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchInput);
      setPage(1); 
    }, 500); 

    return () => clearTimeout(timer); 
  }, [searchInput]);

  if (authLoading || (loading && !user)) {
    return <LoadingOrb />;
  }

  if (!canView) {
    return null;
  }

  return (
    <Card
      title="จัดการตำแหน่ง (Position Management)"
      variant="borderless"
    >
      {showGuide && (
        <Alert
          type="info"
          showIcon
          closable
          title="จัดการตำแหน่งงาน (Position Management) คืออะไร?"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>
                เมนูนี้ใช้สำหรับกำหนด <b>"ตำแหน่งงาน"</b> ทั้งหมดขององค์กร เช่น
                พนักงานขับรถ, หัวหน้าแผนก, ผู้จัดการฝ่าย ฯลฯ
                ซึ่งจะถูกนำไปใช้ผูกกับพนักงานแต่ละคนในระบบ Employee Master
              </p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><b>รหัส/ชื่อตำแหน่ง</b> — ใช้ระบุตัวตนตำแหน่งแต่ละอัน ห้ามซ้ำกัน</li>
                <li><b>กลุ่มสายงาน (Job Family)</b> — จัดกลุ่มตำแหน่งที่มีลักษณะงานใกล้เคียงกัน</li>
                <li><b>บทบาทงาน (Job)</b> — เชื่อมโยงตำแหน่งกับหน้าที่ความรับผิดชอบ</li>
                <li><b>ระดับตำแหน่ง</b> — กำหนดลำดับขั้น เช่น จูเนียร์ ซีเนียร์ หัวหน้างาน</li>
                <li><b>ตำแหน่งผู้จัดการ / ผู้บริหาร</b> — ใช้ระบุว่าตำแหน่งนี้มีลูกน้องในสายบังคับบัญชาหรือไม่</li>
                <li><b>รองรับหลายตำแหน่ง</b> — เปิดไว้ถ้าพนักงาน 1 คนสามารถถือหลายตำแหน่งพร้อมกันได้</li>
              </ul>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                ข้อมูลตำแหน่งเหล่านี้จะถูกใช้ต่อในหลายส่วน เช่น
                โครงสร้างองค์กร, การกำหนดสิทธิ์ (RBAC), เงินเดือน/สวัสดิการ,
                และการจับคู่ทักษะที่จำเป็นต่อตำแหน่ง (Position-Competencies)
              </p>
            </div>
          }
          onClose={() => setShowGuide(false)}
          style={{ marginBottom: 16 }}
        />
      )}

      <PositionSearch
        search={searchInput}
        setSearch={setSearchInput}
        loading={loading}
        onSearch={handleSearch}
        onReset={handleReset}
        onCreate={
          canCreate
            ? handleCreate
            : undefined
        }
      />

      <PositionTable
        loading={loading}
        data={items}
        onView={handleView}
        onEdit={
          canEdit
            ? handleEdit
            : undefined
        }
        onDelete={
          canDelete
            ? handleDelete
            : undefined
        }
      />

      <div
        style={{
          marginTop: 16,
          textAlign: "right",
        }}
      >
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showTotal={(t) => `ทั้งหมด ${t} รายการ`}
          pageSizeOptions={["10", "20", "50", "100"]}
          disabled={loading}
          onChange={(nextPage, nextPageSize) => {
            if (nextPageSize !== pageSize) {
              setPage(1);
              setPageSize(nextPageSize);
            } else {
              setPage(nextPage);
            }
          }}
        />
      </div>

      <PositionModal
        open={modalOpen}
        loading={saving}
        initialValues={editingItem}
        jobs={jobs}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />

      <PositionViewDrawer
        open={drawerOpen}
        data={viewItem}
        onClose={() => {
          setDrawerOpen(false);
          setViewItem(null);
        }}
      />
    </Card>
  );
}