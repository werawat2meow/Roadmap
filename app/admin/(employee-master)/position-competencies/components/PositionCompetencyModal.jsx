"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Alert,
  Divider,
  Form,
  InputNumber,
  Modal,
  Select,
} from "antd";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  FlagOutlined,
  OrderedListOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
} from "@ant-design/icons";

function shortUuid(value) {
  if (!value) {
    return "-";
  }

  const text =
    String(value);

  if (
    text.length <= 18
  ) {
    return text;
  }

  return `${text.slice(
    0,
    8
  )}...${text.slice(-6)}`;
}

export default function PositionCompetencyModal({
  open,
  onCancel,
  onSave,
  saving = false,
  masterLoading = false,
  editingItem = null,
  positions = [],
  competencies = [],
  competencyLevels = [],
}) {
  const [form] =
    Form.useForm();

  const missingPosition =
    Boolean(
      editingItem?.position_id
    ) &&
    !positions.some(
      (item) =>
        String(item.id) ===
        String(
          editingItem
            .position_id
        )
    );

  const missingCompetency =
    Boolean(
      editingItem
        ?.competency_id
    ) &&
    !competencies.some(
      (item) =>
        String(item.id) ===
        String(
          editingItem
            .competency_id
        )
    );

  const missingLevel =
    Boolean(
      editingItem
        ?.required_level_id
    ) &&
    !competencyLevels.some(
      (item) =>
        String(item.id) ===
        String(
          editingItem
            .required_level_id
        )
    );

  const positionOptions =
    useMemo(() => {
      const options =
        positions.map(
          (item) => ({
            value:
              item.id,

            label:
              `${item.position_code || "-"} - ${item.position_name || "-"}`,
          })
        );

      if (missingPosition) {
        options.unshift({
          value:
            editingItem
              ?.position_id,

          label:
            `⚠ ไม่พบตำแหน่งเดิม (${shortUuid(
              editingItem
                ?.position_id
            )})`,

          disabled: true,
        });
      }

      return options;
    }, [
      editingItem,
      missingPosition,
      positions,
    ]);

  const competencyOptions =
    useMemo(() => {
      const options =
        competencies.map(
          (item) => ({
            value:
              item.id,

            label:
              `${item.competency_code || "-"} - ${item.competency_name || "-"}`,
          })
        );

      if (missingCompetency) {
        options.unshift({
          value:
            editingItem
              ?.competency_id,

          label:
            `⚠ ไม่พบ Competency เดิม (${shortUuid(
              editingItem
                ?.competency_id
            )})`,

          disabled: true,
        });
      }

      return options;
    }, [
      competencies,
      editingItem,
      missingCompetency,
    ]);

  const levelOptions =
    useMemo(() => {
      const options =
        competencyLevels.map(
          (item) => ({
            value:
              item.id,

            label:
              `${item.level_code || "-"} - ${item.level_name || "-"}`,
          })
        );

      if (missingLevel) {
        options.unshift({
          value:
            editingItem
              ?.required_level_id,

          label:
            `⚠ ไม่พบระดับเดิม (${shortUuid(
              editingItem
                ?.required_level_id
            )})`,

          disabled: true,
        });
      }

      return options;
    }, [
      competencyLevels,
      editingItem,
      missingLevel,
    ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingItem) {
      form.setFieldsValue({
        position_id:
          editingItem
            .position_id,

        competency_id:
          editingItem
            .competency_id,

        required_level_id:
          editingItem
            .required_level_id,

        importance_level:
          editingItem
            .importance_level ||
          "medium",

        status:
          editingItem.status ||
          "active",

        sort_order:
          Number(
            editingItem
              .sort_order ||
            0
          ),
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        position_id:
          undefined,

        competency_id:
          undefined,

        required_level_id:
          undefined,

        importance_level:
          "medium",

        status:
          "active",

        sort_order: 0,
      });
    }
  }, [
    editingItem,
    form,
    open,
  ]);

  const validateMasterValue =
    (
      list,
      message
    ) =>
    async (_, value) => {
      if (!value) {
        return Promise.reject(
          new Error(message)
        );
      }

      const exists =
        list.some(
          (item) =>
            String(item.id) ===
            String(value)
        );

      if (!exists) {
        return Promise.reject(
          new Error(
            `${message} เนื่องจากข้อมูลเดิมไม่มีอยู่ใน Master แล้ว`
          )
        );
      }

      return Promise.resolve();
    };

  const warningText = [
    missingPosition
      ? "Position เดิมไม่มีอยู่ในตาราง positions"
      : null,

    missingCompetency
      ? "Competency เดิมไม่มีอยู่ใน Master"
      : null,

    missingLevel
      ? "Required Level เดิมไม่มีอยู่ใน Master"
      : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Modal
      title={
        editingItem
          ? "แก้ไขสมรรถนะประจำตำแหน่ง"
          : "เพิ่มสมรรถนะประจำตำแหน่ง"
      }
      open={open}
      onCancel={onCancel}
      onOk={() =>
        form.submit()
      }
      okText="บันทึกข้อมูล"
      cancelText="ยกเลิก"
      confirmLoading={saving}
      destroyOnHidden
      mask={{
        closable:
          !saving,
      }}
      width={760}
      okButtonProps={{
        disabled:
          masterLoading,
      }}
    >
      {warningText ? (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title="พบข้อมูลอ้างอิงเดิมที่ไม่มีอยู่ใน Master"
          description={`${warningText} กรุณาเลือกรายการใหม่ที่ถูกต้องก่อนบันทึก`}
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
      >
        <Divider titlePlacement="left">
          ข้อมูลตำแหน่งและ Competency
        </Divider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={
              <span className="font-medium">
                <AppstoreOutlined className="mr-1" />
                ตำแหน่ง
              </span>
            }
            name="position_id"
            rules={[
              {
                validator:
                  validateMasterValue(
                    positions,
                    "กรุณาเลือกตำแหน่งที่ถูกต้อง"
                  ),
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={
                masterLoading
              }
              optionFilterProp="label"
              placeholder="เลือกตำแหน่ง"
              options={
                positionOptions
              }
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium">
                <SafetyCertificateOutlined className="mr-1" />
                Competency
              </span>
            }
            name="competency_id"
            rules={[
              {
                validator:
                  validateMasterValue(
                    competencies,
                    "กรุณาเลือก Competency ที่ถูกต้อง"
                  ),
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={
                masterLoading
              }
              optionFilterProp="label"
              placeholder="เลือก Competency"
              options={
                competencyOptions
              }
            />
          </Form.Item>
        </div>

        <Divider titlePlacement="left">
          ระดับที่ต้องการ
        </Divider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={
              <span className="font-medium">
                <StarOutlined className="mr-1" />
                Required Level
              </span>
            }
            name="required_level_id"
            rules={[
              {
                validator:
                  validateMasterValue(
                    competencyLevels,
                    "กรุณาเลือกระดับ Competency ที่ถูกต้อง"
                  ),
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={
                masterLoading
              }
              optionFilterProp="label"
              placeholder="เลือกระดับ"
              options={
                levelOptions
              }
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium">
                <FlagOutlined className="mr-1" />
                Importance
              </span>
            }
            name="importance_level"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกระดับความสำคัญ",
              },
            ]}
          >
            <Select
              options={[
                {
                  value: "low",
                  label: "Low (ต่ำ)",
                },
                {
                  value: "medium",
                  label: "Medium (ปานกลาง)",
                },
                {
                  value: "high",
                  label: "High (สูง)",
                },
                {
                  value: "critical",
                  label: "Critical (สำคัญมาก)",
                },
              ]}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={
              <span className="font-medium">
                <CheckCircleOutlined className="mr-1" />
                สถานะ
              </span>
            }
            name="status"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะ",
              },
            ]}
          >
            <Select
              options={[
                {
                  value: "active",
                  label:
                    "Active (เปิดใช้งาน)",
                },
                {
                  value: "inactive",
                  label:
                    "Inactive (ปิดใช้งาน)",
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium">
                <OrderedListOutlined className="mr-1" />
                ลำดับการแสดงผล
              </span>
            }
            name="sort_order"
          >
            <InputNumber
              min={0}
              precision={0}
              className="w-full"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
