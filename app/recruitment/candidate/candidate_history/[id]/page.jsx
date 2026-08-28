"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

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

const STATUS_MAP = {
  "รอพิจารณา": { label: 'รอพิจารณา', color: 'default' },
  "HRD ส่งต่อ HRM": { label: 'HRD ส่งต่อ HRM', color: 'volcano' },
  "ผ่านการคัดเลือกเข้าสัมภาษณ์": { label: 'ผ่านการคัดเลือกเข้าสัมภาษณ์', color: 'blue' },
  "นัดสัมภาษณ์": { label: 'นัดสัมภาษณ์', color: 'green' },
  "ยืนยันการสัมภาษณ์": { label: 'ยืนยันการสัมภาษณ์', color: 'green' },
  "เลื่อนการสัมภาษณ์": { label: 'เลื่อนการสัมภาษณ์', color: 'volcano' },
  "ขาดการสัมภาษณ์": { label: 'ขาดการสัมภาษณ์', color: 'green' },
  "ส่งต่อการสัมภาษณ์": { label: 'ส่งต่อการสัมภาษณ์', color: 'green' },
  "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน": { label: 'ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน', color: 'volcano' },
  "ยื่น Resume": { label: 'ยื่น Resume', color: 'default' },
  "backlist": { label: 'backlist', color: 'red' },
  "ยกเลิก": { label: 'ยกเลิก', color: 'red' },
};

function StatusTag({ value }) { 
  
  const meta = STATUS_MAP[value] ?? { label: value ?? '-', color: 'default' };

  return <Tag color={meta.color}>{meta.label}</Tag>;
}

export default function CandidateHistoryPage({ params }) {

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.candidate.history",
    unauthorizedRedirect: "/recruitment",
  });

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
      render: (val) => <StatusTag value={val} />,
    },
    {
      title: "Action",
      align: "center",
      render: (_, row) => (
        <Space size="small">
          { canEdit && (
            <Link href={`/recruitment/candidate/candidate_history/${row.id}/detail`}>
              <Button type="primary">ดูรายละเอียด</Button>
            </Link>
          )}
        </Space>
      ),
    },
  ];

  if (isChecking && loading) return <LoadingOrb />;
  if (!canView) return null;

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