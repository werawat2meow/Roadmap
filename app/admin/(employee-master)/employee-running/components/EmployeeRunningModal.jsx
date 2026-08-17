"use client";

import {
  Button,
} from "antd";

import {
  EditOutlined,
} from "@ant-design/icons";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import EmployeeRunningForm from "./EmployeeRunningForm";

export default function EmployeeRunningModal({
  open = false,

  title = "Running Number",

  mode = "create",

  form,

  companies = [],

  settings = [],

  companyLoading = false,

  settingLoading = false,

  saving = false,

  disabled = false,

  canEdit = false,

  selectedRecord = null,

  onCancel,

  onSubmit,

  onEdit,
}) {
  const isViewMode =
    mode === "view";

  return (
    <MasterModal
      open={open}
      title={title}
      width={1000}
      saving={saving}
      okText={
        isViewMode
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onSubmit={
        isViewMode
          ? onCancel
          : onSubmit
      }
    >
      {isViewMode && canEdit && (
        <div className="mb-4 flex justify-end">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
          >
            แก้ไขข้อมูล
          </Button>
        </div>
      )}

      <EmployeeRunningForm
        form={form}
        mode={mode}
        companies={companies}
        settings={settings}
        companyLoading={
          companyLoading
        }
        settingLoading={
          settingLoading
        }
        disabled={disabled}
        selectedRecord={
          selectedRecord
        }
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}