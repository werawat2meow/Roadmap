"use client";

import { Card, Form, Select } from "antd";

export default function PositionFamilyLevelSearch({
  families = [],
  selectedFamilyId,
  loading,
  onChange,
}) {
  return (
    <Card className="mb-4">

      <Form layout="vertical">

        <Form.Item
          label="Position Family"
          extra="เลือกกลุ่มสายงานที่ต้องการกำหนด Position Levels"
        >
          <Select
            showSearch
            allowClear
            loading={loading}
            placeholder="เลือก Position Family"
            optionFilterProp="label"
            value={selectedFamilyId}
            onChange={onChange}
            options={families.map((item) => ({
              value: item.id,
              label: `${item.family_code} - ${item.family_name}`,
            }))}
          />
        </Form.Item>

      </Form>

    </Card>
  );
}