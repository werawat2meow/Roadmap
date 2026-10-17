"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Card,
  Button,
  Space,
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
import EmployeeMigrationMappingModal from "./components/EmployeeMigrationMappingModal";

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
  const [draftJobId,setDraftJobId] = useState(null);
  const [draftStatus,setDraftStatus] = useState("");
  const [savingDraft,setSavingDraft] = useState(false);
  const [mappingRow,setMappingRow] = useState(null);
  const [masterOptions,setMasterOptions] = useState({});
  const [masterRelations,setMasterRelations] = useState({});

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
    setDraftJobId(null);
    setDraftStatus("");
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

  // Persist Excel source into Draft. This action NEVER creates an employee.
  async function handleSaveDraft(){
    const raw=getRawFile(file);
    if(!raw||!previewReady){swalError("กรุณา Preview ไฟล์ก่อนบันทึก Draft");return;}
    if(draftJobId){swalError("บันทึก Draft แล้ว สามารถแก้ Mapping ได้เลย");return;}
    try{setSavingDraft(true);const form=new FormData();form.append("file",raw);
      const res=await fetch("/api/admin/data-import/employees/draft",{method:"POST",body:form});
      const json=await readJsonResponse(res);if(!res.ok||!json.success)throw new Error(json.error||"Save Draft failed");
      setDraftJobId(json.job_id);setDraftStatus(json.job_status||"draft");setPreviewRows(json.rows);setSummary(json.summary);swalSuccess("บันทึก Draft แล้ว ยังไม่ได้สร้างพนักงานจริง");await loadHistory();
    }catch(err){swalError(err.message||"บันทึก Draft ไม่สำเร็จ");}finally{setSavingDraft(false);}
  }
  async function handleOpenDraft(id){
    try{const res=await fetch(`/api/admin/data-import/employees/draft/${id}`,{cache:"no-store"});const json=await readJsonResponse(res);
      if(!res.ok||!json.success)throw new Error(json.error||"โหลด Draft ไม่สำเร็จ");
      setDraftJobId(id);setDraftStatus(json.job.status);setFile(null);setPreviewRows(json.rows);
      const valid=json.rows.filter(r=>r.valid).length;
      setSummary({total:json.rows.length,valid,invalid:json.rows.length-valid,insert:json.rows.filter(r=>r.valid&&r.action==="insert").length,update:json.rows.filter(r=>r.valid&&r.action==="update").length});
      setPreviewReady(true);swalSuccess("โหลด Draft สำเร็จ");
    }catch(err){swalError(err.message||"โหลด Draft ไม่สำเร็จ");}
  }
  async function handleOpenMapping(row){
    if(!draftJobId){swalError("กรุณาบันทึก Draft ก่อนแก้ Mapping");return;}
    try{if(!Object.keys(masterOptions).length){const res=await fetch("/api/admin/data-import/employees/master-options");const json=await readJsonResponse(res);if(!res.ok||!json.success)throw new Error(json.error||"โหลด Master ไม่สำเร็จ");setMasterOptions(json.options||{});setMasterRelations(json.relations||{});}
     setMappingRow(row);
    }catch(e){swalError(e.message);}
  }
  async function handleSaveMapping(id,mapping){
    const res=await fetch(`/api/admin/data-import/employees/draft/${draftJobId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({updates:[{id,mapping}]})});
    const json=await readJsonResponse(res);if(!res.ok||!json.success)throw new Error(json.error||"บันทึก Mapping ไม่สำเร็จ");
    setPreviewRows(json.rows);setSummary(json.summary);setDraftStatus(json.summary.invalid?"draft":"ready");setMappingRow(null);
    swalSuccess("บันทึก Mapping แล้ว ยังไม่ได้ Import พนักงาน");await loadHistory();
  }

  /* =========================================================
     Execute
  ========================================================= */

  function handleImport(){
    if(!draftJobId || !previewReady){swalError("กรุณาบันทึก Draft และตรวจ Mapping ก่อน");return;}
    if(summary.invalid>0 || draftStatus!=="ready"){swalError("ยังมีข้อมูลไม่ผ่าน Validation กรุณาแก้ Mapping ให้ครบ");return;}
    Modal.confirm({title:"ยืนยัน Import พนักงานจริง",content:`จะสร้างพนักงานจริง ${summary.insert} คน และอัปเดต ${summary.update} คน รหัสพนักงานใหม่จะออกจาก Running Number เดิม`,okText:"ยืนยัน Import จริง",cancelText:"กลับไปตรวจ",async onOk(){
      try{setImporting(true);const res=await fetch(`/api/admin/data-import/employees/draft/${draftJobId}/confirm`,{method:"POST"});const json=await readJsonResponse(res);if(!res.ok||!json.success)throw new Error(json.error||"Import ไม่สำเร็จ");
       swalSuccess(json.message);setDraftStatus("completed");setPreviewReady(false);setDraftJobId(null);setPreviewRows([]);setSummary({total:0,valid:0,invalid:0,insert:0,update:0});await loadHistory();
      }catch(e){swalError(e.message);throw e;}finally{setImporting(false);}
    }});
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
              title="นำเข้าข้อมูลพนักงาน"
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
            <Card
              size="small"
              style={{ marginTop: 12 }}
            >
              <Flex
                justify="space-between"
                align="center"
                gap={16}
                wrap="wrap"
              >
                <div>
                  <Text strong>
                    เปรียบเทียบรหัสพนักงานเก่า - ใหม่
                  </Text>

                  <div>
                    <Text type="secondary">
                      ตรวจสอบรหัสพนักงานจากระบบเดิม
                      และรหัสพนักงานใหม่ที่ออกโดยระบบ HRMS
                      หลังนำเข้าข้อมูล
                    </Text>
                  </div>
                </div>

                <Button
                  type="primary"
                  onClick={() =>
                    router.push("/admin/employee-code-mappings")
                  }
                >
                  ไปหน้าเทียบรหัสพนักงาน เก่า - ใหม่
                </Button>
              </Flex>
            </Card>
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
              previewReady && draftStatus === "ready"
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
              extra={<Space><Button onClick={handleSaveDraft} disabled={!previewReady||!!draftJobId||!canImport} loading={savingDraft}>บันทึก Draft</Button>{draftJobId&&<Text type="secondary">Draft: {draftJobId.slice(0,8)} · {draftStatus}</Text>}</Space>}
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
                  onEdit={draftJobId && ["draft","ready"].includes(draftStatus) ? handleOpenMapping : undefined}
                />
              )}
            </Card>

            <Card
              title="ประวัติการนำเข้าพนักงาน"
            >
              
              <Space wrap style={{marginBottom:12}}>{historyRows.filter(r=>["draft","ready"].includes(r.status)).map(r=><Button key={r.id} onClick={()=>handleOpenDraft(r.id)}>ทำ Mapping ต่อ: {r.file_name}</Button>)}</Space>
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
      <EmployeeMigrationMappingModal open={!!mappingRow} row={mappingRow} options={masterOptions} relations={masterRelations} onCancel={()=>setMappingRow(null)} onSave={handleSaveMapping}/>
    </div>
  );
}
