"use client";

import {
  useEffect,
  useMemo,
} from "react";

import { Modal } from "antd";
import dayjs from "dayjs";

import DeductionTypeForm from "./DeductionTypeForm";

function getInitialValues() {
  return {
    company_id: undefined,
    deduction_code: "",
    deduction_name: "",
    description: null,
    deduction_category: "other",
    calculation_method: "fixed",
    default_amount: 0,
    is_statutory: false,
    reduce_taxable_income: false,
    include_in_net_pay: true,
    is_recurring: true,
    effective_date: dayjs(),
    expire_date: null,
    status: "active",
    sort_order: 0,
    remark: null,
  };
}

export default function DeductionTypeModal({
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
      ? "รายละเอียดประเภทรายการหัก"
      : mode === "edit"
        ? "แก้ไขประเภทรายการหัก"
        : "เพิ่มประเภทรายการหัก";

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
      <DeductionTypeForm
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
