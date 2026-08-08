"use client";

import {
  Button,
  Modal,
} from "antd";

import PayrollGroupForm from "./PayrollGroupForm";
import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

export default function PayrollGroupModal({
  open,

  title = "กลุ่มเงินเดือน",

  form,

  payrollCompanies = [],

  saving = false,

  disabled = false,

  onCancel,

  onSubmit,

  onFinish,
}) {
  /* =========================
     View Mode
  ========================= */
  if (disabled) {
    return (
      <Modal
        open={open}
        title={title}
        width={900}
        forceRender
        destroyOnHidden
        mask={{
          closable: true,
        }}
        keyboard
        onCancel={onCancel}
        footer={
          <Button
            type="primary"
            onClick={onCancel}
          >
            ปิด
          </Button>
        }
      >
        <div className="pt-5">
          <PayrollGroupForm
            form={form}
            payrollCompanies={payrollCompanies}
            disabled
            onFinish={onFinish}
          />
        </div>
      </Modal>
    );
  }

  /* =========================
     Create / Edit Mode
  ========================= */
  return (
    <MasterModal
      open={open}
      title={title}
      width={900}
      saving={saving}
      okText="บันทึก"
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <PayrollGroupForm
        form={form}
        payrollCompanies={payrollCompanies}
        disabled={false}
        onFinish={onFinish}
      />
    </MasterModal>
  );
}