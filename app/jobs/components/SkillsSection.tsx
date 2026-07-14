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
  Checkbox,
  Flex,
  Radio,
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

  const updateComputerLevel = (
    id: string,
    field: "good" | "fair",
    checked: boolean
  ) => {
    onComputerChange(
      computerSkills.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          good:
            field === "good"
              ? (checked ? 1 : 0)
              : 0,
          fair:
            field === "fair"
              ? (checked ? 1 : 0)
              : 0,
        };
      })
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

              <Col xs={24} md={8}>
                <Form.Item
                  label={getUIText(uiText.computerSkillSystem, locale)}
                >
                  <Radio.Group
                    block
                    value={
                      item.good === 1
                        ? "good"
                        : item.fair === 1
                        ? "fair"
                        : undefined
                    }
                    onChange={(e) =>
                      updateComputerLevel(
                        item.id,
                        e.target.value,
                        true
                      )
                    }
                  >
                    <Radio.Button value="good" style={{ width: "50%" }}>
                      {getUIText(uiText.computerSkillGood, locale)}
                    </Radio.Button>

                    <Radio.Button value="fair" style={{ width: "50%" }}>
                      {getUIText(uiText.computerSkillFair, locale)}
                    </Radio.Button>
                  </Radio.Group>
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
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Input
                    className="justify-items-center"
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
                <Form.Item 
                  label={getUIText(uiText.languageSkillListening, locale)} 
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
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
                  </Flex>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillSpeaking, locale)} 
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
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
                  </Flex>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillReading, locale)}
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
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
                  </Flex>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillWriting, locale)}
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
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
                  </Flex>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>
    </div>
  );
}