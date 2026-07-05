"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  WorkExperience,
  WorkExperienceSectionProps,
} from "@/app/jobs/types/types";

import { createWorkRow } from "@/app/jobs/types/utils";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

const { TextArea } = Input;

export default function WorkExperienceSection({
  language,
  value,
  onChange,
}: WorkExperienceSectionProps) {

  const { locale } = useLanguage();
  /* -------------------------------------------------------------------------- */
  /*                                  Handlers                                  */
  /* -------------------------------------------------------------------------- */

  const addRow = () => {
    onChange([...value, createWorkRow()]);
  };

  const removeRow = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof WorkExperience,
    fieldValue: string
  ) => {
    const updated = value.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]: fieldValue,
          }
        : item
    );

    onChange(updated);
  };

  /* -------------------------------------------------------------------------- */

  return (
    <Card
      title={getUIText(uiText.workExperienceSection, locale)}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addRow}
        style={{ marginBottom: 20 }}
      >
        {getUIText(uiText.addRow, locale)}
      </Button>

      {value.map((work, index) => (
        <Card
          key={work.id}
          type="inner"
          style={{ marginBottom: 20 }}
          title={`${
            language === "TH"
              ? "รายการที่"
              : "Experience"
          } ${index + 1}`}
          extra={
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(work.id)}
            >
              {getUIText(uiText.removeRow, locale)}
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Period */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workPeriod, locale)}
              >
                <Input
                  placeholder={
                    language === "TH"
                      ? "เช่น ม.ค. 2565 - ธ.ค. 2566"
                      : "Example: Jan 2022 - Dec 2023"
                  }
                  value={work.period}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "period",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Company */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workCompanyName, locale)}
              >
                <Input
                  value={work.companyName}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "companyName",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Position */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workPosition, locale)}
              >
                <Input
                  value={work.position}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "position",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Latest Salary */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workLatestSalary, locale)}
              >
                <Input
                  suffix={getUIText(uiText.type_salary, locale)}
                  value={work.latestSalary}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "latestSalary",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Reason */}

            <Col span={24}>
              <Form.Item
                label={getUIText(uiText.workReasonForLeaving, locale)}
              >
                <TextArea
                  rows={3}
                  value={work.reasonForLeaving}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "reasonForLeaving",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}
    </Card>
  );
}