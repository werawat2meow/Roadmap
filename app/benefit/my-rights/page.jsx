"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Tag, Spin, Empty } from "antd";
import {GiftOutlined,UserOutlined,CheckCircleOutlined,} from "@ant-design/icons";

export default function MyBenefitRightsPage() {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [rights, setRights] = useState([]);

  const getBenefitKey = (item) => {
    return (
      item?.benefit_id ||
      item?.benefits?.id ||
      item?.benefit_code ||
      item?.benefits?.benefit_code ||
      item?.id
    );
  };

  const removeDuplicateRights = (items = []) => {
    const map = new Map();

    items.forEach((item) => {
      const key = getBenefitKey(item);
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
  };

  const loadMyRights = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/my-rights", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลดสิทธิ์ไม่สำเร็จ");
      }

      const rawRights = data.data?.rights || [];
      const uniqueRights = removeDuplicateRights(rawRights);

      setEmployee(data.data?.employee || null);
      setRights(uniqueRights);
    } catch (error) {
      console.error("LOAD_MY_RIGHTS_ERROR:", error);
      setEmployee(null);
      setRights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRights();
  }, []);

  const fullName = useMemo(() => {
    return employee
      ? `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim()
      : "-";
  }, [employee]);

  const formatQuota = (item) => {
    if (item?.is_unlimited) return "ไม่จำกัด";

    if (item?.quota_amount) {
      return `${Number(item.quota_amount).toLocaleString()} ${
        item.quota_unit || ""
      }`;
    }

    if (item?.discount_percent) {
      return `${item.discount_percent}%`;
    }

    return "-";
  };

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Tag className="m-0 rounded-full border-0 bg-emerald-100 text-emerald-700">
                  My Rights
                </Tag>

                <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-600">
                  Benefit System
                </Tag>
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                สิทธิ์สวัสดิการของฉัน
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                แสดงสิทธิ์ตามสถานะพนักงาน ระดับตำแหน่ง และอายุงาน
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UserOutlined />
                </div>

                <div>
                  <div className="font-bold text-slate-800">{fullName}</div>

                  <div className="text-xs text-slate-500">
                    {employee?.employee_code || "-"} ·{" "}
                    {employee?.positions?.position_level || "-"} ·{" "}
                    {employee?.employee_statuses?.status_name || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {rights.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rights.map((item) => (
              <Card
                key={getBenefitKey(item)}
                variant="borderless"
                className="rounded-[24px] shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
                    <GiftOutlined />
                  </div>

                  <Tag className="m-0 rounded-full border-0 bg-emerald-50 text-emerald-700">
                    Active
                  </Tag>
                </div>

                <h3 className="text-lg font-bold text-slate-800">
                  {item.benefits?.benefit_name || "-"}
                </h3>

                <p className="mt-1 min-h-[42px] text-sm text-slate-500">
                  {item.benefits?.description || item.rule_note || "-"}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <span className="text-slate-400">ประเภท: </span>
                    <span className="font-semibold text-slate-700">
                      {item.benefits?.benefit_categories?.category_name || "-"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <span className="text-slate-400">Quota: </span>
                    <span className="font-semibold text-slate-700">
                      {formatQuota(item)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <span className="text-slate-400">รอบการใช้สิทธิ์: </span>
                    <span className="font-semibold text-slate-700">
                      {item.quota_frequency || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <CheckCircleOutlined />
                  <span>คุณมีสิทธิ์ใช้งานรายการนี้</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="borderless" className="rounded-[24px] shadow-sm">
            <Empty description="ยังไม่พบสิทธิ์สวัสดิการของคุณ" />
          </Card>
        )}
      </div>
    </div>
  );
}