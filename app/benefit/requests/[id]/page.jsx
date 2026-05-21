"use client";

import { useEffect, useState } from "react";
import { Button, Card, Descriptions, Space, Spin, Tag, message } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const requestId = params?.id;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const canView = hasPermission(user, "benefit.request.view") || hasPermission(user, "benefit.request.create") || hasPermission(user, "benefit.request.approve");

  const loadDetail = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/benefits/requests/${requestId}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดรายละเอียดไม่สำเร็จ");
      }

      setData(json.data || null);
    } catch (error) {
      console.error("LOAD_REQUEST_DETAIL_ERROR:", error);
      message.error(error.message || "โหลดรายละเอียดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && canView) {
      loadDetail();
    }
  }, [requestId, canView]);

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "default";
      case "pending":
        return "gold";
      case "in_review":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "cancelled":
        return "default";
      case "paid":
        return "purple";
      default:
        return "blue";
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดูคำขอนี้</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card
          className="rounded-[24px] shadow-sm"
          title={
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
              <div>
                <div className="text-xl font-bold text-slate-800">
                  Benefit Request Detail
                </div>
                <div className="text-sm text-slate-500">
                  รายละเอียดคำขอสวัสดิการ
                </div>
              </div>
            </div>
          }
        >
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Spin />
            </div>
          ) : (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Request No">
                {data?.request_no || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(data?.status)}>
                  {data?.status || "-"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Employee">
                {`${data?.employees?.first_name_th || ""} ${
                  data?.employees?.last_name_th || ""
                }`.trim() || "-"}
                <div className="text-xs text-slate-400">
                  {data?.employees?.employee_code || "-"}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Benefit">
                {data?.benefits?.benefit_name || "-"}
                <div className="text-xs text-slate-400">
                  {data?.benefits?.benefit_code || "-"}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Requested Amount">
                {data?.requested_amount
                  ? Number(data.requested_amount).toLocaleString()
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Approved Amount">
                {data?.approved_amount
                  ? Number(data.approved_amount).toLocaleString()
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Remark">
                {data?.remark || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Reject Reason">
                {data?.reject_reason || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Created At">
                {data?.created_at
                  ? new Date(data.created_at).toLocaleString("th-TH")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        <Card className="rounded-[24px] shadow-sm" title="Attachments">
          {data?.attachments?.length ? (
            <Space orientation="vertical" className="w-full">
              {data.attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-xl border bg-white p-3"
                >
                  <div>
                    <div className="font-medium">{file.file_name}</div>
                    <div className="text-xs text-slate-400">
                      {file.file_type || "-"} /{" "}
                      {file.file_size
                        ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB`
                        : "-"}
                    </div>
                  </div>

                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      window.open(
                        `/api/benefits/attachments/${file.id}`,
                        "_blank"
                      )
                    }
                  >
                    Download
                  </Button>
                </div>
              ))}
            </Space>
          ) : (
            <div className="text-slate-400">ไม่มีไฟล์แนบ</div>
          )}
        </Card>
      </div>
    </div>
  );
}