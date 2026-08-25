"use client";

import { Descriptions, Drawer, Empty, Tag, Timeline, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  employeeName,
  formatDate,
  formatDateTime,
  formatMoney,
  getAdjustmentTypeLabel,
  statusMeta,
} from "./compensationUi";

const { Text } = Typography;

function actionIcon(action) {
  if (action === "approved") return <CheckCircleOutlined />;
  if (action === "rejected") return <CloseCircleOutlined />;
  if (action === "submitted") return <SendOutlined />;
  if (action === "created" || action === "updated") return <EditOutlined />;
  return <ClockCircleOutlined />;
}

export default function ApprovalLogDrawer({
  open,
  loading = false,
  adjustment,
  logs = [],
  onClose,
}) {
  return (
    <Drawer
      open={open}
      size="large"
      title="Salary Adjustment & Approval Trail"
      onClose={onClose}
      loading={loading}
    >
      {!adjustment ? (
        <Empty />
      ) : (
        <>
          <Descriptions bordered size="small" column={2} className="mb-6">
            <Descriptions.Item label="พนักงาน" span={2}>
              <strong>{adjustment.employee?.employee_code || "-"}</strong>{" "}
              {employeeName(adjustment.employee)}
            </Descriptions.Item>
            <Descriptions.Item label="ประเภท">
              {getAdjustmentTypeLabel(adjustment.adjustment_type)}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะ">
              <Tag color={statusMeta(adjustment.status).color}>
                {statusMeta(adjustment.status).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="เงินเดือนเดิม">
              {formatMoney(adjustment.current_salary, adjustment.currency_code)}
            </Descriptions.Item>
            <Descriptions.Item label="ปรับเพิ่ม/ลด">
              {formatMoney(adjustment.adjustment_amount, adjustment.currency_code)}
              {adjustment.adjustment_percent != null
                ? ` (${Number(adjustment.adjustment_percent).toFixed(2)}%)`
                : ""}
            </Descriptions.Item>
            <Descriptions.Item label="เงินเดือนใหม่">
              {formatMoney(adjustment.proposed_salary, adjustment.currency_code)}
            </Descriptions.Item>
            <Descriptions.Item label="วันที่มีผล">
              {formatDate(adjustment.effective_date)}
            </Descriptions.Item>
          </Descriptions>

          {logs.length === 0 ? (
            <Empty description="ยังไม่มี Approval Log" />
          ) : (
            <Timeline
              items={logs.map((log) => ({
                icon: actionIcon(log.action),
                content: (
                  <div>
                    <div className="font-medium text-slate-800">
                      {String(log.action || "-").toUpperCase()}
                      {log.from_status || log.to_status ? (
                        <Text type="secondary">
                          {`  ${log.from_status || "-"} → ${log.to_status || "-"}`}
                        </Text>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-500">
                      {log.actor?.username || "System"}
                      {log.role?.role_name ? ` • ${log.role.role_name}` : ""}
                      {` • ${formatDateTime(log.created_at)}`}
                    </div>
                    {log.comment ? (
                      <div className="mt-1 rounded-lg bg-slate-50 p-2 text-sm">
                        {log.comment}
                      </div>
                    ) : null}
                  </div>
                ),
              }))}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
