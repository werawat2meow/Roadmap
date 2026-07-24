"use client";

import { useEffect, useState } from "react";
import { Card } from "antd";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";

import PositionCompetencySearch from "./components/PositionCompetencySearch";
import PositionCompetencyTable from "./components/PositionCompetencyTable";
import PositionCompetencyPagination from "./components/PositionCompetencyPagination";
import PositionCompetencyModal from "./components/PositionCompetencyModal";

export default function PositionCompetenciesPage() {
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user,"ems.position_competencies.view");
  const canCreate = hasPermission(user,"ems.position_competencies.create");
  const canEdit = hasPermission(user,"ems.position_competencies.edit");
  const canDelete = hasPermission(user,"ems.position_competencies.delete");

  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState([]);
  const [competencies,setCompetencies,] = useState([]);
  const [competencyLevels,setCompetencyLevels,] = useState([]);

  /* ============================
        Search
  ============================ */

  const [search, setSearch] = useState("");
  const [positionId,setPositionId,] = useState("");
  const [competencyId,setCompetencyId,] = useState("");
  const [requiredLevelId,setRequiredLevelId,] = useState("");
  const [importance,setImportance,] = useState("");
  const [status, setStatus] = useState("active");

  /* ============================
        Pagination
  ============================ */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] =useState(0);

  /* ============================
        Loading
  ============================ */

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ============================
        Modal
  ============================ */

  const [openModal,setOpenModal,] = useState(false);
  const [editingItem,setEditingItem,] = useState(null);

  /* ============================
        Load Data
  ============================ */

  const loadData = async (
    currentPage = page,
    currentPageSize = pageSize
  ) => {
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

      if (search)
        params.set(
          "search",
          search
        );

      if (positionId)
        params.set(
          "position_id",
          positionId
        );

      if (competencyId)
        params.set(
          "competency_id",
          competencyId
        );

      if (requiredLevelId)
        params.set(
          "required_level_id",
          requiredLevelId
        );

      if (importance)
        params.set(
          "importance_level",
          importance
        );

      if (status)
        params.set(
          "status",
          status
        );

      const res =
        await fetch(
          `/api/admin/position-competencies?${params.toString()}`
        );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ||
            "Load Error"
        );
      }

      setItems(
        json.data || []
      );

      setTotal(
        json.pagination?.total ||
          0
      );
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

  const loadPositions =
    async () => {
      try {
        const res =
          await fetch(
            "/api/admin/positions?all=true"
          );

        const json =
          await res.json();

        if (!res.ok) {
          throw new Error(
            json.error
          );
        }

        setPositions(
          json.data || []
        );
      } catch (err) {
        console.error(err);
      }
    };

  /* ============================
        Load Competencies
  ============================ */

  const loadCompetencies =
    async () => {
      try {
        const res =
          await fetch(
            "/api/admin/competencies?all=true"
          );

        const json =
          await res.json();

        if (!res.ok) {
          throw new Error(
            json.error
          );
        }

        setCompetencies(
          json.data || []
        );
      } catch (err) {
        console.error(err);
      }
    };

  /* ============================
        Load Competency Levels
  ============================ */

  const loadCompetencyLevels =
    async () => {
      try {
        const res =
          await fetch(
            "/api/admin/competency-levels?all=true"
          );

        const json =
          await res.json();

        if (!res.ok) {
          throw new Error(
            json.error
          );
        }

        setCompetencyLevels(
          json.data || []
        );
      } catch (err) {
        console.error(err);
      }
    };

  /* ============================
        Search
  ============================ */

  const handleSearch =
    () => {
      setPage(1);

      loadData(
        1,
        pageSize
      );
    };

  /* ============================
        Reset
  ============================ */

  const handleReset =
    () => {
      setSearch("");

      setPositionId("");

      setCompetencyId("");

      setRequiredLevelId("");

      setImportance("");

      setStatus(
        "active"
      );

      setPage(1);
    };

  /* ============================
        Add
  ============================ */

  const handleAdd =
    () => {
      setEditingItem(
        null
      );

      setOpenModal(
        true
      );
    };

  /* ============================
        Edit
  ============================ */

  const handleEdit =
    (record) => {
      setEditingItem(
        record
      );

      setOpenModal(
        true
      );
    };

  /* ============================
        Pagination
  ============================ */

  const handlePageChange = (
    current,
    currentPageSize
  ) => {
    setPage(
      current
    );

    setPageSize(
      currentPageSize
    );

    loadData(
      current,
      currentPageSize
    );
  };
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
    competencyId,
    requiredLevelId,
    importance,
    status,
  ]);

  /* ============================
        Initial Load
  ============================ */

  useEffect(() => {
    if (loadingUser) return;
    if (!canView) return;

    loadPositions();
    loadCompetencies();
    loadCompetencyLevels();
    loadData(1, pageSize);
  }, [loadingUser]);

  /* ============================
        Save
  ============================ */

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const isEdit = !!editingItem;

      const res = await fetch(
        isEdit
          ? `/api/admin/position-competencies/${editingItem.id}`
          : "/api/admin/position-competencies",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error);
      }

      swalSuccess(json.message);

      setOpenModal(false);
      setEditingItem(null);

      loadData(page, pageSize);
    } catch (err) {
      console.error(err);
      swalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ============================
        Delete
  ============================ */

  const handleDelete = async (record) => {
    const result = await swalConfirm(
      "ยืนยันการลบ",
      `ต้องการลบ ${record.competency_name} ใช่หรือไม่?`
    );

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/position-competencies/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error);
      }

      swalSuccess(json.message);

      loadData(page, pageSize);
    } catch (err) {
      console.error(err);
      swalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================
        Render
  ============================ */

  return (
    <Card variant="outlined">
      <PositionCompetencySearch
        search={search}
        setSearch={setSearch}
        positionId={positionId}
        setPositionId={setPositionId}
        competencyId={competencyId}
        setCompetencyId={setCompetencyId}
        requiredLevelId={requiredLevelId}
        setRequiredLevelId={setRequiredLevelId}
        importance={importance}
        setImportance={setImportance}
        status={status}
        setStatus={setStatus}
        positions={positions}
        competencies={competencies}
        competencyLevels={competencyLevels}
        onSearch={handleSearch}
        onReset={handleReset}
        onAdd={handleAdd}
        canCreate={canCreate}
      />

      <PositionCompetencyTable
        loading={loading}
        data={items}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <PositionCompetencyPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
      />

      <PositionCompetencyModal
        open={openModal}
        onCancel={() => {
          setOpenModal(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        saving={saving}
        editingItem={editingItem}
        positions={positions}
        competencies={competencies}
        competencyLevels={competencyLevels}
      />
    </Card>
  );
}