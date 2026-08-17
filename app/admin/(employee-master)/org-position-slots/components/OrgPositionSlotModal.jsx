"use client";

import {
  Alert,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from "antd";

import {
  useEffect,
  useMemo,
} from "react";

/* =========================================================
   Component
========================================================= */

export default function OrgPositionSlotModal({
  open,

  editing = null,

  filters = {},

  options = {},

  parentSlots = [],

  saving = false,

  onCancel,

  onSubmit,
}) {
  const [
    form,
  ] =
    Form.useForm();

  const isEdit =
    Boolean(
      editing?.id
    );

  /* =======================================================
     Watches
  ======================================================= */

  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const branchGroupId =
    Form.useWatch(
      "branch_group_id",
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

  /* =======================================================
     Master
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

  const positions =
    options.positions ||
    [];

  /* =======================================================
     Branch Groups
  ======================================================= */

  const scopedBranchGroups =
    useMemo(
      () =>
        companyId
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
                        companyId
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
          : [],
      [
        companyId,
        branchGroups,
        branches,
      ]
    );

  /* =======================================================
     Branches
  ======================================================= */

  const scopedBranches =
    useMemo(
      () =>
        companyId &&
        branchGroupId
          ? branches.filter(
              (
                branch
              ) =>
                String(
                  branch.company_id ||
                    ""
                ) ===
                  String(
                    companyId
                  ) &&
                String(
                  branch.group_id ||
                    ""
                ) ===
                  String(
                    branchGroupId
                  )
            )
          : [],
      [
        companyId,
        branchGroupId,
        branches,
      ]
    );

  /* =======================================================
     Departments
  ======================================================= */

  const scopedDepartments =
    useMemo(
      () => {
        if (!branchId) {
          return [];
        }

        const ids =
          new Set(
            branchDepartments
              .filter(
                (
                  mapping
                ) =>
                  String(
                    mapping.branch_id ||
                      ""
                  ) ===
                    String(
                      branchId
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
          );

        return departments.filter(
          (
            department
          ) =>
            ids.has(
              String(
                department.id
              )
            )
        );
      },
      [
        branchId,
        branchDepartments,
        departments,
      ]
    );

  /* =======================================================
     Divisions
  ======================================================= */

  const scopedDivisions =
    useMemo(
      () =>
        departmentId
          ? divisions.filter(
              (
                division
              ) =>
                String(
                  division.department_id ||
                    ""
                ) ===
                String(
                  departmentId
                )
            )
          : [],
      [
        departmentId,
        divisions,
      ]
    );

  /* =======================================================
     Units
  ======================================================= */

  const scopedUnits =
    useMemo(
      () =>
        divisionId
          ? units.filter(
              (
                unit
              ) =>
                String(
                  unit.division_id ||
                    ""
                ) ===
                String(
                  divisionId
                )
            )
          : [],
      [
        divisionId,
        units,
      ]
    );

  /* =======================================================
     Parent Slots

     Parent สามารถอยู่:
     - Scope เดียวกัน
     - Scope ที่สูงกว่า

     เช่น:
     Parent = Division Manager
     Child = Unit Officer

     แต่ห้ามอยู่คนละสาย
  ======================================================= */

  const parentSlotOptions =
    useMemo(
      () =>
        parentSlots
          .filter(
            (
              slot
            ) => {
              if (
                isEdit &&
                String(
                  slot.id
                ) ===
                  String(
                    editing.id
                  )
              ) {
                return false;
              }

              if (
                !isParentCompatible(
                  slot,
                  {
                    company_id:
                      companyId,

                    branch_group_id:
                      branchGroupId,

                    branch_id:
                      branchId,

                    department_id:
                      departmentId,

                    division_id:
                      divisionId,

                    unit_id:
                      unitId,
                  }
                )
              ) {
                return false;
              }

              return true;
            }
          )
          .map(
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
          ),
      [
        parentSlots,
        isEdit,
        editing,
        companyId,
        branchGroupId,
        branchId,
        departmentId,
        divisionId,
        unitId,
      ]
    );

  /* =======================================================
     Initial Values
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editing) {
      form.setFieldsValue({
        slot_code:
          editing.slot_code ||
          "",

        slot_name:
          editing.slot_name ||
          "",

        company_id:
          editing.company_id ||
          undefined,

        branch_group_id:
          editing.branch_group_id ||
          undefined,

        branch_id:
          editing.branch_id ||
          undefined,

        department_id:
          editing.department_id ||
          undefined,

        division_id:
          editing.division_id ||
          undefined,

        unit_id:
          editing.unit_id ||
          undefined,

        position_id:
          editing.position_id ||
          undefined,

        parent_slot_id:
          editing.parent_slot_id ||
          undefined,

        slot_type:
          editing.slot_type ||
          "normal",

        employment_capacity:
          Number(
            editing.employment_capacity ||
              1
          ),

        sort_order:
          Number(
            editing.sort_order ||
              0
          ),

        status:
          editing.status ||
          "active",

        effective_from:
          editing.effective_from ||
          getBangkokToday(),

        effective_to:
          editing.effective_to ||
          "",
      });

      return;
    }

    /*
     * Create:
     * เอา Filter จากหน้า List
     * มาเป็น default ช่วย User
     */

    form.resetFields();

    form.setFieldsValue({
      slot_code: "",
      slot_name: "",

      company_id:
        filters.company_id ||
        undefined,

      branch_group_id:
        filters.branch_group_id ||
        undefined,

      branch_id:
        filters.branch_id ||
        undefined,

      department_id:
        filters.department_id ||
        undefined,

      division_id:
        filters.division_id ||
        undefined,

      unit_id:
        filters.unit_id ||
        undefined,

      position_id:
        filters.position_id ||
        undefined,

      parent_slot_id:
        undefined,

      slot_type:
        "normal",

      employment_capacity:
        1,

      sort_order:
        0,

      status:
        "active",

      effective_from:
        getBangkokToday(),

      effective_to:
        "",
    });
  }, [
    open,
    editing,
    filters,
    form,
  ]);

  /* =======================================================
     Submit
  ======================================================= */

  const handleOk =
    async () => {
      const values =
        await form.validateFields();

      if (
        values.effective_from &&
        values.effective_to &&
        values.effective_to <
          values.effective_from
      ) {
        form.setFields([
          {
            name:
              "effective_to",

            errors: [
              "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
            ],
          },
        ]);

        return;
      }

      /*
       * Strict Cascade Validation
       *
       * ถ้ามี Scope ชั้นล่าง
       * ต้องมี Parent ชั้นบนครบ
       */

      if (
        values.branch_group_id &&
        !values.company_id
      ) {
        return setFieldError(
          form,
          "company_id",
          "กรุณาเลือกบริษัทก่อนกรุ๊ปสังกัด"
        );
      }

      if (
        values.branch_id &&
        !values.branch_group_id
      ) {
        return setFieldError(
          form,
          "branch_group_id",
          "กรุณาเลือกกรุ๊ปสังกัดก่อนสังกัด"
        );
      }

      if (
        values.department_id &&
        !values.branch_id
      ) {
        return setFieldError(
          form,
          "branch_id",
          "กรุณาเลือกสังกัดก่อนแผนก"
        );
      }

      if (
        values.division_id &&
        !values.department_id
      ) {
        return setFieldError(
          form,
          "department_id",
          "กรุณาเลือกแผนกก่อนฝ่าย"
        );
      }

      if (
        values.unit_id &&
        !values.division_id
      ) {
        return setFieldError(
          form,
          "division_id",
          "กรุณาเลือกฝ่ายก่อนหน่วยงาน"
        );
      }

      await onSubmit?.({
        slot_code:
          String(
            values.slot_code ||
              ""
          )
            .trim()
            .toUpperCase(),

        slot_name:
          String(
            values.slot_name ||
              ""
          ).trim() ||
          null,

        company_id:
          values.company_id,

        branch_group_id:
          values.branch_group_id ||
          null,

        branch_id:
          values.branch_id ||
          null,

        department_id:
          values.department_id ||
          null,

        division_id:
          values.division_id ||
          null,

        unit_id:
          values.unit_id ||
          null,

        position_id:
          values.position_id,

        parent_slot_id:
          values.parent_slot_id ||
          null,

        slot_type:
          values.slot_type ||
          "normal",

        employment_capacity:
          Number(
            values.employment_capacity ||
              1
          ),

        sort_order:
          Number(
            values.sort_order ||
              0
          ),

        status:
          values.status ||
          "active",

        effective_from:
          values.effective_from,

        effective_to:
          values.effective_to ||
          null,
      });
    };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Modal
      open={
        open
      }

      title={
        isEdit
          ? "แก้ไข Position Slot"
          : "เพิ่ม Position Slot"
      }

      width={900}

      okText={
        isEdit
          ? "บันทึกการแก้ไข"
          : "เพิ่ม Position Slot"
      }

      cancelText="ยกเลิก"

      confirmLoading={
        saving
      }

      onOk={
        handleOk
      }

      onCancel={
        onCancel
      }

      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="Position Slot คืออัตราตำแหน่งจริงในโครงสร้าง"
        description="Position เป็นชื่อตำแหน่งงาน ส่วน Position Slot คือ Seat จริงที่สามารถมี Parent Slot และผู้ครองตำแหน่งได้ โดย Backend จะตรวจ Scope และสายองค์กรอีกครั้งก่อนบันทึก"
      />

      <Form
        form={
          form
        }
        layout="vertical"
      >
        <Row
          gutter={[
            16,
            0,
          ]}
        >
          {/* Slot Code */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="รหัส Position Slot"
              name="slot_code"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณากรอกรหัส Position Slot",
                },
              ]}
            >
              <Input
                placeholder="เช่น AP-MGR-001"
                onChange={(
                  event
                ) => {
                  const value =
                    event.target.value.toUpperCase();

                  form.setFieldValue(
                    "slot_code",
                    value
                  );
                }}
              />
            </Form.Item>
          </Col>

          {/* Slot Name */}

          <Col
            xs={24}
            md={16}
          >
            <Form.Item
              label="ชื่อ Position Slot"
              name="slot_name"
            >
              <Input placeholder="เช่น Accounting Payable Manager Slot" />
            </Form.Item>
          </Col>

          {/* Company */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="บริษัท"
              name="company_id"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือกบริษัท",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="เลือกบริษัท"
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

                    parent_slot_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {/* Branch Group */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="กรุ๊ปสังกัด"
              name="branch_group_id"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={
                  !companyId
                }
                placeholder="เลือกกรุ๊ปสังกัด"
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
                onChange={() => {
                  form.setFieldsValue({
                    branch_id:
                      undefined,

                    department_id:
                      undefined,

                    division_id:
                      undefined,

                    unit_id:
                      undefined,

                    parent_slot_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {/* Branch */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="สังกัด"
              name="branch_id"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={
                  !branchGroupId
                }
                placeholder="เลือกสังกัด"
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
                onChange={() => {
                  form.setFieldsValue({
                    department_id:
                      undefined,

                    division_id:
                      undefined,

                    unit_id:
                      undefined,

                    parent_slot_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {/* Department */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="แผนก"
              name="department_id"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={
                  !branchId
                }
                placeholder="เลือกแผนก"
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
                onChange={() => {
                  form.setFieldsValue({
                    division_id:
                      undefined,

                    unit_id:
                      undefined,

                    parent_slot_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {/* Division */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ฝ่าย"
              name="division_id"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={
                  !departmentId
                }
                placeholder="เลือกฝ่าย"
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
                onChange={() => {
                  form.setFieldsValue({
                    unit_id:
                      undefined,

                    parent_slot_id:
                      undefined,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {/* Unit */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="หน่วยงาน"
              name="unit_id"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={
                  !divisionId
                }
                placeholder="เลือกหน่วยงาน"
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
                onChange={() => {
                  form.setFieldValue(
                    "parent_slot_id",
                    undefined
                  );
                }}
              />
            </Form.Item>
          </Col>

          {/* Position */}

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="ตำแหน่ง"
              name="position_id"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือกตำแหน่ง",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="เลือกตำแหน่ง"
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
              />
            </Form.Item>
          </Col>

          {/* Parent */}

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              label="Parent Position Slot"
              name="parent_slot_id"
              extra="ไม่เลือก = Root ของสายโครงสร้าง"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="เลือก Parent Slot"
                options={
                  parentSlotOptions
                }
              />
            </Form.Item>
          </Col>

          {/* Slot Type */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="Slot Type"
              name="slot_type"
            >
              <Select
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
              />
            </Form.Item>
          </Col>

          {/* Capacity */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="Employment Capacity"
              name="employment_capacity"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาระบุ Capacity",
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={999}
                precision={0}
              />
            </Form.Item>
          </Col>

          {/* Sort */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="ลำดับ"
              name="sort_order"
            >
              <InputNumber
                className="w-full"
                min={0}
                precision={0}
              />
            </Form.Item>
          </Col>

          {/* Effective From */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="มีผลตั้งแต่"
              name="effective_from"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาระบุวันที่เริ่มต้น",
                },
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          {/* Effective To */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="สิ้นสุด"
              name="effective_to"
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          {/* Status */}

          <Col
            xs={24}
            md={8}
          >
            <Form.Item
              label="สถานะ"
              name="status"
            >
              <Select
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
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

/* =========================================================
   Parent Compatibility

   Parent มีค่า Scope ชั้นไหน
   Child ต้องมีค่าเดียวกันในชั้นนั้น

   Parent:
     company A
     division null

   Child:
     company A
     division X

   = ผ่าน

   Parent:
     company B

   Child:
     company A

   = ไม่ผ่าน
========================================================= */

function isParentCompatible(
  parent,
  child
) {
  const hierarchy = [
    "company_id",
    "branch_group_id",
    "branch_id",
    "department_id",
    "division_id",
    "unit_id",
  ];

  for (
    const key of hierarchy
  ) {
    const parentValue =
      parent?.[key];

    const childValue =
      child?.[key];

    /*
     * Parent ไม่กำหนด Scope ชั้นนี้
     * แปลว่า Parent อยู่สูงกว่า
     */
    if (!parentValue) {
      continue;
    }

    /*
     * Parent มี Scope
     * แต่ Child ไม่มี
     * = Parent ลึกกว่า Child
     */
    if (!childValue) {
      return false;
    }

    if (
      String(
        parentValue
      ) !==
      String(
        childValue
      )
    ) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   Field Error
========================================================= */

function setFieldError(
  form,
  field,
  message
) {
  form.setFields([
    {
      name:
        field,

      errors: [
        message,
      ],
    },
  ]);

  return null;
}

/* =========================================================
   Bangkok Date
========================================================= */

function getBangkokToday() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Asia/Bangkok",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}