"use client";

import { useMemo } from "react";
import {
  Alert,
  Button,
  Empty,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const SCOPE_LABELS = {
  all: "ทั้งองค์กร",
  company: "บริษัท",
  branch_group: "กรุ๊ปสังกัด",
  branch: "สังกัด",
  department: "แผนก",
  division: "ฝ่าย",
  unit: "หน่วยงาน",
};

function getScopeTargetName(scope = {}) {
  switch (scope.scope_type) {
    case "all":
      return "ทั้งองค์กร";
    case "company":
      return scope.company_name || "-";
    case "branch_group":
      return scope.branch_group_name || "-";
    case "branch":
      return scope.branch_name || "-";
    case "department":
      return scope.department_name || "-";
    case "division":
      return scope.division_name || "-";
    case "unit":
      return scope.unit_name || "-";
    default:
      return "-";
  }
}

function getScopes(record = {}) {
  if (Array.isArray(record.scopes) && record.scopes.length) {
    return record.scopes;
  }

  if (!record.scope_type) return [];

  return [
    {
      scope_type: record.scope_type,
      company_name: record.company_name,
      branch_group_name: record.branch_group_name,
      branch_name: record.branch_name,
      department_name: record.department_name,
      division_name: record.division_name,
      unit_name: record.unit_name,
      is_primary: true,
      status: record.status,
    },
  ];
}

function scoreAssignment(record = {}) {
  let score = 0;
  if (record.status === "active") score += 4;
  if (record.is_primary) score += 2;
  if (record.management_level) score += 1;
  return score;
}

function buildTreeData(data = []) {
  const records = (Array.isArray(data) ? data : []).filter(
    (item) => item?.id && item?.employee_id
  );

  const recordById = new Map();
  const preferredByEmployeeId = new Map();

  for (const record of records) {
    const id = String(record.id);
    const employeeId = String(record.employee_id);

    recordById.set(id, record);

    const current = preferredByEmployeeId.get(employeeId);
    if (!current || scoreAssignment(record) > scoreAssignment(current)) {
      preferredByEmployeeId.set(employeeId, record);
    }
  }

  const childrenByParentId = new Map();
  const rootIds = [];

  for (const record of records) {
    const id = String(record.id);
    const supervisorEmployeeId = record.supervisor_employee_id
      ? String(record.supervisor_employee_id)
      : "";

    const parentRecord = supervisorEmployeeId
      ? preferredByEmployeeId.get(supervisorEmployeeId)
      : null;

    const parentId = parentRecord?.id ? String(parentRecord.id) : "";

    if (!parentId || parentId === id || !recordById.has(parentId)) {
      rootIds.push(id);
      continue;
    }

    if (!childrenByParentId.has(parentId)) {
      childrenByParentId.set(parentId, []);
    }

    childrenByParentId.get(parentId).push(id);
  }

  const visited = new Set();

  function makeNode(id, path = new Set()) {
    if (path.has(id)) {
      return null;
    }

    const record = recordById.get(id);
    if (!record) return null;

    visited.add(id);

    const nextPath = new Set(path);
    nextPath.add(id);

    const childIds = childrenByParentId.get(id) || [];
    const children = childIds
      .map((childId) => makeNode(childId, nextPath))
      .filter(Boolean);

    return {
      key: id,
      record,
      children,
    };
  }

  const tree = rootIds.map((id) => makeNode(id)).filter(Boolean);

  // ถ้ามีข้อมูลวงรอบหรือ supervisor ที่เชื่อมกันผิดปกติ
  // ให้ยังแสดงรายการนั้นเป็น root เพื่อไม่ให้ข้อมูลหายจากหน้าจอ
  for (const record of records) {
    const id = String(record.id);
    if (visited.has(id)) continue;

    const node = makeNode(id);
    if (node) tree.push(node);
  }

  return tree;
}

function BusinessNode({
  record,
  canEditRecord,
  canDeleteRecord,
  deletingId,
  onView,
  onEdit,
  onDelete,
}) {
  const scopes = getScopes(record);
  const visibleScopes = scopes.slice(0, 3);
  const extraScopeCount = Math.max(scopes.length - visibleScopes.length, 0);

  const canEdit = Boolean(canEditRecord?.(record));
  const canDelete = Boolean(canDeleteRecord?.(record));

  return (
    <div
      style={{
        width: "100%",
        minWidth: 320,
        padding: "8px 10px",
        border: "1px solid #f0f0f0",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <Space
        align="start"
        style={{
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Space orientation="vertical" size={3} style={{ minWidth: 0 }}>
          <Space wrap size={[6, 4]}>
            <Text strong>{record.employee_name || "-"}</Text>
            <Text type="secondary">{record.employee_code || "-"}</Text>
            {record.management_level && (
              <Tag color="blue">{record.management_level}</Tag>
            )}
            <Tag color={record.status === "active" ? "green" : undefined}>
              {record.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
            </Tag>
          </Space>

          <Text type="secondary">
            {[record.position_name, record.job_name]
              .filter(Boolean)
              .join(" • ") || "ไม่ระบุตำแหน่ง / Job"}
          </Text>

          {record.management_level !== "P12" && (
            <Text type="secondary">
              Reports To: {record.supervisor_name || "ไม่ระบุผู้บังคับบัญชา"}
            </Text>
          )}

          {visibleScopes.length > 0 && (
            <Space wrap size={[4, 4]}>
              {visibleScopes.map((scope, index) => (
                <Tag
                  key={scope.id || `${scope.scope_type}-${index}`}
                  color={scope.is_primary ? "geekblue" : undefined}
                >
                  {SCOPE_LABELS[scope.scope_type] || scope.scope_type}: {getScopeTargetName(scope)}
                </Tag>
              ))}
              {extraScopeCount > 0 && <Tag>+{extraScopeCount}</Tag>}
            </Space>
          )}
        </Space>

        <Space size={2} onClick={(event) => event.stopPropagation()}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView?.(record)}
            />
          </Tooltip>

          {canEdit && (
            <Tooltip title="แก้ไขสายบริหาร">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ยกเลิกโครงสร้างบริหาร">
              <Button
                type="text"
                danger
                loading={String(deletingId) === String(record.id)}
                icon={<DeleteOutlined />}
                onClick={() => onDelete?.(record)}
              />
            </Tooltip>
          )}
        </Space>
      </Space>
    </div>
  );
}

export default function EmployeeBusinessStructureTree({
  data = [],
  loading = false,
  error = "",
  deletingId = "",
  canEditRecord = () => false,
  canDeleteRecord = () => false,
  onView,
  onEdit,
  onDelete,
}) {
  const treeData = useMemo(() => buildTreeData(data), [data]);

  const treeKey = useMemo(
    () => `business-tree-${data.length}-${data[0]?.id || "empty"}`,
    [data]
  );

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title="ไม่สามารถโหลดผังสายบริหารได้"
        description={error}
      />
    );
  }

  if (!treeData.length) {
    return <Empty description="ไม่พบโครงสร้างบริหารตามตัวกรองที่เลือก" />;
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        icon={<NodeIndexOutlined />}
        title="ผังสายบริหาร"
        description="แสดงความสัมพันธ์จากผู้บังคับบัญชาไปยังผู้ใต้บังคับบัญชาตาม Reporting Line ภายใต้ Permission, Scope และตัวกรองปัจจุบัน คลิกชื่อในผังหรือใช้ปุ่มด้านขวาเพื่อดูและจัดการรายการ"
      />

      <div style={{ overflowX: "auto" }}>
        <Tree
          key={treeKey}
          blockNode
          showLine={{ showLeafIcon: false }}
          defaultExpandAll
          treeData={treeData}
          titleRender={(node) => (
            <BusinessNode
              record={node.record}
              deletingId={deletingId}
              canEditRecord={canEditRecord}
              canDeleteRecord={canDeleteRecord}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
          onSelect={(_, info) => {
            if (info?.node?.record) {
              onView?.(info.node.record);
            }
          }}
        />
      </div>
    </Space>
  );
}
