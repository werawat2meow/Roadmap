"use client";

import { Form, Modal } from "antd";
import { useEffect } from "react";
import EarningTypeForm, { INITIAL_EARNING_TYPE_VALUES } from "./EarningTypeForm";

function toFormValues(record) {
  if (!record) return { ...INITIAL_EARNING_TYPE_VALUES };
  return {
    earning_type_code: record.earning_type_code || "",
    earning_type_name_th: record.earning_type_name_th || "",
    earning_type_name_en: record.earning_type_name_en || "",
    description: record.description || "",
    earning_category: record.earning_category || "other",
    is_taxable: Boolean(record.is_taxable),
    is_social_security_base: Boolean(record.is_social_security_base),
    is_provident_fund_base: Boolean(record.is_provident_fund_base),
    is_recurring: Boolean(record.is_recurring),
    is_proratable: Boolean(record.is_proratable),
    sort_order: Number(record.sort_order || 0),
    status: record.status || "active",
  };
}

export default function EarningTypeModal({ open = false, mode = "create", record = null, saving = false, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const isView = mode === "view";
  const title = mode === "create" ? "เพิ่มประเภทเงินได้" : mode === "edit" ? "แก้ไขประเภทเงินได้" : "รายละเอียดประเภทเงินได้";

  useEffect(() => {
    if (open) form.setFieldsValue(toFormValues(mode === "create" ? null : record));
  }, [form, open, mode, record]);

  return (
    <Modal
      open={open}
      title={title}
      width={980}
      confirmLoading={saving}
      destroyOnHidden
      mask={{ closable: !saving }}
      okText={isView ? "ปิด" : mode === "create" ? "บันทึก" : "บันทึกการแก้ไข"}
      cancelText="ยกเลิก"
      cancelButtonProps={{ style: { display: isView ? "none" : undefined }, disabled: saving }}
      onCancel={onCancel}
      onOk={async () => {
        if (isView) return onCancel?.();
        try {
          const values = await form.validateFields();
          await onSubmit?.({
            ...values,
            earning_type_code: String(values.earning_type_code || "").trim().toUpperCase(),
          });
        } catch (error) {
          if (!error?.errorFields) throw error;
        }
      }}
    >
      <EarningTypeForm form={form} mode={mode} disabled={saving} />
    </Modal>
  );
}
