"use client";

import { useEffect, useState } from "react";
import { Card } from "antd";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import PositionSkillSearch from "./components/PositionSkillSearch";
import PositionSkillTable from "./components/PositionSkillTable";
import PositionSkillPagination from "./components/PositionSkillPagination";
import PositionSkillModal from "./components/PositionSkillModal";

import {swalConfirm,swalError,swalSuccess,} from "../../../components/Swal";

export default function PositionSkillsPage() {
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user,"ems.position_skills.view");
  const canCreate = hasPermission(user,"ems.position_skills.create");
  const canEdit = hasPermission(user,"ems.position_skills.edit");
  const canDelete = hasPermission(user,"ems.position_skills.delete");

  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);

  const [search, setSearch] = useState("");
  const [positionId, setPositionId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [importance, setImportance] = useState("");
  const [status, setStatus] = useState("active");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /* ============================
        Modal
  ============================ */

  const [openModal, setOpenModal] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState(null);

  /* ============================
        API
  ============================ */

  const loadData = async (
    currentPage = page,
    currentPageSize = pageSize
  ) => {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.set("page", currentPage);

      params.set(
        "pageSize",
        currentPageSize
      );

      if (search)
        params.set("search", search);

      if (positionId)
        params.set(
          "position_id",
          positionId
        );

      if (skillId)
        params.set("skill_id", skillId);

      if (importance)
        params.set(
          "importance_level",
          importance
        );

      if (status)
        params.set("status", status);

      const res = await fetch(
        `/api/admin/position-skills?${params.toString()}`
      );

      const json = await res.json();

      if (!res.ok)
        throw new Error(
          json.error || "Load Error"
        );

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
  };
    /* ============================
        Load Positions
  ============================ */

  const loadPositions = async () => {
    try {
      const res = await fetch(
        "/api/admin/positions?all=true"
      );

      const json = await res.json();

      if (!res.ok)
        throw new Error(
          json.error || "Load Position Error"
        );

      setPositions(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ============================
        Load Skills
  ============================ */

  const loadSkills = async () => {
    try {
      const res = await fetch(
        "/api/admin/skills?all=true"
      );

      const json = await res.json();

      if (!res.ok)
        throw new Error(
          json.error || "Load Skill Error"
        );

      setSkills(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ============================
        Search
  ============================ */

  const handleSearch = () => {
    setPage(1);
    loadData(1, pageSize);
  };

  /* ============================
        Reset
  ============================ */

  const handleReset = () => {
    setSearch("");
    setPositionId("");
    setSkillId("");
    setImportance("");
    setStatus("active");
    setPage(1);
  };

  /* ============================
        Add
  ============================ */

  const handleAdd = () => {
    setEditingItem(null);

    setOpenModal(true);
  };

  /* ============================
        Edit
  ============================ */

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

    loadPositions();

    loadSkills();

    loadData();
  }, [loadingUser]);

  /* ============================
      Auto Search
  ============================ */

  useEffect(() => {
    if (loadingUser) return;

    if (!canView) return;

    const timer = setTimeout(() => {
      setPage(1);
      loadData(1, pageSize);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    search,
    positionId,
    skillId,
    importance,
    status,
  ]);

    /* ============================
        Save
  ============================ */

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const method = editingItem ? "PATCH" : "POST";

      const url = editingItem
        ? `/api/admin/position-skills/${editingItem.id}`
        : "/api/admin/position-skills";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Save Error");
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

  /* ============================
        Delete
  ============================ */

  const handleDelete = async (record) => {
    const confirm = await swalConfirm({
      title: "ยืนยันการลบ",
      text: `ต้องการลบ ${record.skill_name} ใช่หรือไม่ ?`,
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `/api/admin/position-skills/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Delete Error");
      }

      swalSuccess("ลบข้อมูลสำเร็จ");

      loadData(page, pageSize);
    } catch (err) {
      console.error(err);

      swalError(
        err.message || "ลบข้อมูลไม่สำเร็จ"
      );
    }
  };

  /* ============================
        Permission
  ============================ */

  if (loadingUser) {
    return null;
  }

  if (!canView) {
    return null;
  }

  /* ============================
        Render
  ============================ */

  return (
    <>
      <PositionSkillSearch
        search={search}
        setSearch={setSearch}
        positionId={positionId}
        setPositionId={setPositionId}
        skillId={skillId}
        setSkillId={setSkillId}
        importance={importance}
        setImportance={setImportance}
        status={status}
        setStatus={setStatus}
        positions={positions}
        skills={skills}
        loading={loading}
        onSearch={handleSearch}
        onReset={handleReset}
        onAdd={handleAdd}
        canCreate={canCreate}
      />

      <Card>
        <PositionSkillTable
          data={items}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        <PositionSkillPagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
        />
      </Card>

      <PositionSkillModal
        open={openModal}
        loading={saving}
        editingItem={editingItem}
        positions={positions}
        skills={skills}
        onCancel={() => {
          setOpenModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}