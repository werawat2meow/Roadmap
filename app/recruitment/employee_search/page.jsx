"use client";

import { useState } from "react";
import {
  Card,
  Input,
  Table,
  Tag,
  Typography,
  Space,
  Empty,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";

import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import AntIcon from '@/components/AntIcon';

const { Title, Text } = Typography;

const recruitStatusColor = {
  1: "gold",
  2: "blue",
  3: "cyan",
  4: "processing",
  5: "green",
  6: "orange",
  7: "red",
  8: "purple",
  9: "geekblue",
  10: "green",
  11: "red",
  12: "blue",
  13: "orange",
  14: "red",
  15: "green",
  16: "default",
  17: "blue",
  18: "orange",
  19: "gold",
  0: "default",
  99: "red",
};

export default function EmployeeSearchPage() {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const { isChecking, canView } = usePageGuard({
        module: "recruitment.employee.search",
        unauthorizedRedirect: "/recruitment",
    });

    const handleSearch = async (
    value,
    page = 1,
    pageSize = pagination.pageSize
    ) => {
    const keyword = value.trim();

    setSearch(value);

    if (!keyword) {
        setData([]);
        setPagination({
        current: 1,
        pageSize: 10,
        total: 0,
        });
        return;
    }

    try {
        setLoading(true);

        const params = new URLSearchParams({
        search: keyword,
        page: String(page),
        pageSize: String(pageSize),
        });

        const response = await fetch(
        `/recruitment/api/employee_search?${params.toString()}`
        );

        const result = await response.json();

        if (result.success) {
        setData(result.data || []);

        setPagination({
            current: result.page,
            pageSize: result.pageSize,
            total: result.total,
        });
        } else {
        setData([]);
        }
    } catch (error) {
        console.error("Search employee error:", error);
        setData([]);
    } finally {
        setLoading(false);
    }
    };

  const columns = [
    {
      title: "ชื่อ",
      dataIndex: "first_name",
      key: "first_name",
      width: 250,
    },
    {
      title: "นามสกุล",
      dataIndex: "last_name",
      key: "last_name",
      width: 250,
    },
    {
      title: "ชื่อเล่น",
      dataIndex: "nickname",
      key: "nickname",
      width: 180,
      render: (value) => value || "-",
    },
    {
      title: "สถานะ",
      dataIndex: "status_name",
      key: "status_name",
      width: 300,
      render: (value, record) => (
        <Tag
          color={
            record.source === "recruit_job_applications"
              ? recruitStatusColor[record.status] || "default"
              : "blue"
          }
        >
          {value ?? "-"}
        </Tag>
      ),
    },
    {
      title: "แหล่งข้อมูล",
      dataIndex: "source",
      key: "source",
      width: 250,
      render: (value) =>
        value === "employees"
          ? "พนักงาน"
          : "ผู้สมัครงาน",
    },
  ];

    if (isChecking || loading) return <LoadingOrb />;
    if (!canView) return null;

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space
          orientation="vertical"
          size={20}
          style={{ width: "100%" }}
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              ค้นหาข้อมูลพนักงาน
            </Title>

            <Text type="secondary">
              ค้นหาจากชื่อ นามสกุล หรือชื่อเล่น
            </Text>
          </div>

          <Input.Search
            allowClear
            size="large"
            placeholder="ค้นหาชื่อ นามสกุล หรือชื่อเล่น..."
            prefix={<AntIcon name="SearchOutlined" />}
            value={search}
            onChange={(e) => {
              const value = e.target.value;

              setSearch(value);

              if (!value.trim()) {
                setData([]);
              }
            }}
            onSearch={handleSearch}
            loading={loading}
            enterButton="ค้นหา"
          />

          <Table
            rowKey={(record) => `${record.source}-${record.id}`}
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],

                showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }}
            onChange={(paginationInfo) => {
                handleSearch(
                search,
                paginationInfo.current,
                paginationInfo.pageSize
                );
            }}
            scroll={{ x: 1000 }}
          />
        </Space>
      </Card>
    </div>
  );
}