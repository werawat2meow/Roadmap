"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import CandidateDetail from "@/app/recruitment/components/CandidateDetail";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import {
  Button,
  Card,
  Select,
  DatePicker,
  Radio,
  Input,
  Typography,
} from "antd";

const { Text } = Typography;

const APPLICATION_STATUS = [
  { value: 1, label: "รอพิจารณา" },
  { value: 2, label: "HRD ส่งต่อ HRM" },
  { value: 3, label: "ผ่านการคัดเลือกเข้าสัมภาษณ์" },
  { value: 4, label: "นัดสัมภาษณ์" },
  { value: 5, label: "ยืนยันการสัมภาษณ์" },
  { value: 6, label: "เลื่อนการสัมภาษณ์" },
  { value: 7, label: "ขาดการสัมภาษณ์" },
  { value: 8, label: "ส่งต่อการสัมภาษณ์" },
  { value: 9, label: "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน" },
  { value: 16, label: "ยื่น Resume" },
  { value: 99, label: "backlist" },
  { value: 0, label: "ยกเลิก" },
];

// status ที่ต้องกรอกวันเวลานัดสัมภาษณ์ + ประเภทการสัมภาษณ์
const STATUS_CONFIRMED_INTERVIEW = 4;

const INTERVIEW_TYPE_OPTIONS = [
  { value: "onsite", label: "Onsite (สัมภาษณ์ที่บริษัท)" },
  { value: "online", label: "Online (สัมภาษณ์ผ่านวิดีโอคอล)" },
  { value: "phone", label: "Phone (สัมภาษณ์ทางโทรศัพท์)" },
];

export default function Page({ params }) {
  const router = useRouter();

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.candidate.history",
    unauthorizedRedirect: "/recruitment",
  });

  const { id } = use(params);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState(undefined);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  // ข้อมูลนัดสัมภาษณ์ (แสดงเมื่อ status === STATUS_CONFIRMED_INTERVIEW)
  const [interviewDateTime, setInterviewDateTime] = useState(null);
  const [interviewType, setInterviewType] = useState(undefined);

  const [interviewData, setInterviewData] = useState({
    location: "",
    meeting_url: "",
  });

  const [interviewErrors, setInterviewErrors] = useState({});

  const requiresInterviewDetails = status === STATUS_CONFIRMED_INTERVIEW;

  useEffect(() => {
    if (id) fetchCandidateDetail();
  }, [id]);

  // เมื่อโหลดข้อมูลผู้สมัครสำเร็จ ให้ sync ค่าฟอร์มทั้งหมดจาก data
  useEffect(() => {
    if (!data) return;

    setStatus(data?.application?.status);

    const firstInterview = data?.interviews?.[0];
    setInterviewDateTime(
      firstInterview?.interview_datetime
        ? dayjs(firstInterview.interview_datetime)
        : null
    );
    setInterviewType(firstInterview?.interview_type ?? undefined);
    setInterviewData({
      location: firstInterview?.location ?? "",
      meeting_url: firstInterview?.meeting_url ?? "",
    });
  }, [data]);

  async function fetchCandidateDetail() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/recruitment/api/candidate_detail/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();     

      if (!res.ok) {
        throw new Error(result.message || "Load candidate detail failed");
      }

      setData(result ?? null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isChecking && !canEdit) {
      router.replace("/recruitment/candidate");
    }
  }, [isChecking, canEdit, router]);

  // ยังโหลดอยู่ (ไม่ว่าจะเช็คสิทธิ์หรือโหลดข้อมูล) -> แสดง loading เท่านั้น ห้ามไปต่อ
  if (isChecking || loading) return <LoadingOrb />;
  if (!canEdit) return null;

  // โหลดเสร็จแล้วแต่ไม่มีข้อมูล/error -> หยุดที่นี่ ห้ามไปต่อ
  if (error || !data) {
    return notFound();
  }

  const handleStatusChange = (val) => {
    setStatus(val);
    if (val !== STATUS_CONFIRMED_INTERVIEW) {
      setInterviewErrors({});
    }
  };

  const validateInterviewFields = () => {
    if (!requiresInterviewDetails) return true;

    const errors = {};
    if (!interviewDateTime) {
      errors.interviewDateTime = "กรุณาระบุวันเวลานัดสัมภาษณ์";
    }
    if (!interviewType) {
      errors.interviewType = "กรุณาเลือกประเภทการสัมภาษณ์";
    }
    setInterviewErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStatus = async () => {
    setErrorMessage("");
    setSuccessMessage(null);

    if (!validateInterviewFields()) {
      return;
    }

    try {
      setSaving(true);

      const body = {
        id: data.application.id,
        location: interviewData.location,
        meeting_url: interviewData.meeting_url,
        status,
      };

      if (requiresInterviewDetails) {
        body.interview_datetime = interviewDateTime.toISOString();
        body.interview_type = interviewType;
      }

      const res = await fetch("/recruitment/api/candidate_detail/UpdateStatus", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message);
      }

      setSuccessMessage("บันทึกข้อมูลเรียบร้อย");
      router.push("/recruitment/candidate");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // Layout
  // ============================
  return (
    <div>
      <CandidateDetail
        application={data?.application}
        education={data?.education}
        workExperience={data?.workExperience}
        languageSkills={data?.languageSkills}
        systemProgramSkills={data?.systemProgramSkills}
        documents={data?.documents}
        interviews={data?.interviews?.[0]}
      />

      {APPLICATION_STATUS.some((item) => item.value === status) && (
        <div className="p-6" >
          <Card title="สถานะการสมัคร">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <Select
                  value={status}
                  onChange={handleStatusChange}
                  style={{ width: 250 }}
                  options={APPLICATION_STATUS}
                />
              </div>

              {requiresInterviewDetails && (
                <div className="flex-wrap gap-6 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <div>
                      <Text strong>วันเวลานัดสัมภาษณ์</Text>
                    </div>
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      value={interviewDateTime}
                      onChange={(val) => {
                        setInterviewDateTime(val);
                        setInterviewErrors((prev) => ({
                          ...prev,
                          interviewDateTime: undefined,
                        }));
                      }}
                      status={interviewErrors.interviewDateTime ? "error" : ""}
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

                  <div>
                    <div>
                      <Text strong>ประเภทการสัมภาษณ์</Text>
                    </div>
                    <div className="mt-1">
                      <Radio.Group
                        value={interviewType}
                        onChange={(e) => {
                          const value = e.target.value;
                          setInterviewType(value);
                          setInterviewErrors((prev) => ({
                            ...prev,
                            interviewType: undefined,
                          }));
                          // ถ้าไม่ใช่ Online ให้ล้าง URL
                          if (value !== "online") {
                            setInterviewData((prev) => ({
                              ...prev,
                              meeting_url: "",
                            }));
                          }
                        }}
                        options={INTERVIEW_TYPE_OPTIONS}
                        optionType="button"
                        buttonStyle="solid"
                      />
                    </div>
                    {interviewErrors.interviewType && (
                      <div>
                        <Text type="danger" style={{ fontSize: 12 }}>
                          {interviewErrors.interviewType}
                        </Text>
                      </div>
                    )}
                  </div>
                  <div>
                    <div>
                      <Text strong>สถานที่สัมภาษณ์</Text>
                    </div>
                    <div className="mt-1">
                      <Input
                        name="location"
                        value={interviewData.location}
                        onChange={(e) =>
                          setInterviewData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  {interviewType === "online" && (
                    <div>
                      <div>
                        <Text strong>URL การประชุม</Text>
                      </div>
                      <div className="mt-1">
                        <Input
                          value={interviewData.meeting_url}
                          name="meeting_url"
                          onChange={(e) =>
                            setInterviewData((prev) => ({
                              ...prev,
                              meeting_url: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="px-6 mb-5">
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 p-6">
        <div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg px-4 py-2 text-white font-medium shadow-sm transition-colors cursor-pointer"
            style={{ backgroundColor: "orange", color: "black" }}
          >
            ย้อนกลับ
          </button>
        </div>
        <div>
          {APPLICATION_STATUS.some((item) => item.value === status) && (
            <Button type="primary" loading={saving} onClick={handleSaveStatus}>
              บันทึก
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}