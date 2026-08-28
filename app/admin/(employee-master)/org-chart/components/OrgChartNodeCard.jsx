"use client";

import {
  Avatar,
  Card,
  Flex,
  Space,
  Tag,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  getOrganizationPath,
} from "./orgChartUtils";

const {
  Text,
  Title,
} = Typography;

function initials(
  name
) {
  const text =
    String(
      name || ""
    ).trim();

  if (!text) {
    return "?";
  }

  return text
    .split(/\s+/)
    .map(
      (part) =>
        part[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function OrgChartNodeCard({
  node,
  compact = false,
}) {
  const occupants =
    node?.occupants || [];

  const visibleOccupants =
    compact
      ? occupants.slice(
          0,
          1
        )
      : occupants.slice(
          0,
          3
        );

  const organizationPath =
    getOrganizationPath(
      node
    );

  return (
    <Card
      size="small"
      style={{
        width:
          compact
            ? 260
            : 300,

        borderRadius: 14,
      }}
      styles={{
        body: {
          padding:
            compact
              ? 10
              : 14,
        },
      }}
    >
      <Flex
        vertical
        gap={8}
      >
        <Flex
          justify="space-between"
          align="start"
          gap={8}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {node.slot_code ||
                "POSITION SLOT"}
            </Text>

            <Title
              level={5}
              style={{
                margin: 0,
                fontSize: 15,
              }}
              ellipsis={{
                tooltip:
                  node.slot_name,
              }}
            >
              {node.position_name ||
                node.slot_name}
            </Title>

            {node.position_level_code && (
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                }}
              >
                ระดับ{" "}
                {
                  node.position_level_code
                }
                {node.position_level_name
                  ? ` - ${node.position_level_name}`
                  : ""}
              </Text>
            )}
          </div>

          <ApartmentOutlined
            style={{
              fontSize: 20,
            }}
          />
        </Flex>

        {organizationPath && (
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              lineHeight: 1.4,
            }}
          >
            {organizationPath}
          </Text>
        )}

        <Flex
          gap={6}
          wrap="wrap"
        >
          <Tag
            icon={
              <TeamOutlined />
            }
          >
            Capacity{" "}
            {node.capacity}
          </Tag>

          <Tag
            color={
              node.filled > 0
                ? "success"
                : "default"
            }
          >
            ครองแล้ว{" "}
            {node.filled}
          </Tag>

          {node.vacant > 0 && (
            <Tag color="warning">
              ว่าง{" "}
              {node.vacant}
            </Tag>
          )}
        </Flex>

        <div>
          {visibleOccupants.length ? (
            <Space
              direction="vertical"
              size={6}
              style={{
                width: "100%",
              }}
            >
              {visibleOccupants.map(
                (occupant) => (
                  <Flex
                    key={
                      occupant.employee_id
                    }
                    align="center"
                    gap={8}
                  >
                    <Avatar
                      size={
                        compact
                          ? 28
                          : 32
                      }
                      icon={
                        <UserOutlined />
                      }
                    >
                      {initials(
                        occupant.full_name
                      )}
                    </Avatar>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <Text
                        strong
                        ellipsis={{
                          tooltip:
                            occupant.full_name,
                        }}
                        style={{
                          display:
                            "block",
                        }}
                      >
                        {
                          occupant.full_name
                        }
                      </Text>

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                        }}
                      >
                        {
                          occupant.employee_code
                        }
                      </Text>
                    </div>
                  </Flex>
                )
              )}

              {occupants.length >
                visibleOccupants.length && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                  }}
                >
                  + อีก{" "}
                  {occupants.length -
                    visibleOccupants.length}{" "}
                  คน
                </Text>
              )}
            </Space>
          ) : (
            <Tag color="warning">
              ตำแหน่งว่าง
            </Tag>
          )}
        </div>
      </Flex>
    </Card>
  );
}
