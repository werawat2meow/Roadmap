"use client";

import { useEffect , useState } from "react";
import {
  swalSuccess,
  swalError,
} from "@/app/components/Swal";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";

const { TextArea } = Input;

export default function SkillModal({
  open,
  item,
  onCancel,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      form.setFieldsValue({
        skill_code: item.skill_code,
        skill_name: item.skill_name,
        category_id: item.category_id,
        description: item.description,
        sort_order: item.sort_order ?? 0,
        status: item.status ?? "active",
      });
    } else {
      form.resetFields();

      form.setFieldsValue({
        sort_order: 0,
        status: "active",
      });
    }
  }, [open, item, form]);

  useEffect(() => {
  
    const loadCategories = async () => {

      try {
        const res = await fetch(
          "/api/admin/skill-categories?all=true"
        );

        const json = await res.json();

        if (!json.success) return;

        setCategories(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        
      }
    };

    loadCategories();
  }, []);

  const handleSave = async () => {
     if (saveLoading) return;
    try {
      setSaveLoading(true);
      const values = await form.validateFields();

      const url = item
        ? `/api/admin/skills/${item.id}`
        : "/api/admin/skills";

      const method = item ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "บันทึกข้อมูลไม่สำเร็จ"
        );
      }

      await swalSuccess(
        item
          ? "แก้ไขข้อมูลสำเร็จ"
          : "เพิ่มข้อมูลสำเร็จ",
        json.message || ""
      );

      onSuccess?.();

    } catch (err) {
      console.error(
        "SAVE_SKILL:",
        err
      );

      await swalError(
        "เกิดข้อผิดพลาด",
        err.message ||
          "ไม่สามารถบันทึกข้อมูลได้"
      );
    }finally {
      setSaveLoading(false);
    }
  };


  return (
    <Modal
      open={open}
      width={700}
      destroyOnHidden
      mask={{ closable: !saveLoading }}
      title={
        item
          ? "แก้ไข Skill"
          : "เพิ่ม Skill"
      }
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={saveLoading}
      onCancel={() => {
        if (saveLoading) return;
        onCancel?.();
      }}
      closable={!saveLoading}
      keyboard={!saveLoading}


      // Part 6-2
      onOk={handleSave}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="Skill Code"
          name="skill_code"
          rules={[
            {
              required: true,
              message: "กรุณากรอกรหัส Skill",
            },
          ]}
        >
          <Input
            maxLength={50}
            placeholder="เช่น SKILL001"
            onChange={(e) => {
              form.setFieldValue(
                "skill_code",
                e.target.value.toUpperCase()
              );
            }}
          />
        </Form.Item>

        <Form.Item
          label="Skill Name"
          name="skill_name"
          rules={[
            {
              required: true,
              message: "กรุณากรอกชื่อ Skill",
            },
          ]}
        >
          <Input
            maxLength={255}
            placeholder="ชื่อ Skill"
          />
        </Form.Item>

        <Form.Item
          label="Category"
          name="category_id"
          rules={[
            {
              required: true,
              message: "กรุณาเลือกหมวดหมู่",
            },
          ]}
        >
          <Select
            showSearch
            allowClear
            placeholder="เลือกหมวดหมู่"

            optionFilterProp="label"

            options={categories.map((item) => ({
              value: item.id,
              label: `${item.category_code} - ${item.category_name}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea
            rows={4}
            maxLength={1000}
            showCount
            placeholder="รายละเอียดเพิ่มเติม"
          />
        </Form.Item>

        <Form.Item
          label="Sort Order"
          name="sort_order"
        >
          <InputNumber
            min={0}
            precision={0}
            style={{
              width: "100%",
            }}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[
            {
              required: true,
              message: "กรุณาเลือกสถานะ",
            },
          ]}
        >
          <Select
            options={[
              {
                label: "Active",
                value: "active",
              },
              {
                label: "Inactive",
                value: "inactive",
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
