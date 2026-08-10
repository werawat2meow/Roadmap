"use client";

import { useEffect, useState } from "react";
import { Button, Form, message, Space } from "antd";
import { useRouter } from "next/navigation";

import { getTranslation, uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
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
  PersonalInformationData ,
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
  validateApplication,
} from "@/app/jobs/types/utils";


export default function ApplicationForm({
  language,
  saving,
  position,
  onSubmit,
}: ApplicationFormProps) {

  const { locale } = useLanguage();
  const router = useRouter();

  /* -------------------------------------------------------------------------- */
  /*                                  Antd Form                                */
  /* -------------------------------------------------------------------------- */

  const [form] = Form.useForm();

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */

  const [personal, setPersonal] =
    useState<PersonalInformationData  >(
      createPersonalInformation()
    );

  const [education, setEducation] =
    useState<EducationHistory[]>([
      createEducationRow(),
    ]);

  const [workExperience, setWorkExperience] =
    useState<WorkExperience[]>([
      createWorkRow(),
    ]);

  const [computerSkills, setComputerSkills] =
    useState<ComputerSkill[]>([
      createComputerSkillRow(),
    ]);

  const [languageSkills, setLanguageSkills] =
    useState<LanguageSkill[]>([
      createLanguageSkillRow(),
    ]);

  const [documents, setDocuments] =
    useState<ApplicationDocument[]>(
      createDefaultDocuments()
    );

  const [agreement, setAgreement] =
    useState<Agreement>(
      createAgreement()
    );

  /* -------------------------------------------------------------------------- */
  /*                              Submit Handler                                */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = async () => {
    const payload: JobApplicationPayload = {
      jobId: position.jobId,
      positionId: position.positionId,
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
        {/* ---------------------------------------------------------------------- */}
        {/* Personal Information                                                   */}
        {/* ---------------------------------------------------------------------- */}

        <PersonalInformation
            form={form}
            language={language}
            position={position}
            value={personal}
            onChange={setPersonal}
        />

        {/* ---------------------------------------------------------------------- */}
        {/* Education Background                                                   */}
        {/* ---------------------------------------------------------------------- */}

        <EducationSection
            form={form}
            language={language}
            value={education}
            onChange={setEducation}
        />

        {/* ---------------------------------------------------------------------- */}
        {/* Work Experience                                                        */}
        {/* ---------------------------------------------------------------------- */}

        <WorkExperienceSection
            form={form}
            language={language}
            value={workExperience}
            onChange={setWorkExperience}
        />

        {/* ---------------------------------------------------------------------- */}
        {/* Skills                                                                 */}
        {/* ---------------------------------------------------------------------- */}

        <SkillsSection
        form={form}
            language={language}
            computerSkills={computerSkills}
            languageSkills={languageSkills}
            onComputerChange={setComputerSkills}
            onLanguageChange={setLanguageSkills}
        />

        {/* ---------------------------------------------------------------------- */}
        {/* Required Documents                                                     */}
        {/* ---------------------------------------------------------------------- */}

        <DocumentsSection
            form={form}
            language={language}
            value={documents}
            onChange={setDocuments}
        />

        {/* ---------------------------------------------------------------------- */}
        {/* Agreement / PDPA                                                       */}
        {/* ---------------------------------------------------------------------- */}

        <AgreementSection
            form={form}
            language={language}
            value={agreement}
            onChange={setAgreement}
        />

        {/* ---------------------------------------------------------------------- */}
        {/* Submit Button                                                          */}
        {/* ---------------------------------------------------------------------- */}

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