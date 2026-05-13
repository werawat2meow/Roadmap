"use client";

import { useEffect, useState } from "react";
import { Card, Tag, Button, Empty, Spin } from "antd";
import {CheckCircleOutlined,CloseCircleOutlined,ClockCircleOutlined,FileTextOutlined,} from "@ant-design/icons";

export default function BenefitApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const loadApprovals = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/approvals", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลดรายการอนุมัติไม่สำเร็จ");
      }

      setRequests(data.data || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_APPROVALS_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <Card variant="borderless" className="rounded-[28px] shadow-sm">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Tag className="m-0 rounded-full border-0 bg-amber-100 text-amber-700">
                Approval
              </Tag>
              <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-600">
                Benefit System
              </Tag>
            </div>

            <h1 className="text-2xl font-bold text-slate-800">
              รายการรออนุมัติสวัสดิการ
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              ตรวจสอบ อนุมัติ หรือปฏิเสธคำขอใช้สิทธิ์สวัสดิการ
            </p>
          </div>
        </Card>

        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((item) => (
              <Card
                key={item.id}
                variant="borderless"
                className="rounded-[24px] shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-700">
                      <ClockCircleOutlined />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">
                          {item.request_no || "-"}
                        </h3>

                        <Tag className="m-0 rounded-full border-0 bg-amber-100 text-amber-700">
                          {item.status || "pending"}
                        </Tag>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.benefits?.benefit_name || "-"} ·{" "}
                        {item.employees?.employee_code || "-"} ·{" "}
                        {item.employees
                          ? `${item.employees.first_name_th || ""} ${
                              item.employees.last_name_th || ""
                            }`.trim()
                          : "-"}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        จำนวนที่ขอ:{" "}
                        <span className="font-semibold">
                          {item.requested_amount
                            ? Number(item.requested_amount).toLocaleString()
                            : "-"}
                        </span>
                      </p>

                      {item.remark && (
                        <p className="mt-1 text-sm text-slate-400">
                          หมายเหตุ: {item.remark}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button icon={<FileTextOutlined />}>รายละเอียด</Button>

                    <Button
                      icon={<CloseCircleOutlined />}
                      danger
                    >
                      ปฏิเสธ
                    </Button>

                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      className="!bg-emerald-600 hover:!bg-emerald-700"
                    >
                      อนุมัติ
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="borderless" className="rounded-[24px] shadow-sm">
            <Empty description="ยังไม่มีรายการรออนุมัติ" />
          </Card>
        )}
      </div>
    </div>
  );
}