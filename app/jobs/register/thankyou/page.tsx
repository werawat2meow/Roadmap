"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Flex, Progress, Typography } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

import LanguageHeader from "@/app/jobs/components/LanguageHeader";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { getTranslation, uiText } from "@/app/jobs/components/translations";

const { Title, Paragraph, Text } = Typography;

const REDIRECT_SECONDS = 5;

export default function RegisterThankYouPage() {
  const router = useRouter();

  const { locale } = useLanguage();

  const t = useMemo(
    () => (key: keyof typeof uiText) => getTranslation(key, locale as "EN" | "TH"),
    [locale]
  );

  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (seconds === 0) return;

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    if (seconds === 0) {
      router.replace("/jobs");
    }
  }, [seconds, router]);

  return (
    <>
      <LanguageHeader />

      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 650,
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <Flex
            vertical
            align="center"
            gap={20}
          >
            <CheckCircleFilled
              style={{
                fontSize: 72,
                color: "#52c41a",
              }}
            />

            <Title level={2} style={{ marginBottom: 0 }}>
              {t.applicationSubmitted ??
                "ขอบคุณสำหรับการสมัครงาน"}
            </Title>

            <Title
              level={4}
              style={{
                marginTop: 0,
                fontWeight: 400,
              }}
            >
              {t.applicationSubmittedEn ??
                "Thank you for your application"}
            </Title>

            <Paragraph
              style={{
                maxWidth: 500,
                marginBottom: 0,
              }}
            >
              {t.applicationSubmittedDescription ??
                "Your application has been successfully submitted. Our recruitment team will review your information and contact you if your qualifications match the position."}
            </Paragraph>

            <Progress
              percent={(seconds / REDIRECT_SECONDS) * 100}
              showInfo={false}
              status="active"
            />

            <Text type="secondary">
              {t.redirectIn ??
                "Redirecting to job list in"}{" "}
              <strong>{seconds}</strong>{" "}
              {t.seconds ?? "seconds"}...
            </Text>

            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/jobs")}
            >
              {t.backToJobs ??
                "Back to Job Listings"}
            </Button>
          </Flex>
        </Card>
      </div>
    </>
  );
}