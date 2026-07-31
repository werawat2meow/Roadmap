"use client";

import {
  Col,
  Descriptions,
  Divider,
  Drawer,
  Row,
  Space,
  Tag,
} from "antd";

export default function PositionViewDrawer({open,onClose,data,}) {
  if (!data) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
      title="รายละเอียดตำแหน่ง"
    >
      <Descriptions
        bordered
        column={2}
        size="middle"
      >
        <Descriptions.Item
          label="รหัสตำแหน่ง"
        >
          {data.position_code}
        </Descriptions.Item>

        <Descriptions.Item
          label="ชื่อตำแหน่ง"
        >
          {data.position_name}
        </Descriptions.Item>

        <Descriptions.Item
          label="ชื่อย่อ"
        >
          {data.short_name || "-"}
        </Descriptions.Item>

        <Descriptions.Item
          label="สถานะ"
        >
          <Tag
            color={
              data.status === "active"
                ? "success"
                : "default"
            }
          >
            {data.status}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label="กลุ่มสายงาน"
        >
          {data.family ? (
            <>
              <strong>
                {data.family.code}
              </strong>

              {" - "}

              {data.family.name}
            </>
          ) : (
            "-"
          )}
        </Descriptions.Item>

        <Descriptions.Item
          label="Job"
        >
          {data.job ? (
            <>
              <strong>
                {data.job.code}
              </strong>

              {" - "}

              {data.job.name}
            </>
          ) : (
            "-"
          )}
        </Descriptions.Item>
          <Descriptions.Item
          label="ระดับตำแหน่ง"
          span={2}
          >
          <Space wrap>
            {(data.levels || []).length > 0 ? (
              data.levels.map((level) => (
                <Tag
                  key={level.id}
                  color={
                    level.is_default
                      ? "blue"
                      : "default"
                  }
                >
                  {level.level_code}

                  {level.level_name
                    ? ` - ${level.level_name}`
                    : ""}

                  {level.is_default && " ★"}
                </Tag>
              ))
            ) : (
              "-"
            )}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item
          label="รายละเอียด"
          span={2}
        >
          {data.description || "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider titlePlacement="left">
        คุณสมบัติตำแหน่ง
      </Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <strong>ตำแหน่งผู้จัดการ</strong>

          <div style={{ marginTop: 8 }}>
            <Tag
              color={
                data.is_manager
                  ? "processing"
                  : "default"
              }
            >
              {data.is_manager
                ? "YES"
                : "NO"}
            </Tag>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <strong>ตำแหน่งผู้บริหาร</strong>

          <div style={{ marginTop: 8 }}>
            <Tag
              color={
                data.is_executive
                  ? "volcano"
                  : "default"
              }
            >
              {data.is_executive
                ? "YES"
                : "NO"}
            </Tag>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <strong>รองรับหลายตำแหน่ง</strong>

          <div style={{ marginTop: 8 }}>
            <Tag
              color={
                data.allow_multiple_assignment
                  ? "purple"
                  : "default"
              }
            >
              {data.allow_multiple_assignment
                ? "รองรับ"
                : "ไม่รองรับ"}
            </Tag>
          </div>
        </Col>
      </Row>

      <Divider titlePlacement="left">
        ข้อมูลระบบ
      </Divider>

      <Descriptions
        bordered
        column={2}
        size="small"
      >
        <Descriptions.Item
          label="Sort Order"
        >
          {data.sort_order ?? 0}
        </Descriptions.Item>

        <Descriptions.Item
          label="Legacy Level"
        >
          {data.position_level || "-"}
        </Descriptions.Item>

        <Descriptions.Item
          label="สร้างเมื่อ"
        >
          {data.created_at
            ? new Date(
                data.created_at
              ).toLocaleString("th-TH")
            : "-"}
        </Descriptions.Item>

        <Descriptions.Item
          label="แก้ไขล่าสุด"
        >
          {data.updated_at
            ? new Date(
                data.updated_at
              ).toLocaleString("th-TH")
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
}