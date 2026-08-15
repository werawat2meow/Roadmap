"use client";

import {
  Form,
  Modal,
} from "antd";

import {
  useEffect,
} from "react";

import PositionForm from "./PositionForm";

export default function PositionModal({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading,
}) {
  const [form] =
    Form.useForm();

  /* =========================================================
     Set Form
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    /* =======================================================
       Edit
    ======================================================= */

    if (initialValues) {
      form.resetFields();

      form.setFieldsValue({
        ...initialValues,

        /*
         * รองรับกรณี API ส่ง family.id
         * หรือ position_family_id
         */
        position_family_id:
          initialValues
            .position_family_id ||
          initialValues
            .family?.id ||
          null,

        /*
         * Select mode=multiple
         * ต้องการ UUID[]
         */
        position_levels:
          Array.isArray(
            initialValues.levels
          )
            ? initialValues
                .levels
                .map(
                  (item) =>
                    item.id
                )
                .filter(Boolean)
            : [],
      });

      return;
    }

    /* =======================================================
       Create
    ======================================================= */

    form.resetFields();

    form.setFieldsValue({
      status: "active",

      is_manager: false,

      is_executive: false,

      allow_multiple_assignment:
        false,

      position_family_id:
        null,

      position_levels: [],
    });
  }, [
    open,
    initialValues,
    form,
  ]);

  /* =========================================================
     Submit
  ========================================================= */

  async function handleFinish() {
    try {
      const values =
        await form.validateFields();

      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (err) {
      console.error(
        "POSITION_FORM_ERROR",
        err
      );
    }
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <Modal
      open={open}

      width={900}

      destroyOnHidden

      mask={{
        closable: false,
      }}

      title={
        initialValues
          ? "แก้ไขตำแหน่ง"
          : "เพิ่มตำแหน่ง"
      }

      okText="บันทึก"

      cancelText="ยกเลิก"

      confirmLoading={
        loading
      }

      onCancel={
        onCancel
      }

      onOk={
        handleFinish
      }
    >
      <PositionForm
        form={form}

        /*
         * สำคัญมาก
         * ส่งข้อมูล row เดิมลงไป
         * เพื่อสร้าง Label ตอน Edit
         */
        initialValues={
          initialValues
        }

        disabled={
          loading
        }
      />
    </Modal>
  );
}