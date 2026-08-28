"use client";

import {
  useEffect,
} from "react";

import {
  Modal,
} from "antd";

import dayjs from "dayjs";

import EmployeeBankAccountForm from "./EmployeeBankAccountForm";

/* =========================================================
   Helpers
========================================================= */

function toDayjs(value) {
  if (!value) return null;
  const date = dayjs(value);
  return date.isValid()? date: null;
}

function formatBankAccountNo(
  value
) {
  const digits =
    String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(
      0,
      3
    )}-${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(
      0,
      3
    )}-${digits.slice(
      3,
      4
    )}-${digits.slice(4)}`;
  }

  return `${digits.slice(
    0,
    3
  )}-${digits.slice(
    3,
    4
  )}-${digits.slice(
    4,
    9
  )}-${digits.slice(9, 10)}`;
}

/* =========================================================
   Component
========================================================= */

export default function EmployeeBankAccountModal({
  open = false,

  form,

  editing = null,

  viewMode = false,

  saving = false,

  banks = [],
  paymentMethods = [],

  onCancel,
  onSubmit,
}) {
  /* =========================================================
     Set Form Values

     ทำหลัง Modal เปิดแล้วเท่านั้น
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * Edit / View
     */
    if (editing) {
      form.setFieldsValue({
        employee_id:
          editing.employee_id ||
          editing.employees?.id ||
          null,

        bank_id:
          editing.bank_id ||
          editing.banks?.id ||
          null,

        payment_method_id:
          editing.payment_method_id ||
          editing.payment_methods?.id ||
          null,

        account_no: formatBankAccountNo(editing.account_no),

        account_name:
          editing.account_name ||
          "",

        branch_name:
          editing.branch_name ||
          "",

        is_primary:
          Boolean(
            editing.is_primary
          ),

        effective_date:
          toDayjs(
            editing.effective_date
          ),

        expire_date:
          toDayjs(
            editing.expire_date
          ),

        status:
          editing.status ||
          "active",

        remark:
          editing.remark ||
          "",
      });

      return;
    }

    /*
     * Create
     */
    form.resetFields();

    form.setFieldsValue({
      employee_id:
        null,

      bank_id:
        null,

      payment_method_id:
        null,

      account_no:
        "",

      account_name:
        "",

      branch_name:
        "",

      is_primary:
        false,

      effective_date:
        dayjs(),

      expire_date:
        null,

      status:
        "active",

      remark:
        "",
    });
  }, [
    open,
    editing,
    form,
  ]);

  /* =========================================================
     Title
  ========================================================= */

  const title =
    viewMode
      ? "ดูบัญชีธนาคารพนักงาน"
      : editing
        ? "แก้ไขบัญชีธนาคารพนักงาน"
        : "เพิ่มบัญชีธนาคารพนักงาน";

  /* =========================================================
     Submit
  ========================================================= */

  const handleOk =
    async () => {
      if (viewMode) {
        onCancel?.();
        return;
      }

      try {
        const values =
          await form.validateFields();

        await onSubmit?.(
          values
        );
      } catch (error) {
        /*
         * Validation Error
         * AntD จะแสดงใต้ Field ให้อยู่แล้ว
         */
        if (
          error?.errorFields
        ) {
          return;
        }

        console.error(
          "EMPLOYEE_BANK_ACCOUNT_FORM_SUBMIT_ERROR:",
          error
        );
      }
    };

  /* =========================================================
     Render
  ========================================================= */

  return (
    <Modal
      open={open}
      title={title}
      width={860}
      centered
      forceRender
      mask={{
        closable: false,
      }}
      confirmLoading={
        saving
      }
      okText="บันทึก"
      cancelText={
        viewMode
          ? "ปิด"
          : "ยกเลิก"
      }

      okButtonProps={{
        style:
          viewMode
            ? {
                display:
                  "none",
              }
            : undefined,
      }}

      onCancel={
        onCancel
      }

      onOk={
        handleOk
      }
    >
      <div className="pt-4">
        <EmployeeBankAccountForm
          form={
            form
          }

          editing={
            editing
          }

          viewMode={
            viewMode
          }

          saving={
            saving
          }

          banks={
            banks
          }

          paymentMethods={
            paymentMethods
          }
        />
      </div>
    </Modal>
  );
}