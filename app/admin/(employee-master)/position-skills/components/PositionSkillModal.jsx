"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Alert,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Rate,
  Select,
  Switch,
} from "antd";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FlagOutlined,
  OrderedListOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const importanceOptions = [
  {
    label: "Low (ต่ำ)",
    value: "low",
  },
  {
    label: "Medium (ปานกลาง)",
    value: "medium",
  },
  {
    label: "High (สูง)",
    value: "high",
  },
  {
    label:
      "Critical (วิกฤต/สำคัญมาก)",
    value: "critical",
  },
];

const statusOptions = [
  {
    label:
      "Active (เปิดใช้งาน)",
    value: "active",
  },
  {
    label:
      "Inactive (ปิดใช้งาน)",
    value: "inactive",
  },
];

const descLevels = [
  "พื้นฐาน",
  "ปานกลาง",
  "ชำนาญ",
  "ขั้นสูง",
  "เชี่ยวชาญพิเศษ",
];

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

export default function PositionSkillModal({
  open,
  loading = false,
  masterLoading = false,
  editingItem = null,
  positions = [],
  skills = [],
  onCancel,
  onSubmit,
}) {
  const [form] =
    Form.useForm();

  const editingPositionMissing =
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

  const editingSkillMissing =
    Boolean(
      editingItem?.skill_id
    ) &&
    !skills.some(
      (item) =>
        String(item.id) ===
        String(
          editingItem
            .skill_id
        )
    );

  const positionOptions =
    useMemo(() => {
      const options =
        positions.map(
          (item) => ({
            label:
              `${item.position_code || "-"} - ${item.position_name || "-"}`,
            value:
              item.id,
          })
        );

      if (
        editingPositionMissing
      ) {
        options.unshift({
          label:
            `⚠ ไม่พบตำแหน่งเดิม (${shortUuid(
              editingItem
                ?.position_id
            )})`,
          value:
            editingItem
              ?.position_id,
          disabled: true,
        });
      }

      return options;
    }, [
      positions,
      editingItem,
      editingPositionMissing,
    ]);

  const skillOptions =
    useMemo(() => {
      const options =
        skills.map(
          (item) => ({
            label:
              `${item.skill_code || "-"} - ${item.skill_name || "-"}`,
            value:
              item.id,
          })
        );

      if (
        editingSkillMissing
      ) {
        options.unshift({
          label:
            `⚠ ไม่พบทักษะเดิม (${shortUuid(
              editingItem
                ?.skill_id
            )})`,
          value:
            editingItem
              ?.skill_id,
          disabled: true,
        });
      }

      return options;
    }, [
      skills,
      editingItem,
      editingSkillMissing,
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

        skill_id:
          editingItem
            .skill_id,

        required_level:
          editingItem
            .required_level ??
          1,

        importance_level:
          editingItem
            .importance_level ??
          "medium",

        is_mandatory:
          editingItem
            .is_mandatory ??
          false,

        description:
          editingItem
            .description ??
          "",

        sort_order:
          editingItem
            .sort_order ??
          0,

        status:
          editingItem
            .status ??
          "active",
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        position_id:
          undefined,

        skill_id:
          undefined,

        required_level: 1,

        importance_level:
          "medium",

        is_mandatory:
          false,

        sort_order: 0,

        status:
          "active",

        description: "",
      });
    }
  }, [
    editingItem,
    open,
    form,
  ]);

  const validatePosition =
    async (_, value) => {
      if (!value) {
        return Promise.reject(
          new Error(
            "กรุณาเลือกตำแหน่งงาน"
          )
        );
      }

      const exists =
        positions.some(
          (item) =>
            String(item.id) ===
            String(value)
        );

      if (!exists) {
        return Promise.reject(
          new Error(
            "ตำแหน่งเดิมไม่มีอยู่ใน Master แล้ว กรุณาเลือกตำแหน่งใหม่"
          )
        );
      }

      return Promise.resolve();
    };

  const validateSkill =
    async (_, value) => {
      if (!value) {
        return Promise.reject(
          new Error(
            "กรุณาเลือกทักษะ"
          )
        );
      }

      const exists =
        skills.some(
          (item) =>
            String(item.id) ===
            String(value)
        );

      if (!exists) {
        return Promise.reject(
          new Error(
            "ทักษะเดิมไม่มีอยู่ใน Master แล้ว กรุณาเลือกทักษะใหม่"
          )
        );
      }

      return Promise.resolve();
    };

  const handleFinish = (
    values
  ) => {
    onSubmit?.(
      values
    );
  };

  return (
    <Modal
      open={open}
      destroyOnHidden
      centered
      width={720}
      title={
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <ToolOutlined className="text-blue-600" />

          <span>
            {editingItem
              ? "แก้ไขทักษะประจำตำแหน่ง"
              : "เพิ่มทักษะประจำตำแหน่งใหม่"}
          </span>
        </div>
      }
      okText="บันทึกข้อมูล"
      cancelText="ยกเลิก"
      confirmLoading={
        loading
      }
      mask={{
        closable:
          !loading,
      }}
      onCancel={
        onCancel
      }
      onOk={() =>
        form.submit()
      }
      okButtonProps={{
        className:
          "bg-blue-600 hover:bg-blue-700",

        disabled:
          masterLoading,
      }}
    >
      {(editingPositionMissing ||
        editingSkillMissing) && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title="พบข้อมูลอ้างอิงเดิมที่ไม่มีอยู่ใน Master"
          description={
            editingPositionMissing
              ? "Position Skill รายการนี้อ้างถึง Position ที่ไม่มีอยู่ในตาราง positions แล้ว กรุณาเลือกตำแหน่งใหม่ก่อนบันทึก"
              : "Position Skill รายการนี้อ้างถึง Skill ที่ไม่มีอยู่ใน Master แล้ว กรุณาเลือกทักษะใหม่ก่อนบันทึก"
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={
          handleFinish
        }
        className="mt-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <AppstoreOutlined className="mr-1 text-blue-500" />
                ตำแหน่ง
              </span>
            }
            name="position_id"
            rules={[
              {
                validator:
                  validatePosition,
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
              placeholder="-- ค้นหาหรือเลือกตำแหน่ง --"
              size="large"
              options={
                positionOptions
              }
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <ToolOutlined className="mr-1 text-blue-500" />
                ทักษะ (Skill)
              </span>
            }
            name="skill_id"
            rules={[
              {
                validator:
                  validateSkill,
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
              placeholder="-- ค้นหาหรือเลือกทักษะ --"
              size="large"
              options={
                skillOptions
              }
            />
          </Form.Item>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <StarOutlined className="mr-1 text-amber-500" />
                ระดับทักษะที่ต้องการ (Required Level)
              </span>
            }
            name="required_level"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุระดับทักษะ",
              },
            ]}
          >
            <Rate
              count={5}
              tooltips={
                descLevels
              }
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <FlagOutlined className="mr-1 text-slate-500" />
                ระดับความสำคัญ (Importance)
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
              size="large"
              options={
                importanceOptions
              }
            />
          </Form.Item>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              label={
                <span className="font-medium text-slate-700">
                  <SafetyCertificateOutlined className="mr-1 text-slate-500" />
                  บังคับต้องมี (Mandatory)
                </span>
              }
              name="is_mandatory"
              valuePropName="checked"
              className="mb-0"
            >
              <Switch
                checkedChildren="จำเป็น"
                unCheckedChildren="ไม่บังคับ"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="font-medium text-slate-700">
                  <OrderedListOutlined className="mr-1 text-slate-500" />
                  ลำดับการแสดงผล
                </span>
              }
              name="sort_order"
              className="mb-0"
            >
              <InputNumber
                min={0}
                precision={0}
                className="w-full"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="font-medium text-slate-700">
                  <CheckCircleOutlined className="mr-1 text-slate-500" />
                  สถานะ
                </span>
              }
              name="status"
              className="mb-0"
            >
              <Select
                size="large"
                options={
                  statusOptions
                }
              />
            </Form.Item>
          </div>
        </div>

        <Form.Item
          label={
            <span className="font-medium text-slate-700">
              <FileTextOutlined className="mr-1 text-slate-500" />
              รายละเอียดเพิ่มเติม (Description)
            </span>
          }
          name="description"
        >
          <Input.TextArea
            rows={3}
            placeholder="ระบุคำอธิบายเพิ่มเติม ขอบเขต หรือหมายเหตุของทักษะประจำตำแหน่งนี้..."
            className="rounded-lg"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
