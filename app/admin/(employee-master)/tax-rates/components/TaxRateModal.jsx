"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Modal,
} from "antd";

import dayjs from "dayjs";

import TaxRateForm from "./TaxRateForm";

function getInitialValues() {
  const now =
    dayjs();

  return {
    company_id:
      undefined,

    tax_rate_code:
      "",

    tax_rate_name:
      "",

    tax_year:
      now.year(),

    calculation_method:
      "progressive",

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

    brackets: [
      {
        income_min:
          0,

        income_max:
          null,

        tax_rate_percent:
          0,
      },
    ],
  };
}

function toDayjs(
  value
) {
  return value
    ? dayjs(value)
    : null;
}

export default function TaxRateModal({
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
            selected
              .company_id,
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
          selected
            .company_id,

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
      company_id:
        selected.company_id,

      tax_rate_code:
        selected.tax_rate_code,

      tax_rate_name:
        selected.tax_rate_name,

      tax_year:
        selected.tax_year,

      calculation_method:
        selected
          .calculation_method,

      effective_date:
        toDayjs(
          selected
            .effective_date
        ),

      expire_date:
        toDayjs(
          selected
            .expire_date
        ),

      status:
        selected.status,

      is_default:
        Boolean(
          selected
            .is_default
        ),

      remark:
        selected.remark,

      brackets:
        Array.isArray(
          selected.brackets
        ) &&
        selected.brackets
          .length >
          0
          ? selected.brackets.map(
              (item) => ({
                income_min:
                  Number(
                    item.income_min ||
                    0
                  ),

                income_max:
                  item.income_max ===
                    null ||
                  item.income_max ===
                    undefined
                    ? null
                    : Number(
                        item.income_max
                      ),

                tax_rate_percent:
                  Number(
                    item.tax_rate_percent ||
                    0
                  ),
              })
            )
          : [
              {
                income_min:
                  0,
                income_max:
                  null,
                tax_rate_percent:
                  0,
              },
            ],
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode === "view"
      ? "รายละเอียดอัตราภาษี"
      : mode === "edit"
        ? "แก้ไขอัตราภาษี"
        : "เพิ่มอัตราภาษี";

  return (
    <Modal
      open={open}
      forceRender
      mask={{
        closable:
          false,
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
      <TaxRateForm
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
