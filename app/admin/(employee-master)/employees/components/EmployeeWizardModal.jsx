"use client";

import {
  Button,
  Space,
} from "antd";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  EditOutlined,
} from "@ant-design/icons";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";
import EmployeeWizardForm, {EMPLOYEE_WIZARD_STEPS,} from "./EmployeeWizardForm";

const LAST_STEP = EMPLOYEE_WIZARD_STEPS.length - 1;

export default function EmployeeWizardModal({
  open = false,

  title = "เพิ่มพนักงาน",

  mode = "create",

  form,

  currentStep = 0,

  saving = false,

  disabled = false,

  canEdit = false,

  selectedRecord = null,

  masterData = {},

  masterLoading = false,

  uploadLoading = false,

  onCancel,

  onSubmit,

  onEdit,

  onPrevious,

  onNext,

  onStepChange,

  onPhotoChange,
}) {
  const isViewMode =
    mode === "view";

  const isFirstStep =
    currentStep === 0;

  const isLastStep =
    currentStep === LAST_STEP;

  /*
    ป้องกัน currentStep เกินจำนวน Step
    กรณีมีการแก้ Step แล้ว State เก่ายังค้าง
  */
  const isValidStep =
    currentStep >= 0 &&
    currentStep <= LAST_STEP;

  /* =======================================================
     FOOTER
  ======================================================= */

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      {/* ===================================================
          LEFT ACTION
      =================================================== */}

      <div>
        {!isFirstStep &&
          isValidStep && (
            <Button
              icon={
                <ArrowLeftOutlined />
              }
              disabled={saving}
              onClick={onPrevious}
            >
              ย้อนกลับ
            </Button>
          )}
      </div>

      {/* ===================================================
          RIGHT ACTION
      =================================================== */}

      <Space wrap>
        <Button
          disabled={saving}
          onClick={onCancel}
        >
          {isViewMode
            ? "ปิด"
            : "ยกเลิก"}
        </Button>

        {/* -------------------------------------------------
            VIEW MODE
        ------------------------------------------------- */}

        {isViewMode &&
          canEdit && (
            <Button
              type="primary"
              icon={
                <EditOutlined />
              }
              disabled={saving}
              onClick={onEdit}
            >
              แก้ไขข้อมูล
            </Button>
          )}

        {/* -------------------------------------------------
            CREATE / EDIT:
            ยังไม่ถึง Step สุดท้าย
        ------------------------------------------------- */}

        {!isViewMode &&
          !isLastStep &&
          isValidStep && (
            <Button
              type="primary"
              icon={
                <ArrowRightOutlined />
              }
              iconPlacement="end"
              disabled={saving}
              onClick={onNext}
            >
              ถัดไป
            </Button>
          )}

        {/* -------------------------------------------------
            CREATE / EDIT:
            แสดงปุ่มบันทึกเฉพาะ Step สุดท้าย
        ------------------------------------------------- */}

        {!isViewMode &&
          isLastStep &&
          isValidStep && (
            <Button
              type="primary"
              icon={
                <CheckOutlined />
              }
              loading={saving}
              disabled={saving}
              onClick={onSubmit}
            >
              {mode === "edit"
                ? "บันทึกการแก้ไข"
                : "สร้างพนักงาน"}
            </Button>
          )}
      </Space>
    </div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <MasterModal
      open={open}
      title={title}
      width="98vw"
      saving={saving}
      footer={footer}
      onCancel={onCancel}
    >
      <EmployeeWizardForm
        form={form}
        mode={mode}
        currentStep={
          currentStep
        }
        disabled={disabled}
        selectedRecord={
          selectedRecord
        }
        masterData={masterData}
        masterLoading={
          masterLoading
        }
        uploadLoading={
          uploadLoading
        }
        onStepChange={
          onStepChange
        }
        onPhotoChange={
          onPhotoChange
        }
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}