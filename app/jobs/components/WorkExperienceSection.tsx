"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  DatePicker,
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

import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Text } = Typography;
const { RangePicker } = DatePicker;
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

  const PERIOD_FORMAT = "MMM YYYY";

  // แปลง string "Jan 2022 - Dec 2023" กลับเป็น [Dayjs, Dayjs]
  const parsePeriodToRange = (period: string): [Dayjs, Dayjs] | null => {
    if (!period) return null;
    const parts = period.split(" - ");
    if (parts.length !== 2) return null;

    const start = dayjs(parts[0], PERIOD_FORMAT, true);
    const end = dayjs(parts[1], PERIOD_FORMAT, true);

    if (!start.isValid() || !end.isValid()) return null;
    return [start, end];
  };

  // แปลงค่าที่เลือกจาก RangePicker กลับเป็น string เก็บใน work.period
  const formatRangeToPeriod = (
    dates: [Dayjs | null, Dayjs | null] | null
  ): string => {
    if (!dates || !dates[0] || !dates[1]) return "";
    return `${dates[0].format(PERIOD_FORMAT)} - ${dates[1].format(PERIOD_FORMAT)}`;
  };


  /* -------------------------------------------------------------------------- */

  return (
    <Card
      title={getUIText(uiText.workExperienceSection, locale)}
      style={{ marginBottom: 24 }}
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

            {/* <Col xs={24} md={12}>
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
            </Col> */}

            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.workPeriod, locale)}>
                <RangePicker
                  picker="month"
                  style={{ width: "100%" }}
                  placeholder={["Jan 2022", "Dec 2023"]}
                  value={parsePeriodToRange(work.period)}
                  onChange={(dates) => {
                    const periodString = formatRangeToPeriod(
                      dates as [Dayjs | null, Dayjs | null]
                    );
                    updateRow(work.id, "period", periodString);
                  }}
                />

                {work.period && (
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 4, fontSize: 13 }}
                  >
                    {language === "TH" ? "ช่วงที่เลือก: " : "Selected: "}
                    {work.period}
                  </Text>
                )}
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