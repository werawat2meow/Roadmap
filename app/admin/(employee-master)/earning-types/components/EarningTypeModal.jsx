"use client";

import {
  useEffect,
  useMemo,
} from "react";

import { Modal } from "antd";
import dayjs from "dayjs";

import EarningTypeForm from "./EarningTypeForm";

function getInitialValues() {
  return {
    company_id: undefined,
    earning_code: "",
    earning_name: "",
    description: null,
    earning_category: "salary",
    calculation_method: "fixed",
    default_amount: 0,
    taxable: true,
    social_security_applicable: false,
    provident_fund_applicable: false,
    include_in_gross_pay: true,
    is_recurring: true,
    effective_date: dayjs(),
    expire_date: null,
    status: "active",
    sort_order: 0,
    remark: null,
  };
}

export default function EarningTypeModal({
  open,
  form,
  mode = "create",
  selected = null,
  saving = false,
  onCancel,
  onFinish,
}) {
  const disabled = mode === "view";

  const companyInitialOption =
    useMemo(() => {
      const company = selected?.companies;

      if (!selected?.company_id) {
        return null;
      }

      if (!company) {
        return {
          value: selected.company_id,
          label: "บริษัทที่เลือก",
        };
      }

      const name =
        company.company_name_th ||
        company.company_name_en ||
        "-";

      return {
        value: selected.company_id,
        label: company.company_code
          ? `${company.company_code} - ${name}`
          : name,
      };
    }, [selected]);

  useEffect(() => {
    if (!open) return;

    if (!selected) {
      form.resetFields();
      form.setFieldsValue(
        getInitialValues()
      );
      return;
    }

    form.resetFields();

    form.setFieldsValue({
      ...selected,

      effective_date:
        selected.effective_date
          ? dayjs(selected.effective_date)
          : dayjs(),

      expire_date:
        selected.expire_date
          ? dayjs(selected.expire_date)
          : null,

      default_amount:
        selected.default_amount === null ||
        selected.default_amount === undefined
          ? null
          : Number(selected.default_amount),
    });
  }, [open, selected, form]);

  const title =
    mode === "view"
      ? "รายละเอียดประเภทเงินได้"
      : mode === "edit"
        ? "แก้ไขประเภทเงินได้"
        : "เพิ่มประเภทเงินได้";

  return (
    <Modal
      open={open}
      forceRender
      mask={{ closable: false }}
      title={title}
      width={980}
      okText={
        mode === "view"
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      confirmLoading={saving}
      cancelButtonProps={{
        style:
          mode === "view"
            ? { display: "none" }
            : undefined,
      }}
      onCancel={onCancel}
      onOk={() => {
        if (mode === "view") {
          onCancel?.();
          return;
        }

        form.submit();
      }}
    >
      <EarningTypeForm
        form={form}
        disabled={disabled}
        companyInitialOption={
          companyInitialOption
        }
        onFinish={onFinish}
      />
    </Modal>
  );
}
