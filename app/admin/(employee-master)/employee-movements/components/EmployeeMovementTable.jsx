"use client";

import { Button, Card, Checkbox, Empty, Pagination, Segmented, Space, Spin, Tag, Typography } from "antd";
import { EditOutlined, FileImageOutlined, SettingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

function formatDate(value) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid()
    ? date.format("DD/MM/YYYY")
    : "-";
}

function safeTagColor(color) {
  if (!color || color === "slate") {
    return "default";
  }
  return color;
}

function trackingTag(row, area) {
  const stats = row.check_stats?.[area];
  if (!stats || stats.total === 0) return { text: "ยังไม่มีรายการ", color: "default" };
  if (area === "ASSET") {
    const pending = stats.total - stats.completed;
    return { text: `ทรัพย์สินคงค้าง (${pending})`, color: pending ? "magenta" : "green" };
  }
  return {
    text: `ติดตามแล้ว (${stats.completed}/${stats.total})`,
    color: stats.completed === stats.total ? "green" : "orange",
  };
}
function fileTag(row, isExitStatus) {
  if (isExitStatus || row.orientation_report_ready) {
    return { text: "รายงานพร้อมพิมพ์", color: "gold" };
  }
  return { text: "ยังไม่พร้อม", color: "default" };
}

export default function EmployeeMovementTable({
  rows,
  loading,
  page,
  pageSize,
  total,
  setPage,
  setPageSize,
  selected,
  setSelected,
  statuses,
  filters,
  busy,
  canManage,
  canHrView,
  canAuditView,
  bulk,
  printReport,
  printAllExitFiltered,
  manageExit,
  exitView,
  setExitView,
  isExitTab,
  onChangeStatus,
  onManageChecklist,
}) {
  const selectedRows = rows.filter((row) => selected.includes(row.id));
  const prepareSelected = selectedRows
    .filter((row) => row.orientation_can_prepare)
    .map((row) => row.id);
  const completeSelected = selectedRows
    .filter((row) => row.orientation_can_complete)
    .map((row) => row.id);
  const reportSelected = selectedRows
    .filter((row) => row.orientation_report_ready)
    .map((row) => row.id);
  const exitSelected = selectedRows.filter((row) =>
    ["RESIGNED", "RETIRED", "TERMINATED"].includes(
      String(row.status_code || "").toUpperCase()
    )
  );
  const sendable = exitSelected
    .filter((row) => row.exit_report_state === "PENDING")
    .map((row) => row.id);
  const closeable = exitSelected
    .filter((row) => row.exit_report_state === "SENT")
    .map((row) => row.id);

  const selectedStatus = statuses.find(
    (item) => item.id === filters.employee_status_id
  );
  const isPreHire = selectedStatus?.status_code === "PRE_HIRE";

  const allChecked = rows.length > 0 && selected.length === rows.length;
  const indeterminate = selected.length > 0 && selected.length < rows.length;

  return (
    <Card
      style={{ borderRadius: 18 }}
      styles={{ body: { padding: 0 } }}
      title="รายการติดตามพนักงาน"
      extra={
        <Text type="secondary">
          {total.toLocaleString("th-TH")} รายการ · ข้อมูลภายในสิทธิ์ที่ได้รับ
        </Text>
      }
    >
      <div style={{ padding: 16, borderBottom: "1px solid #f0f0f0" }}>
        <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
          <Text strong>เลือกแล้ว {selected.length} รายการ</Text>

          {/* ใช้รายงานพ้นสภาพแบบเดียวกับปุ่มรายบุคคล; ไม่รวมคนที่ยังทำงาน */}
          {canHrView && exitSelected.length > 0 && (
            <Button
              icon={<FileImageOutlined />}
              disabled={busy}
              onClick={() => printReport("exit", exitSelected.map((row) => row.id))}
            >
              รวมรายงานพ้นสภาพที่เลือก ({exitSelected.length})
            </Button>
          )}
          {canHrView && isExitTab && total > 0 && (
            <Button
              disabled={busy}
              onClick={printAllExitFiltered}
            >
              รวมรายงานพ้นสภาพทั้งหมดตามตัวกรอง ({total})
            </Button>
          )}

          {canHrView && isPreHire && (
            <Button
              disabled={!prepareSelected.length || busy || !canManage}
              loading={busy}
              onClick={() => bulk("REOPEN_ORIENTATION", prepareSelected)}
            >
              เปลี่ยนเป็นรอ Orientation ({prepareSelected.length})
            </Button>
          )}

          {canHrView && !!completeSelected.length && (
            <Button
              disabled={busy || !canManage}
              loading={busy}
              onClick={() => bulk("COMPLETE_ORIENTATION", completeSelected)}
            >
              ยืนยัน Orientation เสร็จแล้ว ({completeSelected.length})
            </Button>
          )}

          {canHrView && !!reportSelected.length && !isExitTab && (
            <>
              <Button onClick={() => printReport("cards", reportSelected)}>
                ส่งออกรูปภาพพนักงาน
              </Button>
              <Button onClick={() => printReport("table", reportSelected)}>
                ส่งออกตาราง Orientation
              </Button>
            </>
          )}

          {canHrView && isExitTab && (
            <>
              <Segmented
                value={exitView}
                onChange={(value) => {
                  setExitView(value);
                  setSelected([]);
                }}
                options={[
                  {
                    label: "รอดำเนินการ",
                    value: "pending",
                  },
                  {
                    label: "ปิดงานแล้ว",
                    value: "closed",
                  },
                  {
                    label: "ทั้งหมด",
                    value: "all",
                  },
                ]}
              />

              <Button
                disabled={!sendable.length || busy || !canManage}
                loading={busy}
                onClick={() => manageExit("MARK_SENT", sendable)}
              >
                ยืนยันส่งรายงานแล้ว ({sendable.length})
              </Button>
              <Button
                disabled={!closeable.length || busy || !canManage}
                loading={busy}
                onClick={() => manageExit("CLOSE", closeable)}
              >
                ปิดงานติดตาม ({closeable.length})
              </Button>
            </>
          )}
        </Space>
      </div>

      <Spin spinning={loading} description="กำลังโหลดข้อมูลพนักงาน..." size="large">
      <div style={{ padding: 16, minHeight: 180 }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1160 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "42px 2fr 0.7fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr",
                gap: 16,
                padding: "10px 12px",
                borderBottom: "2px solid #d9d9d9",
                fontWeight: 700,
                color: "#111111",
              }}
            >
              <Checkbox
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={(event) => {
                  setSelected(event.target.checked ? rows.map((row) => row.id) : []);
                }}
              />
              <div>ข้อมูลผู้ใช้</div>
              <div>ระดับ</div>
              <div>สังกัด</div>
              <div>เริ่มงานวันแรก</div>
              <div>สถานะการทำงาน</div>
              <div>ไฟล์ต่างๆ</div>
              <div>Audit Management</div>
              <div>Company Assets</div>
            </div>

            {!rows.length && !loading && (
              <div style={{ padding: 40 }}>
                <Empty description="ไม่พบข้อมูล" />
              </div>
            )}

            {rows.map((row) => {
              const isExitStatus = ["RESIGNED", "RETIRED", "TERMINATED"].includes(
                String(row.status_code || "").toUpperCase()
              );
              const file = fileTag(row, isExitStatus);
              const audit = trackingTag(row, "AUDIT");
              const assets = trackingTag(row, "ASSET");

              return (
                <div
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "42px 2fr 0.7fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr",
                    gap: 16,
                    padding: "14px 12px",
                    borderBottom: "1px solid #f0f0f0",
                    alignItems: "start",
                  }}
                >
                  <Checkbox
                    checked={selected.includes(row.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelected((prev) => [...prev, row.id]);
                      } else {
                        setSelected((prev) => prev.filter((id) => id !== row.id));
                      }
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: "#2b3bb4",
                      }}
                    >
                      {row.first_name_th} {row.last_name_th}
                    </div>
                    <div style={{ marginTop: 4 }}>เลขพนักงาน : {row.employee_code || "-"}</div>
                    <div style={{ marginTop: 2 }}>สังกัด : {row.organization?.branch_id || "-"}</div>
                    <div style={{ marginTop: 2 }}>แผนก : {row.organization?.department_id || "-"}</div>
                  </div>

                  <div style={{ fontWeight: 700, color: "#2b3bb4", fontSize: 18 }}>
                    {row.level_p || "-"}
                  </div>

                  <div style={{ fontWeight: 600 }}>
                    {row.organization?.company_id || "-"}
                  </div>

                  <div style={{ fontWeight: 700, color: "#2b3bb4", fontSize: 18 }}>
                    {formatDate(row.hire_date)}
                  </div>

                  <div>
                    <Tag
                      color={safeTagColor(row.color)}
                      style={{
                        borderRadius: 999,
                        paddingInline: 14,
                        paddingBlock: 6,
                        fontWeight: 700,
                      }}
                    >
                      {row.status_name || "-"}
                    </Tag>
                    {canManage && !isExitStatus && ["PRE_HIRE", "PROBATION", "ACTIVE", "NOTICE", "SUSPENDED"].includes(String(row.status_code || "").toUpperCase()) && (
                      <div style={{ marginTop: 10 }}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => onChangeStatus(row)}>
                          ดู / จัดการ
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Tag
                      color={file.color}
                      style={{
                        borderRadius: 999,
                        paddingInline: 14,
                        paddingBlock: 6,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      {file.text}
                    </Tag>
                    <div>
                      <Button
                        icon={<FileImageOutlined />}
                        onClick={() => printReport(isExitStatus ? "exit" : "cards", [row.id])}
                        disabled={!canHrView || (!isExitStatus && !row.orientation_report_ready)}
                      >
                        ดู / จัดการ
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Tag
                      color={audit.color}
                      style={{
                        borderRadius: 999,
                        paddingInline: 14,
                        paddingBlock: 6,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      {audit.text}
                    </Tag>
                    <div>
                      <Button
                        icon={<SettingOutlined />}
                        onClick={() => onManageChecklist(row, "AUDIT")}
                        disabled={!canAuditView && !canHrView}
                      >
                        ดู / จัดการ
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Tag
                      color={assets.color}
                      style={{
                        borderRadius: 999,
                        paddingInline: 14,
                        paddingBlock: 6,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      {assets.text}
                    </Tag>
                    <div>
                      <Button
                        icon={<SettingOutlined />}
                        onClick={() => onManageChecklist(row, "ASSET")}
                        disabled={!canHrView}
                      >
                        ดู / จัดการ
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <Text type="secondary">
            แสดง {rows.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, total)} จาก {total.toLocaleString("th-TH")} รายการ
          </Text>

          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            onChange={(nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }
              setPage(nextPage);
            }}
          />
        </div>
      </div>
      </Spin>
    </Card>
  );
}
