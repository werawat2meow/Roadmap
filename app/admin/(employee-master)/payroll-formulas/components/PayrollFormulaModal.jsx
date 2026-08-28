"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Modal,
} from "antd";

import dayjs from "dayjs";

import PayrollFormulaForm from "./PayrollFormulaForm";

function getInitialValues() {
  return {
    company_id:
      undefined,

    formula_code:
      "",

    formula_name:
      "",

    description:
      null,

    formula_type:
      "general",

    formula_expression:
      "",

    calculation_order:
      0,

    rounding_method:
      "round",

    decimal_places:
      2,

    minimum_amount:
      null,

    maximum_amount:
      null,

    effective_date:
      dayjs(),

    expire_date:
      null,

    status:
      "active",

    sort_order:
      0,

    remark:
      null,
  };
}

export default function PayrollFormulaModal({
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

  const systemProtected =
    selected?.is_system ===
    true;

  const companyInitialOption =
    useMemo(() => {
      const company =
        selected?.companies;

      if (!selected?.company_id) {
        return null;
      }

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
          ? dayjs(
              selected.effective_date
            )
          : dayjs(),

      expire_date:
        selected.expire_date
          ? dayjs(
              selected.expire_date
            )
          : null,

      minimum_amount:
        selected.minimum_amount ===
          null ||
        selected.minimum_amount ===
          undefined
          ? null
          : Number(
              selected.minimum_amount
            ),

      maximum_amount:
        selected.maximum_amount ===
          null ||
        selected.maximum_amount ===
          undefined
          ? null
          : Number(
              selected.maximum_amount
            ),
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode === "view"
      ? "รายละเอียดสูตรการคำนวณเงินเดือน"
      : mode === "edit"
        ? "แก้ไขสูตรการคำนวณเงินเดือน"
        : "เพิ่มสูตรการคำนวณเงินเดือน";

  return (
    <Modal
      open={open}
      forceRender
      mask={{
        closable: false,
      }}
      title={title}
      width={1120}
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
            ? {
                display: "none",
              }
            : undefined,
      }}
      onCancel={onCancel}
      onOk={() => {
        if (
          mode === "view"
        ) {
          onCancel?.();
          return;
        }

        form.submit();
      }}
    >
      <PayrollFormulaForm
        form={form}
        disabled={disabled}
        systemProtected={
          systemProtected
        }
        companyInitialOption={
          companyInitialOption
        }
        onFinish={onFinish}
      />
    </Modal>
  );
}
