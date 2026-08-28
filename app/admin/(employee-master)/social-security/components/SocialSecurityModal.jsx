"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Modal,
} from "antd";

import dayjs from "dayjs";

import SocialSecurityForm from "./SocialSecurityForm";

function getInitialValues() {
  const now =
    dayjs();

  return {
    company_id:
      undefined,

    setting_code:
      "",

    setting_name:
      "",

    scheme_type:
      "section_33",

    contribution_method:
      "percentage",

    wage_base_min:
      0,

    wage_base_max:
      null,

    employee_rate_percent:
      0,

    employer_rate_percent:
      0,

    employee_contribution_min:
      null,

    employee_contribution_max:
      null,

    employer_contribution_min:
      null,

    employer_contribution_max:
      null,

    fixed_employee_amount:
      null,

    fixed_employer_amount:
      null,

    effective_date:
      now.startOf(
        "year"
      ),

    expire_date:
      now.endOf(
        "year"
      ),

    status:
      "active",

    is_default:
      false,

    remark:
      null,
  };
}

function toDayjs(
  value
) {
  return value
    ? dayjs(value)
    : null;
}

export default function SocialSecurityModal({
  open,
  form,
  mode = "create",
  selected = null,
  saving = false,
  onCancel,
  onFinish,
}) {
  const disabled =
    mode === "view";

  const companyInitialOption =
    useMemo(() => {
      if (
        !selected?.company_id
      ) {
        return null;
      }

      const company =
        selected.companies;

      if (!company) {
        return {
          value:
            selected.company_id,
          label:
            "บริษัทที่เลือก",
        };
      }

      const name =
        company.company_name_th ||
        company.company_name_en ||
        "-";

      return {
        value:
          selected.company_id,

        label:
          company.company_code
            ? `${company.company_code} - ${name}`
            : name,
      };
    }, [
      selected,
    ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();

    if (!selected) {
      form.setFieldsValue(
        getInitialValues()
      );

      return;
    }

    form.setFieldsValue({
      ...selected,

      wage_base_min:
        Number(
          selected.wage_base_min ||
          0
        ),

      wage_base_max:
        selected.wage_base_max ===
          null ||
        selected.wage_base_max ===
          undefined
          ? null
          : Number(
              selected.wage_base_max
            ),

      employee_rate_percent:
        Number(
          selected.employee_rate_percent ||
          0
        ),

      employer_rate_percent:
        Number(
          selected.employer_rate_percent ||
          0
        ),

      employee_contribution_min:
        selected.employee_contribution_min ===
          null ||
        selected.employee_contribution_min ===
          undefined
          ? null
          : Number(
              selected.employee_contribution_min
            ),

      employee_contribution_max:
        selected.employee_contribution_max ===
          null ||
        selected.employee_contribution_max ===
          undefined
          ? null
          : Number(
              selected.employee_contribution_max
            ),

      employer_contribution_min:
        selected.employer_contribution_min ===
          null ||
        selected.employer_contribution_min ===
          undefined
          ? null
          : Number(
              selected.employer_contribution_min
            ),

      employer_contribution_max:
        selected.employer_contribution_max ===
          null ||
        selected.employer_contribution_max ===
          undefined
          ? null
          : Number(
              selected.employer_contribution_max
            ),

      fixed_employee_amount:
        selected.fixed_employee_amount ===
          null ||
        selected.fixed_employee_amount ===
          undefined
          ? null
          : Number(
              selected.fixed_employee_amount
            ),

      fixed_employer_amount:
        selected.fixed_employer_amount ===
          null ||
        selected.fixed_employer_amount ===
          undefined
          ? null
          : Number(
              selected.fixed_employer_amount
            ),

      effective_date:
        toDayjs(
          selected.effective_date
        ),

      expire_date:
        toDayjs(
          selected.expire_date
        ),

      is_default:
        Boolean(
          selected.is_default
        ),
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode === "view"
      ? "รายละเอียดประกันสังคม"
      : mode === "edit"
        ? "แก้ไขประกันสังคม"
        : "เพิ่มการตั้งค่าประกันสังคม";

  return (
    <Modal
      open={open}
      forceRender
      mask={{
        closable: false,
      }}
      title={title}
      width={1050}
      okText={
        disabled
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      confirmLoading={
        saving
      }
      cancelButtonProps={{
        style:
          disabled
            ? {
                display:
                  "none",
              }
            : undefined,
      }}
      onCancel={
        onCancel
      }
      onOk={() => {
        if (disabled) {
          onCancel?.();
          return;
        }

        form.submit();
      }}
    >
      <SocialSecurityForm
        form={form}
        disabled={
          disabled
        }
        companyInitialOption={
          companyInitialOption
        }
        onFinish={
          onFinish
        }
      />
    </Modal>
  );
}
