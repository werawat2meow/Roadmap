"use client";

import {
  Button,
  Card,
  Flex,
  Progress,
  Space,
  Tag,
  Typography,
} from "antd";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const {
  Text,
  Title,
} = Typography;

function statusMeta(
  step
) {
  if (
    step.status ===
    "ready"
  ) {
    return {
      color: "success",
      label: "พร้อม",
      icon:
        <CheckCircleOutlined />,
    };
  }

  if (
    step.status ===
    "in_progress"
  ) {
    return {
      color:
        "processing",
      label:
        "กำลังตั้งค่า",
      icon:
        <ClockCircleOutlined />,
    };
  }

  return {
    color: "default",
    label:
      "ยังไม่เริ่ม",
    icon:
      <ExclamationCircleOutlined />,
  };
}

export default function SetupStepCard({
  step,
  canAccess,
  onOpen,
}) {
  const meta =
    statusMeta(step);

  return (
    <Card
      title={
        <Flex
          align="center"
          gap={10}
          wrap="wrap"
        >
          <Tag
            color={
              step.priority ===
              "P0"
                ? "red"
                : step.priority ===
                    "P1"
                  ? "orange"
                  : "blue"
            }
          >
            {step.priority}
          </Tag>

          <Text
            type="secondary"
          >
            STEP {step.order}
          </Text>

          <Title
            level={5}
            style={{
              margin: 0,
            }}
          >
            {step.title}
          </Title>

          <Tag
            color={
              meta.color
            }
            icon={meta.icon}
          >
            {meta.label}
          </Tag>
        </Flex>
      }
      extra={
        <Progress
          percent={
            step.percent ||
            0
          }
          size="small"
          style={{
            width: 130,
          }}
        />
      }
    >
      <Text
        type="secondary"
        style={{
          display:
            "block",
          marginBottom: 14,
        }}
      >
        {step.description}
      </Text>

      <Flex
        vertical
        gap={8}
      >
        {(step.items || []).map(
          (item) => {
            const allowed =
              canAccess(
                item.permission
              );

            return (
              <Flex
                key={
                  item.key
                }
                justify="space-between"
                align="center"
                gap={12}
                wrap="wrap"
                style={{
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #f0f0f0",
                  borderRadius:
                    10,
                }}
              >
                <Space
                  size={8}
                  wrap
                >
                  {item.ready ? (
                    <CheckCircleOutlined />
                  ) : item.available ? (
                    <ClockCircleOutlined />
                  ) : (
                    <ExclamationCircleOutlined />
                  )}

                  <Text
                    strong={
                      item.required
                    }
                  >
                    {item.label}
                  </Text>

                  {item.required && (
                    <Tag color="red">
                      Required
                    </Tag>
                  )}

                  {!item.available && (
                    <Tag>
                      ยังไม่มีตาราง /
                      โมดูล
                    </Tag>
                  )}

                  {item.available && (
                    <Tag
                      color={
                        item.ready
                          ? "success"
                          : "default"
                      }
                    >
                      {item.ready
                        ? `พร้อม (${item.count})`
                        : "ยังไม่มีข้อมูล"}
                    </Tag>
                  )}
                </Space>

                <Button
                  type="link"
                  icon={
                    <ArrowRightOutlined />
                  }
                  iconPlacement="end"
                  disabled={
                    !allowed
                  }
                  onClick={() =>
                    onOpen?.(
                      item
                    )
                  }
                >
                  ไปหน้านี้
                </Button>
              </Flex>
            );
          }
        )}
      </Flex>
    </Card>
  );
}
