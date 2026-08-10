"use client";

import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from "antd";

import {
  CheckSquareOutlined,
  DownOutlined,
  KeyOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  useMemo,
  useState,
} from "react";

const { Text, Title } = Typography;

/* =========================================================
   Constants
========================================================= */

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  update: "Edit",
  delete: "Delete",
  manage: "Manage",
  approve: "Approve",
  reject: "Reject",
  export: "Export",
  import: "Import",
  print: "Print",
  reset_password: "Reset PW",
};

// ลำดับคอลัมน์ Action ที่อยากให้เรียงก่อน ถ้ามีอยู่ในระบบนั้นๆ
const PREFERRED_ACTION_ORDER = [
  "view",
  "create",
  "edit",
  "update",
  "delete",
  "manage",
  "approve",
  "reject",
  "export",
  "import",
  "print",
  "reset_password",
];

const SYSTEM_LABELS = {
  access: "User Access",
  ems: "Employee Master",
  payroll: "Payroll",
  benefit: "Benefit",
  leave: "Leave",
  attendance: "Attendance",
  recruitment: "Recruitment",
};

/* =========================================================
   Helpers
========================================================= */

function getPermissionSystem(permission) {
  const permissionCode =
    permission?.permission_code || "";

  const moduleCode =
    permission?.module_code || "";

  const source =
    permissionCode || moduleCode;

  const firstPart =
    source.split(".")[0] || "other";

  return firstPart;
}

function getPermissionModule(permission) {
  const moduleCode =
    permission?.module_code || "";

  const permissionCode =
    permission?.permission_code || "";

  if (moduleCode) {
    const parts =
      moduleCode.split(".");

    if (parts.length > 1) {
      return parts.slice(1).join(".");
    }

    return moduleCode;
  }

  const parts =
    permissionCode.split(".");

  if (parts.length >= 3) {
    return parts.slice(1, -1).join(".");
  }

  if (parts.length >= 2) {
    return parts[1];
  }

  return "other";
}

function getSystemLabel(systemCode) {
  return (
    SYSTEM_LABELS[systemCode] ||
    systemCode
      .replaceAll("_", " ")
      .toUpperCase()
  );
}

function getModuleLabel(moduleCode) {
  return String(moduleCode || "other")
    .replaceAll("_", " ")
    .replaceAll(".", " / ")
    .replace(/\b\w/g, (value) =>
      value.toUpperCase()
    );
}

function getActionLabel(actionCode) {
  return (
    ACTION_LABELS[actionCode] ||
    actionCode ||
    "สิทธิ์"
  );
}

function getOrderedActionCodes(
  actionCodes
) {
  const known =
    PREFERRED_ACTION_ORDER.filter(
      (code) =>
        actionCodes.includes(code)
    );

  const unknown = actionCodes
    .filter(
      (code) =>
        !PREFERRED_ACTION_ORDER.includes(
          code
        )
    )
    .sort();

  return [...known, ...unknown];
}

/* =========================================================
   Component
========================================================= */

export default function RolePermissionMatrix({
  roleId = "",
  permissions = [],

  selectedPermissionIds = [],

  disabled = false,

  loading = false,

  onChange,
}) {

  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [systemFilter, setSystemFilter] =
    useState("");

  // เก็บ systemCode ที่ถูก "กาง" (เปิด) ไว้ — ค่าเริ่มต้นว่าง = ปิดหมด
  const [expandedSystems, setExpandedSystems] =
    useState(() => new Set());

  const toggleSystemCollapsed = (systemCode) => {
    setExpandedSystems((prev) => {
      const next = new Set(prev);

      if (next.has(systemCode)) {
        next.delete(systemCode);
      } else {
        next.add(systemCode);
      }

      return next;
    });
  };

  const activePermissions =
    useMemo(() => {
      return permissions.filter(
        (permission) =>
          permission?.is_active !==
          false
      );
    }, [permissions]);

  const systemOptions =
    useMemo(() => {
      const systems = [
        ...new Set(
          activePermissions.map(
            getPermissionSystem
          )
        ),
      ];

      return systems
        .sort()
        .map((systemCode) => ({
          value: systemCode,
          label:
            getSystemLabel(
              systemCode
            ),
        }));
    }, [activePermissions]);

  const filteredPermissions =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return activePermissions.filter(
        (permission) => {
          const system =
            getPermissionSystem(
              permission
            );

          if (
            systemFilter &&
            system !== systemFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          return [
            permission.permission_code,
            permission.permission_name,
            permission.description,
            permission.module_code,
            permission.action_code,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
          );
        }
      );
    }, [
      activePermissions,
      search,
      systemFilter,
    ]);

  const groupedPermissions =
    useMemo(() => {
      const groups = {};

      for (const permission of filteredPermissions) {
        const systemCode =
          getPermissionSystem(
            permission
          );

        const moduleCode =
          getPermissionModule(
            permission
          );

        if (!groups[systemCode]) {
          groups[systemCode] = {};
        }

        if (
          !groups[systemCode][moduleCode]
        ) {
          groups[systemCode][
            moduleCode
          ] = [];
        }

        groups[systemCode][
          moduleCode
        ].push(permission);
      }

      return groups;
    }, [filteredPermissions]);

  const selectedSet = useMemo(
    () =>
      new Set(
        selectedPermissionIds
      ),
    [selectedPermissionIds]
  );

  const setSelectedIds = (
    nextIds
  ) => {
    onChange?.([
      ...new Set(nextIds),
    ]);
  };

  const togglePermission = (
    permissionId
  ) => {
    if (disabled) {
      return;
    }

    if (
      selectedSet.has(permissionId)
    ) {
      setSelectedIds(
        selectedPermissionIds.filter(
          (id) =>
            id !== permissionId
        )
      );
    } else {
      setSelectedIds([
        ...selectedPermissionIds,
        permissionId,
      ]);
    }
  };

  // toggle เปิด/ปิดกลุ่มของ permission id แบบ all-or-none
  const toggleIdsList = (ids) => {
    if (disabled) {
      return;
    }

    const validIds = ids.filter(
      Boolean
    );

    const allSelected =
      validIds.length > 0 &&
      validIds.every((id) =>
        selectedSet.has(id)
      );

    if (allSelected) {
      setSelectedIds(
        selectedPermissionIds.filter(
          (id) =>
            !validIds.includes(id)
        )
      );
    } else {
      setSelectedIds([
        ...selectedPermissionIds,
        ...validIds,
      ]);
    }
  };

  const toggleGroup = (
    groupPermissions
  ) => {
    toggleIdsList(
      groupPermissions.map(
        (item) => item.id
      )
    );
  };

  const toggleSystem = (
    featureGroups
  ) => {
    const systemPermissions =
      Object.values(
        featureGroups
      ).flat();

    toggleGroup(
      systemPermissions
    );
  };

  const selectAllVisible = () => {
    const ids =
      filteredPermissions.map(
        (item) => item.id
      );

    setSelectedIds([
      ...selectedPermissionIds,
      ...ids,
    ]);
  };

  const clearAllVisible = () => {
    const visibleIds = new Set(
      filteredPermissions.map(
        (item) => item.id
      )
    );

    setSelectedIds(
      selectedPermissionIds.filter(
        (id) =>
          !visibleIds.has(id)
      )
    );
  };

  const handleSavePermissions = async () => {
    if (disabled || saving) {
      return;
    }

    if (!roleId) {
      message.error(
        "ไม่พบ Role ที่ต้องการบันทึก"
      );

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/role-permissions",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            role_id: roleId,

            permission_ids:
              selectedPermissionIds,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.success !== true
      ) {
        throw new Error(
          result?.error ||
            "ไม่สามารถบันทึกสิทธิ์ได้"
        );
      }

      const savedPermissionIds =
        result?.data
          ?.permission_ids ||
        selectedPermissionIds;

      onChange?.(
        savedPermissionIds
      );

      message.success(
        result?.message ||
          "บันทึกสิทธิ์เรียบร้อยแล้ว"
      );

      await onSaved?.({
        role_id: roleId,

        permission_ids:
          savedPermissionIds,

        response: result,
      });
    } catch (error) {
      console.error(
        "SAVE_ROLE_PERMISSION_ERROR:",
        error
      );

      message.error(
        error?.message ||
          "ไม่สามารถบันทึกสิทธิ์ได้"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     สร้างตารางแบบ Pivot สำหรับ 1 "ระบบ"
     แถว = โมดูล, คอลัมน์ = ประเภท Action (View / Create / Edit ...)
  ========================================================= */

  function buildPivotTable(
    featureGroups
  ) {
    const moduleRows = Object.entries(
      featureGroups
    ).map(([moduleCode, items]) => {
      const byAction = {};

      for (const item of items) {
        byAction[item.action_code] =
          item;
      }

      return {
        key: moduleCode,
        moduleCode,
        items,
        byAction,
      };
    });

    const actionCodeSet = new Set();

    for (const row of moduleRows) {
      for (const item of row.items) {
        if (item.action_code) {
          actionCodeSet.add(
            item.action_code
          );
        }
      }
    }

    const actionCodes =
      getOrderedActionCodes([
        ...actionCodeSet,
      ]);

    return { moduleRows, actionCodes };
  }

  function buildPivotColumns(
    moduleRows,
    actionCodes
  ) {
    const moduleColumn = {
      title: "โมดูล",
      dataIndex: "moduleCode",
      key: "moduleCode",
      fixed: "left",
      width: 240,
      render: (moduleCode, row) => {
        // ใช้คำอธิบายจาก action "view" ก่อน ถ้าไม่มีค่อยหาจาก
        // permission ตัวแรกที่มี description ในโมดูลนี้
        const rowDescription =
          row.byAction?.view
            ?.description ||
          row.items.find(
            (item) =>
              item?.description
          )?.description ||
          null;

        return (
          <div>
            <Text strong>
              {getModuleLabel(
                moduleCode
              )}
            </Text>

            <div className="text-xs text-slate-500">
              {row.items.length}{" "}
              Actions
            </div>

            {rowDescription && (
              <div className="mt-1 text-xs text-slate-400">
                {rowDescription}
              </div>
            )}
          </div>
        );
      },
    };

    const actionColumns =
      actionCodes.map((actionCode) => {
        const columnIds =
          moduleRows
            .map(
              (row) =>
                row.byAction[
                  actionCode
                ]?.id
            )
            .filter(Boolean);

        const allColSelected =
          columnIds.length > 0 &&
          columnIds.every((id) =>
            selectedSet.has(id)
          );

        const someColSelected =
          columnIds.some((id) =>
            selectedSet.has(id)
          );

        return {
          title: (
            <div className="flex flex-col items-center gap-1">
              <Checkbox
                disabled={
                  disabled ||
                  columnIds.length ===
                    0
                }
                checked={
                  allColSelected
                }
                indeterminate={
                  someColSelected &&
                  !allColSelected
                }
                onChange={() =>
                  toggleIdsList(
                    columnIds
                  )
                }
              />

              <span>
                {getActionLabel(
                  actionCode
                )}
              </span>
            </div>
          ),
          dataIndex: actionCode,
          key: actionCode,
          align: "center",
          width: 110,
          render: (_, row) => {
            const permission =
              row.byAction[
                actionCode
              ];

            if (!permission) {
              return (
                <span className="text-slate-300">
                  –
                </span>
              );
            }

            return (
              <Tooltip
                title={
                  permission.permission_name ||
                  permission.permission_code
                }
              >
                <Checkbox
                  disabled={disabled}
                  checked={selectedSet.has(
                    permission.id
                  )}
                  onChange={() =>
                    togglePermission(
                      permission.id
                    )
                  }
                />
              </Tooltip>
            );
          },
        };
      });

    return [
      moduleColumn,
      ...actionColumns,
    ];
  }

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        title="กำหนดสิทธิ์ให้ Role"
        description="Permissions กำหนดว่า Role นี้สามารถเข้าเมนูใด และทำ Action ใดได้ ส่วนขอบเขตสังกัดจะกำหนดภายหลังในหน้ากำหนดบทบาทผู้ใช้งาน"
      />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Row
          gutter={[12, 12]}
          align="middle"
        >
          <Col
            xs={24}
            lg={12}
          >
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="ค้นหา Permission..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </Col>

          <Col
            xs={24}
            sm={12}
            lg={6}
          >
            <Select
              allowClear
              className="w-full"
              placeholder="กรองตามระบบ"
              value={
                systemFilter ||
                undefined
              }
              options={systemOptions}
              onChange={(value) =>
                setSystemFilter(
                  value || ""
                )
              }
            />
          </Col>

          <Col
            xs={24}
            sm={12}
            lg={6}
          >
            <Space wrap>
              <Button
                icon={
                  <CheckSquareOutlined />
                }
                disabled={
                  disabled || loading
                }
                onClick={
                  selectAllVisible
                }
              >
                เลือกที่แสดง
              </Button>

              <Button
                disabled={
                  disabled || loading
                }
                onClick={
                  clearAllVisible
                }
              >
                ยกเลิกที่แสดง
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Space>
          <KeyOutlined className="text-blue-600" />

          <Text strong>
            เลือกแล้ว{" "}
            {selectedPermissionIds.length}{" "}
            สิทธิ์
          </Text>
        </Space>

        <Space wrap>
          <Text type="secondary">
            แสดง{" "}
            {filteredPermissions.length}{" "}
            จาก {activePermissions.length}{" "}
            สิทธิ์
          </Text>

          <Button
            type="primary"
            icon={
              <CheckSquareOutlined />
            }
            loading={saving}
            disabled={
              disabled ||
              loading ||
              saving ||
              !roleId
            }
            onClick={
              handleSavePermissions
            }
          >
            บันทึกสิทธิ์
          </Button>
        </Space>
      </div>

      {Object.keys(
        groupedPermissions
      ).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10">
          <Empty description="ไม่พบ Permission" />
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(
            groupedPermissions
          ).map(
            ([
              systemCode,
              featureGroups,
            ]) => {
              const systemPermissions =
                Object.values(
                  featureGroups
                ).flat();

              const allSystemSelected =
                systemPermissions.length >
                  0 &&
                systemPermissions.every(
                  (item) =>
                    selectedSet.has(
                      item.id
                    )
                );

              const someSystemSelected =
                systemPermissions.some(
                  (item) =>
                    selectedSet.has(
                      item.id
                    )
                );

              const isSystemCollapsed =
                !expandedSystems.has(
                  systemCode
                );

              const {
                moduleRows,
                actionCodes,
              } = buildPivotTable(
                featureGroups
              );

              const pivotColumns =
                buildPivotColumns(
                  moduleRows,
                  actionCodes
                );

              return (
                <div
                  key={systemCode}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        toggleSystemCollapsed(
                          systemCode
                        )
                      }
                      className="flex items-center gap-2 text-left"
                    >
                      {isSystemCollapsed ? (
                        <RightOutlined className="text-slate-400" />
                      ) : (
                        <DownOutlined className="text-slate-400" />
                      )}

                      <div>
                        <Title
                          level={4}
                          className="!mb-0"
                        >
                          {getSystemLabel(
                            systemCode
                          )}
                        </Title>

                        <Text type="secondary">
                          {
                            systemPermissions.length
                          }{" "}
                          Permissions
                        </Text>
                      </div>
                    </button>

                    <Checkbox
                      disabled={disabled}
                      checked={
                        allSystemSelected
                      }
                      indeterminate={
                        someSystemSelected &&
                        !allSystemSelected
                      }
                      onChange={() =>
                        toggleSystem(
                          featureGroups
                        )
                      }
                    >
                      เลือกทั้งระบบ
                    </Checkbox>
                  </div>

                  {!isSystemCollapsed && (
                    <Table
                      bordered
                      size="small"
                      rowKey="key"
                      pagination={false}
                      scroll={{ x: "max-content" }}
                      columns={
                        pivotColumns
                      }
                      dataSource={
                        moduleRows
                      }
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}