"use client";

import {
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
} from "antd";

import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function EmployeePositionAssignmentSearch({
  filters,
  options = {},
  slots = [],

  loading = false,

  employeeLoading = false,
  employeeOptions = [],

  onEmployeeSearch,

  onChange,
  onReset,
  onRefresh,
}) {
  /* =======================================================
     Master Data
  ======================================================= */

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
     Company + Branch Group -> Branch
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

  const allowedDepartmentIds =
    new Set(
      filters.branch_id
        ? branchDepartments
            .filter(
              (
                row
              ) =>
                String(
                  row.branch_id ||
                    ""
                ) ===
                  String(
                    filters.branch_id
                  ) &&
                row.status !==
                  "inactive"
            )
            .map(
              (
                row
              ) =>
                String(
                  row.department_id
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
            allowedDepartmentIds.has(
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
     Render
  ======================================================= */

  return (
    <Card className="shadow-sm">

      <Row
        gutter={[
          12,
          12,
        ]}
        align="bottom"
      >

        {/* =================================================
            Employee
        ================================================= */}

        <Col
          xs={24}
          lg={6}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            พนักงาน
          </div>

          <Select
            allowClear
            showSearch
            filterOption={
              false
            }
            value={
              filters.employee_id ||
              undefined
            }
            placeholder="ค้นหารหัส / ชื่อพนักงาน"
            options={
              employeeOptions
            }
            loading={
              employeeLoading
            }
            onSearch={
              onEmployeeSearch
            }
            onChange={(
              value
            ) =>
              onChange(
                "employee_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Position Slot
        ================================================= */}

        <Col
          xs={24}
          lg={6}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            Position Slot
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={
              filters.position_slot_id ||
              undefined
            }
            placeholder="เลือก Position Slot"
            options={slots.map(
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
              onChange(
                "position_slot_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Company
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            บริษัท
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
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
              onChange(
                "company_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Branch Group
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            กรุ๊ปสังกัด
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
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
              onChange(
                "branch_group_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Branch
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            สังกัด
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
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
              onChange(
                "branch_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Department
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            แผนก
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
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
              onChange(
                "department_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Division
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            ฝ่าย
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
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
              onChange(
                "division_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Unit
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            หน่วยงาน
          </div>

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
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
              onChange(
                "unit_id",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Assignment Type
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            Assignment Type
          </div>

          <Select
            allowClear
            value={
              filters.assignment_type ||
              undefined
            }
            placeholder="ทุกประเภท"
            options={[
              {
                value:
                  "primary",
                label:
                  "Primary",
              },
              {
                value:
                  "acting",
                label:
                  "Acting / รักษาการ",
              },
              {
                value:
                  "secondary",
                label:
                  "Secondary",
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
              onChange(
                "assignment_type",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Primary
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            Primary
          </div>

          <Select
            allowClear
            value={
              filters.is_primary ||
              undefined
            }
            placeholder="ทั้งหมด"
            options={[
              {
                value:
                  "true",
                label:
                  "Primary เท่านั้น",
              },
              {
                value:
                  "false",
                label:
                  "Non-primary",
              },
            ]}
            onChange={(
              value
            ) =>
              onChange(
                "is_primary",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Status
        ================================================= */}

        <Col
          xs={24}
          md={8}
          lg={4}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            สถานะ
          </div>

          <Select
            allowClear
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
              onChange(
                "status",
                value ||
                  ""
              )
            }
            className="w-full"
          />
        </Col>

        {/* =================================================
            Buttons
        ================================================= */}

        <Col
          xs={24}
          lg={8}
        >
          <Space wrap>

            <Button
              icon={
                <SearchOutlined />
              }
              onClick={
                onRefresh
              }
              loading={
                loading
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
              onClick={
                onRefresh
              }
              loading={
                loading
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