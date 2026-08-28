"use client";

import {
  useState,
} from "react";

import {
  Alert,
  Button,
  Card,
  Flex,
  Upload,
  Typography,
} from "antd";

import {
  CloudUploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import {
  swalError,
} from "@/components/Swal";

const {
  Dragger,
} = Upload;

const {
  Text,
} = Typography;

async function readErrorResponse(response) {
  const text = await response.text();

  if (!text) {
    return "ไม่สามารถสร้าง Template ได้";
  }

  try {
    const json = JSON.parse(text);

    return (
      json?.error ||
      json?.message ||
      "ไม่สามารถสร้าง Template ได้"
    );
  } catch {
    return text;
  }
}

function getDownloadFileName(response) {
  const disposition =
    response.headers.get(
      "content-disposition"
    ) || "";

  const match =
    disposition.match(
      /filename="?([^";]+)"?/i
    );

  return (
    match?.[1] ||
    `employee_migration_template_${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}.xlsx`
  );
}

export default function EmployeeMigrationUploadPanel({
  file,
  previewLoading = false,
  importing = false,
  canImport = false,
  previewReady = false,
  validRows = 0,
  onFileChange,
  onPreview,
  onImport,
}) {
  const [
    templateLoading,
    setTemplateLoading,
  ] = useState(false);

  async function handleDownloadTemplate() {
    try {
      setTemplateLoading(true);

      const response =
        await fetch(
          "/api/admin/data-import/employees/template",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          await readErrorResponse(
            response
          )
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;
      link.download =
        getDownloadFileName(
          response
        );

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      URL.revokeObjectURL(
        url
      );
    } catch (error) {
      console.error(
        "DOWNLOAD_EMPLOYEE_MIGRATION_TEMPLATE_ERROR:",
        error
      );

      swalError(
        error?.message ||
          "ไม่สามารถดาวน์โหลด Template ได้"
      );
    } finally {
      setTemplateLoading(false);
    }
  }

  return (
    <Card>
      <Flex
        vertical
        gap={16}
      >
        <Alert
          type="warning"
          showIcon
          title="Employee Migration — รักษารหัสพนักงานเดิม"
          description={
            <>
              ใช้สำหรับย้ายพนักงานจากระบบเก่าเข้าระบบใหม่ โดยคอลัมน์{" "}
              <strong>
                employee_code
              </strong>
              {" "}คือรหัสพนักงานเดิม ระบบจะไม่ Generate รหัสใหม่ผ่าน Employee Code Setting
            </>
          }
        />

        <Alert
          type="info"
          showIcon
          icon={
            <SafetyCertificateOutlined />
          }
          title="ระบบจะตรวจข้อมูลก่อน Import จริง"
          description="Upload ไฟล์แล้วกดตรวจสอบ ระบบจะ Validate Required Field, Master Code, Organization Lineage, Duplicate, INSERT/UPDATE และ Employee Scope ทุกแถวก่อนให้ยืนยัน Import"
        />

        <Flex
          wrap="wrap"
          gap={12}
          align="center"
        >
          <Button
            icon={
              <DownloadOutlined />
            }
            loading={
              templateLoading
            }
            disabled={
              previewLoading ||
              importing
            }
            onClick={
              handleDownloadTemplate
            }
          >
            Generate & ดาวน์โหลด Employee Template
          </Button>

          <Text type="secondary">
            Template จะดึง Master Data ล่าสุดจาก HRMS ตาม Scope ของผู้ใช้งาน และสร้าง Sheet REF_* ให้ครบอัตโนมัติ
          </Text>
        </Flex>

        <Alert
          type="success"
          showIcon
          title="ไม่ต้องนั่ง List Code เอง"
          description="ในไฟล์ที่ดาวน์โหลดจะมี Employees สำหรับกรอกข้อมูล และ REF_Companies, REF_Branches, REF_Departments, REF_Positions, REF_Salary_Bands, Payroll และ Master อื่น ๆ จากฐานข้อมูลจริง"
        />

        <Dragger
          accept=".xlsx,.xls"
          maxCount={1}
          multiple={false}
          fileList={
            file
              ? [file]
              : []
          }
          beforeUpload={() =>
            false
          }
          onChange={({
            fileList,
          }) => {
            const next =
              fileList[
                fileList.length -
                  1
              ] ||
              null;

            onFileChange?.(
              next
            );
          }}
          onRemove={() => {
            onFileChange?.(
              null
            );

            return true;
          }}
          disabled={
            previewLoading ||
            importing ||
            templateLoading
          }
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined />
          </p>

          <p className="ant-upload-text">
            ลากไฟล์ Excel มาวาง หรือคลิกเพื่อเลือกไฟล์
          </p>

          <p className="ant-upload-hint">
            ใช้ Template ที่ Generate จากระบบ และห้ามเปลี่ยนชื่อ Header
          </p>
        </Dragger>

        <Flex
          wrap="wrap"
          justify="end"
          gap={8}
        >
          <Button
            icon={
              <CloudUploadOutlined />
            }
            loading={
              previewLoading
            }
            disabled={
              !file ||
              importing ||
              templateLoading
            }
            onClick={
              onPreview
            }
          >
            ตรวจสอบไฟล์ / Preview
          </Button>

          <Button
            type="primary"
            loading={
              importing
            }
            disabled={
              !canImport ||
              !previewReady ||
              validRows <= 0 ||
              previewLoading ||
              templateLoading
            }
            onClick={
              onImport
            }
          >
            ยืนยันนำเข้ารายการที่ผ่าน ({validRows})
          </Button>
        </Flex>

        {!canImport && (
          <Text type="secondary">
            บัญชีนี้มีสิทธิ์ดู Preview แต่ไม่มีสิทธิ์ INSERT/UPDATE พนักงาน
          </Text>
        )}
      </Flex>
    </Card>
  );
}
