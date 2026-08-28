"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Modal,
} from "antd";

import PayrollRunForm from "./PayrollRunForm";

function getInitialValues() {
  return {
    company_id:
      undefined,

    payroll_period_id:
      undefined,

    run_code:
      "",

    run_name:
      "",

    run_type:
      "regular",

    remark:
      null,
  };
}

export default function PayrollRunModal({
  open,
  form,
  mode = "create",
  selected = null,
  saving = false,
  onCancel,
  onFinish,
}) {
  const disabled =
    mode === "view" ||
    (
      selected &&
      selected.status !==
        "draft"
    );

  const companyInitialOption =
    useMemo(() => {
      const company =
        selected?.companies;

      if (
        !selected?.company_id
      ) {
        return null;
      }

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

  const periodInitialOption =
    useMemo(() => {
      const period =
        selected
          ?.payroll_periods;

      if (
        !selected
          ?.payroll_period_id
      ) {
        return null;
      }

      if (!period) {
        return {
          value:
            selected
              .payroll_period_id,
          label:
            "งวดเงินเดือนที่เลือก",
        };
      }

      return {
        value:
          selected
            .payroll_period_id,

        label:
          `${period.period_code || "-"} - ${period.period_name || "-"}`,
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

      payroll_period_id:
        selected
          .payroll_period_id,

      run_code:
        selected.run_code,

      run_name:
        selected.run_name,

      run_type:
        selected.run_type,

      remark:
        selected.remark,
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode === "view"
      ? "รายละเอียด Payroll Run"
      : mode === "edit"
        ? "แก้ไข Payroll Run"
        : "สร้าง Payroll Run";

  return (
    <Modal
      open={open}
      forceRender
      mask={{
        closable:
          false,
      }}
      title={title}
      width={900}
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
      <PayrollRunForm
        form={form}
        disabled={
          disabled
        }
        companyInitialOption={
          companyInitialOption
        }
        periodInitialOption={
          periodInitialOption
        }
        onFinish={
          onFinish
        }
      />
    </Modal>
  );
}
