"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Divider,
  Modal,
  Typography,
} from "antd";

import dayjs from "dayjs";

import HrPolicyForm from "./HrPolicyForm";
import HrPolicyVersionHistory from "./HrPolicyVersionHistory";

const {
  Title,
} = Typography;

function getInitialValues() {
  return {
    company_id:
      undefined,
    policy_code:
      "",
    policy_name:
      "",
    policy_category:
      "general",
    description:
      null,
    owner_department:
      "Human Resources",
    status:
      "draft",
    effective_date:
      null,
    expire_date:
      null,
    is_mandatory:
      false,
    version_title:
      "Initial Release",
    content:
      "",
    change_summary:
      "สร้างนโยบายฉบับแรก",
  };
}

function toDayjs(value) {
  return value
    ? dayjs(value)
    : null;
}

export default function HrPolicyModal({
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

  const companyInitialOption =
    useMemo(() => {
      if (
        !selected?.company_id
      ) {
        return null;
      }

      const company =
        selected.companies;

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

    form.resetFields();

    if (!selected) {
      form.setFieldsValue(
        getInitialValues()
      );

      return;
    }

    const version =
      selected.current_version ||
      {};

    form.setFieldsValue({
      company_id:
        selected.company_id,
      policy_code:
        selected.policy_code,
      policy_name:
        selected.policy_name,
      policy_category:
        selected.policy_category,
      description:
        selected.description,
      owner_department:
        selected.owner_department,
      status:
        selected.status,
      effective_date:
        toDayjs(
          selected.effective_date
        ),
      expire_date:
        toDayjs(
          selected.expire_date
        ),
      is_mandatory:
        Boolean(
          selected.is_mandatory
        ),
      version_title:
        version.version_title,
      content:
        version.content || "",
      change_summary:
        version.change_summary,
    });
  }, [
    open,
    selected,
    form,
  ]);

  const title =
    mode === "view"
      ? "รายละเอียดนโยบายบริษัท"
      : mode === "edit"
        ? "แก้ไขนโยบายบริษัท"
        : "เพิ่มนโยบายบริษัท";

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
        disabled
          ? "ปิด"
          : "บันทึก"
      }
      cancelText="ยกเลิก"
      confirmLoading={saving}
      cancelButtonProps={{
        style:
          disabled
            ? {
                display:
                  "none",
              }
            : undefined,
      }}
      onCancel={onCancel}
      onOk={() => {
        if (disabled) {
          onCancel?.();
          return;
        }

        form.submit();
      }}
    >
      <HrPolicyForm
        form={form}
        disabled={disabled}
        companyInitialOption={
          companyInitialOption
        }
        onFinish={onFinish}
      />

      {selected &&
        Array.isArray(
          selected.versions
        ) && (
          <>
            <Divider />

            <Title
              level={5}
              className="!mb-3"
            >
              ประวัติ Version
            </Title>

            <HrPolicyVersionHistory
              versions={
                selected.versions
              }
            />
          </>
        )}
    </Modal>
  );
}
