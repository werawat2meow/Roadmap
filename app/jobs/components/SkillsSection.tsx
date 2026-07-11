"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  ComputerSkill,
  LanguageSkill,
  SkillsSectionProps,
} from "@/app/jobs/types/types";

import {
  createComputerSkillRow,
  createLanguageSkillRow,
} from "@/app/jobs/types/utils";

import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

const { Title } = Typography;

export default function SkillsSection({
  language,
  computerSkills,
  languageSkills,
  onComputerChange,
  onLanguageChange,
}: SkillsSectionProps) {

  const { locale } = useLanguage();
  /* -------------------------------------------------------------------------- */
  /*                              Computer Skills                               */
  /* -------------------------------------------------------------------------- */

  const addComputer = () => {
    onComputerChange([
      ...computerSkills,
      createComputerSkillRow(),
    ]);
  };

  const removeComputer = (id: string) => {
    onComputerChange(
      computerSkills.filter(
        (item) => item.id !== id
      )
    );
  };

  const updateComputer = (
    id: string,
    field: keyof ComputerSkill,
    value: string
  ) => {
    onComputerChange(
      computerSkills.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              Language Skills                               */
  /* -------------------------------------------------------------------------- */

  const addLanguage = () => {
    onLanguageChange([
      ...languageSkills,
      createLanguageSkillRow(),
    ]);
  };

  const removeLanguage = (id: string) => {
    onLanguageChange(
      languageSkills.filter(
        (item) => item.id !== id
      )
    );
  };

  const updateLanguage = (
    id: string,
    field: keyof LanguageSkill,
    value: string
  ) => {
    onLanguageChange(
      languageSkills.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div>
      {/* ---------------------------------------------------------------------- */}
      {/* Computer Skills                                                        */}
      {/* ---------------------------------------------------------------------- */}

      <Card
        title={getUIText(uiText.skillsSection, locale)}
        style={{ marginBottom: 24 }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addComputer}
          style={{ marginBottom: 16 }}
        >
          {getUIText(uiText.addRow, locale)}
        </Button>

        {computerSkills.map((item, index) => (
          <Card
            key={item.id}
            type="inner"
            style={{ marginBottom: 12 }}
            title={`${
              language === "TH"
                ? "รายการ"
                : "Item"
            } ${index + 1}`}
            extra={
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  removeComputer(item.id)
                }
              >
                {getUIText(uiText.removeRow, locale)}
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label={getUIText(uiText.computerSkillSystem, locale)}
                >
                  <Input
                    value={item.system_program}
                    onChange={(e) =>
                      updateComputer(
                        item.id,
                        "system_program",
                        e.target.value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.computerSkillGood, locale)}>
                  <InputNumber
                    value={item.good}
                    max={10}
                    onChange={(value) =>
                      updateComputer(
                        item.id,
                        "good",
                        value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.computerSkillFair, locale)}>
                  <InputNumber
                    value={item.fair}
                    max={10}
                    onChange={(value) =>
                      updateComputer(
                        item.id,
                        "fair",
                        value
                      )
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>

      {/* ---------------------------------------------------------------------- */}
      {/* Language Skills                                                        */}
      {/* ---------------------------------------------------------------------- */}

      <Card
        title={getUIText(uiText.languageSkillsSubSection, locale)}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addLanguage}
          style={{ marginBottom: 16 }}
        >
          {getUIText(uiText.addRow, locale)}
        </Button>

        {languageSkills.map((item, index) => (
          <Card
            key={item.id}
            type="inner"
            style={{ marginBottom: 12 }}
            title={`${getUIText(uiText.languageSkillLanguage, locale)} ${index + 1}`}
            extra={
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  removeLanguage(item.id)
                }
              >
                {getUIText(uiText.removeRow, locale)}
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Form.Item
                  label={getUIText(uiText.languageSkillLanguage, locale)}
                >
                  <Input
                    value={item.language}
                    onChange={(e) =>
                      updateLanguage(
                        item.id,
                        "language",
                        e.target.value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.languageSkillListening, locale)}>
                  <InputNumber
                    value={item.listening}
                    max={10}
                    onChange={(value) =>
                      updateLanguage(
                        item.id,
                        "listening",
                        value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.languageSkillSpeaking, locale)}>
                  <InputNumber
                    value={item.speaking}
                    max={10}
                    onChange={(value) =>
                      updateLanguage(
                        item.id,
                        "speaking",
                        value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.languageSkillReading, locale)}>
                  <InputNumber
                    value={item.reading}
                    max={10}
                    onChange={(value) =>
                      updateLanguage(
                        item.id,
                        "reading",
                        value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.languageSkillWriting, locale)}>
                  <InputNumber
                    value={item.writing}
                    max={10}
                    onChange={(value) =>
                      updateLanguage(
                        item.id,
                        "writing",
                        value
                      )
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>
    </div>
  );
}