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

import PositionSkillSearch from "./components/PositionSkillSearch";
import PositionSkillTable from "./components/PositionSkillTable";
import PositionSkillPagination from "./components/PositionSkillPagination";
import PositionSkillModal from "./components/PositionSkillModal";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";

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

function normalizeRows(payload) {
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

export default function PositionSkillsPage() {
  const {
    user,
    loadingUser,
  } = useAuth();

  const canView =
    hasPermission(
      user,
      "ems.position_skills.view"
    );

  const canCreate =
    hasPermission(
      user,
      "ems.position_skills.create"
    );

  const canEdit =
    hasPermission(
      user,
      "ems.position_skills.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "ems.position_skills.delete"
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
    skills,
    setSkills,
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
    skillId,
    setSkillId,
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
     LOAD DATA
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

          if (skillId) {
            params.set(
              "skill_id",
              skillId
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
              `/api/admin/position-skills?${params.toString()}`,
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
                "ไม่สามารถโหลดข้อมูลทักษะประจำตำแหน่งได้"
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
        } catch (err) {
          console.error(
            "loadData position-skills:",
            err
          );

          swalError(
            err?.message ||
              "โหลดข้อมูลไม่สำเร็จ"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canView,
        importance,
        page,
        pageSize,
        positionId,
        search,
        skillId,
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
            skillResponse,
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
                "/api/admin/skills?all=true&status=active",
                {
                  cache:
                    "no-store",
                }
              ),
            ]);

          const [
            positionJson,
            skillJson,
          ] =
            await Promise.all([
              readJsonResponse(
                positionResponse
              ),

              readJsonResponse(
                skillResponse
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
            !skillResponse.ok
          ) {
            throw new Error(
              getApiError(
                skillJson,
                "ไม่สามารถโหลดทักษะได้"
              )
            );
          }

          setPositions(
            normalizeRows(
              positionJson
            )
          );

          setSkills(
            normalizeRows(
              skillJson
            )
          );
        } catch (err) {
          console.error(
            "loadMasters position-skills:",
            err
          );

          swalError(
            err?.message ||
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
      }, 250);

    return () =>
      clearTimeout(
        timer
      );
  }, [
    loadingUser,
    canView,
    search,
    positionId,
    skillId,
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
    setSkillId("");
    setImportance("");
    setStatus("active");
    setPage(1);
  };

  const handleAdd = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มทักษะประจำตำแหน่ง"
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
        "คุณไม่มีสิทธิ์แก้ไขทักษะประจำตำแหน่ง"
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

  const handleSubmit =
    async (values) => {
      try {
        setSaving(true);

        const method =
          editingItem
            ? "PATCH"
            : "POST";

        const url =
          editingItem
            ? `/api/admin/position-skills/${editingItem.id}`
            : "/api/admin/position-skills";

        const res =
          await fetch(
            url,
            {
              method,

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
            (editingItem
              ? "แก้ไขข้อมูลสำเร็จ"
              : "เพิ่มข้อมูลสำเร็จ")
        );

        setOpenModal(
          false
        );

        setEditingItem(
          null
        );

        await loadData(
          page,
          pageSize
        );
      } catch (err) {
        console.error(
          "save position-skill:",
          err
        );

        swalError(
          err?.message ||
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
          "คุณไม่มีสิทธิ์ลบทักษะประจำตำแหน่ง"
        );
        return;
      }

      const confirm =
        await swalConfirm({
          title:
            "ยืนยันการลบ",

          text:
            `ต้องการลบ ${
              record.skill_name ||
              record.skill_id
            } ใช่หรือไม่ ?`,
        });

      if (
        !confirm?.isConfirmed
      ) {
        return;
      }

      try {
        const res =
          await fetch(
            `/api/admin/position-skills/${record.id}`,
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
      } catch (err) {
        console.error(
          "delete position-skill:",
          err
        );

        swalError(
          err?.message ||
            "ลบข้อมูลไม่สำเร็จ"
        );
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
        description="คุณไม่มีสิทธิ์ดูข้อมูลทักษะประจำตำแหน่ง"
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PositionSkillSearch
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
        skillId={skillId}
        setSkillId={
          setSkillId
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
        skills={skills}
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

      <Card>
        <PositionSkillTable
          data={items}
          loading={loading}
          onEdit={
            handleEdit
          }
          onDelete={
            handleDelete
          }
          canEdit={
            canEdit
          }
          canDelete={
            canDelete
          }
        />

        <PositionSkillPagination
          current={page}
          pageSize={
            pageSize
          }
          total={total}
          onChange={
            handlePageChange
          }
        />
      </Card>

      <PositionSkillModal
        open={openModal}
        loading={saving}
        masterLoading={
          masterLoading
        }
        editingItem={
          editingItem
        }
        positions={
          positions
        }
        skills={skills}
        onCancel={() => {
          setOpenModal(
            false
          );

          setEditingItem(
            null
          );
        }}
        onSubmit={
          handleSubmit
        }
      />
    </>
  );
}
