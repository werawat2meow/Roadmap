"use client";

import { Card, Col, Row, Typography } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const CARD_META = {
  UPCOMING: {
    icon: <ClockCircleOutlined />,
    accent: "#111111",
    soft: "#ffffff",
    border: "#d9d9d9",
  },
  STARTED: {
    icon: <UserAddOutlined />,
    accent: "#1f9d39",
    soft: "#ffffff",
    border: "#d9d9d9",
  },
  PROBATION: {
    icon: <TeamOutlined />,
    accent: "#1463ff",
    soft: "#ffffff",
    border: "#d9d9d9",
  },
  LAST_WORKING_DAY: {
    icon: <LogoutOutlined />,
    accent: "#7f7f7f",
    soft: "#ffffff",
    border: "#d9d9d9",
  },
  NOTICE: {
    icon: <CalendarOutlined />,
    accent: "#e11d48",
    soft: "#ffffff",
    border: "#d9d9d9",
  },
};

export default function EmployeeMovementKpis({
  kpis,
  counts,
  event,
  onSelect,
}) {
  return (
    <Row gutter={[14, 14]} style={{ marginBottom: 18 }} wrap>
      {kpis.map(([key, label]) => {
        const meta = CARD_META[key] || CARD_META.UPCOMING;
        const active = event === key;

        return (
          <Col key={key} xs={24} sm={12} md={8} lg={8} xl={4}>
            <Card
              hoverable
              onClick={() => onSelect(key)}
              styles={{ body: { padding: 18 } }}
              style={{
                borderRadius: 16,
                border: `1px solid ${active ? "#111111" : meta.border}`,
                boxShadow: active
                  ? "0 0 0 2px rgba(17,17,17,0.08)"
                  : "0 8px 22px rgba(15, 23, 42, 0.04)",
                background: meta.soft,
                cursor: "pointer",
                minHeight: 100,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#111111",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        lineHeight: 1,
                        fontWeight: 800,
                        color: meta.accent,
                      }}
                    >
                      {counts[key] ?? 0}
                    </span>
                    <Text type="secondary">คน</Text>
                  </div>
                </div>

                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    color: meta.accent,
                    background: "rgba(15,23,42,0.04)",
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </div>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
