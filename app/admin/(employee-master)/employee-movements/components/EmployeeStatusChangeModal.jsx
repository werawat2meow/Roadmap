
"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Typography,
  Button,
  Timeline,
  Spin,
} from "antd";
import dayjs from "dayjs";

// --------------------------------------------------
// Allowed Employee Status Transitions
// --------------------------------------------------

const TRANSITIONS = {
  PRE_HIRE: ["PROBATION", "ACTIVE"],
  PROBATION: [
    "ACTIVE",
    "NOTICE",
    "RESIGNED",
    "SUSPENDED",
    "TERMINATED",
    "DISMISSED",
  ],
  ACTIVE: [
    "NOTICE",
    "RESIGNED",
    "SUSPENDED",
    "RETIRED",
    "TERMINATED",
    "DISMISSED",
  ],
  NOTICE: ["RESIGNED", "ACTIVE", "DISMISSED"],
  SUSPENDED: ["ACTIVE", "TERMINATED", "DISMISSED"],
};

// --------------------------------------------------
// Direct Exit Reason Options
// --------------------------------------------------

const EXIT_REASON_OPTIONS = [
  {
    value: "ABSENCE_OVER_3_DAYS",
    label: "ขาดงานเกิน 3 วัน (ต้องตรวจสอบข้อเท็จจริง)",
  },
  {
    value: "OTHER",
    label: "เหตุผลอื่น / ข้อยกเว้นที่ HR ตรวจสอบแล้ว",
  },
];

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function EmployeeStatusChangeModal({
  employee,
  statuses = [],
  onCancel,
  onSave,
}) {
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  const [busy, setBusy] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [policyError, setPolicyError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // ------------------------------------------------
  // Watch Form Values
  // ------------------------------------------------

  const chosenId = Form.useWatch("new_status_id", form);
  const reasonCode = Form.useWatch("exit_reason_code", form);

  const selectedStatus = statuses.find(
    (status) => status.id === chosenId
  )?.status_code;

  const isNotice = selectedStatus === "NOTICE";
  const isCancelResignation = employee?.status_code === "NOTICE" && selectedStatus === "ACTIVE";

  const directDismissed =
    selectedStatus === "DISMISSED" &&
    ["ACTIVE", "PROBATION", "NOTICE", "SUSPENDED"].includes(employee?.status_code);
  const directResigned =
    selectedStatus === "RESIGNED" &&
    ["ACTIVE", "PROBATION"].includes(employee?.status_code);

  const requiredDays = Number(
    policy?.notice_required_days || 0
  );

  const levelCode = policy?.level_code || "";

  // ------------------------------------------------
  // Allowed Status Options
  // ------------------------------------------------

  const allowedTransitions =
    TRANSITIONS[employee?.status_code] || [];

  const options = statuses
    .filter(
      (status) =>
        status.status === "active" &&
        allowedTransitions.includes(status.status_code)
    )
    .map((status) => ({
      label: status.status_name,
      value: status.id,
    }));

  // ------------------------------------------------
  // Initialize Form
  // ------------------------------------------------

  useEffect(() => {
    if (!employee) {
      return;
    }

    form.setFieldsValue({
      new_status_id: undefined,
      effective_date: dayjs(),
      last_working_day: employee.resignation_date
        ? dayjs(employee.resignation_date)
        : null,
      reason: "",
      exit_reason_code: undefined,
      confirm_direct_exit: false,
    });
  }, [employee, form]);

  // ------------------------------------------------
  // Load Notice Period Policy
  // ------------------------------------------------

  useEffect(() => {
    if (!employee?.id) {
      setPolicy(null);
      setPolicyError("");
      return;
    }

    let cancelled = false;

    setPolicy(null);
    setPolicyError("");

    const loadPolicy = async () => {
      try {
        const response = await fetch(
          `/api/admin/employee-movements/change-status?employee_id=${encodeURIComponent(
            employee.id
          )}`,
          {
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "โหลดระดับ P ไม่สำเร็จ"
          );
        }

        if (!cancelled) {
          setPolicy(data.data);
        }
      } catch (error) {
        if (!cancelled) {
          setPolicyError(
            error?.message || "ไม่สามารถโหลดข้อมูลได้"
          );
        }
      }
    };

    loadPolicy();

    return () => {
      cancelled = true;
    };
  }, [employee?.id]);

  useEffect(() => {
    setHistoryOpen(false);
    setHistory([]);
    setHistoryError("");
  }, [employee?.id]);

  const loadHistory = async () => {
    if (!employee?.id) return;
    if (historyOpen) { setHistoryOpen(false); return; }
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await fetch(
        `/api/admin/employee-movements/status-history?employee_id=${encodeURIComponent(employee.id)}`,
        { credentials: "same-origin", cache: "no-store" }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ไม่สามารถโหลดประวัติได้");
      setHistory(result.data || []);
    } catch (error) { setHistoryError(error?.message || "ไม่สามารถโหลดประวัติได้"); }
    finally { setHistoryLoading(false); }
  };

  // ------------------------------------------------
  // Validate Last Working Day
  // ------------------------------------------------

  const validateLastWorkingDay = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    if (!requiredDays) {
      return Promise.reject(
        new Error(
          "ไม่พบระดับ P2–P10 กรุณาตรวจสอบข้อมูลตำแหน่ง"
        )
      );
    }

    const minimumLastWorkingDay = dayjs()
      .startOf("day")
      .add(requiredDays, "day");

    if (value.isBefore(minimumLastWorkingDay, "day")) {
      return Promise.reject(
        new Error(
          `ต้องแจ้งล่วงหน้าอย่างน้อย ${requiredDays} วัน`
        )
      );
    }

    return Promise.resolve();
  };

  // ------------------------------------------------
  // Save Employee Status
  // ------------------------------------------------

  const save = async () => {
    if (busy) {
      return;
    }

    try {
      const values = await form.validateFields();

      setBusy(true);

      const effectiveDate =
        values.effective_date.format("YYYY-MM-DD");

      let lastWorkingDay = null;

      if (isNotice) {
        lastWorkingDay =
          values.last_working_day.format("YYYY-MM-DD");
      } else if (directResigned) {
        lastWorkingDay = effectiveDate;
      }

      const payload = {
        new_status_id: values.new_status_id,
        effective_date: effectiveDate,
        last_working_day: lastWorkingDay,
        reason: values.reason.trim(),
        exit_reason_code: directDismissed
          ? values.exit_reason_code
          : null,
        confirm_direct_exit: directDismissed
          ? values.confirm_direct_exit === true
          : false,
      };

      await onSave(payload);
    } catch (error) {
      // Ant Design Form validation errors
      if (error?.errorFields) {
        return;
      }

      modal.error({
        title: "บันทึกไม่สำเร็จ",
        content:
          error?.message || "กรุณาตรวจสอบข้อมูล",
      });
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <>
      {contextHolder}

      <Modal
        title="เปลี่ยนสถานะการทำงาน"
        open={!!employee}
        onCancel={onCancel}
        onOk={save}
        okText="ยืนยันเปลี่ยนสถานะ"
        cancelText="ยกเลิก"
        okButtonProps={{
          disabled: options.length === 0 || busy,
          loading: busy,
        }}
        destroyOnHidden
      >
        {employee && (
          <>
            {/* Employee Information */}

            <Typography.Text strong>
              {[
                employee.first_name_th,
                employee.last_name_th,
              ]
                .filter(Boolean)
                .join(" ")}{" "}
              ({employee.employee_code})
            </Typography.Text>

            <div style={{ margin: "10px 0" }}>
              สถานะปัจจุบัน:{" "}
              <Typography.Text strong>
                {employee.status_name ||
                  employee.status_code ||
                  "-"}
              </Typography.Text>
            </div>

            {/* No Available Status Transitions */}

            {options.length === 0 && (
              <Alert
                type="warning"
                showIcon
                title="สถานะนี้ไม่มีเส้นทางเปลี่ยนสถานะที่อนุญาต"
                style={{ marginBottom: 12 }}
              />
            )}

            {/* Employee Status Form */}

            <Form form={form} layout="vertical">
              {/* New Status */}

              <Form.Item
                name="new_status_id"
                label="สถานะใหม่"
                rules={[
                  {
                    required: true,
                    message: "เลือกสถานะใหม่",
                  },
                ]}
              >
                <Select
                  placeholder="เลือกจาก Employee Status Master"
                  options={options}
                />
              </Form.Item>

              {/* Effective Date */}

              <Form.Item
                name="effective_date"
                label="วันที่มีผล"
                rules={[
                  {
                    required: true,
                    message: "ระบุวันที่มีผล",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabledDate={(date) =>
                    date &&
                    !date.isSame(dayjs(), "day")
                  }
                />
              </Form.Item>

              {/* Notice Period */}

              {isNotice && (
                <>
                  {policyError && (
                    <Alert
                      type="error"
                      showIcon
                      style={{ marginBottom: 12 }}
                      title={policyError}
                    />
                  )}

                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    title={
                      requiredDays
                        ? `ระดับ ${
                            levelCode || "-"
                          } ต้องแจ้งล่วงหน้า ${requiredDays} วัน (วันปฏิทิน)`
                        : "ต้องมีระดับ P2–P10 เพื่อคำนวณระยะเวลาแจ้งล่วงหน้า"
                    }
                  />

                  <Form.Item
                    name="last_working_day"
                    label="วันทำงานวันสุดท้าย (Last Working Day)"
                    rules={[
                      {
                        required: true,
                        message:
                          "กรุณาระบุ Last Working Day",
                      },
                      {
                        validator: validateLastWorkingDay,
                      },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      disabledDate={(date) =>
                        date &&
                        date.isBefore(
                          dayjs().startOf("day"),
                          "day"
                        )
                      }
                    />
                  </Form.Item>
                </>
              )}

              {isCancelResignation && (
                <Alert type="success" showIcon style={{ marginBottom: 12 }}
                  title="ยกเลิกการลาออก"
                  description="เมื่อยืนยัน ระบบจะคืนสถานะเป็นพนักงานปัจจุบันและล้างวันทำงานสุดท้าย เพื่อไม่ให้เปลี่ยนเป็นลาออกอัตโนมัติ กรุณาระบุเหตุผลด้านล่าง" />
              )}

              {/* Disciplinary Dismissal */}

              {directDismissed && (
                <>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    title="พ้นสภาพการเป็นพนักงาน (DISMISSED)"
                    description="สำหรับกรณีบริษัทมีคำสั่งให้ออกเนื่องจากความผิดร้ายแรงที่ผ่านการตรวจสอบแล้ว ต้องระบุเหตุผลและยืนยันการตรวจสอบก่อนบันทึก"
                  />

                  <Form.Item
                    name="exit_reason_code"
                    label="เหตุผลการพ้นสภาพจากความผิดร้ายแรง"
                    rules={[
                      {
                        required: true,
                        message: "กรุณาเลือกเหตุผล",
                      },
                    ]}
                  >
                    <Select
                      options={EXIT_REASON_OPTIONS}
                    />
                  </Form.Item>

                  {/* Absence Warning */}

                  {reasonCode ===
                    "ABSENCE_OVER_3_DAYS" && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 12 }}
                      title="ข้อควรระวัง: ต้องตรวจสอบข้อเท็จจริงและดำเนินการตามระเบียบก่อนให้ออก"
                    />
                  )}

                  {/* HR Confirmation */}

                  <Form.Item
                    name="confirm_direct_exit"
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value === true
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error(
                                  "กรุณายืนยันว่าตรวจสอบเหตุผลและอำนาจดำเนินการแล้ว"
                                )
                              ),
                      },
                    ]}
                  >
                    <Checkbox>
                      HR ยืนยันว่าตรวจสอบเหตุผล เอกสาร
                      และอำนาจอนุมัติก่อนพ้นสภาพแล้ว
                    </Checkbox>
                  </Form.Item>
                </>
              )}

              {/* Change Reason */}

              <Form.Item
                name="reason"
                label="เหตุผลการเปลี่ยนสถานะ"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "ระบุเหตุผล",
                  },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Form>

            <div style={{ margin: "16px 0" }}>
              <Button onClick={loadHistory}> {historyOpen ? "ซ่อนประวัติการเปลี่ยนสถานะ" : "ดูประวัติการเปลี่ยนสถานะ"} </Button>
              {historyOpen && (
                <div style={{ marginTop: 12, maxHeight: 260, overflowY: "auto" }}>
                  <Spin spinning={historyLoading} />
                  {historyError && <Alert type="error" showIcon title={historyError} />}
                  {!historyLoading && !historyError && history.length === 0 && <Typography.Text type="secondary">ยังไม่มีประวัติ</Typography.Text>}
                  <Timeline style={{ marginTop: 12 }} items={history.map(item => ({
                    content: <div key={item.id}>
                      <Typography.Text strong>{item.old_status_name} → {item.new_status_name}</Typography.Text>
                      <div>{item.change_source === "SYSTEM" ? "ระบบอัตโนมัติ" : `HR: ${item.actor_display_name || item.actor_username || "ไม่พบชื่อผู้ดำเนินการ"}${item.actor_username && item.actor_display_name && item.actor_display_name !== item.actor_username ? ` (${item.actor_username})` : ""}`}</div>
                      <div>บันทึก: {new Date(item.changed_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</div>
                      <div>วันที่มีผล: {item.effective_date || "-"}</div>
                      <div>เหตุผล: {item.reason || "-"}</div>
                    </div>
                  }))} />
                </div>
              )}
            </div>

            {/* Additional Information */}

            <Typography.Text type="secondary">
              การบันทึกอัปเดต Employee Master
              และประวัติ
              โดยไม่ปิดงานรายงานหรือบัญชีผู้ใช้โดยอัตโนมัติ
            </Typography.Text>
          </>
        )}
      </Modal>
    </>
  );
}
