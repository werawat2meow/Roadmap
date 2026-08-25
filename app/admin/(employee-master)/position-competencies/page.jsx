"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Card,
} from "antd";

import {
  useAuth,
} from "@/contexts/AuthContext";

import {
  hasPermission,
} from "@/lib/permissions";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";

import PositionCompetencySearch from "./components/PositionCompetencySearch";
import PositionCompetencyTable from "./components/PositionCompetencyTable";
import PositionCompetencyPagination from "./components/PositionCompetencyPagination";
import PositionCompetencyModal from "./components/PositionCompetencyModal";

/* =========================================================
   HELPERS
========================================================= */

async function readJsonResponse(
  response
) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getApiError(
  json,
  fallback
) {
  return (
    json?.details_error ||
    json?.error ||
    json?.message ||
    fallback
  );
}

function normalizeRows(
  payload
) {
  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.rows
    )
  ) {
    return payload.rows;
  }

  return [];
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PositionCompetenciesPage() {
  const {
    user,
    loadingUser,
  } = useAuth();

  const canView =
    hasPermission(
      user,
      "ems.position_competencies.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.position_competencies.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.position_competencies.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "ems.position_competencies.delete"
    );

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    positions,
    setPositions,
  ] = useState([]);

  const [
    competencies,
    setCompetencies,
  ] = useState([]);

  const [
    competencyLevels,
    setCompetencyLevels,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    positionId,
    setPositionId,
  ] = useState("");

  const [
    competencyId,
    setCompetencyId,
  ] = useState("");

  const [
    requiredLevelId,
    setRequiredLevelId,
  ] = useState("");

  const [
    importance,
    setImportance,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("active");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(20);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    masterLoading,
    setMasterLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    openModal,
    setOpenModal,
  ] = useState(false);

  const [
    editingItem,
    setEditingItem,
  ] = useState(null);

  /* =======================================================
     LOAD LIST
  ======================================================= */

  const loadData =
    useCallback(
      async (
        currentPage = page,
        currentPageSize =
          pageSize
      ) => {
        if (!canView) {
          return;
        }

        try {
          setLoading(true);

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              currentPage
            )
          );

          params.set(
            "pageSize",
            String(
              currentPageSize
            )
          );

          if (search) {
            params.set(
              "search",
              search
            );
          }

          if (positionId) {
            params.set(
              "position_id",
              positionId
            );
          }

          if (competencyId) {
            params.set(
              "competency_id",
              competencyId
            );
          }

          if (
            requiredLevelId
          ) {
            params.set(
              "required_level_id",
              requiredLevelId
            );
          }

          if (importance) {
            params.set(
              "importance_level",
              importance
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          const res =
            await fetch(
              `/api/admin/position-competencies?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              res
            );

          if (!res.ok) {
            throw new Error(
              getApiError(
                json,
                "ไม่สามารถโหลดข้อมูลสมรรถนะประจำตำแหน่งได้"
              )
            );
          }

          setItems(
            normalizeRows(
              json
            )
          );

          setTotal(
            Number(
              json
                ?.pagination
                ?.total ||
              0
            )
          );
        } catch (error) {
          console.error(
            "load position competencies error:",
            error
          );

          swalError(
            error?.message ||
              "โหลดข้อมูลไม่สำเร็จ"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        competencyId,
        importance,
        page,
        pageSize,
        positionId,
        requiredLevelId,
        search,
        status,
      ]
    );

  /* =======================================================
     LOAD MASTERS
  ======================================================= */

  const loadMasters =
    useCallback(
      async () => {
        try {
          setMasterLoading(
            true
          );

          const [
            positionResponse,
            competencyResponse,
            levelResponse,
          ] =
            await Promise.all([
              fetch(
                "/api/admin/positions?all=true&status=active",
                {
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/admin/competencies?all=true&status=active",
                {
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/admin/competency-levels?all=true&status=active",
                {
                  cache:
                    "no-store",
                }
              ),
            ]);

          const [
            positionJson,
            competencyJson,
            levelJson,
          ] =
            await Promise.all([
              readJsonResponse(
                positionResponse
              ),

              readJsonResponse(
                competencyResponse
              ),

              readJsonResponse(
                levelResponse
              ),
            ]);

          if (
            !positionResponse.ok
          ) {
            throw new Error(
              getApiError(
                positionJson,
                "ไม่สามารถโหลดตำแหน่งได้"
              )
            );
          }

          if (
            !competencyResponse.ok
          ) {
            throw new Error(
              getApiError(
                competencyJson,
                "ไม่สามารถโหลด Competency ได้"
              )
            );
          }

          if (
            !levelResponse.ok
          ) {
            throw new Error(
              getApiError(
                levelJson,
                "ไม่สามารถโหลดระดับ Competency ได้"
              )
            );
          }

          setPositions(
            normalizeRows(
              positionJson
            )
          );

          setCompetencies(
            normalizeRows(
              competencyJson
            )
          );

          setCompetencyLevels(
            normalizeRows(
              levelJson
            )
          );
        } catch (error) {
          console.error(
            "load position competency masters error:",
            error
          );

          swalError(
            error?.message ||
              "ไม่สามารถโหลดข้อมูล Master ได้"
          );
        } finally {
          setMasterLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (
      loadingUser ||
      !canView
    ) {
      return;
    }

    loadMasters();
  }, [
    loadingUser,
    canView,
    loadMasters,
  ]);

  useEffect(() => {
    if (
      loadingUser ||
      !canView
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        setPage(1);

        loadData(
          1,
          pageSize
        );
      }, 300);

    return () =>
      clearTimeout(
        timer
      );
  }, [
    loadingUser,
    canView,
    search,
    positionId,
    competencyId,
    requiredLevelId,
    importance,
    status,
    pageSize,
  ]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleSearch = () => {
    setPage(1);

    loadData(
      1,
      pageSize
    );
  };

  const handleReset = () => {
    setSearch("");
    setPositionId("");
    setCompetencyId("");
    setRequiredLevelId("");
    setImportance("");
    setStatus("active");
    setPage(1);
  };

  const handleAdd = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มสมรรถนะประจำตำแหน่ง"
      );
      return;
    }

    setEditingItem(null);
    setOpenModal(true);
  };

  const handleEdit = (
    record
  ) => {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขสมรรถนะประจำตำแหน่ง"
      );
      return;
    }

    setEditingItem(
      record
    );

    setOpenModal(true);
  };

  const handlePageChange = (
    current,
    currentPageSize
  ) => {
    setPage(current);

    setPageSize(
      currentPageSize
    );

    loadData(
      current,
      currentPageSize
    );
  };

  const handleSave =
    async (values) => {
      try {
        setSaving(true);

        const isEdit =
          Boolean(
            editingItem
          );

        const res =
          await fetch(
            isEdit
              ? `/api/admin/position-competencies/${editingItem.id}`
              : "/api/admin/position-competencies",
            {
              method:
                isEdit
                  ? "PATCH"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  values
                ),
            }
          );

        const json =
          await readJsonResponse(
            res
          );

        if (!res.ok) {
          throw new Error(
            getApiError(
              json,
              "บันทึกข้อมูลไม่สำเร็จ"
            )
          );
        }

        swalSuccess(
          json?.message ||
            (isEdit
              ? "แก้ไขข้อมูลสำเร็จ"
              : "เพิ่มข้อมูลสำเร็จ")
        );

        setOpenModal(false);
        setEditingItem(null);

        await loadData(
          page,
          pageSize
        );
      } catch (error) {
        console.error(
          "save position competency error:",
          error
        );

        swalError(
          error?.message ||
            "บันทึกข้อมูลไม่สำเร็จ"
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDelete =
    async (record) => {
      if (!canDelete) {
        swalError(
          "คุณไม่มีสิทธิ์ลบสมรรถนะประจำตำแหน่ง"
        );
        return;
      }

      const result =
        await swalConfirm(
          "ยืนยันการลบ",
          `ต้องการลบ ${
            record
              .competency_name ||
            record
              .competency_id
          } ใช่หรือไม่?`
        );

      if (
        !result?.isConfirmed
      ) {
        return;
      }

      try {
        setLoading(true);

        const res =
          await fetch(
            `/api/admin/position-competencies/${record.id}`,
            {
              method:
                "DELETE",
            }
          );

        const json =
          await readJsonResponse(
            res
          );

        if (!res.ok) {
          throw new Error(
            getApiError(
              json,
              "ลบข้อมูลไม่สำเร็จ"
            )
          );
        }

        swalSuccess(
          json?.message ||
            "ลบข้อมูลสำเร็จ"
        );

        await loadData(
          page,
          pageSize
        );
      } catch (error) {
        console.error(
          "delete position competency error:",
          error
        );

        swalError(
          error?.message ||
            "ลบข้อมูลไม่สำเร็จ"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     PERMISSION
  ======================================================= */

  if (loadingUser) {
    return null;
  }

  if (!canView) {
    return (
      <Alert
        type="error"
        showIcon
        title="ไม่มีสิทธิ์เข้าถึง"
        description="คุณไม่มีสิทธิ์ดูข้อมูลสมรรถนะประจำตำแหน่ง"
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Card variant="outlined">
      <PositionCompetencySearch
        search={search}
        setSearch={
          setSearch
        }
        positionId={
          positionId
        }
        setPositionId={
          setPositionId
        }
        competencyId={
          competencyId
        }
        setCompetencyId={
          setCompetencyId
        }
        requiredLevelId={
          requiredLevelId
        }
        setRequiredLevelId={
          setRequiredLevelId
        }
        importance={
          importance
        }
        setImportance={
          setImportance
        }
        status={status}
        setStatus={
          setStatus
        }
        positions={
          positions
        }
        competencies={
          competencies
        }
        competencyLevels={
          competencyLevels
        }
        loading={
          loading ||
          masterLoading
        }
        onSearch={
          handleSearch
        }
        onReset={
          handleReset
        }
        onAdd={
          handleAdd
        }
        canCreate={
          canCreate
        }
      />

      <PositionCompetencyTable
        loading={loading}
        data={items}
        onEdit={
          handleEdit
        }
        onDelete={
          handleDelete
        }
        canEdit={canEdit}
        canDelete={
          canDelete
        }
      />

      <PositionCompetencyPagination
        page={page}
        pageSize={
          pageSize
        }
        total={total}
        onChange={
          handlePageChange
        }
      />

      <PositionCompetencyModal
        open={openModal}
        onCancel={() => {
          setOpenModal(
            false
          );

          setEditingItem(
            null
          );
        }}
        onSave={
          handleSave
        }
        saving={saving}
        masterLoading={
          masterLoading
        }
        editingItem={
          editingItem
        }
        positions={
          positions
        }
        competencies={
          competencies
        }
        competencyLevels={
          competencyLevels
        }
      />
    </Card>
  );
}
