"use client";

import { Result, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function TaxRatesPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Result
        icon={<ClockCircleOutlined className="text-blue-500" />}
        title="Tax Rates"
        subTitle={
          <div className="mt-2">
            <Text type="secondary" className="text-base">
              ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา
            </Text>
            <br />
            <Text type="secondary" className="text-sm">
              Coming Soon
            </Text>
          </div>
        }
      />
    </div>
  );
}