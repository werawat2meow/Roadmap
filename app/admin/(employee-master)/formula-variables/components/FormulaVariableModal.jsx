"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Modal,
} from "antd";

import dayjs from "dayjs";

import FormulaVariableForm from "./FormulaVariableForm";

function getInitialValues() {
  return {
    company_id:
      undefined,

    variable_code:
      "",

    variable_name:
      "",

    description:
      null,

    data_type:
      "number",

    source_type:
      "custom",

    source_key:
      null,

    default_value:
      null,

    is_required:
      false,

    status:
      "active",

    sort_order:
      0,

    remark:
      null,
  };
}

function normalizeDefaultValueForForm(
  dataType,
  value
) {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

  if (
    dataType ===
      "number" ||
    dataType ===
      "integer"
  ) {
    const number =
      Number(
        value
      );

    return Number.isFinite(
      number
    )
      ? number
      : null;
  }

  if (
    dataType ===
    "boolean"
  ) {
    const normalized =
      String(
        value
      ).toLowerCase();

    return [
      "true",
      "1",
    ].includes(
      normalized
    )
      ? "true"
      : "false";
  }

  if (
    dataType ===
    "date"
  ) {
    const date =
      dayjs(
        value
      );

    return date.isValid()
      ? date
      : null;
  }

  return String(
    value
  );
}

export default function FormulaVariableModal({
  open,
  form,
  mode = "create",
  selected = null,
  saving = false,
  onCancel,
  onFinish,
}) {
  const disabled =
    mode ===
    "view";

  const systemProtected =
    selected?.is_system ===
    true;

  const companyInitialOption =
    useMemo(() => {
      const company =
        selected?.companies;

      if (
        !selected
          ?.company_id
      ) {
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
        company
          .company_name_th ||
        company
          .company_name_en ||
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

      default_value:
        normalizeDefaultValueForForm(
          selected.data_type,
          selected.default_value
        ),
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode ===
    "view"
      ? "รายละเอียดตัวแปรสูตรคำนวณ"
      : mode ===
          "edit"
        ? "แก้ไขตัวแปรสูตรคำนวณ"
        : "เพิ่มตัวแปรสูตรคำนวณ";

  return (
    <Modal
      open={
        open
      }
      forceRender
      mask={{
        closable:
          false,
      }}
      title={
        title
      }
      width={980}
      okText={
        mode ===
        "view"
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      confirmLoading={
        saving
      }
      cancelButtonProps={{
        style:
          mode ===
          "view"
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
        if (
          mode ===
          "view"
        ) {
          onCancel?.();

          return;
        }

        form.submit();
      }}
    >
      <FormulaVariableForm
        form={
          form
        }
        disabled={
          disabled
        }
        systemProtected={
          systemProtected
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
