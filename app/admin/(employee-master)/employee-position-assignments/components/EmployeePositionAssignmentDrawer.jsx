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

export default function EmployeePositionAssignmentDrawer({
  open,

  assignment = null,

  canEdit = false,

  onClose,
  onEdit,
}) {
  const employee =
    assignment?.employees ||
    {};

  const slot =
    assignment?.org_position_slots ||
    {};

  return (
    <Drawer
      open={
        open
      }
      title="รายละเอียด Employee Position Assignment"
      placement="right"
      size="large"
      onClose={
        onClose
      }
      extra={
        canEdit
          ? (
            <Button
              icon={
                <EditOutlined />
              }
              onClick={() =>
                onEdit?.(
                  assignment
                )
              }
            >
              แก้ไข
            </Button>
          )
          : null
      }
    >
      {assignment && (
        <>

          {/* =================================================
              Employee Header
          ================================================= */}

          <div className="mb-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">

            <Avatar
              size={72}
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

            <div>

              <div className="text-lg font-semibold text-slate-800">
                {getEmployeeName(
                  employee
                )}
              </div>

              <div className="text-sm text-slate-500">
                {employee.employee_code ||
                  "-"}
              </div>

              <Space
                className="mt-2"
                wrap
              >

                <AssignmentTypeTag
                  value={
                    assignment.assignment_type
                  }
                />

                {assignment.is_primary && (
                  <Tag color="blue">
                    Primary
                  </Tag>
                )}

                {assignment.status ===
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

              </Space>

            </div>

          </div>

          {/* =================================================
              Position
          ================================================= */}

          <Descriptions
            bordered
            column={1}
            size="small"
          >

            <Descriptions.Item label="Position Slot">
              {slot.slot_code ||
                "-"}{" "}
              -{" "}
              {slot.slot_name ||
                "-"}
            </Descriptions.Item>

            <Descriptions.Item label="ตำแหน่ง">
              {slot.positions
                ?.position_name ||
                "-"}
            </Descriptions.Item>

            <Descriptions.Item label="สายองค์กร">
              {assignment.organization_path ||
                "-"}
            </Descriptions.Item>

          </Descriptions>

          {/* =================================================
              Date
          ================================================= */}

          <Divider titlePlacement="left">
            ช่วงเวลาการครองตำแหน่ง
          </Divider>

          <Descriptions
            bordered
            column={1}
            size="small"
          >

            <Descriptions.Item label="มีผลตั้งแต่">
              {assignment.effective_from ||
                "-"}
            </Descriptions.Item>

            <Descriptions.Item label="สิ้นสุด">
              {assignment.effective_to ||
                "ไม่กำหนด"}
            </Descriptions.Item>

            <Descriptions.Item label="Assignment Type">

              <AssignmentTypeTag
                value={
                  assignment.assignment_type
                }
              />

            </Descriptions.Item>

            <Descriptions.Item label="Primary">
              {assignment.is_primary
                ? "ใช่"
                : "ไม่ใช่"}
            </Descriptions.Item>

            <Descriptions.Item label="สถานะ">
              {assignment.status ===
              "active"
                ? "ใช้งาน"
                : "ยกเลิก"}
            </Descriptions.Item>

          </Descriptions>

        </>
      )}
    </Drawer>
  );
}

/* =========================================================
   Assignment Type
========================================================= */

function AssignmentTypeTag({
  value,
}) {
  const config = {
    primary: {
      color:
        "blue",
      label:
        "Primary",
    },

    acting: {
      color:
        "gold",
      label:
        "Acting",
    },

    secondary: {
      color:
        "purple",
      label:
        "Secondary",
    },

    temporary: {
      color:
        "cyan",
      label:
        "Temporary",
    },
  };

  const current =
    config[value] ||
    {
      color:
        "default",

      label:
        value ||
        "-",
    };

  return (
    <Tag
      color={
        current.color
      }
    >
      {current.label}
    </Tag>
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