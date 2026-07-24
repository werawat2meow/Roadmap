"use client";

import { useEffect, useState } from "react";
import { Card } from "antd";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import {swalConfirm,swalError,swalSuccess} from "../../../components/Swal";

import SkillLevelSearch from "./components/SkillLevelSearch";
import SkillLevelTable from "./components/SkillLevelTable";
import SkillLevelPagination from "./components/SkillLevelPagination";
import SkillLevelModal from "./components/SkillLevelModal";

export default function SkillLevelsPage() {
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user,"ems.skill_levels.view");
  const canCreate = hasPermission(user,"ems.skill_levels.create");
  const canEdit = hasPermission(user,"ems.skill_levels.edit" );
  const canDelete = hasPermission( user,"ems.skill_levels.delete");

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] =  useState("active");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadData = async (currentPage = page,currentPageSize = pageSize) => {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.set(
        "page",
        currentPage
      );

      params.set(
        "pageSize",
        currentPageSize
      );

      if (search) {
        params.set("search", search);
      }

      if (status) {
        params.set("status", status);
      }

      const res = await fetch(
        `/api/admin/skill-levels?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ||
            "Load skill levels failed"
        );
      }

      setItems(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);

      swalError(
        err.message ||
          "โหลดข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);

    loadData(1, pageSize);
  };


  const handleReset = () => {
    setSearch("");
    setStatus("active");
    setPage(1);
    loadData(1, pageSize);
  };

  const handleAdd = () => {
    setEditingItem(null);

    setOpenModal(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);

    setOpenModal(true);
  };

  /* ============================
      Pagination
  ============================ */

  const handlePageChange = (
    current,
    currentPageSize
  ) => {
    setPage(current);

    setPageSize(currentPageSize);

    loadData(
      current,
      currentPageSize
    );
  };

  /* ============================
      Init
  ============================ */

  useEffect(() => {
    if (loadingUser) return;

    if (!canView) return;

    loadData();
  }, [loadingUser]);

  /* ============================
      Reload เมื่อ Filter เปลี่ยน
  ============================ */

  useEffect(() => {
    if (loadingUser) return;

    if (!canView) return;

    const timer = setTimeout(() => {
      loadData(1, pageSize);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status]);

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const url = editingItem
        ? `/api/admin/skill-levels/${editingItem.id}`
        : "/api/admin/skill-levels";

      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "บันทึกข้อมูลไม่สำเร็จ"
        );
      }

      swalSuccess(
        editingItem
          ? "แก้ไขข้อมูลสำเร็จ"
          : "เพิ่มข้อมูลสำเร็จ"
      );

      setOpenModal(false);
      setEditingItem(null);

      loadData(page, pageSize);
    } catch (err) {
      console.error(err);

      swalError(
        err.message || "บันทึกข้อมูลไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const result = await swalConfirm(
      "ยืนยันการลบ",
      `ต้องการลบ "${record.level_name}" ใช่หรือไม่ ?`
    );

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/skill-levels/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "ลบข้อมูลไม่สำเร็จ"
        );
      }

      await swalSuccess("ลบข้อมูลสำเร็จ");

      // ถ้าลบรายการสุดท้ายของหน้าปัจจุบัน
      // ให้ย้อนกลับไปหน้าก่อน
      const nextPage =
        items.length === 1 && page > 1
          ? page - 1
          : page;

      if (nextPage !== page) {
        setPage(nextPage);
      }

      loadData(nextPage, pageSize);
    } catch (err) {
      console.error(err);

      swalError(
        err.message || "ลบข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) return null;

  if (!canView) {
    return (
      <Card>
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </Card>
    );
  }


  return (
    <Card title="Skill Levels">
      <SkillLevelSearch
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        loading={loading}
        onSearch={handleSearch}
        onReset={handleReset}
        onAdd={handleAdd}
        canCreate={canCreate}
      />

      <SkillLevelTable
        data={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <SkillLevelPagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
      />

      <SkillLevelModal
        open={openModal}
        loading={saving}
        editingItem={editingItem}
        onCancel={() => {
          setOpenModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}