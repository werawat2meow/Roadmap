"use client";

import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
} from "antd";

import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

/* =========================================================
   Component
========================================================= */

export default function OrgPositionSlotSearch({
  filters = {},

  options = {},

  parentSlots = [],

  loading = false,

  onChange,

  onSearch,

  onReset,

  onRefresh,
}) {
  const companies =
    options.companies ||
    [];

  const branchGroups =
    options.branch_groups ||
    [];

  const branches =
    options.branches ||
    [];

  const branchDepartments =
    options.branch_departments ||
    [];

  const departments =
    options.departments ||
    [];

  const divisions =
    options.divisions ||
    [];

  const units =
    options.units ||
    [];

  const positions =
    options.positions ||
    [];

  /* =======================================================
     Company -> Branch Group
  ======================================================= */

  const scopedBranchGroups =
    filters.company_id
      ? branchGroups.filter(
          (
            group
          ) =>
            branches.some(
              (
                branch
              ) =>
                String(
                  branch.company_id ||
                    ""
                ) ===
                  String(
                    filters.company_id
                  ) &&
                String(
                  branch.group_id ||
                    ""
                ) ===
                  String(
                    group.id
                  )
            )
        )
      : [];

  /* =======================================================
     Company + Group -> Branch
  ======================================================= */

  const scopedBranches =
    filters.company_id &&
    filters.branch_group_id
      ? branches.filter(
          (
            branch
          ) =>
            String(
              branch.company_id ||
                ""
            ) ===
              String(
                filters.company_id
              ) &&
            String(
              branch.group_id ||
                ""
            ) ===
              String(
                filters.branch_group_id
              )
        )
      : [];

  /* =======================================================
     Branch -> Department
     ผ่าน branch_departments
  ======================================================= */

  const departmentIds =
    new Set(
      filters.branch_id
        ? branchDepartments
            .filter(
              (
                mapping
              ) =>
                String(
                  mapping.branch_id ||
                    ""
                ) ===
                  String(
                    filters.branch_id
                  ) &&
                mapping.status !==
                  "inactive"
            )
            .map(
              (
                mapping
              ) =>
                String(
                  mapping.department_id
                )
            )
        : []
    );

  const scopedDepartments =
    filters.branch_id
      ? departments.filter(
          (
            department
          ) =>
            departmentIds.has(
              String(
                department.id
              )
            )
        )
      : [];

  /* =======================================================
     Department -> Division
  ======================================================= */

  const scopedDivisions =
    filters.department_id
      ? divisions.filter(
          (
            division
          ) =>
            String(
              division.department_id ||
                ""
            ) ===
            String(
              filters.department_id
            )
        )
      : [];

  /* =======================================================
     Division -> Unit
  ======================================================= */

  const scopedUnits =
    filters.division_id
      ? units.filter(
          (
            unit
          ) =>
            String(
              unit.division_id ||
                ""
            ) ===
            String(
              filters.division_id
            )
        )
      : [];

  /* =======================================================
     Parent Slot Filter
  ======================================================= */

  const scopedParentSlots =
    parentSlots.filter(
      (
        slot
      ) => {
        if (
          filters.company_id &&
          String(
            slot.company_id ||
              ""
          ) !==
            String(
              filters.company_id
            )
        ) {
          return false;
        }

        if (
          filters.branch_group_id &&
          String(
            slot.branch_group_id ||
              ""
          ) !==
            String(
              filters.branch_group_id
            )
        ) {
          return false;
        }

        if (
          filters.branch_id &&
          String(
            slot.branch_id ||
              ""
          ) !==
            String(
              filters.branch_id
            )
        ) {
          return false;
        }

        if (
          filters.department_id &&
          String(
            slot.department_id ||
              ""
          ) !==
            String(
              filters.department_id
            )
        ) {
          return false;
        }

        if (
          filters.division_id &&
          String(
            slot.division_id ||
              ""
          ) !==
            String(
              filters.division_id
            )
        ) {
          return false;
        }

        if (
          filters.unit_id &&
          String(
            slot.unit_id ||
              ""
          ) !==
            String(
              filters.unit_id
            )
        ) {
          return false;
        }

        return true;
      }
    );

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Card>
      <Row
        gutter={[
          12,
          12,
        ]}
        align="bottom"
      >
        {/* Search */}

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <FieldLabel>
            ค้นหา
          </FieldLabel>

          <Input
            allowClear
            value={
              filters.search
            }
            placeholder="Slot Code / Slot Name / Position"
            prefix={
              <SearchOutlined />
            }
            onChange={(
              event
            ) =>
              onChange?.(
                "search",
                event.target.value
              )
            }
            onPressEnter={
              onSearch
            }
          />
        </Col>

        {/* Company */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            บริษัท
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={
              filters.company_id ||
              undefined
            }
            placeholder="บริษัท"
            options={companies.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.company_code ||
                    ""
                  } - ${
                    item.company_name_th ||
                    item.company_name_en ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "company_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Branch Group */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            กรุ๊ปสังกัด
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={
              !filters.company_id
            }
            value={
              filters.branch_group_id ||
              undefined
            }
            placeholder="กรุ๊ปสังกัด"
            options={scopedBranchGroups.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.group_code ||
                    ""
                  } - ${
                    item.group_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "branch_group_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Branch */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            สังกัด
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={
              !filters.branch_group_id
            }
            value={
              filters.branch_id ||
              undefined
            }
            placeholder="สังกัด"
            options={scopedBranches.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.branch_code ||
                    ""
                  } - ${
                    item.branch_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "branch_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Department */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            แผนก
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={
              !filters.branch_id
            }
            value={
              filters.department_id ||
              undefined
            }
            placeholder="แผนก"
            options={scopedDepartments.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.department_code ||
                    ""
                  } - ${
                    item.department_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "department_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Division */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            ฝ่าย
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={
              !filters.department_id
            }
            value={
              filters.division_id ||
              undefined
            }
            placeholder="ฝ่าย"
            options={scopedDivisions.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.division_code ||
                    ""
                  } - ${
                    item.division_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "division_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Unit */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            หน่วยงาน
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={
              !filters.division_id
            }
            value={
              filters.unit_id ||
              undefined
            }
            placeholder="หน่วยงาน"
            options={scopedUnits.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.unit_code ||
                    ""
                  } - ${
                    item.unit_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "unit_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Position */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            ตำแหน่ง
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={
              filters.position_id ||
              undefined
            }
            placeholder="ตำแหน่ง"
            options={positions.map(
              (
                item
              ) => ({
                value:
                  item.id,

                label:
                  `${
                    item.position_code ||
                    ""
                  } - ${
                    item.position_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "position_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Parent */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            Parent Slot
          </FieldLabel>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={
              filters.parent_slot_id ||
              undefined
            }
            placeholder="Parent Slot"
            options={scopedParentSlots.map(
              (
                slot
              ) => ({
                value:
                  slot.id,

                label:
                  `${
                    slot.slot_code ||
                    "-"
                  } - ${
                    slot.slot_name ||
                    slot.positions
                      ?.position_name ||
                    "-"
                  }`,
              })
            )}
            onChange={(
              value
            ) =>
              onChange?.(
                "parent_slot_id",
                value || ""
              )
            }
          />
        </Col>

        {/* Slot Type */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            Slot Type
          </FieldLabel>

          <Select
            allowClear
            className="w-full"
            value={
              filters.slot_type ||
              undefined
            }
            placeholder="ทุกประเภท"
            options={[
              {
                value:
                  "normal",
                label:
                  "Normal",
              },
              {
                value:
                  "manager",
                label:
                  "Manager",
              },
              {
                value:
                  "head",
                label:
                  "Head",
              },
              {
                value:
                  "temporary",
                label:
                  "Temporary",
              },
            ]}
            onChange={(
              value
            ) =>
              onChange?.(
                "slot_type",
                value || ""
              )
            }
          />
        </Col>

        {/* Status */}

        <Col
          xs={24}
          sm={12}
          xl={4}
        >
          <FieldLabel>
            สถานะ
          </FieldLabel>

          <Select
            allowClear
            className="w-full"
            value={
              filters.status ||
              undefined
            }
            placeholder="ทุกสถานะ"
            options={[
              {
                value:
                  "active",
                label:
                  "ใช้งาน",
              },
              {
                value:
                  "inactive",
                label:
                  "ยกเลิก",
              },
            ]}
            onChange={(
              value
            ) =>
              onChange?.(
                "status",
                value || ""
              )
            }
          />
        </Col>

        {/* Actions */}

        <Col
          xs={24}
          xl={8}
        >
          <Space wrap>
            <Button
              type="primary"
              icon={
                <SearchOutlined />
              }
              loading={
                loading
              }
              onClick={
                onSearch
              }
            >
              ค้นหา
            </Button>

            <Button
              onClick={
                onReset
              }
            >
              ล้างตัวกรอง
            </Button>

            <Button
              icon={
                <ReloadOutlined />
              }
              loading={
                loading
              }
              onClick={
                onRefresh
              }
            >
              รีเฟรช
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

/* =========================================================
   Field Label
========================================================= */

function FieldLabel({
  children,
}) {
  return (
    <div className="mb-1 text-xs font-medium text-slate-500">
      {children}
    </div>
  );
}