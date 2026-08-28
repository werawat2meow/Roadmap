"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Modal,
} from "antd";

import dayjs from "dayjs";

import PayrollPeriodForm from "./PayrollPeriodForm";

function getInitialValues() {
  const now =
    dayjs();

  return {
    company_id:
      undefined,

    payroll_group_id:
      undefined,

    period_code:
      "",

    period_name:
      "",

    period_year:
      now.year(),

    period_no:
      now.month() +
      1,

    period_start_date:
      now.startOf(
        "month"
      ),

    period_end_date:
      now.endOf(
        "month"
      ),

    cutoff_start_date:
      null,

    cutoff_end_date:
      null,

    payment_date:
      now.endOf(
        "month"
      ),

    status:
      "draft",

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

export default function PayrollPeriodModal({
  open,
  form,
  mode = "create",
  selected = null,
  saving = false,
  onCancel,
  onFinish,
}) {
  const locked =
    selected
      ?.is_locked ===
    true;

  const disabled =
    mode === "view" ||
    locked;

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

  const groupInitialOption =
    useMemo(() => {
      const group =
        selected
          ?.payroll_groups;

      if (
        !selected
          ?.payroll_group_id
      ) {
        return null;
      }

      if (!group) {
        return {
          value:
            selected
              .payroll_group_id,

          label:
            "กลุ่มเงินเดือนที่เลือก",
        };
      }

      const code =
        group.payroll_group_code ||
        "";

      const name =
        group.payroll_group_name ||
        "กลุ่มเงินเดือน";

      return {
        value:
          selected
            .payroll_group_id,

        label:
          code
            ? `${code} - ${name}`
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

      period_start_date:
        toDayjs(
          selected
            .period_start_date
        ),

      period_end_date:
        toDayjs(
          selected
            .period_end_date
        ),

      cutoff_start_date:
        toDayjs(
          selected
            .cutoff_start_date
        ),

      cutoff_end_date:
        toDayjs(
          selected
            .cutoff_end_date
        ),

      payment_date:
        toDayjs(
          selected
            .payment_date
        ),
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode === "view"
      ? "รายละเอียดงวดเงินเดือน"
      : mode === "edit"
        ? "แก้ไขงวดเงินเดือน"
        : "เพิ่มงวดเงินเดือน";

  return (
    <Modal
      open={open}
      forceRender
      mask={{
        closable:
          false,
      }}
      title={title}
      width={980}
      okText={
        mode === "view" ||
        locked
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      confirmLoading={
        saving
      }
      cancelButtonProps={{
        style:
          mode === "view" ||
          locked
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
          mode === "view" ||
          locked
        ) {
          onCancel?.();
          return;
        }

        form.submit();
      }}
    >
      <PayrollPeriodForm
        form={form}
        disabled={
          disabled
        }
        locked={
          locked
        }
        companyInitialOption={
          companyInitialOption
        }
        groupInitialOption={
          groupInitialOption
        }
        onFinish={
          onFinish
        }
      />
    </Modal>
  );
}
