"use client";

import { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Rate,
  Select,
  Switch,
  Divider,
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
  { label: "Low (ต่ำ)", value: "low" },
  { label: "Medium (ปานกลาง)", value: "medium" },
  { label: "High (สูง)", value: "high" },
  { label: "Critical (วิกฤต/สำคัญมาก)", value: "critical" },
];

const statusOptions = [
  { label: "Active (เปิดใช้งาน)", value: "active" },
  { label: "Inactive (ปิดใช้งาน)", value: "inactive" },
];

// ข้อความกำกับระดับดาว (Required Level)
const descLevels = ["พื้นฐาน", "ปานกลาง", "ชำนาญ", "ขั้นสูง", "เชี่ยวชาญพิเศษ"];

export default function PositionSkillModal({
  open,
  loading = false,
  editingItem = null,
  positions = [],
  skills = [],
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      form.setFieldsValue({
        position_id: editingItem.position_id,
        skill_id: editingItem.skill_id,
        required_level: editingItem.required_level ?? 1,
        importance_level: editingItem.importance_level ?? "medium",
        is_mandatory: editingItem.is_mandatory ?? false,
        description: editingItem.description ?? "",
        sort_order: editingItem.sort_order ?? 0,
        status: editingItem.status ?? "active",
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        required_level: 1,
        importance_level: "medium",
        is_mandatory: false,
        sort_order: 0,
        status: "active",
      });
    }
  }, [editingItem, open, form]);

  const handleFinish = (values) => {
    onSubmit(values);
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
            {editingItem ? "แก้ไขทักษะประจำตำแหน่ง" : "เพิ่มทักษะประจำตำแหน่งใหม่"}
          </span>
        </div>
      }
      okText="บันทึกข้อมูล"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okButtonProps={{ className: "bg-blue-600 hover:bg-blue-700" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        {/* ส่วนข้อมูลหลัก */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <AppstoreOutlined className="mr-1 text-blue-500" /> ตำแหน่ง
              </span>
            }
            name="position_id"
            rules={[{ required: true, message: "กรุณาเลือกตำแหน่งงาน" }]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="-- ค้นหาหรือเลือกตำแหน่ง --"
              size="large"
              options={positions.map((item) => ({
                label: `${item.position_code} - ${item.position_name}`,
                value: item.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <ToolOutlined className="mr-1 text-blue-500" /> ทักษะ (Skill)
              </span>
            }
            name="skill_id"
            rules={[{ required: true, message: "กรุณาเลือกทักษะ" }]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="-- ค้นหาหรือเลือกทักษะ --"
              size="large"
              options={skills.map((item) => ({
                label: `${item.skill_code} - ${item.skill_name}`,
                value: item.id,
              }))}
            />
          </Form.Item>
        </div>

        <Divider className="my-2" />

        {/* ส่วนระดับความสามารถและความสำคัญ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 items-start">
          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <StarOutlined className="mr-1 text-amber-500" /> ระดับทักษะที่ต้องการ (Required Level)
              </span>
            }
            name="required_level"
            extra="ประเมินระดับความเชี่ยวชาญขั้นต่ำที่ตำแหน่งนี้ต้องมี"
          >
            <Rate count={5} tooltips={descLevels} className="text-xl" />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <FlagOutlined className="mr-1 text-orange-500" /> ระดับความสำคัญ (Importance)
              </span>
            }
            name="importance_level"
          >
            <Select size="large" options={importanceOptions} />
          </Form.Item>
        </div>

        {/* ส่วนตั้งค่าเพิ่มเติม */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <SafetyCertificateOutlined className="mr-1 text-emerald-600" /> บังคับต้องมี (Mandatory)
              </span>
            }
            name="is_mandatory"
            valuePropName="checked"
            className="mb-0"
          >
            <Switch
              checkedChildren="จำเป็น"
              unCheckedChildren="ไม่จำเป็น"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <OrderedListOutlined className="mr-1 text-indigo-500" /> ลำดับการแสดงผล
              </span>
            }
            name="sort_order"
            className="mb-0"
          >
            <InputNumber min={0} size="large" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">
                <CheckCircleOutlined className="mr-1 text-blue-500" /> สถานะ
              </span>
            }
            name="status"
            className="mb-0"
          >
            <Select size="large" options={statusOptions} />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span className="font-medium text-slate-700">
              <FileTextOutlined className="mr-1 text-slate-500" /> รายละเอียดเพิ่มเติม (Description)
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