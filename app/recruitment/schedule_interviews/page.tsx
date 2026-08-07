// page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  App,
  Table,
  Button,
  Typography,
  Space,
  DatePicker,
  Select,
  Tag,
  Modal,
  InputNumber,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { SearchOutlined } from "@ant-design/icons";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const { Title, Text } = Typography;

interface RecruitJobInterview {
  id: string;
  interview_datetime: string;
  interview_order?: number;
  interview_type?: string;
  status?: number;
}

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  created_at: string;
  status: number;
  position_id: number;
  positions: {
    position_name: string;
  } | null;

  recruit_job_interviews?: RecruitJobInterview[];
}

interface PositionOption {
  value: number;
  label: string;
}

interface InterviewerOption {
  value: string;
  label: string;
}

interface InterviewErrors {
  interviewDateTime?: string;
  interviewer?: string;
  remark?: string;
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  4: { label: "นัดสัมภาษณ์", color: "green" },
  5: { label: "ยืนยันการสัมภาษณ์", color: "green" },
  6: { label: "เลื่อนการสัมภาษณ์", color: "volcano" },
  7: { label: "ขาดการสัมภาษณ์", color: "volcano" },
  8: { label: "ส่งต่อการสัมภาษณ์", color: "green" },
  9: { label: "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน", color: "volcano" },
  10: { label: "ผ่านการคัดเลือก", color: "volcano" },
  11: { label: "ไม่ผ่านการคัดเลือก", color: "volcano" },
  12: { label: "นัดวันเริ่มทำงาน", color: "volcano" },
};

const pageSizeOptions: { value: number | "all"; label: string }[] = [
  { value: 10, label: "10 rows" },
  { value: 20, label: "20 rows" },
  { value: 30, label: "30 rows" },
  { value: 40, label: "40 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
  { value: "all", label: "แสดงทั้งหมด" },
];

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, v]) => ({
  value: Number(value),
  label: v.label,
}));

function StatusTag({ value }: { value: number }) {
  const meta = STATUS_MAP[value] ?? {
    label: value != null ? String(value) : "-",
    color: "default",
  };
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

// Helper: get the most recent interview from a list (sorted by date desc)
function getLatestInterview(
  interviews?: RecruitJobInterview[]
): RecruitJobInterview | null {
  if (!interviews?.length) return null;
  return [...interviews].sort(
    (a, b) =>
      new Date(b.interview_datetime).getTime() -
      new Date(a.interview_datetime).getTime()
  )[0];
}

export default function RecruitmentApplicationsPage() {

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.schedule.interviews",
    unauthorizedRedirect: "/recruitment",
  });

  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Application[]>([]);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    undefined
  );
  const [positionId, setPositionId] = useState<number | undefined>(undefined);
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>(
    []
  );
  const [dateRange, setDateRange] = useState<Dayjs | null>(null);
  const [count, setCount] = useState(0);

  // ===== รวม modal ทั้งหมด (ลำดับสัมภาษณ์ + สถานะ) เป็น modal เดียว =====
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [sortOrder, setSortOrder] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<number>();
  const [savingUpdate, setSavingUpdate] = useState(false);

  const [interviewerOptions, setInterviewerOptions] = useState<InterviewerOption[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<number>();
  const [loadingInterviewer, setLoadingInterviewer] = useState(false);

  const [interviewDateTime, setInterviewDateTime] = useState<Dayjs | null>(null);
  const [interviewErrors, setInterviewErrors] = useState<InterviewErrors>({});

  const isAll = pageSize === "all";
  const numericPageSize = isAll ? undefined : pageSize;
  const from = isAll ? 0 : (page - 1) * (numericPageSize as number);

  // โหลดตัวเลือกตำแหน่งงาน (resource=positions) ครั้งเดียวตอน mount
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const res = await fetch(
          `/recruitment/api/schedule_interviews?resource=positions`
        );
        const json = await res.json();
        if (!json.error) {
          setPositionOptions(
            (json.data ?? []).map(
              (p: { id: number; position_name: string }) => ({
                value: p.id,
                label: p.position_name,
              })
            )
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadPositions();
  }, []);

  const loadData = async (targetPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("pageSize", String(pageSize));

      if (statusFilter) {
        params.set("status", String(statusFilter));
      }
      if (positionId) {
        params.set("position_id", String(positionId));
      }
      if (dateRange) {
        // ชื่อ param ต้องตรงกับ API: date_from / date_to
        params.set("date_from", dateRange.format("YYYY-MM-DD"));
        params.set("date_to", dateRange.format("YYYY-MM-DD"));
      }

      const res = await fetch(
        `/recruitment/api/schedule_interviews?${params.toString()}`
      );
      const json = await res.json();

      // API ไม่มี field success, ต้องเช็คจาก error แทน
      if (!json.error) {
        setRows(json.data ?? []);
        setCount(json.count ?? 0);
      } else {
        console.error(json.error);
        setRows([]);
        setCount(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // เวลาเปลี่ยน filter ให้ reset ไปหน้า 1 แล้วค่อยยิง fetch ครั้งเดียว
  // (ป้องกันการยิง loadData ซ้ำซ้อนตอน mount / ตอนเปลี่ยน filter)
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, positionId, dateRange, pageSize]);

  useEffect(() => {
    if (page === 1) return; // already handled by the filter effect above
    loadData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ===== เปิด modal อัพเดตข้อมูล (รวมลำดับสัมภาษณ์ + สถานะ) =====
  const openUpdateModal = async (record: Application) => {
    setSelectedApplication(record);
    setSelectedStatus(record.status);
    setSelectedInterviewer(undefined);
    setInterviewErrors({});

    // ดึง interviewDateTime ล่าสุดของแถวนี้มา prefill (recruit_job_interviews.interview_datetime)
    const latest = getLatestInterview(record.recruit_job_interviews);
    setInterviewDateTime(latest ? dayjs(latest.interview_datetime) : null);

    // logic เดิมจาก openOrderModal: คำนวณลำดับสัมภาษณ์ถัดไปจาก latest_order API
    if (latest) {
      try {
        const res = await fetch(
          `/recruitment/api/schedule_interviews/latest_order?datetime=${encodeURIComponent(
            latest.interview_datetime
          )}`
        );
        const json = await res.json();
        setSortOrder((json.latest_order ?? 0) + 1);
      } catch (err) {
        console.error(err);
        setSortOrder(latest.interview_order ?? 1);
      }
    } else {
      setSortOrder(1);
    }

    setUpdateModalOpen(true);
  };

  // ===== บันทึกข้อมูล (ลำดับสัมภาษณ์ + สถานะ) ด้วย API เดียว =====
  const saveUpdate = async () => {
    if (!selectedApplication || savingUpdate) return;

    if (selectedStatus === 5 && !selectedInterviewer) {
      message.warning("กรุณาเลือกผู้สัมภาษณ์");
      return;
    }

    if (selectedStatus === 6 && !interviewDateTime) {
      setInterviewErrors((prev) => ({
        ...prev,
        interviewDateTime: "กรุณาเลือกวันและเวลานัดสัมภาษณ์",
      }));
      return;
    }

    setSavingUpdate(true);

    try {
      const res = await fetch(
        "/recruitment/api/schedule_interviews/update_status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: selectedApplication.id,
            status: selectedStatus,
            interviewer_id: selectedInterviewer,
            interview_datetime: interviewDateTime,
            sort_order: sortOrder,
          }),
        }
      );

      const json = await res.json();

      if (!json.error) {
        message.success("อัพเดตข้อมูลเรียบร้อย");

        // ปิด Modal อัตโนมัติ
        setUpdateModalOpen(false);

        // Reset ค่า
        setSelectedApplication(null);
        setSelectedStatus(undefined);
        setSelectedInterviewer(undefined);
        setInterviewDateTime(null);

        // Reload ข้อมูล
        await loadData(page);
      } else {
        message.error(json.error);
      }
    } catch (err) {
      console.error(err);
      message.error("เกิดข้อผิดพลาด");
    } finally {
      setSavingUpdate(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "No.",
        key: "no",
        width: 60,
        render: (_: unknown, __: Application, index: number) => (
          <Text strong>{from + index + 1}</Text>
        ),
      },
      {
        title: "Position",
        dataIndex: ["positions", "position_name"],
        key: "position_name",
        render: (value: string) => value || "-",
      },
      {
        title: "Name",
        key: "first_name",
        render: (_: unknown, record: Application) =>
          `${record.first_name} ${record.last_name}`,
      },
      {
        title: "Interview Date",
        dataIndex: "recruit_job_interviews",
        key: "interview_datetime",
        width: 170,
        render: (interviews: RecruitJobInterview[]) => {
          const latest = getLatestInterview(interviews);
          if (!latest) return "-";
          return dayjs(latest.interview_datetime).format("DD/MM/YYYY HH:mm");
        },
      },
      {
        title: "Number of interview",
        dataIndex: "recruit_job_interviews",
        key: "interview_order",
        render: (interviews: RecruitJobInterview[]) => {
          const latest = getLatestInterview(interviews);
          return latest?.interview_order ?? "0";
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 180,
        render: (value: number) => <StatusTag value={value} />,
      },
      {
        title: "Action",
        key: "action",
        width: 120,
        render: (_: unknown, record: Application) => (
          <Space>
            {canView && (
              <Link href={`/recruitment/schedule_interviews/${record.id}`}>
                <Button type="primary">View</Button>
              </Link>
            )}

            {canEdit && (
              <Button type="primary" ghost onClick={() => openUpdateModal(record)}>
                อัพเดตข้อมูล
              </Button>
            )}
          </Space>
        ),
      },
    ],
    // canEdit / canView are included so the Action column re-renders once
    // permissions finish loading from usePageGuard
    [from, canEdit, canView]
  );

  const loadInterviewers = async () => {
    setLoadingInterviewer(true);

    try {
      // ===== Future =====
      // const res = await fetch("/recruitment/api/schedule_interviews/getInterviewer");
      // const json = await res.json();
      // setInterviewerOptions(json.data);

      // ===== Mock Data =====
      setInterviewerOptions([
        { value: "5345373a-dd77-4173-84a9-d8aca3f15047", label: "คุณม่อน" },
        { value: "1", label: "คุณกุ้งนาง" },
        { value: "2", label: "Mr. John" },
      ]);
    } finally {
      setLoadingInterviewer(false);
    }
  };

  useEffect(() => {
    if (selectedStatus === 5) {
      loadInterviewers();
    } else {
      setSelectedInterviewer(undefined);
    }
  }, [selectedStatus]);

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <>
      <div className="h-full w-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Schedule Interviews
              </h1>
              <p className="mt-2 text-slate-500">รายการรอสัมภาษณ์</p>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 w-full">
          <div
            style={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Applications
                </Title>
              </div>
              <Space wrap>
                <Space size="small">
                  <Text style={{ fontSize: 13, color: "#475569" }}>
                    แสดง
                  </Text>
                  <Select
                    value={pageSize}
                    onChange={(val) => setPageSize(val)}
                    style={{ width: 130 }}
                    options={pageSizeOptions}
                  />
                </Space>
              </Space>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                padding: "12px 20px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <Select
                allowClear
                placeholder="สถานะรายการ"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 200 }}
                options={STATUS_OPTIONS}
                suffixIcon={<SearchOutlined style={{ color: "#94a3b8" }} />}
              />
              <Select
                allowClear
                showSearch
                placeholder="ตำแหน่งงาน (Position)"
                value={positionId}
                onChange={(val) => setPositionId(val)}
                style={{ width: 240 }}
                options={positionOptions}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />

              <DatePicker
                placeholder="วันที่เข้าสัมภาษณ์"
                value={dateRange}
                onChange={(val) => setDateRange(val)}
                style={{ width: 280 }}
              />
            </div>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={rows}
              loading={loading}
              pagination={
                isAll
                  ? false
                  : {
                      current: page,
                      pageSize: numericPageSize,
                      total: count,
                      onChange: (p) => setPage(p),
                      showTotal: (total, [start, end]) =>
                        `${start} - ${end} จาก ${total} รายการ`,
                      showSizeChanger: false,
                      style: { padding: "12px 20px" },
                    }
              }
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "ไม่พบข้อมูล" }}
              style={{ margin: 0 }}
            />
          </div>
        </div>
      </div>

      {/* ===== Modal เดียว: รวมอัพเดตลำดับสัมภาษณ์ + สถานะ ===== */}
      <Modal
        title="อัพเดตข้อมูลการสัมภาษณ์"
        open={updateModalOpen}
        onCancel={() => !savingUpdate && setUpdateModalOpen(false)}
        onOk={saveUpdate}
        okText="บันทึก"
        cancelText="ยกเลิก"
        confirmLoading={savingUpdate}
        closable={!savingUpdate}
        mask={{ closable: !savingUpdate }}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <div style={{ marginBottom: 6 }}>ลำดับสัมภาษณ์</div>

            <InputNumber
              min={1}
              value={sortOrder}
              onChange={(v) => setSortOrder(v ?? 1)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ marginBottom: 6 }}>สถานะ</div>

            <Select
              style={{ width: "100%" }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={STATUS_OPTIONS}
            />
          </div>

          {selectedStatus === 5 && (
            <div>
              <div style={{ marginBottom: 6 }}>
                ผู้สัมภาษณ์ <span style={{ color: "red" }}>*</span>
              </div>

              <Select
                showSearch
                allowClear
                placeholder="เลือกผู้สัมภาษณ์"
                loading={loadingInterviewer}
                value={selectedInterviewer}
                onChange={setSelectedInterviewer}
                options={interviewerOptions}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>
          )}

          {selectedStatus === 6 && (
            <div>
              <div>
                <Text strong>วันเวลานัดสัมภาษณ์</Text>
              </div>

              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                value={interviewDateTime}
                onChange={(value: Dayjs | null) => {
                  setInterviewDateTime(value);
                  setInterviewErrors((prev) => ({
                    ...prev,
                    interviewDateTime: undefined,
                  }));
                }}
                status={interviewErrors.interviewDateTime ? "error" : undefined}
                placeholder="เลือกวันและเวลา"
                className="w-full mt-1"
              />

              {interviewErrors.interviewDateTime && (
                <div>
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {interviewErrors.interviewDateTime}
                  </Text>
                </div>
              )}
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
}