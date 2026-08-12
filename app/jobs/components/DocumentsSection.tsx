"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import type { UploadProps } from "antd";

import {
  ApplicationDocument,
  DocumentsSectionProps,
} from "@/app/jobs/types/types";

import { createOtherDocument } from "@/app/jobs/types/utils";

import { uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";

const { Text } = Typography;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "video/mp4",
];


export default function DocumentsSection({
  language,
  value,
  onChange,
}: DocumentsSectionProps) {

  const { locale } = useLanguage();
  
  /* -------------------------------------------------------------------------- */
  /*                                  Handlers                                  */
  /* -------------------------------------------------------------------------- */

  const updateDocumentFields = (
    id: string,
    fields: Partial<ApplicationDocument>
  ) => {
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, ...fields } : item
      )
    );
  };

  // const beforeUpload =
  // (id: string): UploadProps["beforeUpload"] =>
  // (file) => {
  //   updateDocumentFields(id, { file, fileName: file.name });
  //   return false;
  // };

  const beforeUpload =
  (id: string): UploadProps["beforeUpload"] =>
  (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error(getUIText(uiText.invalidDocument, locale));
      return Upload.LIST_IGNORE;
    }

    updateDocumentFields(id, {
      file,
      fileName: file.name,
    });

    return false;
  };

  const addOtherDocument = () => {
    onChange([...value, createOtherDocument()]);
  };

  const removeDocument = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const getTitle = (doc: ApplicationDocument) => {
    switch (doc.type) {
      case "photo":
        return getUIText(uiText.docPhoto, locale);

      case "house_registration":
        return getUIText(uiText.docHouseholdReg, locale);

      case "id_card":
        return getUIText(uiText.docIdCard, locale);

      case "education":
        return getUIText(uiText.docEducationCert, locale);

      default:
        return getUIText(uiText.docOther, locale);
    }
  };

  return (
    <Card
      title={getUIText(uiText.documentsSection, locale)}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addOtherDocument}
        style={{ marginBottom: 16 }}
      >
        {getUIText(uiText.addRow, locale)}
      </Button>

      <Space
        orientation="vertical"
        size={20}
        style={{ width: "100%" }}
      >
        {value.map((doc) => (
          <Card
            key={doc.id}
            type="inner"
            title={getTitle(doc)}
            extra={
              doc.type === "other" && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    removeDocument(doc.id)
                  }
                >
                  {getUIText(uiText.removeRow, locale)}
                </Button>
              )
            }
          >
            <Row gutter={[16, 16]}>
              {doc.type === "other" && (
                <Col span={24}>
                  <Form.Item
                    label={
                      language === "TH"
                        ? "ชื่อเอกสาร"
                        : "Document Name"
                    }
                    required
                  >
                    <Input
                      value={doc.title}
                      onChange={(e) =>
                        updateDocumentFields(doc.id, { title: e.target.value, })
                      }
                    />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} md={16}>
                <Upload
                  accept=".png,.jpg,.jpeg,.pdf,.mp4"
                  maxCount={1}
                  beforeUpload={beforeUpload(
                    doc.id
                  )}
                  showUploadList={false}
                >
                  <Button
                    icon={<UploadOutlined />}
                  >
                    {getUIText(uiText.chooseFile, locale)}
                  </Button>
                </Upload>

                {doc.fileName && (
                  <div
                    style={{
                      marginTop: 10,
                    }}
                  >
                    <Text type="success">
                      {doc.fileName}
                    </Text>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
    </Card>
  );
}