"use client";

import {
  Avatar,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Popconfirm,
  Space,
  Tag,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

export default function OrgStructureDrawer({
  open,
  slot,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  deletingAssignmentId = "",
  onClose,
  onAddChild,
  onEditSlot,
  onDeleteSlot,
  onAssignEmployee,
  onEditAssignment,
  onDeleteAssignment,
}) {
  if (!slot) return null;

  const assignments = slot.employee_position_assignments || [];

  return (
    <Drawer
      open={open}
      title="รายละเอียด Position Slot"
      size="large"
      onClose={onClose}
      extra={
        <Space wrap>
          {canCreate ? (
            <Button icon={<PlusOutlined />} onClick={() => onAddChild?.(slot)}>
              เพิ่ม Child
            </Button>
          ) : null}

          {canEdit && !slot.is_context_ancestor ? (
            <Button icon={<EditOutlined />} onClick={() => onEditSlot?.(slot)}>
              แก้ไข
            </Button>
          ) : null}

          {canDelete && !slot.is_context_ancestor ? (
            <Popconfirm
              title="ลบ Position Slot"
              description="Slot ต้องไม่มี Child และไม่มีประวัติ Assignment"
              okText="ลบ"
              cancelText="ยกเลิก"
              onConfirm={() => onDeleteSlot?.(slot)}
            >
              <Button danger icon={<DeleteOutlined />}>
                ลบ
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      }
    >
      {slot.is_context_ancestor ? (
        <Tag color="blue" className="mb-3">
          Context Ancestor — ใช้สำหรับเชื่อม Tree เท่านั้น
        </Tag>
      ) : null}

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Slot Code">
          {slot.slot_code || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Slot Name">
          {slot.slot_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Position">
          {slot.positions?.position_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Capacity">
          {slot.employment_capacity || 1}
        </Descriptions.Item>
        <Descriptions.Item label="บริษัท">
          {slot.companies?.company_name_th || slot.companies?.company_name_en || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="กลุ่มสังกัด">
          {slot.branch_groups?.group_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="สังกัด">
          {slot.branches?.branch_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="แผนก">
          {slot.departments?.department_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="ฝ่าย">
          {slot.divisions?.division_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="หน่วย">
          {slot.units?.unit_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="ประเภท">
          {slot.slot_type || "normal"}
        </Descriptions.Item>
        <Descriptions.Item label="สถานะ">
          <Tag color={slot.status === "active" ? "green" : "default"}>
            {slot.status === "active" ? "ใช้งาน" : "ยกเลิก"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="มีผลตั้งแต่">
          {slot.effective_from || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="สิ้นสุด">
          {slot.effective_to || "ไม่กำหนด"}
        </Descriptions.Item>
      </Descriptions>

      <Divider titlePlacement="left">
        <Space>
          <TeamOutlined />
          ผู้ครอง Position Slot
        </Space>
      </Divider>

      {!slot.is_context_ancestor && canCreate ? (
        <Button
          type="primary"
          icon={<UserOutlined />}
          className="mb-4"
          onClick={() => onAssignEmployee?.(slot)}
        >
          กำหนดพนักงาน
        </Button>
      ) : null}

      {assignments.length ? (
        <div className="space-y-3">
          {assignments.map((item) => {
            const employee = item.employees || {};
            const name = getEmployeeName(employee);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      size={46}
                      src={employee.employee_photo_url || undefined}
                    >
                      {name.charAt(0)}
                    </Avatar>

                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-800">
                        {name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {employee.employee_code || "-"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Tag color={item.is_primary ? "blue" : "default"}>
                          {item.assignment_type || "-"}
                        </Tag>
                        <Tag color={item.status === "active" ? "green" : "default"}>
                          {item.status}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <Space>
                    {canEdit ? (
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onEditAssignment?.(item)}
                      />
                    ) : null}

                    {canDelete ? (
                      <Popconfirm
                        title="ลบ Assignment นี้?"
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        onConfirm={() => onDeleteAssignment?.(item)}
                      >
                        <Button
                          size="small"
                          danger
                          loading={deletingAssignmentId === item.id}
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    ) : null}
                  </Space>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  {item.effective_from || "-"} → {item.effective_to || "ปัจจุบัน"}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty description="ยังไม่มี Employee Position Assignment" />
      )}
    </Drawer>
  );
}

function getEmployeeName(employee) {
  return (
    [employee?.first_name_th, employee?.last_name_th]
      .filter(Boolean)
      .join(" ") ||
    [employee?.first_name_en, employee?.last_name_en]
      .filter(Boolean)
      .join(" ") ||
    "-"
  );
}
