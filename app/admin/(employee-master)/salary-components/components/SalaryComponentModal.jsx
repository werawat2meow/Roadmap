"use client";

import {
  Button,
  Modal,
} from "antd";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import SalaryComponentForm from "./SalaryComponentForm";

export default function SalaryComponentModal({
  open,

  title = "รายการเงินเดือน",

  form,

  saving = false,

  disabled = false,

  onCancel,

  onSubmit,
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
          <SalaryComponentForm
            form={form}
            disabled
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
      destroyOnHidden
      okText="บันทึก"
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <SalaryComponentForm
        form={form}
        disabled={false}
      />
    </MasterModal>
  );
}