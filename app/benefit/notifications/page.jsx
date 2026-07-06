"use client";

import { useEffect, useState } from "react";
import {Card,Tag,Button,Typography,message,} from "antd";
import {BellOutlined,CheckOutlined,ReloadOutlined,DeleteOutlined,} from "@ant-design/icons";

const { Text } = Typography;

export default function BenefitNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/notifications", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดการแจ้งเตือนไม่สำเร็จ");
      }

      setItems(json.data || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_NOTIFICATIONS_ERROR:", error);
      message.error(error?.message || "โหลดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch("/api/benefits/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "อ่านการแจ้งเตือนไม่สำเร็จ");
      }

      message.success("อ่านการแจ้งเตือนแล้ว");
      loadData();
    } catch (error) {
      console.error("MARK_NOTIFICATION_READ_ERROR:", error);
      message.error(error?.message || "อ่านการแจ้งเตือนไม่สำเร็จ");
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "request_created":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "reversed":
        return "purple";
      case "paid":
        return "cyan";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "request_created":
        return "ส่งคำขอ";
      case "approved":
        return "อนุมัติ";
      case "rejected":
        return "ปฏิเสธ";
      case "reversed":
        return "คืนสิทธิ์";
      case "paid":
        return "จ่ายเงิน";
      default:
        return type || "-";
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <BellOutlined className="text-emerald-600" />
            <span className="text-lg font-bold">การแจ้งเตือน</span>
            {unreadCount > 0 && <Tag color="red">{unreadCount} ใหม่</Tag>}
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={loadData}
          >
            Refresh
          </Button>
        }
      >
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              size="small"
              className={
                item.is_read
                  ? "border-slate-200"
                  : "border-emerald-300 bg-emerald-50"
              }
            >
              <div className="flex items-start justify-between gap-4">

                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">

                    <span className="font-semibold">
                      {item.title}
                    </span>

                    <Tag color={getTypeColor(item.notification_type)}>
                      {getTypeLabel(item.notification_type)}
                    </Tag>

                    {!item.is_read && (
                      <Tag color="red">
                        New
                      </Tag>
                    )}
                  </div>

                  <div className="text-slate-600">
                    {item.message}
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("th-TH")
                      : "-"}
                  </div>
                </div>

                {!item.is_read && (
                  <Button
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => markAsRead(item.id)}
                  >
                    อ่านแล้ว
                  </Button>
                )}

              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}