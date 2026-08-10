"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  Row,
  Select,
  Space,
} from "antd";

import {
  ApartmentOutlined,
  BankOutlined,
  FundProjectionScreenOutlined,
  ProfileOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

import {
  useEffect,
  useMemo,
} from "react";

/* =========================================================
   HELPERS
========================================================= */

function makeLabel(
  item,
  codeKey,
  nameKey
) {
  const code = item?.[codeKey];

  const name =
    item?.[nameKey] || "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function isActive(item) {
  return (
    !item?.status ||
    item.status === "active"
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EmployeeOrganizationStep({
  form,

  disabled = false,

  masterData = {},

  masterLoading = false,
}) {
  /* =======================================================
     WATCH FORM
  ======================================================= */

  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const branchId =
    Form.useWatch(
      "branch_id",
      form
    );

  const departmentId =
    Form.useWatch(
      "department_id",
      form
    );

  const divisionId =
    Form.useWatch(
      "division_id",
      form
    );

  const unitId =
    Form.useWatch(
      "unit_id",
      form
    );

  const positionFamilyId =
    Form.useWatch(
      "position_family_id",
      form
    );

  const positionLevelId =
    Form.useWatch(
      "position_level_id",
      form
    );

  const positionId =
    Form.useWatch(
      "position_id",
      form
    );

  /* =======================================================
     MASTER DATA
  ======================================================= */

  const companies =
    masterData.companies || [];

  const branchGroups =
    masterData.branchGroups || [];

  const branches =
    masterData.branches || [];

  const departments =
    masterData.departments || [];

  const branchDepartments =
    masterData.branchDepartments || [];

  const divisions =
    masterData.divisions || [];

  const units =
    masterData.units || [];

  const positions =
    masterData.positions || [];

  const unitPositions =
    masterData.unitPositions || [];

  const jobs =
    masterData.jobs || [];

  const positionFamilies =
    masterData.positionFamilies || [];

  const positionLevels =
    masterData.positionLevels || [];

  const positionFamilyLevels =
    masterData.positionFamilyLevels ||
    [];

  const businessUnits =
    masterData.businessUnits || [];

  const costCenters =
    masterData.costCenters || [];

  const profitCenters =
    masterData.profitCenters || [];

  /* =======================================================
     ORGANIZATION OPTIONS
  ======================================================= */

  const companyOptions =
    useMemo(
      () =>
        companies
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "company_code",
              "company_name_th"
            ),
          })),
      [companies]
    );

  const branchGroupOptions =
    useMemo(
      () =>
        branchGroups
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "group_code",
              "group_name"
            ),
          })),
      [branchGroups]
    );

  const branchOptions =
    useMemo(
      () =>
        branches
          .filter(
            (item) =>
              isActive(item) &&
              (!companyId ||
                item.company_id ===
                  companyId)
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "branch_code",
              "branch_name"
            ),
          })),
      [
        branches,
        companyId,
      ]
    );

  const departmentOptions =
    useMemo(() => {
      const activeDepartments =
        departments.filter(
          isActive
        );

      if (!branchId) {
        return activeDepartments.map(
          (item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "department_code",
              "department_name"
            ),
          })
        );
      }

      const allowedIds =
        new Set(
          branchDepartments
            .filter(
              (item) =>
                isActive(item) &&
                item.branch_id ===
                  branchId
            )
            .map(
              (item) =>
                item.department_id
            )
        );

      return activeDepartments
        .filter((item) =>
          allowedIds.has(item.id)
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "department_code",
            "department_name"
          ),
        }));
    }, [
      branchId,
      branchDepartments,
      departments,
    ]);

  const divisionOptions =
    useMemo(
      () =>
        divisions
          .filter(
            (item) =>
              isActive(item) &&
              (!departmentId ||
                item.department_id ===
                  departmentId)
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "division_code",
              "division_name"
            ),
          })),
      [
        divisions,
        departmentId,
      ]
    );

  const unitOptions =
    useMemo(
      () =>
        units
          .filter(
            (item) =>
              isActive(item) &&
              (!divisionId ||
                item.division_id ===
                  divisionId)
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "unit_code",
              "unit_name"
            ),
          })),
      [
        units,
        divisionId,
      ]
    );

  /* =======================================================
     JOB ARCHITECTURE OPTIONS
  ======================================================= */

  const positionFamilyOptions =
    useMemo(
      () =>
        positionFamilies
          .filter(isActive)
          .sort(
            (a, b) =>
              Number(
                a.sort_order || 0
              ) -
              Number(
                b.sort_order || 0
              )
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "family_code",
              "family_name"
            ),
          })),
      [positionFamilies]
    );

  /*
    Position Level ต้องกรองตาม
    position_family_levels
  */

  const positionLevelOptions =
    useMemo(() => {
      if (!positionFamilyId) {
        return [];
      }

      const mappings =
        positionFamilyLevels
          .filter(
            (item) =>
              item.position_family_id ===
              positionFamilyId
          )
          .sort(
            (a, b) =>
              Number(
                a.sort_order || 0
              ) -
              Number(
                b.sort_order || 0
              )
          );

      const levelIds =
        new Set(
          mappings.map(
            (item) =>
              item.position_level_id
          )
        );

      return positionLevels
        .filter(
          (item) =>
            isActive(item) &&
            levelIds.has(item.id)
        )
        .sort(
          (a, b) =>
            Number(
              a.sort_order || 0
            ) -
            Number(
              b.sort_order || 0
            )
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "level_code",
            "level_name"
          ),
        }));
    }, [
      positionFamilyId,
      positionFamilyLevels,
      positionLevels,
    ]);

  /*
    ตำแหน่งกรองจาก:
    1. positions.position_family_id
    2. unit_positions เมื่อเลือกหน่วยงาน

    หมายเหตุ:
    ตาราง positions ปัจจุบันไม่มี
    position_level_id จึงยังไม่สามารถ
    กรอง Position ตาม Level โดยตรงได้
  */

  const positionOptions =
    useMemo(() => {
      let availablePositions =
        positions.filter(isActive);

      if (positionFamilyId) {
        availablePositions =
          availablePositions.filter(
            (item) =>
              item.position_family_id ===
              positionFamilyId
          );
      }

      if (unitId) {
        const allowedPositionIds =
          new Set(
            unitPositions
              .filter(
                (item) =>
                  isActive(item) &&
                  item.unit_id ===
                    unitId
              )
              .map(
                (item) =>
                  item.position_id
              )
          );

        availablePositions =
          availablePositions.filter(
            (item) =>
              allowedPositionIds.has(
                item.id
              )
          );
      }

      return availablePositions
        .sort(
          (a, b) =>
            Number(
              a.sort_order || 0
            ) -
            Number(
              b.sort_order || 0
            )
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "position_code",
            "position_name"
          ),

          item,
        }));
    }, [
      positions,
      unitPositions,
      unitId,
      positionFamilyId,
    ]);

  const jobOptions =
    useMemo(
      () =>
        jobs
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "job_code",
              "job_name"
            ),
          })),
      [jobs]
    );

  /* =======================================================
     COST STRUCTURE OPTIONS
  ======================================================= */

  const businessUnitOptions =
    useMemo(
      () =>
        businessUnits
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "business_unit_code",
              "business_unit_name"
            ),
          })),
      [businessUnits]
    );

  const costCenterOptions =
    useMemo(
      () =>
        costCenters
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "cost_center_code",
              "cost_center_name"
            ),
          })),
      [costCenters]
    );

  const profitCenterOptions =
    useMemo(
      () =>
        profitCenters
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "profit_center_code",
              "profit_center_name"
            ),
          })),
      [profitCenters]
    );

  /* =======================================================
     DATA CONSISTENCY EFFECTS
  ======================================================= */

  /*
    ถ้าเปลี่ยนบริษัทแล้ว Branch เดิม
    ไม่ได้อยู่ในบริษัทนั้น ให้ Reset
  */

  useEffect(() => {
    if (!branchId) {
      return;
    }

    const selectedBranch =
      branches.find(
        (item) =>
          item.id === branchId
      );

    if (
      selectedBranch &&
      companyId &&
      selectedBranch.company_id !==
        companyId
    ) {
      form.setFieldsValue({
        branch_id: undefined,

        department_id:
          undefined,

        division_id:
          undefined,

        unit_id: undefined,

        position_id:
          undefined,

        job_id: undefined,
      });
    }
  }, [
    companyId,
    branchId,
    branches,
    form,
  ]);

  /*
    เมื่อเลือก Position:
    1. ดึง position_family_id
    2. ดึง job_id
    จากข้อมูล Position เป็นค่าเริ่มต้น
  */

  useEffect(() => {
    if (!positionId) {
      return;
    }

    const selectedPosition =
      positions.find(
        (item) =>
          item.id === positionId
      );

    if (!selectedPosition) {
      return;
    }

    const nextValues = {};

    if (
      selectedPosition
        .position_family_id &&
      selectedPosition
        .position_family_id !==
        positionFamilyId
    ) {
      nextValues.position_family_id =
        selectedPosition.position_family_id;
    }

    if (selectedPosition.job_id) {
      nextValues.job_id =
        selectedPosition.job_id;
    }

    if (
      Object.keys(nextValues)
        .length > 0
    ) {
      form.setFieldsValue(
        nextValues
      );
    }
  }, [
    positionId,
    positionFamilyId,
    positions,
    form,
  ]);

  /*
    ถ้า Family เปลี่ยนแล้ว Level เดิม
    ไม่อยู่ใน Family ใหม่ ให้ Reset
  */

  useEffect(() => {
    if (
      !positionFamilyId ||
      !positionLevelId
    ) {
      return;
    }

    const levelIsAllowed =
      positionFamilyLevels.some(
        (item) =>
          item.position_family_id ===
            positionFamilyId &&
          item.position_level_id ===
            positionLevelId
      );

    if (!levelIsAllowed) {
      form.setFieldValue(
        "position_level_id",
        undefined
      );
    }
  }, [
    positionFamilyId,
    positionLevelId,
    positionFamilyLevels,
    form,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div>
      <Alert
        showIcon
        type="info"
        title="โครงสร้างองค์กรและสายอาชีพ"
        description="เลือกตามลำดับ บริษัท → กรุ๊ปสังกัด → สังกัด → แผนก → ฝ่าย → หน่วยงาน → กลุ่มสายงาน → ระดับตำแหน่ง → ตำแหน่ง → บทบาทงาน"
        className="mb-5"
      />

      {/* ===================================================
          COMPANY AND BRANCH
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <BankOutlined />
          บริษัทและสังกัด
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                companyOptions
              }
              optionFilterProp="label"
              placeholder="เลือกบริษัท"
              onChange={() => {
                form.setFieldsValue({
                  branch_group_id:
                    undefined,

                  branch_id:
                    undefined,

                  department_id:
                    undefined,

                  division_id:
                    undefined,

                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="กรุ๊ปสังกัด"
            name="branch_group_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                branchGroupOptions
              }
              optionFilterProp="label"
              placeholder="เลือกกรุ๊ปสังกัด"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สังกัด"
            name="branch_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสังกัด",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !companyId
              }
              options={
                branchOptions
              }
              optionFilterProp="label"
              placeholder={
                companyId
                  ? "เลือกสังกัด"
                  : "กรุณาเลือกบริษัทก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  department_id:
                    undefined,

                  division_id:
                    undefined,

                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          ORGANIZATION UNIT
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ApartmentOutlined />
          หน่วยงาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="แผนก"
            name="department_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกแผนก",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !branchId
              }
              options={
                departmentOptions
              }
              optionFilterProp="label"
              placeholder={
                branchId
                  ? "เลือกแผนก"
                  : "กรุณาเลือกสังกัดก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  division_id:
                    undefined,

                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ฝ่าย"
            name="division_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !departmentId
              }
              options={
                divisionOptions
              }
              optionFilterProp="label"
              placeholder={
                departmentId
                  ? "เลือกฝ่าย"
                  : "กรุณาเลือกแผนกก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="หน่วยงาน"
            name="unit_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !divisionId
              }
              options={unitOptions}
              optionFilterProp="label"
              placeholder={
                divisionId
                  ? "เลือกหน่วยงาน"
                  : "กรุณาเลือกฝ่ายก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          JOB ARCHITECTURE
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ProfileOutlined />
          กลุ่มสายงานและระดับตำแหน่ง
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="กลุ่มสายงาน"
            name="position_family_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกกลุ่มสายงาน",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                positionFamilyOptions
              }
              optionFilterProp="label"
              placeholder="เลือกกลุ่มสายงาน"
              onChange={() => {
                form.setFieldsValue({
                  position_level_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ระดับตำแหน่ง"
            name="position_level_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกระดับตำแหน่ง",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !positionFamilyId
              }
              options={
                positionLevelOptions
              }
              optionFilterProp="label"
              placeholder={
                positionFamilyId
                  ? "เลือกระดับตำแหน่ง"
                  : "กรุณาเลือกกลุ่มสายงานก่อน"
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ตำแหน่ง"
            name="position_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกตำแหน่ง",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !positionFamilyId ||
                !positionLevelId
              }
              options={
                positionOptions
              }
              optionFilterProp="label"
              placeholder={
                !positionFamilyId
                  ? "กรุณาเลือกกลุ่มสายงานก่อน"
                  : !positionLevelId
                    ? "กรุณาเลือกระดับตำแหน่งก่อน"
                    : "เลือกตำแหน่ง"
              }
              onChange={(
                value
              ) => {
                const selectedPosition =
                  positions.find(
                    (item) =>
                      item.id === value
                  );

                form.setFieldValue(
                  "job_id",
                  selectedPosition
                    ?.job_id ||
                    undefined
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="บทบาทงาน / Job"
            name="job_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={jobOptions}
              optionFilterProp="label"
              placeholder="เลือกบทบาทงาน"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          COST STRUCTURE
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <FundProjectionScreenOutlined />
          โครงสร้างต้นทุน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Business Unit"
            name="business_unit_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                businessUnitOptions
              }
              optionFilterProp="label"
              placeholder="เลือก Business Unit"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Cost Center"
            name="cost_center_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                costCenterOptions
              }
              optionFilterProp="label"
              placeholder="เลือก Cost Center"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Profit Center"
            name="profit_center_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                profitCenterOptions
              }
              optionFilterProp="label"
              placeholder="เลือก Profit Center"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}