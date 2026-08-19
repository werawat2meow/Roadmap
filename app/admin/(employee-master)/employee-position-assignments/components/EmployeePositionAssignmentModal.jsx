"use client";

import {
  Alert,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Switch,
} from "antd";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

export default function EmployeePositionAssignmentModal({
  open,

  assignment = null,

  slots = [],

  saving = false,

  loadEmployees,

  onCancel,
  onSubmit,
}) {
  /* =======================================================
     Form
  ======================================================= */

  const [
    form,
  ] =
    Form.useForm();

  const isEdit =
    Boolean(
      assignment?.id
    );

  /* =======================================================
     Watch
  ======================================================= */

  const selectedSlotId =
    Form.useWatch(
      "position_slot_id",
      form
    );

  const isPrimary =
    Form.useWatch(
      "is_primary",
      form
    );

  /* =======================================================
     Employee State
  ======================================================= */

  const [
    employees,
    setEmployees,
  ] = useState([]);

  const [
    employeeLoading,
    setEmployeeLoading,
  ] = useState(false);

  /* =======================================================
     Selected Slot
  ======================================================= */

  const selectedSlot =
    useMemo(
      () =>
        slots.find(
          (
            slot
          ) =>
            String(
              slot.id
            ) ===
            String(
              selectedSlotId
            )
        ) ||
        null,
      [
        slots,
        selectedSlotId,
      ]
    );

  /* =======================================================
     Slot Options
  ======================================================= */

  const slotOptions =
    useMemo(
      () =>
        slots.map(
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
        slots,
      ]
    );

  /* =======================================================
     Employee Options
  ======================================================= */

  const employeeOptions =
    useMemo(() => {
      const current =
        assignment?.employees;

      const source = [
        ...employees,
      ];

      /*
       * Edit Mode:
       * ถ้าพนักงานปัจจุบันไม่อยู่ในผล Search
       * ให้เพิ่มเข้ามาใน Select
       */

      if (
        current?.id &&
        !source.some(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              current.id
            )
        )
      ) {
        source.unshift(
          current
        );
      }

      return source.map(
        (
          employee
        ) => ({
          value:
            employee.id,

          label:
            `${
              employee.employee_code ||
              ""
            } - ${getEmployeeName(
              employee
            )}`,
        })
      );
    }, [
      employees,
      assignment,
    ]);

  /* =======================================================
     Refresh Employees
  ======================================================= */

  const refreshEmployees =
    async (
      search = ""
    ) => {
      if (
        !loadEmployees ||
        !selectedSlot
      ) {
        setEmployees(
          []
        );

        return;
      }

      try {
        setEmployeeLoading(
          true
        );

        const rows =
          await loadEmployees({
            slot:
              selectedSlot,

            search,

            isPrimary:
              Boolean(
                isPrimary
              ),
          });

        setEmployees(
          Array.isArray(
            rows
          )
            ? rows
            : []
        );
      } finally {
        setEmployeeLoading(
          false
        );
      }
    };

  /* =======================================================
     Set Initial Values
  ======================================================= */

  useEffect(() => {
    if (
      !open
    ) {
      return;
    }

    form.setFieldsValue({
      employee_id:
        assignment?.employee_id ||
        undefined,

      position_slot_id:
        assignment?.position_slot_id ||
        undefined,

      assignment_type:
        assignment?.assignment_type ||
        "primary",

      effective_from:
        assignment?.effective_from ||
        getBangkokToday(),

      effective_to:
        assignment?.effective_to ||
        "",

      is_primary:
        assignment?.is_primary ===
        undefined
          ? true
          : Boolean(
              assignment.is_primary
            ),

      status:
        assignment?.status ||
        "active",
    });
  }, [
    open,
    assignment,
    form,
  ]);

  /* =======================================================
     Load Employee When Slot Changes
  ======================================================= */

  useEffect(() => {
    if (
      !open ||
      !selectedSlotId
    ) {
      return;
    }

    refreshEmployees(
      ""
    );
  }, [
    open,
    selectedSlotId,
    isPrimary,
  ]);

  /* =======================================================
     Submit
  ======================================================= */

  const handleOk =
    async () => {
      const values =
        await form.validateFields();

      /* ===================================================
         Validate Effective Date
      =================================================== */

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

      await onSubmit?.({
        employee_id:
          values.employee_id,

        position_slot_id:
          values.position_slot_id,

        assignment_type:
          values.assignment_type,

        effective_from:
          values.effective_from,

        effective_to:
          values.effective_to ||
          null,

        is_primary:
          Boolean(
            values.is_primary
          ),

        status:
          values.status,
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
          ? "แก้ไข Employee Position Assignment"
          : "เพิ่ม Employee Position Assignment"
      }
      okText={
        isEdit
          ? "บันทึกการแก้ไข"
          : "เพิ่ม Assignment"
      }
      cancelText="ยกเลิก"
      confirmLoading={
        saving
      }
      onCancel={
        onCancel
      }
      onOk={
        handleOk
      }
      destroyOnHidden
    >

      {/* ===================================================
          Scope Info
      =================================================== */}

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="Scope เดียวกับโครงสร้างองค์กร"
        description="ระบบจะแสดงเฉพาะ Position Slot และพนักงานที่อยู่ใน Company → Branch Group → Branch → Department → Division → Unit ที่ผู้ใช้มีสิทธิ์เท่านั้น และ Backend จะตรวจ Scope ซ้ำอีกครั้ง"
      />

      <Form
        form={
          form
        }
        layout="vertical"
      >

        <Row
          gutter={
            12
          }
        >

          {/* =================================================
              Position Slot
          ================================================= */}

          <Col span={24}>

            <Form.Item
              label="Position Slot"
              name="position_slot_id"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือก Position Slot",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="เลือก Position Slot"
                options={
                  slotOptions
                }
                onChange={() => {
                  form.setFieldValue(
                    "employee_id",
                    undefined
                  );

                  setEmployees(
                    []
                  );
                }}
              />
            </Form.Item>

          </Col>

          {/* =================================================
              Employee
          ================================================= */}

          <Col span={24}>

            <Form.Item
              label="พนักงาน"
              name="employee_id"
              rules={[
                {
                  required:
                    true,

                  message:
                    "กรุณาเลือกพนักงาน",
                },
              ]}
            >
              <Select
                showSearch
                filterOption={
                  false
                }
                disabled={
                  !selectedSlot
                }
                placeholder={
                  selectedSlot
                    ? "พิมพ์รหัสหรือชื่อพนักงาน"
                    : "กรุณาเลือก Position Slot ก่อน"
                }
                options={
                  employeeOptions
                }
                loading={
                  employeeLoading
                }
                onSearch={
                  refreshEmployees
                }
              />
            </Form.Item>

          </Col>

          {/* =================================================
              Assignment Type
          ================================================= */}

          <Col
            xs={24}
            md={12}
          >

            <Form.Item
              label="Assignment Type"
              name="assignment_type"
            >
              <Select
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
                ) => {
                  /*
                   * ถ้า Assignment Type เป็น primary
                   * บังคับ is_primary = true
                   */

                  if (
                    value ===
                    "primary"
                  ) {
                    form.setFieldValue(
                      "is_primary",
                      true
                    );
                  }
                }}
              />
            </Form.Item>

          </Col>

          {/* =================================================
              Is Primary
          ================================================= */}

          <Col
            xs={24}
            md={12}
          >

            <Form.Item
              label="Primary Assignment"
              name="is_primary"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

          </Col>

          {/* =================================================
              Effective From
          ================================================= */}

          <Col
            xs={24}
            md={12}
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

          {/* =================================================
              Effective To
          ================================================= */}

          <Col
            xs={24}
            md={12}
          >

            <Form.Item
              label="สิ้นสุด"
              name="effective_to"
            >
              <Input type="date" />
            </Form.Item>

          </Col>

          {/* =================================================
              Status
          ================================================= */}

          <Col span={24}>

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
   Employee Name
========================================================= */

function getEmployeeName(
  employee = {}
) {
  return (
    [
      employee.first_name_th,
      employee.last_name_th,
    ]
      .filter(Boolean)
      .join(" ") ||

    [
      employee.first_name_en,
      employee.last_name_en,
    ]
      .filter(Boolean)
      .join(" ") ||

    "-"
  );
}

/* =========================================================
   Bangkok Today
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