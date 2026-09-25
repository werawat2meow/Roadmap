"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Card,
  Empty,
  Spin,
  Tag,
  Tree,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
} from "@ant-design/icons";

import EmployeeTable from "./EmployeeTable";

const {
  Text,
  Title,
} = Typography;

const LEVELS = [
  {
    key:
      "company",

    idKey:
      "company_id",

    relationKey:
      "companies",

    codeKey:
      "company_code",

    nameKeys: [
      "company_name_th",
      "company_name_en",
    ],

    missingLabel:
      "ไม่ระบุบริษัท",
  },
  {
    key:
      "branch_group",

    idKey:
      "branch_group_id",

    relationKey:
      "branch_groups",

    codeKey:
      "group_code",

    nameKeys: [
      "group_name",
    ],

    missingLabel:
      "ไม่ระบุกรุ๊ปสังกัด",
  },
  {
    key:
      "branch",

    idKey:
      "branch_id",

    relationKey:
      "branches",

    codeKey:
      "branch_code",

    nameKeys: [
      "branch_name",
    ],

    missingLabel:
      "ไม่ระบุสังกัด",
  },
  {
    key:
      "department",

    idKey:
      "department_id",

    relationKey:
      "departments",

    codeKey:
      "department_code",

    nameKeys: [
      "department_name",
    ],

    missingLabel:
      "ไม่ระบุแผนก",
  },
  {
    key:
      "division",

    idKey:
      "division_id",

    relationKey:
      "divisions",

    codeKey:
      "division_code",

    nameKeys: [
      "division_name",
    ],

    missingLabel:
      "ไม่ระบุฝ่าย",
  },
  {
    key:
      "unit",

    idKey:
      "unit_id",

    relationKey:
      "units",

    codeKey:
      "unit_code",

    nameKeys: [
      "unit_name",
    ],

    missingLabel:
      "ไม่ระบุหน่วยงาน",
  },
];

function cleanText(
  value
) {
  return String(
    value ??
      ""
  ).trim();
}

function getRelation(
  record,
  relationKey
) {
  const relation =
    record?.[
      relationKey
    ];

  if (
    Array.isArray(
      relation
    )
  ) {
    return (
      relation[0] ||
      null
    );
  }

  return (
    relation ||
    null
  );
}

function getLevelInfo(
  record,
  level
) {
  const relation =
    getRelation(
      record,
      level.relationKey
    );

  const id =
    cleanText(
      record?.[
        level.idKey
      ] ||
      relation?.id
    );

  const code =
    cleanText(
      relation?.[
        level.codeKey
      ]
    );

  const name =
    level.nameKeys
      .map(
        (key) =>
          cleanText(
            relation?.[key]
          )
      )
      .find(
        Boolean
      ) ||
    "";

  if (
    !id &&
    !code &&
    !name
  ) {
    return {
      id:
        "__unassigned__",

      missing:
        true,

      label:
        level.missingLabel,
    };
  }

  const label =
    code
      ? `${code} - ${
          name ||
          "-"
        }`
      : name ||
        level.missingLabel;

  return {
    id:
      id ||
      `__label__:${label}`,

    missing:
      false,

    label,
  };
}

function compareGroups(
  a,
  b
) {
  if (
    a.missing !==
    b.missing
  ) {
    return a.missing
      ? -1
      : 1;
  }

  return a.label.localeCompare(
    b.label,
    "th"
  );
}

function buildOrganizationData(
  employees = []
) {
  const employeeMap =
    new Map();

  const labelMap =
    new Map();

  function buildLevel(
    rows,
    levelIndex,
    parentKey
  ) {
    if (
      levelIndex >=
      LEVELS.length
    ) {
      return [];
    }

    const level =
      LEVELS[
        levelIndex
      ];

    const grouped =
      new Map();

    for (
      const record of
      rows
    ) {
      const info =
        getLevelInfo(
          record,
          level
        );

      const groupKey =
        `${info.id}`;

      if (
        !grouped.has(
          groupKey
        )
      ) {
        grouped.set(
          groupKey,
          {
            ...info,

            rows:
              [],
          }
        );
      }

      grouped
        .get(
          groupKey
        )
        .rows.push(
          record
        );
    }

    const groups =
      Array.from(
        grouped.values()
      ).sort(
        compareGroups
      );

    return groups.map(
      (
        group,
        index
      ) => {
        const key =
          `${parentKey}/${level.key}:${group.id}:${index}`;

        employeeMap.set(
          key,
          group.rows
        );

        labelMap.set(
          key,
          group.label
        );

        const children =
          buildLevel(
            group.rows,
            levelIndex +
              1,
            key
          );

        return {
          key,

          selectable:
            true,

          title: (
            <span className="inline-flex items-center gap-2">
              <span>
                {
                  group.label
                }
              </span>

              <Tag
                color="blue"
                variant="filled"
              >
                {
                  group.rows
                    .length
                }{" "}
                คน
              </Tag>
            </span>
          ),

          children:
            children.length
              ? children
              : undefined,
        };
      }
    );
  }

  return {
    treeData:
      buildLevel(
        employees,
        0,
        "org"
      ),

    employeeMap,
    labelMap,
  };
}

export default function EmployeeOrganizationView({
  employees = [],
  loading = false,
  deletingId = null,

  canView = false,
  canEdit = false,
  canDelete = false,

  onView,
  onEdit,
  onDelete,
}) {
  const [
    selectedKey,
    setSelectedKey,
  ] = useState(null);

  const [
    tableLoading,
    setTableLoading,
  ] = useState(false);

  const [
    tablePage,
    setTablePage,
  ] = useState(1);

  const [
    tablePageSize,
    setTablePageSize,
  ] = useState(20);

  const organizationData =
    useMemo(
      () =>
        buildOrganizationData(
          employees
        ),
      [
        employees,
      ]
    );

  useEffect(() => {
    if (
      selectedKey &&
      !organizationData
        .employeeMap
        .has(
          selectedKey
        )
    ) {
      setSelectedKey(
        null
      );
    }
  }, [
    organizationData,
    selectedKey,
  ]);

  useEffect(() => {
    setTablePage(1);
  }, [
    selectedKey,
  ]);

  /*
   * Employee rows ของ Organization View ถูกโหลดมาแล้วจาก parent
   * และ filter จาก employeeMap ใน memory จึงไม่มี network loading จริง
   * ตอนเลือก Company / Org node
   *
   * เพิ่ม loading state เฉพาะ UI ตอนเปลี่ยน node
   * เพื่อให้ User เห็น feedback ว่าระบบกำลังเปลี่ยนรายชื่อด้านล่าง
   * โดยไม่แก้ Employee API / Filter / Permission / CRUD logic เดิม
   */
  useEffect(() => {
    if (!selectedKey) {
      setTableLoading(false);
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setTableLoading(false);
        },
        180
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    selectedKey,
  ]);

  const selectedEmployees =
    selectedKey
      ? organizationData
          .employeeMap
          .get(
            selectedKey
          ) ||
        []
      : [];

  const selectedLabel =
    selectedKey
      ? organizationData
          .labelMap
          .get(
            selectedKey
          ) ||
        ""
      : "";

  if (loading) {
    return (
      <Card>
        <div className="flex min-h-[320px] items-center justify-center">
          <Spin
            size="large"
            description="กำลังโหลดโครงสร้างองค์กร..."
          />
        </div>
      </Card>
    );
  }

  if (
    !employees.length
  ) {
    return (
      <Card>
        <Empty
          description="ไม่พบพนักงานตามเงื่อนไขที่เลือก"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title={
          <div className="flex items-center gap-2">
            <ApartmentOutlined />

            <span>
              มุมมองพนักงานตามโครงสร้างองค์กร (Organization View)
            </span>
          </div>
        }
        styles={{
          body: {
            paddingTop:
              12,
          },
        }}
      >
        <Alert
          className="mb-4"
          type="info"
          showIcon
          title="เลือกโครงสร้างเพื่อดูรายชื่อพนักงาน"
          description="ข้อมูลในมุมมองนี้ใช้ Employee Scope, Permission และตัวกรองชุดเดียวกับหน้ารายชื่อพนักงาน โครงสร้างองค์กร → บริษัท → กรุ๊ปสังกัด → สังกัด → แผนก → ฝ่าย → หน่วยงาน"
        />

        <Tree
          blockNode
          showLine={{
            showLeafIcon:
              false,
          }}
          treeData={
            organizationData
              .treeData
          }
          selectedKeys={
            selectedKey
              ? [
                  selectedKey,
                ]
              : []
          }
          onSelect={(
            keys
          ) => {
            const nextKey =
              keys?.[0] ||
              null;

            if (
              nextKey &&
              nextKey !==
                selectedKey
            ) {
              setTableLoading(
                true
              );
            } else if (
              !nextKey
            ) {
              setTableLoading(
                false
              );
            }

            setSelectedKey(
              nextKey
            );
          }}
        />
      </Card>

      <Card
        title={
          <div>
            <Title
              level={5}
              className="!mb-0"
            >
              รายชื่อพนักงานในโครงสร้างที่เลือก
            </Title>

            {selectedKey ? (
              <Text
                type="secondary"
              >
                {
                  selectedLabel
                }{" "}
                ·{" "}
                {
                  selectedEmployees.length
                }{" "}
                คน
              </Text>
            ) : null}
          </div>
        }
      >
        {!selectedKey ? (
          <Empty
            description="กรุณาเลือกบริษัท สังกัด แผนก ฝ่าย หรือหน่วยงานจากโครงสร้างด้านบน"
          />
        ) : (
          <EmployeeTable
            dataSource={
              selectedEmployees
            }
            loading={
              tableLoading
            }
            deletingId={
              deletingId
            }

            page={
              tablePage
            }
            pageSize={
              tablePageSize
            }
            total={
              selectedEmployees
                .length
            }

            canView={
              canView
            }
            canEdit={
              canEdit
            }
            canDelete={
              canDelete
            }

            onView={
              onView
            }
            onEdit={
              onEdit
            }
            onDelete={
              onDelete
            }

            onChange={(
              pagination
            ) => {
              const nextPageSize =
                pagination
                  ?.pageSize ||
                20;

              if (
                nextPageSize !==
                tablePageSize
              ) {
                setTablePageSize(
                  nextPageSize
                );

                setTablePage(
                  1
                );

                return;
              }

              setTablePage(
                pagination
                  ?.current ||
                  1
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
