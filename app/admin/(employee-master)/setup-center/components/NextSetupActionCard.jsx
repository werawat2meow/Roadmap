"use client";

import {
  Button,
  Card,
  Flex,
  Tag,
  Typography,
} from "antd";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const {
  Text,
  Title,
} = Typography;

export default function NextSetupActionCard({
  action,
  canOpen = false,
  onOpen,
}) {
  if (!action) {
    return (
      <Card>
        <Flex
          gap={14}
          align="center"
        >
          <CheckCircleOutlined
            style={{
              fontSize: 28,
            }}
          />

          <div>
            <Title
              level={5}
              style={{
                margin: 0,
              }}
            >
              Required Setup ครบแล้ว
            </Title>

            <Text type="secondary">
              สามารถไปตรวจ Employee,
              Company Structure และงาน
              Operation ต่อได้
            </Text>
          </div>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={16}
      >
        <div>
          <Tag
            color={
              action.priority ===
              "P0"
                ? "red"
                : action.priority ===
                    "P1"
                  ? "orange"
                  : "blue"
            }
          >
            {action.priority}
          </Tag>

          <Text
            type="secondary"
          >
            ขั้นตอนที่{" "}
            {action.step_order} —{" "}
            {action.step_title}
          </Text>

          <Title
            level={4}
            style={{
              margin:
                "6px 0 0",
            }}
          >
            ขั้นตอนถัดไป:{" "}
            {action.label}
          </Title>

          {!canOpen && (
            <Text
              type="warning"
              style={{
                display:
                  "block",
                marginTop: 6,
              }}
            >
              บัญชีนี้ไม่มี Permission
              สำหรับเปิดหน้านี้
              ให้ผู้ดูแลระบบดำเนินการหรือเพิ่มสิทธิ์
            </Text>
          )}
        </div>

        <Button
          type="primary"
          icon={
            <ArrowRightOutlined />
          }
          iconPlacement="end"
          disabled={
            !canOpen
          }
          onClick={
            onOpen
          }
        >
          ทำขั้นตอนถัดไป
        </Button>
      </Flex>
    </Card>
  );
}
