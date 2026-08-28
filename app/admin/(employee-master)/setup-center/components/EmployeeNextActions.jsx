"use client";

import {
  Button,
  Card,
  Flex,
  Steps,
  Tag,
  Typography,
} from "antd";

import {
  ArrowRightOutlined,
} from "@ant-design/icons";

const {
  Text,
  Title,
} = Typography;

const ACTIONS = [
  {
    title:
      "กำหนดการครองตำแหน่ง",
    description:
      "นำพนักงานไปวางใน Position Slot และกำหนดสายบังคับบัญชา",
    href:
      "/admin/employee-position-assignments",
    permission:
      "ems.org_structure.view",
    priority: 1,
  },
  {
    title:
      "ตรวจ Employee Compensation",
    description:
      "กำหนด Salary Structure / Salary Band / Base Salary ของพนักงาน",
    href:
      "/admin/employee-compensations",
    permission:
      "ems.employee_compensations.view",
    priority: 2,
  },
  {
    title:
      "เพิ่มบัญชีธนาคาร",
    description:
      "กำหนดบัญชีรับเงินเดือนและวิธีการจ่ายเงิน",
    href:
      "/admin/employee-bank-accounts",
    permission:
      "ems.employee_bank_accounts.view",
    priority: 3,
  },
  {
    title:
      "ตั้งค่าภาษี / ประกันสังคม",
    description:
      "เตรียมข้อมูลก่อน Payroll Run",
    href:
      "/admin/tax-profiles",
    permission:
      "ems.tax_profiles.view",
    priority: 4,
  },
  {
    title:
      "กำหนดกะ / ตารางเข้างาน",
    description:
      "กำหนดเวลาทำงานของพนักงาน",
    href:
      "/admin/work-schedules",
    permission:
      "ems.work_schedules.view",
    priority: 5,
  },
  {
    title:
      "กำหนดสิทธิ์วันลา",
    description:
      "สร้าง Leave Entitlement ให้พนักงาน",
    href:
      "/admin/leave-entitlements",
    permission:
      "ems.leave_entitlements.view",
    priority: 6,
  },
  {
    title:
      "สร้าง User Account / Scope",
    description:
      "เปิดสิทธิ์เข้า HRMS / ESS / MSS เมื่อข้อมูลพร้อมแล้ว",
    href:
      "/admin/user-access-assignments",
    permission:
      "access.user_access_assignments.view",
    priority: 7,
  },
];

export default function EmployeeNextActions({
  canAccess,
  onOpen,
}) {
  return (
    <Card
      title="หลังเพิ่มพนักงานแล้ว ทำอะไรต่อ?"
    >
      <Text
        type="secondary"
        style={{
          display:
            "block",
          marginBottom: 16,
        }}
      >
        ใช้ลำดับนี้เป็น Checklist
        หลัง Add Employee หรือหลัง
        Employee Migration เสร็จ
      </Text>

      <Steps
        orientation="vertical"
        current={-1}
        items={ACTIONS.map(
          (item) => ({
            title: (
              <Flex
                gap={8}
                align="center"
                wrap="wrap"
              >
                <Title
                  level={5}
                  style={{
                    margin: 0,
                  }}
                >
                  {item.priority}.{" "}
                  {item.title}
                </Title>

                <Tag>
                  Priority{" "}
                  {item.priority}
                </Tag>
              </Flex>
            ),

            content: (
              <Flex
                justify="space-between"
                align="center"
                gap={12}
                wrap="wrap"
              >
                <Text
                  type="secondary"
                >
                  {
                    item.description
                  }
                </Text>

                <Button
                  type="link"
                  icon={
                    <ArrowRightOutlined />
                  }
                  iconPlacement="end"
                  disabled={
                    !canAccess(
                      item.permission
                    )
                  }
                  onClick={() =>
                    onOpen?.(
                      item
                    )
                  }
                >
                  ไปทำต่อ
                </Button>
              </Flex>
            ),
          })
        )}
      />
    </Card>
  );
}
