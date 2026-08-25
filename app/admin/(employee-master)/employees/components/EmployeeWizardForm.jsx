"use client";

import {
  Form,
  Steps,
} from "antd";

import {
  ApartmentOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ContactsOutlined,
  HistoryOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

import EmployeePersonalStep from "./steps/EmployeePersonalStep";
import EmployeeContactStep from "./steps/EmployeeContactStep";
import EmployeeOrganizationStep from "./steps/EmployeeOrganizationStep";
import EmployeeEmploymentStep from "./steps/EmployeeEmploymentStep";
import EmployeePayrollStep from "./steps/EmployeePayrollStep";
import EmployeeAccountStep from "./steps/EmployeeAccountStep";
import EmployeeReviewStep from "./steps/EmployeeReviewStep";
import EmployeeWorkHistoryStep from "./steps/EmployeeWorkHistoryStep";

/* =========================================================
   STEPS
========================================================= */

export const EMPLOYEE_WIZARD_STEPS = [
  {
    title: "ข้อมูลส่วนตัว",
    icon: <IdcardOutlined />,
  },
  {
    title: "ข้อมูลติดต่อ",
    icon: <ContactsOutlined />,
  },
  {
    title: "องค์กรและกลุ่มงาน",
    icon: <ApartmentOutlined />,
  },
  {
    title: "การจ้างงาน",
    icon: <SolutionOutlined />,
  },
  {
    title: "ประวัติการทำงาน",
    icon: <HistoryOutlined />,
  },
  {
    title: "Payroll",
    icon: <BankOutlined />,
  },
  {
    title: "บัญชีและสิทธิ์",
    icon:
      <SafetyCertificateOutlined />,
  },
  {
    title: "ตรวจสอบข้อมูล",
    icon:
      <CheckCircleOutlined />,
  },
];

/* =========================================================
   STEP FIELDS
========================================================= */

export const EMPLOYEE_STEP_FIELDS = {
  0: [
    "title_id",
    "first_name_th",
    "middle_name_th",
    "last_name_th",
    "first_name_en",
    "middle_name_en",
    "last_name_en",
    "nickname_th",
    "nickname_en",
    "gender_id",
    "birth_date",
    "country_id",

    "birth_province_code",
    "birth_district_code",
    "birth_subdistrict_code",
    "birth_postcode",
    "birth_place",

    "blood_group",
    "marital_status_id",
    "religion_id",
    "nationality_id",
    "citizen_id",
    "passport_no",
    "passport_expire_date",
    "employee_photo_path",
    "employee_photo_url",
  ],

  1: [
    "mobile_phone",
    "home_phone",
    "work_phone",

    "personal_email",
    "work_email",

    "line_id",

    "tax_id",
    "social_security_no",
  ],

  2: [
    "company_id",
    "branch_group_id",
    "branch_id",

    "department_id",
    "division_id",
    "unit_id",


    "position_family_id",
    "position_level_id",
    "position_id",
    "job_id",

    "business_unit_id",
    "cost_center_id",
    "profit_center_id",
  ],

  3: [
    "employment_type_id",
    "employee_status_id",

    "start_work_date",

    "probation_days",
    "probation_end_date",
    "probation_status",

    "confirmation_date",
    "termination_date",
    "resignation_date",
    "retirement_date",

    "status",
  ],
  4: ["work_histories"],

  5: [
    "payroll_company_id",
    "payroll_type_id",
    "payroll_group_id",
    "position_level_band_id",
    "base_salary",
  ],

  6: [
    "employee_code_setting_id",
    "employee_type",
    "running_date",

    "create_user_account",
    "role_id",
    "auth_email",
    "account_is_active",
    "update_user_account",
  ],

  7: [
    "remark",
  ],
};

/* =========================================================
   COMPONENT
========================================================= */

export default function EmployeeWizardForm({
  form,
  mode = "create",
  currentStep = 0,
  disabled = false,
  selectedRecord = null,
  masterData = {},
  masterLoading = false,
  uploadLoading = false,
  onStepChange,
  onPhotoChange,
  onFinish,
}) {
  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <EmployeePersonalStep
            form={form}
            disabled={disabled}
            masterData={masterData}
            masterLoading={masterLoading}
            uploadLoading={uploadLoading}
            onPhotoChange={onPhotoChange}
          />
        );

      case 1:
        return (
          <EmployeeContactStep
            form={form}
            disabled={disabled}
          />
        );

      case 2:
        return (
          <EmployeeOrganizationStep
            form={form}
            disabled={disabled}
            masterData={
              masterData
            }
            masterLoading={
              masterLoading
            }
          />
        );

      case 3:
        return (
          <EmployeeEmploymentStep
            form={form}
            disabled={disabled}
            masterData={
              masterData
            }
            masterLoading={
              masterLoading
            }
          />
        );

      case 4:
        return (
          <EmployeeWorkHistoryStep
            form={form}
            disabled={disabled}
          />
        );

      case 5:
        return (
          <EmployeePayrollStep
            form={form}
            mode={mode}
            disabled={disabled}
            masterData={
              masterData
            }
            masterLoading={
              masterLoading
            }
          />
        );

      case 6:
        return (
          <EmployeeAccountStep
            form={form}
            mode={mode}
            disabled={disabled}
            selectedRecord={
              selectedRecord
            }
            masterData={
              masterData
            }
            masterLoading={
              masterLoading
            }
          />
        );

      case 7:
        return (
          <EmployeeReviewStep
            form={form}
            mode={mode}
            selectedRecord={
              selectedRecord
            }
            masterData={
              masterData
            }
          />
        );

      default:
        return null;
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      preserve
      scrollToFirstError={{
        behavior: "smooth",
        block: "center",
      }}
    >
      <Steps
        current={currentStep}
        items={EMPLOYEE_WIZARD_STEPS}
        responsive
        className="mb-8"
        onChange={(step) => {
          onStepChange?.(step);
        }}
      />

      <div className="min-h-[480px]">
        {renderStep()}
      </div>
    </Form>
  );
}