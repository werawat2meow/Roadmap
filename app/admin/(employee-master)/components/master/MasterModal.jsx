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

  onCancel,

  onSubmit,
}) {
  return (
    <Modal
      open={open}
      title={title}
      width={width}
      forceRender
      destroyOnHidden={destroyOnHidden}
      mask={{ closable: !saving }}
      keyboard={!saving}
      confirmLoading={saving}
      okText={okText}
      cancelText={cancelText}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <div className="pt-5">
        {children}
      </div>
    </Modal>
  );
}