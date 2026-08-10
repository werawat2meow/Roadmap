"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Typography,
  Upload,
  message,
  Space,
} from "antd";

import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { InboxOutlined } from "@ant-design/icons";

import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { validatePhone, validateEmail , createAgreement} from "@/app/jobs/types/utils";

import AgreementSection from "@/app/jobs/components/AgreementSection";
import { Agreement } from "@/app/jobs/types/types";


const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

interface ResumeFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  line_id: string;
  other_position: string;
  expected_salary?: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const ACCEPT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const ACCEPT_EXTENSION = ".pdf,.doc,.docx,.png,.jpg,.jpeg";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*                               Resume Form                                  */
/* -------------------------------------------------------------------------- */

export default function ResumeForm() {
  const router = useRouter();
  const { locale } = useLanguage();

  const [form] = Form.useForm<ResumeFormValues>();

  /* ------------------------------- Loading -------------------------------- */

  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------ Resume File ------------------------------ */

  const [resumeFile, setResumeFile] =
    useState<RcFile | null>(null);

  const [fileList, setFileList] = useState<
    UploadFile[]
  >([]);

  const [uploadError, setUploadError] =
    useState("");

  /* ------------------------------- Agreement ------------------------------- */

  const [agreement, setAgreement] =
  useState<Agreement>(
    createAgreement()
  );

  /* ------------------------------- Messages -------------------------------- */

  const requiredMessage = 
    locale === "TH"
      ? "กรุณากรอกข้อมูล"
      : "This field is required.";

  const invalidEmailMessage = getUIText(uiText.invalidEmail, locale);
  const invalidPhoneMessage = getUIText(uiText.invalidPhone, locale);

  const invalidResumeMessage =
    locale === "TH"
      ? "รองรับเฉพาะ PDF, DOC, DOCX, PNG, JPG, JPEG"
      : "Only PDF, DOC, DOCX, PNG, JPG and JPEG  are allowed.";

  const maxSizeMessage =
    locale === "TH"
      ? "ไฟล์ต้องมีขนาดไม่เกิน 20 MB"
      : "Maximum file size is 20 MB.";

  /* -------------------------------------------------------------------------- */
  /*                              Helper Functions                              */
  /* -------------------------------------------------------------------------- */

  const beforeUpload = (file: RcFile) => {
    setUploadError("");

    // Validate file type
    const isValidType =
      ACCEPT_TYPES.includes(file.type) ||
      /\.(pdf|doc|docx)$/i.test(file.name);

    if (!isValidType) {
      setUploadError(invalidResumeMessage);
      message.error(invalidResumeMessage);
      return Upload.LIST_IGNORE;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(maxSizeMessage);
      message.error(maxSizeMessage);
      return Upload.LIST_IGNORE;
    }

    setResumeFile(file);

    setFileList([
      {
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "done",
        originFileObj: file,
      },
    ]);

    return false; // ป้องกัน Upload ของ antd
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setFileList([]);
    setUploadError("");

    return true;
  };


  const validateForm = async (): Promise<ResumeFormValues> => {
    // เช็คสิ่งที่ไม่ต้อง await ก่อน จะได้ error เร็วกว่ารอ form.validateFields()
    if (!resumeFile) {
      throw new Error(
        locale === "TH"
          ? "กรุณาอัปโหลด Resume"
          : "Please upload your resume."
      );
    }

    if (!agreement.certify) {
      throw new Error(
        locale === "TH"
          ? "กรุณารับรองว่าข้อมูลเป็นความจริง"
          : "Please certify your information."
      );
    }

    if (!agreement.pdpa) {
      throw new Error(
        locale === "TH"
          ? "กรุณายอมรับนโยบาย PDPA"
          : "Please accept the PDPA policy."
      );
    }

    // form.validateFields() ตรวจ required / email / phone ผ่าน rules ของแต่ละ
    // Form.Item อยู่แล้ว (ดู validator ของ email และ phone_number ด้านล่าง)
    // จึงไม่ต้องเรียก validateEmail / validatePhone ซ้ำอีกรอบตรงนี้
    const values = await form.validateFields();

    return values;
  };

  /* -------------------------------------------------------------------------- */
  /*                               Submit Handler                               */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      /**
       * Validate Form
       */
      const values = await validateForm();

      const formData = new FormData();

      // resumeFile ถูกเช็คว่าไม่เป็น null แล้วใน validateForm() ด้านบน
      formData.append("resume", resumeFile as RcFile);

      formData.append(
        "data",
        JSON.stringify({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          line_id: values.line_id || "",
          phone_number: values.phone_number,
          other_position: values.other_position || null,
          expected_salary: values.expected_salary || null,
          certify: agreement.certify,
          pdpa: agreement.pdpa,
          from_social_media: agreement.from_social_media || "",
        })
      );

      const response = await fetch(
        "/jobs/api/resume",
        {
          method:"POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (
              locale === "TH"
                ? "ไม่สามารถบันทึกข้อมูลได้"
                : "Unable to save data."
            )
        );
      }

      message.success(
        locale === "TH"
          ? "ฝาก Resume สำเร็จ"
          : "Resume submitted successfully."
      );

      // router.push( "/jobs/register/thankyou?type=resume" );

    } catch (error: any) {

      console.error( "Resume submit error:", error );

      message.error(
        error?.message ||
          (
            locale === "TH"
              ? "เกิดข้อผิดพลาด กรุณาลองใหม่"
              : "Something went wrong."
          )
      );

    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Return                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <div
        style={{
          maxWidth: 1200,
          margin: "24px auto 60px",
          paddingInline: 20,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          requiredMark={false}
          scrollToFirstError
        >
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card>
                <Title level={3} style={{ marginBottom: 8 }}>
                  {locale === "TH" ? "ฝาก Resume" : "Resume Submission"}
                </Title>

                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                  {locale === "TH"
                    ? "ฝาก Resume ไว้กับเรา เมื่อมีตำแหน่งงานที่เหมาะสม ทีมงานจะติดต่อกลับ"
                    : "Submit your resume and we will contact you when a suitable position becomes available."}
                </Paragraph>

                <Form.Item
                  label={ "Resume" }
                  required
                >
                  <Dragger
                    name="resume"
                    multiple={false}
                    maxCount={1}
                    accept={ACCEPT_EXTENSION}
                    beforeUpload={beforeUpload}
                    onRemove={handleRemoveFile}
                    fileList={fileList}
                    showUploadList={false}
                    style={{
                      padding: 24,
                    }}
                  >
                    <p className="ant-upload-drag-icon"> <InboxOutlined /> </p>

                    <p
                      className="ant-upload-text"
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {locale === "TH"
                        ? "คลิกหรือวางไฟล์ Resume ที่นี่"
                        : "Click or drag your resume here"}
                    </p>

                    <p className="ant-upload-hint">
                      PDF / DOC / DOCX / PNG / JPG / JPEG
                      <br />
                      {locale === "TH"
                        ? "ขนาดไฟล์ไม่เกิน 20 MB"
                        : "Maximum file size: 20 MB"}
                    </p>
                  </Dragger>
                </Form.Item>

                {uploadError && (
                  <Alert
                    type="error"
                    showIcon
                    message={uploadError}
                    style={{
                      marginBottom: 16,
                    }}
                  />
                )}

                {resumeFile && (
                  <Card
                    size="small"
                    style={{
                      background: "#fafafa",
                    }}
                  >
                    <Row
                      justify="space-between"
                      align="middle"
                      gutter={16}
                    >
                      <Col flex="auto">
                        <Text strong> {resumeFile.name} </Text>
                        <br />
                        <Text type="secondary">
                          {(
                            resumeFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </Text>
                      </Col>

                      <Col>
                        <Button
                          danger
                          onClick={handleRemoveFile}
                        >
                          {locale === "TH"
                            ? "ลบไฟล์"
                            : "Remove"}
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                )}
              </Card>
            </Col>

            <Col xs={24}>
              <Card
                title={ getUIText(uiText.personalInfoSection, locale)}
              >
                <Row gutter={[16, 0]}>
                  {/* First Name */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      required
                      name="first_name"
                      label={getUIText(uiText.firstName, locale)}
                      rules={[
                        {
                          required: true,
                          message: requiredMessage,
                        },
                      ]}
                    >
                      <Input placeholder={getUIText(uiText.firstName, locale)} />
                    </Form.Item>
                  </Col>

                  {/* Last Name */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      required
                      name="last_name"
                      label={getUIText(uiText.lastName, locale)}
                      rules={[
                        {
                          required: true,
                          message: requiredMessage,
                        },
                      ]}
                    >
                      <Input placeholder={getUIText(uiText.lastName, locale)} />
                    </Form.Item>
                  </Col>

                  {/* Email */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      required
                      name="email"
                      label={getUIText(uiText.email, locale)}
                      rules={[
                        {
                          required: true,
                          message: requiredMessage,
                        },
                        {
                          validator: (_, value) => {
                            if (
                              !value ||
                              validateEmail(value)
                            ) {
                              return Promise.resolve();
                            }

                            return Promise.reject(
                              new Error(
                                invalidEmailMessage
                              )
                            );
                          },
                        },
                      ]}
                    >
                      <Input
                        type="email"
                        placeholder="example@email.com"
                      />
                    </Form.Item>
                  </Col>

                  {/* Phone */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      required
                      name="phone_number"
                      label={getUIText(uiText.phoneNumber, locale)}
                      rules={[
                        {
                          required: true,
                          message: requiredMessage,
                        },
                        {
                          validator: (_, value) => {
                            if (
                              !value ||
                              validatePhone(value)
                            ) {
                              return Promise.resolve();
                            }

                            return Promise.reject(
                              new Error(
                                invalidPhoneMessage
                              )
                            );
                          },
                        },
                      ]}
                    >
                      <Input
                        placeholder={
                          locale === "TH"
                            ? "เช่น 0812345678"
                            : "Example: 0812345678"
                        }
                        maxLength={20}
                      />
                    </Form.Item>
                  </Col>

                  {/* LINE ID */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="line_id"
                      label={getUIText(uiText.lineId, locale)}
                    >
                      <Input
                        placeholder={
                          locale === "TH"
                            ? "กรอก LINE ID"
                            : "Enter LINE ID"
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* ------------------------------------------------------------------ */}
            {/*                      Position Information                          */}
            {/* ------------------------------------------------------------------ */}

            <Col xs={24}>
              <Card
                title={
                  locale === "TH"
                    ? "ข้อมูลการสมัคร"
                    : "Job Information"
                }
              >
                <Row gutter={[16, 0]}>
                  {/* Other Position */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="other_position"
                      label={getUIText(uiText.otherPosition, locale)}
                    >
                      <Input placeholder={getUIText(uiText.otherPosition, locale)} />
                    </Form.Item>
                  </Col>

                  {/* Expected Salary */}
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="expected_salary"
                      label={getUIText(uiText.expectedSalary, locale)}
                    >
                      <Space.Compact style={{ width: "100%" }}>
                        <InputNumber
                          style={{ width: "100%" }}
                          min={0}
                          placeholder={getUIText(uiText.expectedSalary, locale)}
                          parser={(value): number => {
                            return value
                              ? Number(String(value).replace(/,/g, ""))
                              : 0;
                          }}
                        />
                        <Input value={getUIText(uiText.type_salary, locale)} disabled />
                      </Space.Compact>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            {/* ------------------------------------------------------------------ */}
            {/*                           Agreement                                */}
            {/* ------------------------------------------------------------------ */}
            <Col xs={24}>
              <AgreementSection
                form={form}
                language={locale}
                value={agreement}
                onChange={setAgreement}
              />
            </Col>

            {/* ------------------------------------------------------------------ */}
            {/*                             Submit                                 */}
            {/* ------------------------------------------------------------------ */}

            <Col xs={24}>
              <Space
                style={{
                  width: "100%",
                  justifyContent: "center",
                }}
                size="large"
              >
                <Button
                  color="danger" 
                  variant="solid"
                  size="large"
                  onClick={() => router.push("/jobs")}
                >
                  {getUIText(uiText.cancel, locale)}
                </Button>
                
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  {getUIText(uiText.btnResume, locale)}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
}