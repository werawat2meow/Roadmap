"use client";

import { Card, Button, Col, Form, Input, Row, Select, Typography } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

import {
  EducationHistory,
  EducationSectionProps,
} from "@/app/jobs/types/types";

import { createEducationRow } from "@/app/jobs/types/utils";

import { uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";

const { Title } = Typography;
const { Option } = Select;

export default function EducationSection({
  language,
  value,
  onChange,
}: EducationSectionProps) {

  const { locale } = useLanguage();

  /* ---------------------------------------------------------------------- */
  /*                              Handlers                                  */
  /* ---------------------------------------------------------------------- */

  const addRow = () => {
    onChange([...value, createEducationRow()]);
  };

  const removeRow = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof EducationHistory,
    fieldValue: string
  ) => {
    const updated = value.map((item) =>
      item.id === id
        ? { ...item, [field]: fieldValue }
        : item
    );

    onChange(updated);
  };

  return (
    <Card
      title={getUIText(uiText.educationSection, locale)}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addRow}
        style={{ marginBottom: 16 }}
      >
        {getUIText(uiText.addRow, locale)}
      </Button>

      {value.map((edu, index) => (
        <Card
          key={edu.id}
          type="inner"
          style={{ marginBottom: 16 }}
          title={`${language === "TH" ? "รายการที่" : "Item"} ${index + 1}`}
          extra={
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(edu.id)}
            >
              {getUIText(uiText.removeRow, locale)}
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Degree Level */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationLevel, locale)}
              >
                <Select
                  value={edu.degreeLevel}
                  onChange={(val) =>
                    updateRow(
                      edu.id,
                      "degreeLevel",
                      val
                    )
                  }
                >
                  <Option value="high_school">
                    {getUIText(uiText.educationLevelHighSchool, locale)}
                  </Option>
                  <Option value="vocational">
                    {getUIText(uiText.educationLevelvocational, locale)}
                  </Option>
                  <Option value="bachelor">
                    {getUIText(uiText.educationLevelBachelor, locale)}
                  </Option>
                  <Option value="other">
                    {getUIText(uiText.educationLevelOthers, locale)}
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Institution */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationInstitution, locale)}
              >
                <Input
                  value={edu.institution}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "institution",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Faculty */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationFaculty, locale)}
              >
                <Input
                  value={edu.faculty}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "faculty",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Major */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationMajor, locale)}
              >
                <Input
                  value={edu.major}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "major",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Year */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationYear, locale)}
              >
                <Input
                  value={edu.graduatedYear}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "graduatedYear",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* GPA */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationGpa, locale)}
              >
                <Input
                  value={edu.gpa}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "gpa",
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