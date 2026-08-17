"use client";

import { Form, Input, Modal, Typography } from "antd";
import { useEffect } from "react";

const { Text } = Typography;

export default function SalaryStructureModal({
  open = false,
  mode = "create",
  record = null,
  saving = false,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      name: record?.name || "",
    });
  }, [open, record, form]);

  const title = isView
    ? "รายละเอียดโครงสร้างเงินเดือน"
    : isEdit
      ? "แก้ไขโครงสร้างเงินเดือน"
      : "เพิ่มโครงสร้างเงินเดือน";

  const handleOk = async () => {
    if (isView) {
      onCancel?.();
      return;
    }

    const values = await form.validateFields();
    onSubmit?.({
      name: String(values?.name || "").trim(),
    });
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={saving}
      okText={isView ? "ปิด" : isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
      cancelButtonProps={{ style: isView ? { display: "none" } : undefined }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        disabled={isView || saving}
        className="pt-3"
      >
        <Form.Item
          label="ชื่อโครงสร้างเงินเดือน"
          name="name"
          rules={[
            {
              required: true,
              message: "กรุณาระบุชื่อโครงสร้างเงินเดือน",
            },
            {
              max: 255,
              message: "ชื่อโครงสร้างเงินเดือนต้องไม่เกิน 255 ตัวอักษร",
            },
          ]}
        >
          <Input
            size="large"
            placeholder="เช่น Staff Monthly 2027"
            maxLength={255}
            showCount={!isView}
          />
        </Form.Item>

        {isView ? (
          <div className="rounded-xl bg-slate-50 p-4">
            <Text type="secondary">
              ตารางปัจจุบันเก็บเฉพาะชื่อโครงสร้างเงินเดือนและวันที่สร้าง
              จึงยังไม่มีการแสดง Level / Band / Min / Mid / Max ในหน้านี้
            </Text>
          </div>
        ) : null}
      </Form>
    </Modal>
  );
}
