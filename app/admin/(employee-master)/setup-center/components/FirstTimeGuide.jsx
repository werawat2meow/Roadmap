"use client";

import {
  Alert,
  Button,
  Card,
  Flex,
  Radio,
  Typography,
} from "antd";

import {
  ImportOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const {
  Text,
  Title,
} = Typography;

export default function FirstTimeGuide({
  mode = "migration",
  onModeChange,
  canOpenEmployee,
  canOpenImport,
  employeeReady,
  onOpenEmployee,
  onOpenImport,
}) {
  return (
    <Card
      title="เริ่มใช้งานครั้งแรก"
    >
      <Flex
        vertical
        gap={16}
      >
        <Radio.Group
          value={mode}
          onChange={(
            event
          ) =>
            onModeChange?.(
              event.target
                .value
            )
          }
          optionType="button"
          buttonStyle="solid"
          options={[
            {
              value:
                "migration",
              label:
                "ย้ายจากระบบ HR เดิม",
            },
            {
              value:
                "new-company",
              label:
                "เริ่มบริษัทใหม่",
            },
          ]}
        />

        {mode ===
        "migration" ? (
          <>
            <Alert
              type="info"
              showIcon
              title="Flow สำหรับ Migration"
              description="ตั้ง Master ระบบใหม่ให้พร้อม → Generate Employee Migration Template → Mapping Code → Preview/Validate → Import → ตรวจ Position Assignment / Compensation"
            />

            <Button
              type="primary"
              icon={
                <ImportOutlined />
              }
              disabled={
                !employeeReady ||
                !canOpenImport
              }
              onClick={
                onOpenImport
              }
            >
              ไปหน้า Data Import
            </Button>

            {!employeeReady && (
              <Text
                type="warning"
              >
                ต้องตั้ง Required
                Master สำหรับ Employee
                ให้ครบก่อน Import
              </Text>
            )}
          </>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              title="Flow สำหรับบริษัทใหม่"
              description="ตั้ง Master ระบบ → ตรวจ Employee Readiness → เพิ่มพนักงานใหม่ → Position Assignment → Compensation → Bank / Tax → Shift / Leave → User Access"
            />

            <Button
              type="primary"
              icon={
                <PlusOutlined />
              }
              disabled={
                !employeeReady ||
                !canOpenEmployee
              }
              onClick={
                onOpenEmployee
              }
            >
              ไปหน้าเพิ่มพนักงาน
            </Button>

            {!employeeReady && (
              <Text
                type="warning"
              >
                ยังเพิ่มพนักงานไม่ได้
                เพราะ Required Master
                ยังไม่ครบ
              </Text>
            )}
          </>
        )}
      </Flex>
    </Card>
  );
}
