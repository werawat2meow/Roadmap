"use client";

import { useState ,  useEffect, } from "react";

import {
  Card,
  Row,
  Col,
  Result,
  message,
} from "antd";

import {useAuth} from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import PositionFamilyLevelSearch from "./components/PositionFamilyLevelSearch";
import PositionFamilyLevelToolbar from "./components/PositionFamilyLevelToolbar";
import PositionFamilyLevelSummary from "./components/PositionFamilyLevelSummary";
import PositionFamilyLevelTransfer from "./components/PositionFamilyLevelTransfer";

export default function PositionFamilyLevelsPage() {
  const { user } = useAuth();
  const canView = hasPermission(user,"ems.position_family_levels.view");
  const canEdit = hasPermission(user,"ems.position_family_levels.edit");
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [saving, setSaving] =useState(false);
  const [families, setFamilies] =useState([]);
  const [levels, setLevels] =useState([]);
  const [selectedFamilyId, setSelectedFamilyId] =useState(null);
  const [selectedFamily, setSelectedFamily] =useState(null);
  const [selectedLevels, setSelectedLevels] =useState([]);

  const loadFamilies = async () => {
    try {
      setLoadingFamilies(true);

      const res = await fetch(
        "/api/admin/position-families?page=1&pageSize=9999"
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error || "โหลด Position Family ไม่สำเร็จ"
        );
      }

      const rows = json.data || [];

      setFamilies(rows);

      // เลือกตัวแรกอัตโนมัติ
      if (!selectedFamilyId && rows.length > 0) {
        setSelectedFamilyId(rows[0].id);
        setSelectedFamily(rows[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFamilies(false);
    }
  };
  
  const loadLevels = async () => {
    try {
      setLoadingLevels(true);

      const res = await fetch(
        "/api/admin/position-levels?page=1&pageSize=9999"
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.error || "โหลด Position Level ไม่สำเร็จ"
        );
      }

      setLevels(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLevels(false);
    }
  };


  useEffect(() => {
    loadFamilies();
    loadLevels();
  }, []);

  useEffect(() => {
    if (!selectedFamilyId) return;

    loadSelectedLevels(
      selectedFamilyId
    );
  }, [selectedFamilyId]);
  
  
  const loadSelectedLevels = async (
    familyId
  ) => {
    if (!familyId) {
      setSelectedLevels([]);
      return;
    }
    
    try {
      setLoadingLevels(true);
      
      const res = await fetch(
        `/api/admin/position-family-levels?family_id=${familyId}`
      );
      
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(
          json.error || "โหลดข้อมูลไม่สำเร็จ"
        );
      }
      
      const ids =
      (json.data || []).map(
        (item) => item.position_level_id
      );
      
      setSelectedLevels(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLevels(false);
    }
  };
  
  const handleFamilyChange = (
    familyId
  ) => {
    setSelectedFamilyId(familyId);
    
    const family = families.find(
      (item) => item.id === familyId
    );
    
    setSelectedFamily(family || null);
  };
  
  const handleRefresh = async () => {
    await Promise.all([
      loadFamilies(),
      loadLevels(),
    ]);
    
    if (selectedFamilyId) {
      await loadSelectedLevels(
        selectedFamilyId
      );
    }
  };
  
  const handleReset = async () => {
    if (!selectedFamilyId) return;
    
    await loadSelectedLevels(selectedFamilyId);
  };
  
  const handleSave = async () => {
    if (!selectedFamilyId) {
      message.warning("กรุณาเลือก Position Family");
      return;
    }
    
    try {
      setSaving(true);
      
      const res = await fetch(
        "/api/admin/position-family-levels",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            family_id: selectedFamilyId,
            level_ids: selectedLevels,
          }),
        }
      );
      
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(
          json.error || "บันทึกไม่สำเร็จ"
        );
      }
      
      message.success("บันทึกข้อมูลเรียบร้อย");
      
      await loadSelectedLevels(
        selectedFamilyId
      );
    } catch (err) {
      console.error(err);
      
      message.error(
        err.message ||
        "เกิดข้อผิดพลาดในการบันทึก"
      );
    } finally {
      setSaving(false);
    }
  };
  
  if (!canView) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้"
      />
    );
  }
  
  return (
    <div className="space-y-4">

      <PositionFamilyLevelSearch
        families={families}
        loading={loadingFamilies}
        selectedFamilyId={selectedFamilyId}
        onChange={handleFamilyChange}
      />

      <PositionFamilyLevelToolbar
        selectedFamilyId={selectedFamilyId}
        selectedLevels={selectedLevels}
        saving={saving}
        loading={loadingFamilies || loadingLevels}
        canEdit={canEdit}
        onSave={handleSave}
        onReset={handleReset}
        onRefresh={handleRefresh}
      />

      <PositionFamilyLevelSummary
        family={selectedFamily}
        levels={levels.filter((item) =>
          selectedLevels.includes(item.id)
        )}
      />

      <Row>

        <Col xs={24}>

          <Card>

            <PositionFamilyLevelTransfer
              levels={levels}
              selectedLevels={selectedLevels}
              loading={loadingLevels}
              onChange={setSelectedLevels}
            />

          </Card>

        </Col>

      </Row>

    </div>
  );
}