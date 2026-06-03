"use client";

import { useEffect, useState } from "react";
import {Card,Table,Button,Space,Input,Select,Tag,message,} from "antd";
import {PlusOutlined,EditOutlined,DeleteOutlined,} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitPoliciesPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  const canView = hasPermission(user, "benefit.policy.view") || hasPermission(user, "benefit.policy.manage");
  const canCreate = hasPermission(user, "benefit.policy.create") || hasPermission(user, "benefit.policy.manage");
  const canUpdate = hasPermission(user, "benefit.policy.update") || hasPermission(user, "benefit.policy.manage");
  const canDelete = hasPermission(user, "benefit.policy.delete") || hasPermission(user, "benefit.policy.manage");

  const loadData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (year) params.set("year", year);

      const res = await fetch(
        `/api/benefits/policies?${params.toString()}`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || "โหลด Policy ไม่สำเร็จ"
        );
      }

      setRows(json.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView]);

  if (!canView) {
    return (
      <Card>
        ไม่มีสิทธิ์เข้าถึง
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        title="Benefit Policy Rules"
        extra={
          canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
            >
              Add Policy
            </Button>
          )
        }
      >
        <Space className="mb-4" wrap>
          <Input.Search
            placeholder="Search Policy"
            allowClear
            style={{ width: 250 }}
            onSearch={(value) => {
              setSearch(value);
              setTimeout(loadData, 100);
            }}
          />

          <Select
            style={{ width: 140 }}
            value={year}
            onChange={(value) => {
              setYear(value);
              setTimeout(loadData, 100);
            }}
            options={[
              {
                label: "2025",
                value: 2025,
              },
              {
                label: "2026",
                value: 2026,
              },
              {
                label: "2027",
                value: 2027,
              },
            ]}
          />
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={[
            {
              title: "Policy Code",
              dataIndex: "policy_code",
            },
            {
              title: "Policy Name",
              dataIndex: "policy_name",
            },
            {
              title: "Benefit",
              render: (_, record) =>
                record?.benefits?.benefit_name ||
                "-",
            },
            {
              title: "Position",
              dataIndex: "position_level",
            },
            {
              title: "Min Service",
              dataIndex: "min_service_months",
            },
            {
              title: "Quota",
              dataIndex: "quota_amount",
            },
            {
              title: "Priority",
              dataIndex: "priority",
            },
            {
              title: "Status",
              render: (_, record) => (
                <Tag
                  color={
                    record.is_active
                      ? "green"
                      : "red"
                  }
                >
                  {record.is_active
                    ? "Active"
                    : "Inactive"}
                </Tag>
              ),
            },
            {
              title: "Actions",
              render: (_, record) => (
                <Space>
                  {canUpdate && (
                    <Button
                      icon={<EditOutlined />}
                    />
                  )}

                  {canDelete && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}