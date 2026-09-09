"use client";

import { useEffect, useState } from "react";
import {Card,Button,message,} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PositionLevelBandSearch from "./components/PositionLevelBandSearch";
import PositionLevelBandTable from "./components/PositionLevelBandTable";
import PositionLevelBandPagination from "./components/PositionLevelBandPagination";
import PositionLevelBandModal from "./components/PositionLevelBandModal";

import { useRouter,useSearchParams, } from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

export default function PositionLevelBandsPage() {


  /* ==========================
    Permission
  ========================== */
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user,"ems.position_level_bands.view");
  const canCreate = hasPermission(user,"ems.position_level_bands.create");
  const canEdit = hasPermission(user,"ems.position_level_bands.edit");
  const canDelete = hasPermission(user,"ems.position_level_bands.delete");

  /* ==========================
    Navigation Context

    รองรับทั้ง:
    - ?level_id=...
    - ?position_level_id=...

    เพื่อให้เปิดมาจากหน้า
    /admin/position-family-levels
    แล้วเลือกระดับที่กดมาให้อัตโนมัติ
  ========================== */

  const levelIdFromUrl =
    searchParams.get("level_id")?.trim() ||
    searchParams.get("position_level_id")?.trim() ||
    "";

  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [bands, setBands] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(() => levelIdFromUrl || null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =useState(20);
  const [pagination, setPagination] =useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  /* ==========================
      Load Position Levels
  ========================== */

  const loadLevels = async () => {
    try {
      
      const res = await fetch("/api/admin/position-levels");
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }
      const rows = json.data || [];
      setLevels(rows);
      if (
        levelIdFromUrl &&
        rows.some(
          (item) =>
            String(item.id) ===
            String(levelIdFromUrl)
        )
      ) {
        setSelectedLevel(
          levelIdFromUrl
        );
      }
    } catch (err) {
      console.error(err);
      message.error(
        err.message || "โหลดข้อมูลไม่สำเร็จ"
      );
    }
  };

  /* ==========================
    Read Query String
  ========================== */

  useEffect(() => {
    if (!levelIdFromUrl) {
      return;
    }

    setPage(1);

    setSelectedLevel((current) => {
      if (
        String(current || "") ===
        String(levelIdFromUrl)
      ) {
        return current;
      }

      return levelIdFromUrl;
    });
  }, [levelIdFromUrl]);

  /* ==========================
      Load Bands
  ========================== */

  const loadBands = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        pageSize,
      });

      if (search) {
        params.append("search", search);
      }

      if (selectedLevel) {
        params.append(
          "position_level_id",
          selectedLevel
        );
      }

      const res = await fetch(
        `/api/admin/position-level-bands?${params.toString()}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      setBands(json.data || []);

      setPagination(
        json.pagination || {}
      );
    } catch (err) {
      console.error(err);

      message.error(
        err.message || "โหลดข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
      Level Change
  ========================== */

  const handleLevelChange = (
    value
  ) => {
    setPage(1);
    setSelectedLevel(
      value || null
    );
  };

  /* ==========================
      Search
  ========================== */

  const handleSearch = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    loadBands();
  };

  /* ==========================
      Reset
  ========================== */

  const handleReset = () => {
    setSearch("");
    setSelectedLevel(
      levelIdFromUrl || null
    );
    setPage(1);
    setTimeout(() => {
      loadBands();
    }, 0);
  };

  /* ==========================
      Add
  ========================== */

  const handleOpenAdd = () => {
    setEditingItem(null);

    setModalOpen(true);
  };

  /* ==========================
      Edit
  ========================== */

  const handleOpenEdit = (record) => {
    setEditingItem(record);

    setModalOpen(true);
  };

    /* ==========================
      Save
  ========================== */

  const handleSave = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        position_level_id: selectedLevel,
      };

      const url = editingItem
        ? `/api/admin/position-level-bands/${editingItem.id}`
        : "/api/admin/position-level-bands";

      const method = editingItem
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      message.success(
        editingItem
          ? "แก้ไขข้อมูลสำเร็จ"
          : "เพิ่มข้อมูลสำเร็จ"
      );

      setModalOpen(false);

      setEditingItem(null);

      loadBands();
    } catch (err) {
      console.error(err);

      message.error(
        err.message || "บันทึกข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
      Delete
  ========================== */

  const handleDelete = async (record) => {
    if (
      !confirm(
        `ต้องการลบ ${record.band_name} ใช่หรือไม่ ?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/position-level-bands/${record.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      message.success(
        "ลบข้อมูลสำเร็จ"
      );

      loadBands();
    } catch (err) {
      console.error(err);

      message.error(
        err.message || "ลบข้อมูลไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
      Effect
  ========================== */

  useEffect(() => {
    loadLevels();
  }, [searchParams]);

  useEffect(() => {
    loadBands();
  }, [
    page,
    pageSize,
    selectedLevel,
  ]);

  /* ==========================
      Permission Guard
  ========================== */

  useEffect(() => {
    if (loadingUser) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canView) {
      router.replace("/403");
    }
  }, [loadingUser,user,canView,router,]);

  const currentLevel = levels.find((item) => item.id === selectedLevel);

  if (loadingUser) return null;
  if (!user || !canView) return null;
  
  return (
    <Card
      title={
        currentLevel? `Position Level Bands - ${currentLevel.level_code} (${currentLevel.level_name})` : "Position Level Bands"
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
          disabled={!selectedLevel || !canCreate}
        >
          {currentLevel? `เพิ่ม Band (${currentLevel.level_code})`: "เพิ่ม Band"}
        </Button>
      }
    >

      <PageInfoAlert
        message="Position Level Bands"
        description="จัดการข้อมูล Band ของแต่ละระดับตำแหน่งงานคนไทย (Position Level) โดยสามารถเลือก Position Level ที่ต้องการจัดการได้จากด้านบน "
      />

      <div style={{ marginTop: 10 }} />

      <PositionLevelBandSearch
        search={search}
        setSearch={setSearch}
        levels={levels}
        selectedLevel={selectedLevel}
        setSelectedLevel={
          handleLevelChange
        }
        onSearch={handleSearch}
        onReset={handleReset}
        lockLevel={
          !!levelIdFromUrl
        }
      />

      <div style={{ marginTop: 10 }} />

      <PositionLevelBandTable
        data={bands}
        loading={loading}
        pagination={pagination}
        page={page}
        pageSize={pageSize}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <PositionLevelBandPagination
        pagination={pagination}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      <PositionLevelBandModal
        open={modalOpen}
        loading={loading}
        editingItem={editingItem}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSave}
      />
    </Card>
  );
}
