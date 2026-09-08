"use client";

import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Empty,
  Popover,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  BellOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

function toCount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0
    ? Math.floor(number)
    : 0;
}

export default function DashboardNotificationBell({
  dashboard,
  canViewEmployees = false,
}) {
  const router = useRouter();

  if (!canViewEmployees) {
    return null;
  }

  const probationCount = toCount(
    dashboard?.kpi?.probation
  );

  const hasProbation = probationCount > 0;

  const handleOpenEmployees = () => {
    router.push("/admin/employees");
  };

  const content = (
    <div className="w-[360px] max-w-[calc(100vw-48px)]">
      {hasProbation ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-700">
                <ClockCircleOutlined />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900">
                    พนักงานทดลองงาน
                  </div>
                  <Tag color="gold">
                    {probationCount.toLocaleString("th-TH")} คน
                  </Tag>
                </div>

                <Text className="mt-1 block text-xs leading-5 text-slate-500">
                  มีพนักงานที่อยู่ในสถานะทดลองงาน ควรติดตามการประเมินและการยืนยันสถานะตามรอบของบริษัท
                </Text>
              </div>
            </div>
          </div>

          <Button
            type="primary"
            block
            onClick={handleOpenEmployees}
            icon={<ArrowRightOutlined />}
            iconPlacement="end"
          >
            เปิดรายชื่อพนักงาน
          </Button>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="ไม่มีพนักงานทดลองงานที่ต้องติดตามในขอบเขตของคุณ"
        />
      )}
    </div>
  );

  return (
    <div data-dashboard-tour="notifications">
      <Popover
        trigger="click"
        placement="bottomRight"
        title={
          <Space size={8}>
            <BellOutlined />
            <span>การแจ้งเตือน HR</span>
          </Space>
        }
        content={content}
      >
        <Badge
          count={probationCount}
          overflowCount={99}
          size="small"
          offset={[-2, 4]}
        >
          <Button
            icon={<BellOutlined />}
            className={
              hasProbation
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : undefined
            }
          >
            แจ้งเตือน
          </Button>
        </Badge>
      </Popover>
    </div>
  );
}
