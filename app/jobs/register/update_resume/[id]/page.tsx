"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Typography,
  message,
} from "antd";

import type { ApplicationInitialData } from "@/app/jobs/types/types";
import ApplicationForm from "@/app/jobs/components/ApplicationForm";
import { mapApiDocuments } from "@/app/jobs/types/utils";


import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/app/jobs/components/translations";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";
import type { JobApplicationPayload } from "@/app/jobs/types/types";

const { Title, Text } = Typography;

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface PositionInfo {
  jobId: string;
  positionId: string | number;
  positionName: string;
  department?: string;
  companyName?: string;
}

type ApplicationPayload = JobApplicationPayload;

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function RegisterPage() {
  const router = useRouter();

  const params = useParams();

  const application_id = params.id as string;
  
  const jobId = null;

  const { locale } = useLanguage();

  const t = useMemo(
    () =>
      (key: keyof typeof uiText) =>
        getTranslation(key, locale as "TH" | "EN"),
    [locale]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState<PositionInfo | null>(null);
  const [error, setError] = useState("");

  const [initialData, setInitialData] = useState<ApplicationInitialData | undefined>(undefined);

  /* ---------------------------------------------------------------------- */
  /*                           Load Position Detail                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    loadPosition();
  }, []);

  async function loadPosition() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/jobs/api/register/resume/${application_id}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();
      
      const data = result.data;
      const applications_data = result.applications_data;
      const documents_data = result.documents;

      if(result.error){
        setError(result.error);
        return;
      }
      
      if (!data) {
        setError(getUIText(uiText.jobNotFound, locale));
        return;
      }

      if (!data.positions) {
        setError(getUIText(uiText.jobNotFound, locale));
        return;
      }

      if(data.status !== 18){
        router.push("/jobs");
      }

      setPosition({
        jobId,
        positionId: data.positions.id,
        positionName: data.positions.position_name,
        department: null,
        companyName: null,
      });

      // เก็บข้อมูลที่มีอยู่แล้ว (ถ้ามี) ไว้ prefill ฟอร์ม
      // ใช้ optional chaining ทั้งหมด เพราะตอนนี้ API อาจยังไม่ส่งบาง field มา
      setInitialData({
        self_presentation_url: data.self_presentation_url ?? undefined,
        personal: applications_data.personal ?? undefined,
        education: undefined,
        workExperience: undefined,
        computerSkills: undefined,
        languageSkills: undefined,
        documents: mapApiDocuments(documents_data),
        agreement: undefined,
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Unable to load position.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                             Submit Handler                             */
  /* ---------------------------------------------------------------------- */

  async function handleSubmit(
    payload: ApplicationPayload
  ) {
    try {
      setSaving(true);

      const formData = new FormData();

      formData.append(
        "payload",
        JSON.stringify({
          jobId,
          application_id,
          ...payload,
        })
      );

      payload.documents
        .filter(
          (document) =>
            document.file instanceof File
        )
        .forEach((document) => {
          if (document.file) {
            formData.append(
              document.id,
              document.file,
              document.file.name
            );
          }
        });

      const response = await fetch(
        "/jobs/api/application",
        {
          method: "PUT",
          body: formData,
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Cannot save application."
        );
      }

      message.success( getUIText(uiText.saveSuccess, locale) );

      router.push("/jobs/register/thankyou");
    } catch (err: any) {
      console.error(err);

      message.error(
        err.message ??
          "Save failed."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                                  Loading                               */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <div
          style={{
            maxWidth: 1200,
            margin: "30px auto",
            paddingInline: 20,
          }}
        >
          <Skeleton
            active
            paragraph={{
              rows: 12,
            }}
          />
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                                  Error                                 */
  /* ---------------------------------------------------------------------- */

  if (error || !position) {
    return (
      <>
        <div
          style={{
            maxWidth: 900,
            margin: "40px auto",
            paddingInline: 20,
          }}
        >
          <Alert
            type="error"
            showIcon
            title={t("error")}
            description={error}
          />
        </div>
      </>
    );
  }
  
  /* ----------------------------- Part 2 ต่อ ----------------------------- */
    return (
    <>
      <div
        style={{
          maxWidth: 1200,
          margin: "24px auto 60px",
          paddingInline: 20,
        }}
      >
        <Flex
          vertical
          gap={24}
        >
          {/* -------------------------------------------------------------- */}
          {/* Header                                                         */}
          {/* -------------------------------------------------------------- */}

          <Card>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Title level={2} style={{ marginBottom: 0 }}>
                  {t("formTitle")}
                </Title>
              </Col>
            </Row>
          </Card>

          {/* -------------------------------------------------------------- */}
          {/* Position Information                                           */}
          {/* -------------------------------------------------------------- */}

          
            <Card title={t("positionInformation") ?? "Position Information"}>
              <Row gutter={[24, 16]}>
                {position.companyName && (
                  <Col xs={24} md={6}>
                    <Text strong>
                      {t("company")}
                    </Text>

                    <div style={{ marginTop: 8 }}>
                      {position.companyName || "-"}
                    </div>
                  </Col>
                )}

                <Col xs={24} md={12}>
                  <Text strong>
                    {t("positionApplied") ??
                      "Position Applied For"}
                  </Text>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {position.positionName}
                  </div>
                </Col>
              </Row>
            </Card>
          

          {/* -------------------------------------------------------------- */}
          {/* Main Form                                                      */}
          {/* -------------------------------------------------------------- */}

          <ApplicationForm
            jobId={jobId}
            language={locale}
            saving={saving}
            position={position}
            onSubmit={handleSubmit}
            initialData={initialData}
          />
          
        </Flex>
      </div>
    </>
  );
}