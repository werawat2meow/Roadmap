"use client";

import { useEffect, useState } from "react";
import { Button, Form, message, Space, Col, Input, Card } from "antd";
import { useRouter } from "next/navigation";

import { getTranslation, uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";
import PersonalInformation from "@/app/jobs/components/PersonalInformation";
import EducationSection from "@/app/jobs/components/EducationSection";
import WorkExperienceSection from "@/app/jobs/components/WorkExperienceSection";
import SkillsSection from "@/app/jobs/components/SkillsSection";
import DocumentsSection from "@/app/jobs/components/DocumentsSection";
import AgreementSection from "@/app/jobs/components/AgreementSection";

import {
  ApplicationFormProps,
  Agreement,
  ApplicationDocument,
  ComputerSkill,
  EducationHistory,
  JobApplicationPayload,
  LanguageSkill,
  PersonalInformationData,
  WorkExperience,
} from "@/app/jobs/types/types";

import {
  createAgreement,
  createComputerSkillRow,
  createDefaultDocuments,
  createEducationRow,
  createLanguageSkillRow,
  createPersonalInformation,
  createWorkRow,
  mergeAgreement,
  mergeComputerSkillRows,
  mergeDocuments,
  mergeEducationRows,
  mergeLanguageSkillRows,
  mergePersonalInformation,
  mergeWorkExperienceRows,
  validateApplication,
} from "@/app/jobs/types/utils";


export default function ApplicationForm({
  language,
  saving,
  position,
  onSubmit,
  initialData,
}: ApplicationFormProps) {

  const { locale } = useLanguage();
  const router = useRouter();

  const [selfPresentationUrl, setSelfPresentationUrl] = useState<string>(
    initialData?.self_presentation_url ?? ""
  );

  /* -------------------------------------------------------------------------- */
  /*                                  Antd Form                                */
  /* -------------------------------------------------------------------------- */

  const [form] = Form.useForm();

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */
  // ทุก state ด้านล่างจะ prefill จาก initialData ถ้ามีข้อมูลส่งมา
  // ถ้าไม่มี (เช่น API ยังไม่มี field นั้น) จะ fallback เป็นค่า default เดิมทุกประการ

  const [personal, setPersonal] =
    useState<PersonalInformationData>(
      mergePersonalInformation(initialData?.personal)
    );

  const [education, setEducation] =
    useState<EducationHistory[]>(
      mergeEducationRows(initialData?.education)
    );

  const [workExperience, setWorkExperience] =
    useState<WorkExperience[]>(
      mergeWorkExperienceRows(initialData?.workExperience)
    );

  const [computerSkills, setComputerSkills] =
    useState<ComputerSkill[]>(
      mergeComputerSkillRows(initialData?.computerSkills)
    );

  const [languageSkills, setLanguageSkills] =
    useState<LanguageSkill[]>(
      mergeLanguageSkillRows(initialData?.languageSkills)
    );

  const [documents, setDocuments] =
    useState<ApplicationDocument[]>(
      mergeDocuments(initialData?.documents)
    );

  const [agreement, setAgreement] =
    useState<Agreement>(
      mergeAgreement(initialData?.agreement)
    );

  /* -------------------------------------------------------------------------- */
  /*                    Sync Antd Form.Item field (URL) ที่ prefill มา          */
  /* -------------------------------------------------------------------------- */
  // Form.Item name="self_presentation_url" ผูกกับ antd form internally
  // ต้อง setFieldsValue ด้วย ไม่งั้น validation/state ภายในของ antd จะไม่รู้ค่าตั้งต้น
  useEffect(() => {
    form.setFieldsValue({
      self_presentation_url: selfPresentationUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              Submit Handler                                */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = async () => {
    if (position.positionId === undefined) {
      message.error(
        language === "TH"
          ? "ไม่พบข้อมูลตำแหน่งงานที่สมัคร กรุณาลองใหม่อีกครั้ง"
          : "Missing position information. Please try again."
      );
      return;
    }

    const payload: JobApplicationPayload = {
      jobId: position.jobId,
      positionId: position.positionId,
      self_presentation_url: selfPresentationUrl || undefined,
      personal,
      education,
      workExperience,
      computerSkills,
      languageSkills,
      documents,
      agreement,
    };

    const errors = validateApplication(payload, locale);

    if (errors.length > 0) {
      const firstError = errors[0];

      message.error(firstError.message);

      const element =
        (document.querySelector(
          `[name="${firstError.field}"]`
        ) as HTMLElement | null) ??
        (document.querySelector(
          `[data-field="${firstError.field}"]`
        ) as HTMLElement | null);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        requestAnimationFrame(() => {
          const focusable =
            element.matches("input, textarea, select, button")
              ? element
              : (element.querySelector(
                  "input, textarea, select, button"
                ) as HTMLElement | null);

          focusable?.focus();
        });
      }

      return;
    }

    try {
      await onSubmit(payload);
    } catch (error: any) {
      message.error(
        error?.message ??
          "Unable to submit application."
      );
    }
  };

  const handleBack = async () => {
    router.push("/jobs");
  }

  /* -------------------------------------------------------------------------- */
  /*                                  JSX                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
    >
        <PersonalInformation
            form={form}
            language={language}
            position={position}
            value={personal}
            onChange={setPersonal}
        />

        <EducationSection
            form={form}
            language={language}
            value={education}
            onChange={setEducation}
        />

        <WorkExperienceSection
            form={form}
            language={language}
            value={workExperience}
            onChange={setWorkExperience}
        />

        <SkillsSection
            form={form}
            language={language}
            computerSkills={computerSkills}
            languageSkills={languageSkills}
            onComputerChange={setComputerSkills}
            onLanguageChange={setLanguageSkills}
        />

        <DocumentsSection
            form={form}
            language={language}
            value={documents}
            onChange={setDocuments}
        />

        <Card
          style={{ marginTop: 24 }}
          title={language === "TH"
                    ? "URL สำหรับพรีเซ้นตัวเอง"
                    : "Self Presentation URL"}
        >
          <Col xs={24}>
            <Form.Item
              name="self_presentation_url"
              label={
                language === "TH"
                  ? "URL สำหรับพรีเซ้นตัวเอง"
                  : "Self Presentation URL"
              }
              rules={[
                {
                  type: "url",
                  message:
                    language === "TH"
                      ? "กรุณากรอก URL ให้ถูกต้อง"
                      : "Please enter a valid URL.",
                },
              ]}
            >
              <Input
                value={selfPresentationUrl}
                onChange={(e) => setSelfPresentationUrl(e.target.value)}
                placeholder={
                  language === "TH"
                    ? "เช่น https://www.linkedin.com/in/yourname"
                    : "Example: https://www.linkedin.com/in/yourname"
                }
                maxLength={500}
                allowClear
              />
            </Form.Item>
          </Col>
        </Card>

        <AgreementSection
            form={form}
            language={language}
            value={agreement}
            onChange={setAgreement}
        />

        <Form.Item style={{ marginTop: 32 }}>
          <Space style={{ width: "100%" }}>
            <Button
              color="danger" 
              variant="solid"
              size="large"
              onClick={handleBack}
            >
              {getUIText(uiText.cancel, locale)}
            </Button>
            
            <Button
              type="primary"
              size="large"
              loading={saving}
              onClick={handleSubmit}
            >
              {getUIText(uiText.save, locale)}
            </Button>
          </Space>
        </Form.Item>

    </Form>
  );
}