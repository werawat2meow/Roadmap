"use client";

import {
  Avatar,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Space,
  Tag,
} from "antd";

import {
  EditOutlined,
  UserOutlined,
} from "@ant-design/icons";

/* =========================================================
   Component
========================================================= */

export default function OrgPositionSlotDrawer({
  open,

  slot = null,

  canEdit = false,

  onClose,

  onEdit,
}) {
  if (!slot) {
    return (
      <Drawer
        open={
          open
        }
        title="Position Slot"
        size="large"
        onClose={
          onClose
        }
      />
    );
  }

  const assignments =
    getCurrentAssignments(
      slot
    );

  return (
    <Drawer
      open={
        open
      }

      title="รายละเอียด Position Slot"

      placement="right"

      size="large"

      onClose={
        onClose
      }

      extra={
        canEdit &&
        !slot.is_context_ancestor
          ? (
            <Button
              icon={
                <EditOutlined />
              }
              onClick={() =>
                onEdit?.(
                  slot
                )
              }
            >
              แก้ไข
            </Button>
          )
          : null
      }
    >
      {/* ===================================================
          Header
      =================================================== */}

      <div className="mb-5 rounded-2xl bg-slate-50 p-5">
        <Space
          direction="vertical"
          size={4}
        >
          <div className="text-xl font-bold text-slate-800">
            {slot.slot_code ||
              "-"}
          </div>

          <div className="text-sm text-slate-500">
            {slot.slot_name ||
              "ไม่ระบุชื่อ Slot"}
          </div>

          <Space wrap>
            <Tag color="blue">
              {slot.positions
                ?.position_name ||
                "ไม่ระบุตำแหน่ง"}
            </Tag>

            {slot.status ===
            "active"
              ? (
                <Tag color="green">
                  ใช้งาน
                </Tag>
              )
              : (
                <Tag>
                  ยกเลิก
                </Tag>
              )}

            {!slot.parent_slot_id && (
              <Tag color="gold">
                Root Slot
              </Tag>
            )}

            {slot.is_context_ancestor && (
              <Tag>
                Context Ancestor
              </Tag>
            )}
          </Space>
        </Space>
      </div>

      {/* ===================================================
          Slot Information
      =================================================== */}

      <Descriptions
        bordered
        column={1}
        size="small"
      >
        <Descriptions.Item label="รหัส Slot">
          {slot.slot_code ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="ชื่อ Slot">
          {slot.slot_name ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="ตำแหน่ง">
          {slot.positions
            ?.position_code ||
            "-"}{" "}
          -{" "}
          {slot.positions
            ?.position_name ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Slot Type">
          {slot.slot_type ||
            "normal"}
        </Descriptions.Item>

        <Descriptions.Item label="Capacity">
          {slot.employment_capacity ||
            1}
        </Descriptions.Item>

        <Descriptions.Item label="Parent Slot">
          {slot.parent_slot_id ||
            "Root"}
        </Descriptions.Item>
      </Descriptions>

      {/* ===================================================
          Organization
      =================================================== */}

      <Divider titlePlacement="left">
        สายองค์กร
      </Divider>

      <Descriptions
        bordered
        column={1}
        size="small"
      >
        <Descriptions.Item label="บริษัท">
          {slot.companies
            ?.company_name_th ||
            slot.companies
              ?.company_name_en ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="กรุ๊ปสังกัด">
          {slot.branch_groups
            ?.group_name ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="สังกัด">
          {slot.branches
            ?.branch_name ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="แผนก">
          {slot.departments
            ?.department_name ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="ฝ่าย">
          {slot.divisions
            ?.division_name ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="หน่วยงาน">
          {slot.units
            ?.unit_name ||
            "-"}
        </Descriptions.Item>
      </Descriptions>

      {/* ===================================================
          Effective
      =================================================== */}

      <Divider titlePlacement="left">
        ช่วงเวลาที่มีผล
      </Divider>

      <Descriptions
        bordered
        column={1}
        size="small"
      >
        <Descriptions.Item label="เริ่มต้น">
          {slot.effective_from ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="สิ้นสุด">
          {slot.effective_to ||
            "ไม่กำหนด"}
        </Descriptions.Item>

        <Descriptions.Item label="Sort Order">
          {slot.sort_order ??
            0}
        </Descriptions.Item>
      </Descriptions>

      {/* ===================================================
          Current Employees
      =================================================== */}

      <Divider titlePlacement="left">
        ผู้ครอง Position Slot ปัจจุบัน
      </Divider>

      {assignments.length ===
      0 ? (
        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50 p-5 text-center">
          <div className="font-semibold text-orange-600">
            VACANT
          </div>

          <div className="mt-1 text-xs text-orange-500">
            ยังไม่มีพนักงานครอง Position Slot นี้
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(
            (
              assignment
            ) => {
              const employee =
                assignment.employees ||
                {};

              return (
                <div
                  key={
                    assignment.id
                  }
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <Avatar
                    size={48}
                    src={
                      employee.employee_photo_url ||
                      undefined
                    }
                    icon={
                      !employee.employee_photo_url
                        ? (
                          <UserOutlined />
                        )
                        : undefined
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">
                      {getEmployeeName(
                        employee
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {employee.employee_code ||
                        "-"}
                    </div>
                  </div>

                  <Space
                    direction="vertical"
                    size={2}
                    align="end"
                  >
                    <Tag
                      color={
                        assignment.is_primary
                          ? "blue"
                          : "purple"
                      }
                    >
                      {assignment.assignment_type ||
                        "primary"}
                    </Tag>

                    {assignment.is_primary && (
                      <Tag color="green">
                        Primary
                      </Tag>
                    )}
                  </Space>
                </div>
              );
            }
          )}
        </div>
      )}
    </Drawer>
  );
}

/* =========================================================
   Current Assignments
========================================================= */

function getCurrentAssignments(
  slot
) {
  const today =
    new Intl.DateTimeFormat(
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

  return (
    slot
      ?.employee_position_assignments ||
    []
  ).filter(
    (
      assignment
    ) => {
      if (
        assignment.status !==
        "active"
      ) {
        return false;
      }

      if (
        assignment.effective_from &&
        assignment.effective_from >
          today
      ) {
        return false;
      }

      if (
        assignment.effective_to &&
        assignment.effective_to <
          today
      ) {
        return false;
      }

      return true;
    }
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