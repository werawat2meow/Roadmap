"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import {
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
} from "antd";

const { Title, Text } = Typography;

export default function CandidateHistoryPage({ params }) {

  const { id } = use(params);

  const [candidate, setCandidate] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const res = await fetch(
        `/recruitment/api/candidate_history/${id}`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Load failed");
      }

      setCandidate(json.candidate);
      setHistory(json.history ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      title: "ชื่อ-นามสกุล",
      render: () =>
        `${candidate?.first_name ?? ""} ${candidate?.last_name ?? ""}`,
    },
    {
      title: "วันที่สมัคร",
      dataIndex: "created_at",
      render: (value) => new Date(value).toLocaleString("th-TH"),
    },
    {
      title: "Status",
      dataIndex: "display_status",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Action",
      align: "center",
      render: (_, row) => (
        <Link href={`/recruitment/candidate/candidate_history/${row.id}/detail`}>
          <Button type="primary">ดูรายละเอียด</Button>
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title={error} />;
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={4}>ประวัติการสมัคร</Title>

        <Text strong>ชื่อผู้สมัคร :</Text>{" "}
        <Text>
          {candidate?.first_name} {candidate?.last_name}
        </Text>

        <br />

        <Text strong>จำนวนครั้งที่สมัคร :</Text>{" "}
        <Text>{candidate?.count_num} ครั้ง</Text>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={history}
          pagination={false}
        />
      </Card>
    </Space>
  );
}