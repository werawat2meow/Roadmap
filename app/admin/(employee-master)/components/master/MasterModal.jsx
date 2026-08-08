"use client";

import { Modal } from "antd";

export default function MasterModal({
  open,

  title,

  children,

  width = 900,

  saving = false,

  destroyOnHidden = true,

  okText = "บันทึก",

  cancelText = "ยกเลิก",

  footer,

  onCancel,

  onSubmit,
}) {
  /*
    ถ้ามีการส่ง custom footer เข้ามา
    เช่น Employee Wizard
    ให้ใช้ footer ที่ส่งมา

    ถ้าไม่ได้ส่ง footer
    ให้ใช้ Footer มาตรฐานของ Ant Design เหมือนเดิม
  */
  const modalFooter =
    footer !== undefined
      ? footer
      : undefined;

  return (
    <Modal
      open={open}
      title={title}
      width={width}
      style={{ top: 5 }}
      styles={{
        body: {
          maxHeight:
            "calc(100vh - 160px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
      forceRender
      destroyOnHidden={
        destroyOnHidden
      }
      mask={{
        closable: !saving,
      }}
      keyboard={!saving}
      confirmLoading={saving}
      okText={okText}
      cancelText={cancelText}
      footer={modalFooter}
      onCancel={onCancel}
      onOk={
        footer !== undefined
          ? undefined
          : onSubmit
      }
    >
      <div className="pt-5">
        {children}
      </div>
    </Modal>
  );
}