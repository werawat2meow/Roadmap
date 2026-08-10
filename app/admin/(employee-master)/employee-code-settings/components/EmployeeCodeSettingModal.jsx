"use client";

import {
  Button,
  Space,
} from "antd";

import {
  EditOutlined,
} from "@ant-design/icons";

import {
  useEffect,
} from "react";

import dayjs from "dayjs";

import MasterModal from "@/app/admin/(employee-master)/components/master/MasterModal";

import EmployeeCodeSettingForm from "./EmployeeCodeSettingForm";

export default function EmployeeCodeSettingModal({
  open = false,

  title = "ตั้งค่ารหัสพนักงาน",

  mode = "create",

  form,

  companies = [],

  companyLoading = false,

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

  /*
    page.jsx ส่ง effective_date และ expire_date
    มาเป็น String จาก API

    DatePicker ของ Ant Design ต้องใช้ dayjs
  */

  useEffect(() => {
    if (!open || !form) {
      return;
    }

    const values =
      form.getFieldsValue(true);

    const nextValues = {};

    if (values.effective_date) {
      nextValues.effective_date =
        dayjs.isDayjs(
          values.effective_date
        )
          ? values.effective_date
          : dayjs(
              values.effective_date
            );
    }

    if (values.expire_date) {
      nextValues.expire_date =
        dayjs.isDayjs(
          values.expire_date
        )
          ? values.expire_date
          : dayjs(
              values.expire_date
            );
    } else {
      nextValues.expire_date = null;
    }

    if (
      Object.keys(nextValues).length > 0
    ) {
      form.setFieldsValue(nextValues);
    }
  }, [
    open,
    form,
    selectedRecord,
  ]);

  return (
    <MasterModal
      open={open}
      title={title}
      width={1050}
      saving={saving}
      okText={
        isViewMode
          ? "ปิด"
          : "บันทึก"
      }
      cancelText={
        isViewMode
          ? "ยกเลิก"
          : "ยกเลิก"
      }
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

      <EmployeeCodeSettingForm
        form={form}
        companies={companies}
        companyLoading={
          companyLoading
        }
        disabled={disabled}
        onFinish={onSubmit}
      />
    </MasterModal>
  );
}