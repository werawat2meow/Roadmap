"use client";

import {
  Card,
  Checkbox,
  Form,
  Typography,
} from "antd";

import {
  Agreement,
  AgreementSectionProps,
} from "@/app/jobs/types/types";

import { uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";

const { Paragraph, Text } = Typography;

export default function AgreementSection({
  language,
  value,
  onChange,
}: AgreementSectionProps) {

  const { locale } = useLanguage();

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
          checked={value.certify}
          onChange={(e) =>
            updateField(
              "certify",
              e.target.checked
            )
          }
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