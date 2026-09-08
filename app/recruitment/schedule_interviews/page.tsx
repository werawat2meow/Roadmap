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
  Upload,
  UploadFile, 
  UploadProps,
  Input, // เพิ่ม
} from "antd";

import dayjs, { Dayjs } from "dayjs";
import AntIcon from '@/components/AntIcon';
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const { Title, Text } = Typography;

interface RecruitJobInterview {
  id: string;
  interview_datetime: string;
  interview_order?: number;
  interview_type?: string;
  status?: number;
  reviewer?: string | null;
}

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  titles?: {
    title_name_th: string;
  } | null;
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
  5: { label: "ยืนยันการสัมภาษณ์", color: "green" },
  6: { label: "เลื่อนการสัมภาษณ์", color: "volcano" },
  7: { label: "ขาดการสัมภาษณ์", color: "volcano" },
  8: { label: "ส่งต่อการสัมภาษณ์", color: "green" },
  9: { label: "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน", color: "volcano" },
  10: { label: "ผ่านการสัมภาษณ์", color: "volcano" },
  11: { label: "ไม่ผ่านการสัมภาษณ์", color: "volcano" },
  19: { label: "รอพิจารณาอีกครั้ง", color: "volcano" },
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
  const [selectedInterviewer, setSelectedInterviewer] =  useState<string | undefined>();
  const [loadingInterviewer, setLoadingInterviewer] = useState(false);

  const [interviewDateTime, setInterviewDateTime] = useState<Dayjs | null>(null);
  const [remark, setRemark] = useState<string>(""); // เพิ่ม
  const [interviewErrors, setInterviewErrors] = useState<InterviewErrors>({});

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoApplication, setPhotoApplication] =
    useState<Application | null>(null);

  const [photoFile, setPhotoFile] = useState<UploadFile | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const isAll = pageSize === "all";
  const numericPageSize = isAll ? undefined : pageSize;
  const from = isAll ? 0 : (page - 1) * (numericPageSize as number);

  const [exporting, setExporting] = useState(false);
  const [exportingImage, setExportingImage] = useState(false); 

  // โหลดตัวเลือกตำแหน่งงาน (resource=positions) ครั้งเดียวตอน mount
  // ใช้ AbortController กัน request ค้างจากรอบแรกตอน React Strict Mode
  // mount ซ้ำใน dev (mount -> cleanup -> mount)
  useEffect(() => {
    const controller = new AbortController();

    const loadPositions = async () => {
      try {
        const res = await fetch(
          `/recruitment/api/schedule_interviews?resource=positions`,
          { signal: controller.signal }
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
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
      }
    };
    loadPositions();

    return () => controller.abort();
  }, []);

  const loadData = async (targetPage: number, signal?: AbortSignal) => {
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
        `/recruitment/api/schedule_interviews?${params.toString()}`,
        { signal }
      );
      const json = await res.json();

      // API ไม่มี field success, ต้องเช็คจาก error แทน
      if (!json.error) {
        setRows(json.data ?? []);
        setCount(json.count ?? 0);
      } else {
        // console.error(json.error);
        Modal.error({ title: 'เกิดข้อผิดพลาด', content: json.error });
        setRows([]);
        setCount(0);
      }
    } catch (e: any) {
      // request ถูกยกเลิกเพราะ effect ทำงานซ้ำ (เช่น React Strict Mode ตอน dev,
      // หรือ user เปลี่ยน filter เร็วๆ) -> ไม่ต้อง log/แจ้ง error ซ้ำ
      if (e?.name === "AbortError") {
        return;
      }
      console.error(e);
    } finally {
      // ถ้า request นี้ถูก abort ไปแล้ว ไม่ต้องไปยุ่งกับ loading state
      // เพราะ request ที่มาแทน (รอบจริง) จะจัดการ loading ของตัวเองอยู่แล้ว
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", String(statusFilter));
      if (positionId) params.set("position_id", String(positionId));
      if (dateRange) {
        params.set("date_from", dateRange.format("YYYY-MM-DD"));
        params.set("date_to", dateRange.format("YYYY-MM-DD"));
      }

      const res = await fetch(
        `/recruitment/api/schedule_interviews/export?${params.toString()}`
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        Modal.error({
          title: "เกิดข้อผิดพลาด",
          content: json?.error || "ไม่สามารถ export ข้อมูลได้",
        });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schedule_interviews_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Modal.error({ title: "เกิดข้อผิดพลาด", content: "ไม่สามารถ export ข้อมูลได้" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportImage = async () => {
    setExportingImage(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", String(statusFilter));
      if (positionId) params.set("position_id", String(positionId));
      if (dateRange) {
        params.set("date_from", dateRange.format("YYYY-MM-DD"));
        params.set("date_to", dateRange.format("YYYY-MM-DD"));
      }

      const res = await fetch(
        `/recruitment/api/schedule_interviews/export_image?${params.toString()}`
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        Modal.error({
          title: "เกิดข้อผิดพลาด",
          content: json?.error || "ไม่สามารถ export รูปภาพได้",
        });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schedule_interviews_${dayjs().format("YYYYMMDD_HHmm")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      Modal.error({ title: "เกิดข้อผิดพลาด", content: "ไม่สามารถ export รูปภาพได้" });
    } finally {
      setExportingImage(false);
    }
  };

  /**
   * ===== แก้ไขจุดที่ทำให้ API ถูกเรียกซ้ำ / เรียกไม่ตรงจังหวะ =====
   *
   * เดิมมี 2 useEffect แยกกัน:
   *   1) ฟัง [statusFilter, positionId, dateRange, pageSize] -> ถ้า page != 1 จะ setPage(1) แล้ว return
   *      (ไม่เรียก API) ถ้า page == 1 อยู่แล้วจะเรียก loadData(1) ทันที
   *   2) ฟัง [page] -> ถ้า page == 1 จะ return (ไม่เรียก API) ไม่งั้นเรียก loadData(page)
   *
   * ปัญหา:
   *   - ถ้า user แก้ filter ตอนอยู่หน้า 1 พอดี -> effect (1) ยิง loadData(1) ทันที
   *     แต่ effect (1) ไม่ได้ใส่ page ไว้ใน dependency array ทำให้ eslint disable ไว้
   *     และพฤติกรรมขึ้นกับ "ค่า page ปัจจุบัน" ที่ closure จับไว้ ณ ตอนนั้น
   *   - ถ้า user แก้ filter ตอนอยู่หน้าอื่น (เช่นหน้า 3) -> effect (1) แค่ setPage(1) เฉยๆ
   *     ไม่เรียก API เอง แล้วรอ effect (2) จับ page เปลี่ยนแทน แต่ effect (2) เช็ค
   *     "if (page === 1) return" ทำให้ "ไม่เรียก API เลย" กลายเป็นบั๊กเรียกน้อยไป
   *   - ในบาง environment (เช่น React Strict Mode ตอน dev) effect ที่ยิง fetch ตรงๆ
   *     ตอน mount จะถูกเรียกซ้ำ 2 รอบโดยตั้งใจของ React ทำให้ยิ่งดูเหมือนเรียกซ้ำ
   *
   * แก้โดยรวมเป็น useEffect เดียว ให้ loadData ผูกกับทุก dependency ที่เกี่ยวข้อง
   * ในที่เดียว และ reset page แยกออกมาอีก effect หนึ่งแบบไม่ยิง fetch เอง
   * เพื่อให้ "มีจุดเดียว" ที่ยิง API ต่อการเปลี่ยนแปลงแต่ละครั้ง
   */

  // เมื่อ filter เปลี่ยน ให้ reset ไปหน้า 1 เสมอ (ไม่ยิง fetch ตรงนี้)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, positionId, dateRange, pageSize]);

  // จุดเดียวที่ยิง API: ทำงานตอน mount, ตอน page เปลี่ยน, และตอน filter เปลี่ยน
  // (ถ้า filter เปลี่ยนตอน page ยังเป็น 1 อยู่แล้ว setPage(1) จะไม่ trigger re-render
  //  ซ้ำ แต่ effect นี้จะยิงจาก dependency ของ filter ที่เปลี่ยนแทน -> ยิงแค่ครั้งเดียว)
  //
  // ใช้ AbortController ยกเลิก request ค้างทุกครั้งที่ effect ทำงานใหม่ก่อนที่จะ
  // fetch รอบใหม่ ทั้งกรณี dependency เปลี่ยนเร็วๆ ในโค้ดจริง และกรณี React Strict
  // Mode สั่ง mount effect 2 รอบตอน dev (mount -> cleanup(abort) -> mount)
  // ผลคือมีแค่ request ล่าสุดเท่านั้นที่ resolve ได้จริง -> Modal.error ไม่ขึ้นซ้ำ
  useEffect(() => {
    const controller = new AbortController();
    loadData(page, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, positionId, dateRange, pageSize]);

  // ===== เปิด modal อัพเดตข้อมูล (รวมลำดับสัมภาษณ์ + สถานะ) =====
  const openUpdateModal = async (record: Application) => {
    setSelectedApplication(record);
    setSelectedStatus(record.status);
    setInterviewErrors({});
    setRemark("");

    // ดึง interview ล่าสุด
    const latest = getLatestInterview(record.recruit_job_interviews);

    // วันที่สัมภาษณ์
    setInterviewDateTime(
      latest ? dayjs(latest.interview_datetime) : null
    );

    // ผู้สัมภาษณ์เดิม
    setSelectedInterviewer(
      latest?.reviewer != null
        ? String(latest.reviewer)
        : undefined
    );

    // logic เดิม...
    if (latest) {
      try {
        const res = await fetch(
          `/recruitment/api/schedule_interviews/latest_order?datetime=${encodeURIComponent(
            latest.interview_datetime
          )}`
        );

        const json = await res.json();

        setSortOrder(json.latest_order ?? 0);
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

    // if (selectedStatus === 5 && !selectedInterviewer) {
    //   message.warning("กรุณาเลือกผู้สัมภาษณ์");
    //   return;
    // }

    // ต้องกรอกวันเวลานัด เมื่อ status = 6 (เลื่อนสัมภาษณ์)
    if (selectedStatus === 6 && !interviewDateTime) {
      setInterviewErrors((prev) => ({
        ...prev,
        interviewDateTime: "กรุณาเลือกวันและเวลานัดสัมภาษณ์",
      }));
      return;
    }

    // ต้องกรอกเหตุผล เมื่อ status = 6 (เลื่อน), 7 (ขาดสัมภาษณ์), 11 (ไม่ผ่าน)
    if ([6, 7, 11].includes(selectedStatus as number) && !remark.trim()) {
      setInterviewErrors((prev) => ({
        ...prev,
        remark: "กรุณาระบุเหตุผล",
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
            remark: remark, // เพิ่ม
          }),
        }
      );

      const json = await res.json();

      if (!json.error) {
        Modal.success({ title: '', content: "อัพเดตข้อมูลเรียบร้อย" });

        setUpdateModalOpen(false);

        setSelectedApplication(null);
        setSelectedStatus(undefined);
        setSelectedInterviewer(undefined);
        setInterviewDateTime(null);
        setRemark(""); // เพิ่ม

        await loadData(page);
      } else {
        Modal.error({ title: 'เกิดข้อผิดพลาด', content: json.error });
      }
    } catch (err) {
      console.error(err);
      Modal.error({ title: 'เกิดข้อผิดพลาด', content: err });
    } finally {
      setSavingUpdate(false);
    }
  };

  const openPhotoModal = (record: Application) => {
    if (record.status !== 5) {
      message.warning("สามารถอัปเดตรูปได้เฉพาะผู้สมัครที่มีสถานะ 5 เท่านั้น");
      return;
    }

    setPhotoApplication(record);
    setPhotoFile(null);
    setPhotoModalOpen(true);
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
          `${record.titles?.title_name_th ?? ""} ${record.first_name} ${record.last_name}`,
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

            {canEdit && record.status === 5 && (
              <Button
                type="primary"
                icon={<AntIcon name="UploadOutlined" />}
                onClick={() => openPhotoModal(record)}
              >
                อัปเดตรูปผู้สมัคร
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
      const res = await fetch("/recruitment/api/schedule_interviews/getInterviewer");
      const json = await res.json();
      setInterviewerOptions(json.data);
    } catch (err) {
      setLoadingInterviewer(false);
      console.error(err);
      message.error("เกิดข้อผิดพลาด");
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

  const saveApplicantPhoto = async () => {
    if (!photoApplication) return;

    if (!photoFile?.originFileObj) {
      message.warning("กรุณาเลือกรูปผู้สมัคร");
      return;
    }

    setSavingPhoto(true);

    try {
      const formData = new FormData();

      formData.append(
        "application_id",
        String(photoApplication.id)
      );

      formData.append(
        "file",
        photoFile.originFileObj
      );

      const res = await fetch(
        "/recruitment/api/schedule_interviews/update_candidate_photo",
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok || json.error) {
        message.error(json.error || "ไม่สามารถอัปโหลดรูปได้");
        return;
      }

      message.success("อัปเดตรูปผู้สมัครเรียบร้อย");

      setPhotoModalOpen(false);
      setPhotoApplication(null);
      setPhotoFile(null);

      await loadData(page);
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการอัปโหลดรูป");
    } finally {
      setSavingPhoto(false);
    }
  };

  const photoUploadProps: UploadProps = {
    maxCount: 1,
    accept: "image/png,image/jpeg",
    beforeUpload: (file) => {
      const isImage =
        file.type === "image/png" ||
        file.type === "image/jpeg";

      if (!isImage) {
        message.error("สามารถอัปโหลดได้เฉพาะ JPG หรือ PNG เท่านั้น");
        return Upload.LIST_IGNORE;
      }

      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isLt2M) {
        message.error("รูปภาพต้องมีขนาดไม่เกิน 2MB");
        return Upload.LIST_IGNORE;
      }

      setPhotoFile({
        uid: file.uid,
        name: file.name,
        status: "done",
        originFileObj: file,
      });

      return false;
    },
    onRemove: () => {
      setPhotoFile(null);
    },
  };

  if (isChecking || loading) return <LoadingOrb />;
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
                <Button
                  icon={<AntIcon name="FileExcelOutlined" />}
                  loading={exporting}
                  onClick={handleExportExcel}
                >
                  Export Excel
                </Button>

                <Button
                  icon={<AntIcon name="FileImageOutlined" />}
                  loading={exportingImage}
                  onClick={handleExportImage}
                >
                  Export Image
                </Button>

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
                suffixIcon={ <AntIcon name="SearchOutlined" style={{ color: "#94a3b8" }} />}
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
                ผู้สัมภาษณ์
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

          {/* เพิ่มใหม่: ช่องกรอกเหตุผล เมื่อ status = 6, 7, 11 */}
          {[6, 7, 11].includes(selectedStatus as number) && (
            <div>
              <div style={{ marginBottom: 6 }}>
                <Text strong>เหตุผล</Text>
              </div>

              <Input.TextArea
                rows={3}
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value);
                  setInterviewErrors((prev) => ({
                    ...prev,
                    remark: undefined,
                  }));
                }}
                status={interviewErrors.remark ? "error" : undefined}
                placeholder="กรุณาระบุเหตุผล"
              />

              {interviewErrors.remark && (
                <div>
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {interviewErrors.remark}
                  </Text>
                </div>
              )}
            </div>
          )}
        </Space>
      </Modal>

      <Modal
        title="อัปเดตรูปผู้สมัคร"
        open={photoModalOpen}
        onCancel={() => {
          if (!savingPhoto) {
            setPhotoModalOpen(false);
            setPhotoApplication(null);
            setPhotoFile(null);
          }
        }}
        onOk={saveApplicantPhoto}
        okText="บันทึก"
        cancelText="ยกเลิก"
        confirmLoading={savingPhoto}
        closable={!savingPhoto}
        mask={{ closable: !savingPhoto }}
      >
        <Space
          orientation="vertical"
          style={{ width: "100%" }}
          size="middle"
        >
          {photoApplication && (
            <div>
              <Text strong>ผู้สมัคร: </Text>
              <Text>
                {photoApplication.first_name}{" "}
                {photoApplication.last_name}
              </Text>
            </div>
          )}

          <div>
            <Text strong>รูปผู้สมัคร</Text>

            <div style={{ marginTop: 8 }}>
              <Upload {...photoUploadProps}>
                <Button icon={<AntIcon name="UploadOutlined" />}>
                  เลือกรูปภาพ
                </Button>
              </Upload>
            </div>

            <Text
              type="secondary"
              style={{
                display: "block",
                marginTop: 8,
                fontSize: 12,
              }}
            >
              รองรับ JPG, PNG และขนาดไม่เกิน 2MB
            </Text>
          </div>
        </Space>
      </Modal>
    </>
  );
}