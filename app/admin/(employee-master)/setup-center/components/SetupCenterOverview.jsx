"use client";

import {
  Card,
  Col,
  Progress,
  Row,
  Statistic,
  Tag,
  Typography,
} from "antd";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeploymentUnitOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const {
  Text,
} = Typography;

export default function SetupCenterOverview({
  readiness = {},
}) {
  const percent =
    Number(
      readiness.overall_percent ||
      0
    );

  return (
    <Row
      gutter={[
        16,
        16,
      ]}
    >
      <Col
        xs={24}
        lg={10}
      >
        <Card
          style={{
            height:
              "100%",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 18,
            }}
          >
            <Progress
              type="dashboard"
              percent={
                percent
              }
              size={132}
            />

            <div>
              <Text
                strong
                style={{
                  display:
                    "block",
                  fontSize: 16,
                }}
              >
                ความพร้อมของระบบ
              </Text>

              <Text
                type="secondary"
              >
                ตรวจจาก Required Master
                ที่มีข้อมูลอย่างน้อย 1 รายการ
              </Text>

              <div
                style={{
                  marginTop:
                    10,
                }}
              >
                <Tag
                  color={
                    readiness.p0_ready
                      ? "success"
                      : "warning"
                  }
                >
                  P0{" "}
                  {readiness.p0_ready
                    ? "พร้อม"
                    : "ยังไม่ครบ"}
                </Tag>

                <Tag
                  color={
                    readiness.employee_ready
                      ? "success"
                      : "processing"
                  }
                >
                  เพิ่มพนักงาน{" "}
                  {readiness.employee_ready
                    ? "พร้อม"
                    : "ยังไม่พร้อม"}
                </Tag>
              </div>
            </div>
          </div>
        </Card>
      </Col>

      <Col
        xs={12}
        lg={4}
      >
        <Card>
          <Statistic
            title="Required พร้อมแล้ว"
            value={
              readiness.required_ready ||
              0
            }
            suffix={`/ ${
              readiness.required_total ||
              0
            }`}
            prefix={
              <CheckCircleOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={12}
        lg={5}
      >
        <Card>
          <Statistic
            title="สถานะ P0"
            value={
              readiness.p0_ready
                ? "พร้อม"
                : "กำลังตั้งค่า"
            }
            prefix={
              readiness.p0_ready
                ? <DeploymentUnitOutlined />
                : <ClockCircleOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        lg={5}
      >
        <Card>
          <Statistic
            title="Employee Readiness"
            value={
              readiness.employee_ready
                ? "เพิ่มได้"
                : "ยังขาด Master"
            }
            prefix={
              <TeamOutlined />
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
