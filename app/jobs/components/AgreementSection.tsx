"use client";

import { useState } from "react";

import { Card, Checkbox, Form, Input, Radio, Space, Typography, } from "antd";

import { Agreement, AgreementSectionProps, } from "@/app/jobs/types/types";

import { uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";

const { Paragraph, Text } = Typography;

export default function AgreementSection({
  language,
  value,
  onChange,
}: AgreementSectionProps) {

  const { locale } = useLanguage();

  const SOCIAL_OPTIONS = [
    {
      value: "facebook",
      label: getUIText(uiText.facebook, locale),
    },
    {
      value: "instagram",
      label: getUIText(uiText.instagram, locale),
    },
    {
      value: "jobthai",
      label: getUIText(uiText.jobthai, locale),
    },
    {
      value: "jobbkk",
      label: getUIText(uiText.jobbkk, locale),
    },
    {
      value: "linkedin",
      label: getUIText(uiText.linkedin, locale),
    },
    {
      value: "other",
      label: getUIText(uiText.other, locale),
    },
  ];

  const predefinedSocials = [
    "facebook",
    "instagram",
    "jobthai",
    "jobbkk",
    "linkedin",
  ];

  const initialSocial = predefinedSocials.includes(
    value.from_social_media
  )
    ? value.from_social_media
    : value.from_social_media
    ? "other"
    : "";

  const initialOther =
    predefinedSocials.includes(
      value.from_social_media
    )
      ? ""
      : value.from_social_media || "";

  const [social, setSocial] = useState(initialSocial);
  const [otherText, setOtherText] = useState(initialOther);

  /* -------------------------------------------------------------------------- */
  /*                                  Handlers                                  */
  /* -------------------------------------------------------------------------- */

  const updateField = (
    field: keyof Agreement,
    checked: boolean
  ) => {
    onChange({
      ...value,
      [field]: checked,
    });
  };

  const updateSocial = (
    selected: string,
    other = otherText
  ) => {
    setSocial(selected);

    onChange({
      ...value,
      from_social_media:
        selected === "other"
          ? other
          : selected,
    });
  };

  /* -------------------------------------------------------------------------- */

  return (
    <Card
      title={
        language === "TH"
          ? "การรับรองข้อมูลและการยินยอม"
          : "Declaration & Consent"
      }
      style={{ marginTop: 24 }}
    >

      <Form.Item
        label={
          language === "TH"
            ? "ทราบข่าวการเปิดรับสมัครจาก"
            : "How did you hear about this job?"
        }
      >
        <Radio.Group
          value={social}
          onChange={(e) => updateSocial(e.target.value) }
        >
          <Space orientation="vertical">
            {SOCIAL_OPTIONS.map((item) => (
              <Radio
                key={item.value}
                value={item.value}
              >
                {item.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {social === "other" && (
          <Input
            value={otherText}
            onChange={(e) => {
              const text = e.target.value;

              setOtherText(text);

              updateSocial("other", text);
            }}
          />
        )}
      </Form.Item>

      {/* ---------------------------------------------------------------------- */}
      {/* Certification                                                          */}
      {/* ---------------------------------------------------------------------- */}

      <Form.Item
        validateStatus={
          !value.certify ? "error" : ""
        }
        help={
          !value.certify
            ? language === "TH"
              ? "กรุณาเลือกเพื่อยืนยันข้อมูล"
              : "Please accept this declaration."
            : ""
        }
      >
        <Checkbox
          name="certify"
          checked={value.certify}
          onChange={(e) => updateField( "certify", e.target.checked ) }
        >
          <Text strong>
            { getUIText(uiText.consentTerms, locale) }
          </Text>
        </Checkbox>
      </Form.Item>

      {/* ---------------------------------------------------------------------- */}
      {/* PDPA Consent                                                           */}
      {/* ---------------------------------------------------------------------- */}

      <Form.Item
        validateStatus={
          !value.pdpa ? "error" : ""
        }
        help={
          !value.pdpa
            ? language === "TH"
              ? "กรุณาให้ความยินยอมก่อนส่งใบสมัคร"
              : "Please give your consent before submitting."
            : ""
        }
      >
        <Checkbox
          name="pdpa"
          checked={value.pdpa}
          onChange={(e) =>
            updateField(
              "pdpa",
              e.target.checked
            )
          }
        >
          <Text strong>
            { getUIText(uiText.consentPrivacy, locale) }
          </Text>
        </Checkbox>
      </Form.Item>

      {/* ---------------------------------------------------------------------- */}
      {/* Note                                                                   */}
      {/* ---------------------------------------------------------------------- */}

      <Paragraph
        type="secondary"
        style={{ marginTop: 16 }}
      >
        {language === "TH"
          ? "* ต้องเลือกทั้ง 2 ข้อก่อน จึงจะสามารถส่งใบสมัครงานได้"
          : "* Both checkboxes must be accepted before the application can be submitted."}
      </Paragraph>
    </Card>
  );
}