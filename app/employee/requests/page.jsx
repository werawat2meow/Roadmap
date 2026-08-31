"use client";

import {
  Alert,
  Card,
  Empty,
  Table,
  Typography,
} from "antd";

import {
  ClockCircleOutlined,
} from "@ant-design/icons";

import {
  useAuth,
} from "@/contexts/AuthContext";

import EmployeeRequestStatusTag from "../components/EmployeeRequestStatusTag";

import {
  hasEmployeePortalPermission,
} from "../lib/employeePortalAccess";

import {
  mockRequests,
} from "../_mock/employeePortalMockData";

const {
  Title,
  Text,
} = Typography;

export default function EmployeeRequestsPage() {
  const {
    user,
  } =
    useAuth();

  const canView =
    hasEmployeePortalPermission(
      user,
      "ep.request_tracking.view"
    );

  if (!canView) {
    return (
      <Alert
        type="warning"
        showIcon
        title="คุณไม่มีสิทธิ์ติดตามคำขอ"
      />
    );
  }

  const columns = [
    {
      title: "เลขที่คำขอ",
      dataIndex: "id",
      width: 130,
    },
    {
      title: "ประเภท",
      dataIndex: "type",
      width: 140,
    },
    {
      title: "ช่วงวันที่",
      key: "date_range",
      width: 210,
      render: (
        _,
        record
      ) =>
        record.start_date ===
        record.end_date
          ? record.start_date
          : `${record.start_date} - ${record.end_date}`,
    },
    {
      title: "จำนวน",
      dataIndex:
        "total_days",
      width: 100,
      align: "center",
      render: (value) =>
        `${value} วัน`,
    },
    {
      title: "ผู้อนุมัติ",
      dataIndex:
        "approver",
      width: 140,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (value) => (
        <EmployeeRequestStatusTag
          status={value}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <Title
          level={3}
          className="!mb-1"
        >
          ติดตามคำขอ
        </Title>

        <Text className="!text-slate-500">
          ดูสถานะคำขอที่ส่งไว้และผลการอนุมัติ
        </Text>
      </div>

      {/* ===============================================
          Mobile Cards
      =============================================== */}

      <div className="space-y-3 md:hidden">
        {mockRequests.length >
        0 ? (
          mockRequests.map(
            (item) => (
              <Card
                key={item.id}
                size="small"
                className="!rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      {item.id}
                    </div>

                    <div className="mt-1 font-bold text-slate-800">
                      {item.type}
                    </div>
                  </div>

                  <EmployeeRequestStatusTag
                    status={
                      item.status
                    }
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">
                      วันที่ลา
                    </div>

                    <div className="mt-1 text-slate-700">
                      {item.start_date ===
                      item.end_date
                        ? item.start_date
                        : `${item.start_date} - ${item.end_date}`}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">
                      จำนวน
                    </div>

                    <div className="mt-1 text-slate-700">
                      {item.total_days} วัน
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">
                      ผู้อนุมัติ
                    </div>

                    <div className="mt-1 text-slate-700">
                      {item.approver}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">
                      ส่งเมื่อ
                    </div>

                    <div className="mt-1 text-slate-700">
                      {item.submitted_at}
                    </div>
                  </div>
                </div>
              </Card>
            )
          )
        ) : (
          <Empty description="ยังไม่มีคำขอ" />
        )}
      </div>

      {/* ===============================================
          Desktop Table
      =============================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={
            mockRequests
          }
          pagination={false}
          scroll={{
            x: 900,
          }}
        />
      </div>

      <Alert
        type="info"
        showIcon
        icon={
          <ClockCircleOutlined />
        }
        title="Draft Data"
        description="รายการด้านบนเป็น Mock Data สำหรับทดสอบหน้าจอและ Flow ก่อนเชื่อม Approval Workflow จริง"
        className="!mt-5"
      />
    </div>
  );
}
