"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { Spin, Result } from "antd";
import CandidateProfile from "@/app/recruitment/components/CandidateProfile";


export default function ApplicantDetailPage() {
  const params = useParams();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
  
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [notFoundFlag, setNotFoundFlag] = useState(false);
  
    useEffect(() => {
      const fetchCandidate = async () => {
        try {
          const url = token
            ? `/recruitment/api/schedule_list/${params.id}?token=${encodeURIComponent(token)}`
            : `/recruitment/api/schedule_list/${params.id}`;
  
          const res = await fetch(url);
          const json = await res.json();
  
          if (res.status === 401) {
            setUnauthorized(true);
            return;
          }
  
          if (!res.ok || !json.success) {
            setNotFoundFlag(true);
            return;
          }
  
          setData(json.data);
        } catch (err) {
          console.error("fetch candidate error:", err);
          setNotFoundFlag(true);
        } finally {
          setLoading(false);
        }
      };
  
      fetchCandidate();
    }, [params.id, token]);
  
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      );
    }
  
    if (unauthorized) {
      return (
        <Result
          status="403"
          title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
          subTitle="ลิงก์อาจหมดอายุ หรือกรุณาเข้าสู่ระบบก่อนดูข้อมูลผู้สมัคร"
        />
      );
    }
  
    if (notFoundFlag || !data) {
      notFound();
    }
  
    return (
      <CandidateProfile
        application={data.application}
        education={data.education}
        workExperience={data.workExperience}
        languageSkills={data.languageSkills}
        systemProgramSkills={data.systemProgramSkills}
        documents={data.documents}
        interviews={data.interviews}
      />
    );
}