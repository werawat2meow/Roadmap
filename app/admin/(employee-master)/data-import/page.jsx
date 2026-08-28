"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Card,
  Flex,
  Modal,
  Typography,
} from "antd";

import {
  useRouter,
} from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import {
  swalError,
  swalSuccess,
} from "@/components/Swal";

import useScopedPermissions from "@/hooks/useScopedPermissions";

import EmployeeMigrationUploadPanel from "./components/EmployeeMigrationUploadPanel";
import EmployeeMigrationSummaryCards from "./components/EmployeeMigrationSummaryCards";
import EmployeeMigrationPreviewTable from "./components/EmployeeMigrationPreviewTable";
import EmployeeImportHistoryTable from "./components/EmployeeImportHistoryTable";

const {
  Title,
  Text,
} = Typography;

/* =========================================================
   Helpers
========================================================= */

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getRawFile(
  uploadFile
) {
  return (
    uploadFile
      ?.originFileObj ||
    uploadFile ||
    null
  );
}

/* =========================================================
   Page
========================================================= */

export default function DataImportPage() {
  const router =
    useRouter();

  /* =========================================================
     Permission + Employee Scope
     ใช้ pattern เดียวกับหน้า Employee
  ========================================================= */

  const {
    user,

    loadingUser:
      authLoading,

    canView,
    canCreate,
    canEdit,
  } =
    useScopedPermissions(
      "data.import",
      {
        scopeType:
          "employee",
      }
    );

  /* =========================================================
     Upload / Preview
  ========================================================= */

  const [
    file,
    setFile,
  ] =
    useState(null);

  const [
    previewLoading,
    setPreviewLoading,
  ] =
    useState(false);

  const [
    importing,
    setImporting,
  ] =
    useState(false);

  const [
    previewRows,
    setPreviewRows,
  ] =
    useState([]);

  const [
    summary,
    setSummary,
  ] =
    useState({
      total: 0,
      valid: 0,
      invalid: 0,
      insert: 0,
      update: 0,
    });

  const [
    previewReady,
    setPreviewReady,
  ] =
    useState(false);

  /* =========================================================
     History
  ========================================================= */

  const [
    historyRows,
    setHistoryRows,
  ] =
    useState([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);

  const [
    historyPage,
    setHistoryPage,
  ] =
    useState(1);

  const [
    historyPageSize,
    setHistoryPageSize,
  ] =
    useState(20);

  const [
    historyTotal,
    setHistoryTotal,
  ] =
    useState(0);

  const canImport =
    canCreate ||
    canEdit;

  /* =========================================================
     Auth
  ========================================================= */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (!canView) {
      router.replace(
        "/admin"
      );
    }
  }, [
    authLoading,
    user,
    canView,
    router,
  ]);

  /* =========================================================
     History Loader
  ========================================================= */

  const loadHistory =
    useCallback(
      async () => {
        if (!canView) {
          return;
        }

        try {
          setHistoryLoading(
            true
          );

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              historyPage
            )
          );

          params.set(
            "pageSize",
            String(
              historyPageSize
            )
          );

          const response =
            await fetch(
              `/api/admin/data-import/employees/history?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "ไม่สามารถโหลดประวัติการนำเข้าได้"
            );
          }

          setHistoryRows(
            Array.isArray(
              json.data
            )
              ? json.data
              : []
          );

          setHistoryTotal(
            json.pagination
              ?.total ||
              0
          );
        } catch (error) {
          console.error(
            "LOAD_EMPLOYEE_IMPORT_HISTORY_ERROR:",
            error
          );
        } finally {
          setHistoryLoading(
            false
          );
        }
      },
      [
        canView,
        historyPage,
        historyPageSize,
      ]
    );

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    loadHistory();
  }, [
    authLoading,
    user,
    canView,
    loadHistory,
  ]);

  /* =========================================================
     File
  ========================================================= */

  function handleFileChange(
    nextFile
  ) {
    setFile(
      nextFile
    );

    setPreviewRows(
      []
    );

    setSummary({
      total: 0,
      valid: 0,
      invalid: 0,
      insert: 0,
      update: 0,
    });

    setPreviewReady(
      false
    );
  }

  /* =========================================================
     Preview
  ========================================================= */

  async function handlePreview() {
    const rawFile =
      getRawFile(
        file
      );

    if (!rawFile) {
      swalError(
        "กรุณาเลือกไฟล์ Excel"
      );

      return;
    }

    try {
      setPreviewLoading(
        true
      );

      setPreviewReady(
        false
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        rawFile
      );

      const response =
        await fetch(
          "/api/admin/data-import/employees/preview",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const json =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            "ไม่สามารถตรวจสอบไฟล์ได้"
        );
      }

      setPreviewRows(
        Array.isArray(
          json.rows
        )
          ? json.rows
          : []
      );

      setSummary(
        json.summary ||
          {
            total: 0,
            valid: 0,
            invalid: 0,
            insert: 0,
            update: 0,
          }
      );

      setPreviewReady(
        true
      );

      if (
        Number(
          json.summary
            ?.invalid ||
            0
        ) >
        0
      ) {
        swalError(
          `ตรวจสอบเสร็จแล้ว พบ ${json.summary.invalid} แถวที่ต้องแก้ไข`
        );
      } else {
        swalSuccess(
          "ตรวจสอบไฟล์เรียบร้อย พร้อมนำเข้าข้อมูล"
        );
      }
    } catch (error) {
      console.error(
        "PREVIEW_EMPLOYEE_MIGRATION_ERROR:",
        error
      );

      swalError(
        error.message ||
          "ไม่สามารถตรวจสอบไฟล์ได้"
      );
    } finally {
      setPreviewLoading(
        false
      );
    }
  }

  /* =========================================================
     Execute
  ========================================================= */

  function handleImport() {
    const rawFile =
      getRawFile(
        file
      );

    if (
      !rawFile ||
      !previewReady
    ) {
      swalError(
        "กรุณาตรวจสอบไฟล์ก่อนนำเข้า"
      );

      return;
    }

    Modal.confirm({
      title:
        "ยืนยัน Employee Migration",

      width:
        620,

      content: (
        <Flex
          vertical
          gap={8}
        >
          <Text>
            ระบบจะนำเข้าเฉพาะรายการที่ผ่าน Validation
          </Text>

          <Text strong>
            INSERT ใหม่:{" "}
            {summary.insert ||
              0} คน
          </Text>

          <Text strong>
            UPDATE เดิม:{" "}
            {summary.update ||
              0} คน
          </Text>

          <Text type="danger">
            ข้ามรายการ Error:{" "}
            {summary.invalid ||
              0} คน
          </Text>

          <Text>
            employee_code จะใช้รหัสเดิมจาก Excel และไม่ Generate ใหม่
          </Text>
        </Flex>
      ),

      okText:
        "ยืนยันนำเข้า",

      cancelText:
        "ยกเลิก",

      okButtonProps: {
        type:
          "primary",
      },

      async onOk() {
        try {
          setImporting(
            true
          );

          const formData =
            new FormData();

          formData.append(
            "file",
            rawFile
          );

          const response =
            await fetch(
              "/api/admin/data-import/employees/execute",
              {
                method:
                  "POST",

                body:
                  formData,
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "ไม่สามารถนำเข้าพนักงานได้"
            );
          }

          swalSuccess(
            json.message
          );

          setFile(
            null
          );

          setPreviewRows(
            []
          );

          setPreviewReady(
            false
          );

          setSummary({
            total: 0,
            valid: 0,
            invalid: 0,
            insert: 0,
            update: 0,
          });

          setHistoryPage(
            1
          );

          await loadHistory();
        } catch (error) {
          console.error(
            "EXECUTE_EMPLOYEE_MIGRATION_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถนำเข้าพนักงานได้"
          );

          throw error;
        } finally {
          setImporting(
            false
          );
        }
      },
    });
  }

  /* =========================================================
     Render
  ========================================================= */

  if (authLoading) {
    return (
      <LoadingOrb />
    );
  }

  if (
    !user ||
    !canView
  ) {
    return null;
  }

  return (
    <div
      style={{
        width:
          "100%",
        maxWidth:
          "100%",
        minWidth:
          0,
        overflowX:
          "hidden",
      }}
    >
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="นำเข้าข้อมูล"
              subtitle="Data Import / Employee Migration"
              loading={
                previewLoading ||
                importing ||
                historyLoading
              }
              canRefresh
              canCreate={
                false
              }
              onRefresh={() => {
                if (file) {
                  handlePreview();
                }

                loadHistory();
              }}
            />

            <PageInfoAlert
              description="สำหรับย้ายพนักงานจากระบบเก่าเข้าสู่ HRMS ใหม่ โดยรักษารหัสพนักงานเดิม ตรวจ Required Field ตาม Employee Form, Master Code, Organization Scope และ Preview INSERT/UPDATE ก่อน Import จริง"
            />
          </>
        }

        search={
          <EmployeeMigrationUploadPanel
            file={file}
            previewLoading={
              previewLoading
            }
            importing={
              importing
            }
            canImport={
              canImport
            }
            previewReady={
              previewReady
            }
            validRows={
              summary.valid ||
              0
            }
            onFileChange={
              handleFileChange
            }
            onPreview={
              handlePreview
            }
            onImport={
              handleImport
            }
          />
        }

        summary={
          <EmployeeMigrationSummaryCards
            summary={
              summary
            }
          />
        }

        table={
          <Flex
            vertical
            gap={20}
            style={{
              width:
                "100%",
              minWidth:
                0,
            }}
          >
            <Card
              title="ผลตรวจสอบ Employee Migration"
            >
              {!previewReady ? (
                <Text type="secondary">
                  เลือกไฟล์ Excel แล้วกด “ตรวจสอบไฟล์ / Preview”
                </Text>
              ) : (
                <EmployeeMigrationPreviewTable
                  rows={
                    previewRows
                  }
                  loading={
                    previewLoading
                  }
                />
              )}
            </Card>

            <Card
              title="ประวัติการนำเข้าพนักงาน"
            >
              <EmployeeImportHistoryTable
                rows={
                  historyRows
                }
                loading={
                  historyLoading
                }
                page={
                  historyPage
                }
                pageSize={
                  historyPageSize
                }
                total={
                  historyTotal
                }
                onChange={(
                  pagination
                ) => {
                  setHistoryPage(
                    pagination.current ||
                      1
                  );

                  setHistoryPageSize(
                    pagination.pageSize ||
                      20
                  );
                }}
              />
            </Card>
          </Flex>
        }
      />
    </div>
  );
}
