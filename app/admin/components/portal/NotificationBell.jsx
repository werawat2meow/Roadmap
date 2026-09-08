"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Badge,
  Button,
  Empty,
  Popover,
  Spin,
  Tooltip,
} from "antd";

import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import {
  useRouter,
} from "next/navigation";

/* =========================================================
   Constants
========================================================= */

const POLL_INTERVAL_MS =
  60 * 1000;

const PAGE_SIZE = 10;

/* =========================================================
   Helpers
========================================================= */

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: text,
    };
  }
}

function formatRelativeTime(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const diffSeconds =
    Math.round(
      (date.getTime() -
        Date.now()) /
        1000
    );

  const absSeconds =
    Math.abs(diffSeconds);

  const formatter =
    new Intl.RelativeTimeFormat(
      "th-TH",
      {
        numeric: "auto",
      }
    );

  if (absSeconds < 60) {
    return formatter.format(
      diffSeconds,
      "second"
    );
  }

  const diffMinutes =
    Math.round(
      diffSeconds / 60
    );

  if (
    Math.abs(diffMinutes) <
    60
  ) {
    return formatter.format(
      diffMinutes,
      "minute"
    );
  }

  const diffHours =
    Math.round(
      diffMinutes / 60
    );

  if (
    Math.abs(diffHours) < 24
  ) {
    return formatter.format(
      diffHours,
      "hour"
    );
  }

  const diffDays =
    Math.round(
      diffHours / 24
    );

  if (
    Math.abs(diffDays) < 30
  ) {
    return formatter.format(
      diffDays,
      "day"
    );
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function getNotificationIcon(
  item
) {
  const type =
    String(
      item?.notification_type ||
        ""
    ).toLowerCase();

  const moduleCode =
    String(
      item?.module_code ||
        ""
    ).toLowerCase();

  if (
    type.includes("security") ||
    type.includes("password") ||
    type.includes("scope") ||
    moduleCode === "security"
  ) {
    return (
      <SafetyCertificateOutlined />
    );
  }

  if (
    type.includes("employee") ||
    moduleCode === "employees"
  ) {
    return <UserAddOutlined />;
  }

  if (
    type.includes("probation")
  ) {
    return (
      <ClockCircleOutlined />
    );
  }

  if (
    type.includes("document") ||
    type.includes("contract")
  ) {
    return <FileTextOutlined />;
  }

  if (
    type.includes("payroll") ||
    type.includes("salary") ||
    moduleCode === "payroll"
  ) {
    return <DollarOutlined />;
  }

  return <BellOutlined />;
}

function getPriorityClasses(
  priority
) {
  switch (
    String(
      priority || "normal"
    ).toLowerCase()
  ) {
    case "critical":
      return {
        icon:
          "bg-red-50 text-red-600",
        dot: "bg-red-500",
      };

    case "warning":
      return {
        icon:
          "bg-amber-50 text-amber-600",
        dot: "bg-amber-500",
      };

    case "info":
      return {
        icon:
          "bg-blue-50 text-blue-600",
        dot: "bg-blue-500",
      };

    default:
      return {
        icon:
          "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

/* =========================================================
   Component
========================================================= */

export default function NotificationBell() {
  const router =
    useRouter();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     Load Notifications
  ======================================================= */

  const loadNotifications =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!silent) {
          setRefreshing(true);
        }

        try {
          const response =
            await fetch(
              `/api/admin/notifications?page=1&pageSize=${PAGE_SIZE}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const payload =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              payload?.error ||
                payload?.message ||
                "ไม่สามารถโหลดการแจ้งเตือนได้"
            );
          }

          setNotifications(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );

          setUnreadCount(
            Number(
              payload?.unread_count ||
                0
            )
          );

          setError("");
        } catch (loadError) {
          console.error(
            "NotificationBell load error:",
            loadError
          );

          setError(
            loadError?.message ||
              "ไม่สามารถโหลดการแจ้งเตือนได้"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadNotifications({
      silent: true,
    });

    const timer =
      window.setInterval(
        () => {
          loadNotifications({
            silent: true,
          });
        },
        POLL_INTERVAL_MS
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [loadNotifications]);

  /* =======================================================
     Mark One As Read
  ======================================================= */

  const markAsRead =
    useCallback(
      async (
        notificationId
      ) => {
        const target =
          notifications.find(
            (item) =>
              item.id ===
              notificationId
          );

        if (
          !target ||
          target.is_read
        ) {
          return true;
        }

        try {
          const response =
            await fetch(
              `/api/admin/notifications/${notificationId}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  is_read: true,
                }),
              }
            );

          const payload =
            await readJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              payload?.error ||
                payload?.message ||
                "ไม่สามารถอัปเดตการแจ้งเตือนได้"
            );
          }

          setNotifications(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  notificationId
                    ? {
                        ...item,
                        is_read: true,
                        read_at:
                          payload?.data
                            ?.read_at ||
                          new Date()
                            .toISOString(),
                      }
                    : item
              )
          );

          setUnreadCount(
            (current) =>
              Math.max(
                current - 1,
                0
              )
          );

          return true;
        } catch (markError) {
          console.error(
            "NotificationBell mark read error:",
            markError
          );

          return false;
        }
      },
      [notifications]
    );

  /* =======================================================
     Mark All As Read
  ======================================================= */

  const handleMarkAllRead =
    useCallback(async () => {
      if (
        markingAll ||
        unreadCount <= 0
      ) {
        return;
      }

      setMarkingAll(true);

      try {
        const response =
          await fetch(
            "/api/admin/notifications/read-all",
            {
              method: "POST",
            }
          );

        const payload =
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "ไม่สามารถทำเครื่องหมายอ่านทั้งหมดได้"
          );
        }

        const readAt =
          new Date()
            .toISOString();

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                is_read: true,
                read_at:
                  item.read_at ||
                  readAt,
              })
            )
        );

        setUnreadCount(0);
      } catch (markAllError) {
        console.error(
          "NotificationBell mark all error:",
          markAllError
        );
      } finally {
        setMarkingAll(false);
      }
    }, [
      markingAll,
      unreadCount,
    ]);

  /* =======================================================
     Open Notification
  ======================================================= */

  const handleOpenNotification =
    useCallback(
      async (item) => {
        await markAsRead(
          item.id
        );

        const actionUrl =
          String(
            item?.action_url ||
              ""
          ).trim();

        if (
          actionUrl &&
          actionUrl.startsWith(
            "/"
          )
        ) {
          setOpen(false);
          router.push(
            actionUrl
          );
        }
      },
      [
        markAsRead,
        router,
      ]
    );

  /* =======================================================
     Panel
  ======================================================= */

  const content =
    useMemo(
      () => (
        <div className="w-[380px] max-w-[calc(100vw-32px)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-800">
                การแจ้งเตือน
              </div>

              <div className="mt-0.5 text-xs text-slate-400">
                {unreadCount > 0
                  ? `ยังไม่ได้อ่าน ${unreadCount} รายการ`
                  : "ไม่มีรายการที่ยังไม่ได้อ่าน"}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip title="รีเฟรช">
                <Button
                  type="text"
                  size="small"
                  loading={
                    refreshing
                  }
                  icon={
                    <ReloadOutlined />
                  }
                  onClick={() =>
                    loadNotifications()
                  }
                />
              </Tooltip>

              <Tooltip title="อ่านทั้งหมด">
                <Button
                  type="text"
                  size="small"
                  disabled={
                    unreadCount <= 0
                  }
                  loading={
                    markingAll
                  }
                  icon={
                    <CheckOutlined />
                  }
                  onClick={
                    handleMarkAllRead
                  }
                />
              </Tooltip>
            </div>
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Spin />
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center">
                <div className="text-sm font-medium text-red-500">
                  {error}
                </div>

                <Button
                  type="link"
                  className="mt-2"
                  onClick={() =>
                    loadNotifications()
                  }
                >
                  ลองใหม่
                </Button>
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="px-4 py-8">
                <Empty
                  image={
                    Empty.PRESENTED_IMAGE_SIMPLE
                  }
                  description="ยังไม่มีการแจ้งเตือน"
                />
              </div>
            ) : (
              notifications.map(
                (item) => {
                  const priority =
                    getPriorityClasses(
                      item.priority
                    );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`
                        relative
                        flex
                        w-full
                        items-start
                        gap-3
                        border-b
                        border-slate-100
                        px-4
                        py-3
                        text-left
                        transition
                        hover:bg-slate-50

                        ${
                          item.is_read
                            ? "bg-white"
                            : "bg-blue-50/40"
                        }
                      `}
                      onClick={() =>
                        handleOpenNotification(
                          item
                        )
                      }
                    >
                      {!item.is_read ? (
                        <span
                          className={`
                            absolute
                            right-3
                            top-4
                            h-2
                            w-2
                            rounded-full
                            ${priority.dot}
                          `}
                        />
                      ) : null}

                      <div
                        className={`
                          mt-0.5
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          text-base
                          ${priority.icon}
                        `}
                      >
                        {getNotificationIcon(
                          item
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pr-3">
                        <div
                          className={`
                            truncate
                            text-sm
                            text-slate-800
                            ${
                              item.is_read
                                ? "font-medium"
                                : "font-semibold"
                            }
                          `}
                        >
                          {item.title ||
                            "การแจ้งเตือน"}
                        </div>

                        {item.message ? (
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {item.message}
                          </div>
                        ) : null}

                        <div className="mt-1.5 text-[11px] text-slate-400">
                          {formatRelativeTime(
                            item.created_at
                          )}
                        </div>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      ),
      [
        error,
        handleMarkAllRead,
        handleOpenNotification,
        loadNotifications,
        loading,
        markingAll,
        notifications,
        refreshing,
        unreadCount,
      ]
    );

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      open={open}
      onOpenChange={
        setOpen
      }
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <Tooltip title="การแจ้งเตือน">
        <button
          type="button"
          aria-label="การแจ้งเตือน"
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            text-slate-500
            transition
            hover:bg-slate-50
            hover:text-slate-700
          "
        >
          <Badge
            count={unreadCount}
            size="small"
            overflowCount={99}
            offset={[
              1,
              0,
            ]}
          >
            <BellOutlined className="text-xl text-slate-600" />
          </Badge>
        </button>
      </Tooltip>
    </Popover>
  );
}
