"use client";

import { Button, Card, Checkbox, Empty, Pagination, Segmented, Space, Spin, Tag, Typography } from "antd";
import { EditOutlined, FileImageOutlined, SettingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";

const { Text } = Typography;

const EXIT_STATUS_CODES = ["RESIGNED", "RETIRED", "TERMINATED"];

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
    text: `อยู่กลุ่มไลน์ (${stats.completed}/${stats.total})`,
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
  onOpenSeparation,
  manageExit,
  exitView,
  setExitView,
  isExitTab,
  onChangeStatus,
  onManageChecklist,
}) {
  // AUDITOR sees the Audit workspace only, even if HR permissions are assigned.
  // Other roles continue to use the original permission flags.
  const { user } = useAuth();
  // Login payloads can expose the role under role_name instead of role_code.
  // Check both code and name before showing HR-only columns.
  const roleTokens = [
    user?.role_code,
    user?.role_name,
    user?.roleCode,
    user?.roleName,
    user?.role?.role_code,
    user?.role?.role_name,
    user?.role?.code,
    user?.role?.name,
    user?.roles?.role_code,
    user?.roles?.role_name,
    user?.access?.role_code,
    user?.access?.role_name,
  ].filter(Boolean).map((value) => String(value).trim().toUpperCase());
  const isAuditor = roleTokens.some((value) => value === "AUDITOR");
  const showHrColumns = !isAuditor && Boolean(canHrView);
  const showAuditColumn = Boolean(canAuditView);
  const showAssetsColumn = !isAuditor && Boolean(canHrView);
  const gridColumns = ["42px", "minmax(220px,2fr)", "0.7fr", "1fr", "1fr",
    ...(showHrColumns ? ["1.2fr", "1.2fr"] : []),
    ...(showAuditColumn ? ["1.2fr"] : []),
    ...(showAssetsColumn ? ["1.2fr"] : []),
  ].join(" ");
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
    EXIT_STATUS_CODES.includes(String(row.status_code || "").toUpperCase())
  );
  // id ของแถวที่พ้นสภาพและถูกเลือก (ใช้กับปุ่มดู/จัดการรายงานพ้นสภาพ)
  const selectedExitIds = exitSelected.map((row) => row.id);
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

  const selectableRows = rows.filter(row => !row.recruitment_only);
  const allChecked = selectableRows.length > 0 && selected.length === selectableRows.length;
  const indeterminate = selected.length > 0 && selected.length < selectableRows.length;

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

          {showHrColumns && isPreHire && (
            <Button
              disabled={!prepareSelected.length || busy || !canManage}
              loading={busy}
              onClick={() => bulk("REOPEN_ORIENTATION", prepareSelected)}
            >
              เปลี่ยนเป็นรอ Orientation ({prepareSelected.length})
            </Button>
          )}

          {showHrColumns && !!completeSelected.length && (
            <Button
              disabled={busy || !canManage}
              loading={busy}
              onClick={() => bulk("COMPLETE_ORIENTATION", completeSelected)}
            >
              ยืนยัน Orientation เสร็จแล้ว ({completeSelected.length})
            </Button>
          )}

          {showHrColumns && !!reportSelected.length && !isExitTab && (
            <>
              <Button onClick={() => printReport("cards", reportSelected)}>
                ส่งออกรูปภาพพนักงาน
              </Button>
              <Button onClick={() => printReport("table", reportSelected)}>
                ส่งออกตาราง Orientation
              </Button>
            </>
          )}

          {showHrColumns && isExitTab && (
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
                disabled={!selectedExitIds.length}
                onClick={() => printReport("exit", selectedExitIds)}
              >
                ดู / พิมพ์รายงานพ้นสภาพ ({selectedExitIds.length})
              </Button>
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

          {/* นอกแท็บพ้นสภาพ: ถ้าเลือกแถวที่พ้นสภาพปนมา ให้มีปุ่มเปิดรายงานพ้นสภาพ */}
          {showHrColumns && !isExitTab && selectedExitIds.length > 0 && (
            <Button
              icon={<FileImageOutlined />}
              onClick={() => printReport("exit", selectedExitIds)}
            >
              ดู / จัดการรายงานพ้นสภาพ ({selectedExitIds.length})
            </Button>
          )}
        </Space>
      </div>

      <Spin spinning={loading} description="กำลังโหลดข้อมูลพนักงาน..." size="large">
      <div style={{ padding: 16, minHeight: 180 }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: showHrColumns ? 1160 : 760 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: gridColumns,
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
                  setSelected(event.target.checked ? rows.filter(row => !row.recruitment_only).map((row) => row.id) : []);
                }}
              />
              <div>ข้อมูลผู้ใช้</div>
              <div>ระดับ</div>
              <div>สังกัด</div>
              <div>เริ่มงานวันแรก</div>
              {showHrColumns && <div>สถานะการทำงาน</div>}
              {showHrColumns && <div>ไฟล์ต่างๆ</div>}
              {showAuditColumn && <div>Audit Management</div>}
              {showAssetsColumn && <div>Company Assets</div>}
            </div>

            {!rows.length && !loading && (
              <div style={{ padding: 40 }}>
                <Empty description="ไม่พบข้อมูล" />
              </div>
            )}

            {rows.map((row) => {
              const isExitStatus = EXIT_STATUS_CODES.includes(
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
                    gridTemplateColumns: gridColumns,
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

                  {showHrColumns && <div>
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
                    {canManage &&
                      !isExitStatus &&
                      ["PROBATION", "ACTIVE", "NOTICE", "SUSPENDED"].includes(
                        String(row.status_code || "").toUpperCase()
                      ) && (
                        <div style={{ marginTop: 10 }}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onChangeStatus(row)}
                          >
                            ดู / จัดการ
                          </Button>
                        </div>
                    )}
                  </div>}

                  {showHrColumns && <div>
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
                        onClick={() => isExitStatus ? onOpenSeparation?.(row) : printReport("cards", [row.id])}
                        disabled={!showHrColumns || (!isExitStatus && !row.orientation_report_ready)}
                      >
                        ดู / จัดการ
                      </Button>
                    </div>
                  </div>}

                  {showAuditColumn && <div>
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
                        disabled={!showAuditColumn}
                      >
                        ดู / จัดการ
                      </Button>
                    </div>
                  </div>}

                  {showAssetsColumn && <div>
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
                        disabled={!showAssetsColumn}
                      >
                        ดู / จัดการ
                      </Button>
                    </div>
                  </div>}
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