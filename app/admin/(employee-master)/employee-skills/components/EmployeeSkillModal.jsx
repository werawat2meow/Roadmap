"use client";

import { useEffect, useState , useMemo, } from "react";

import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
} from "antd";

import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;


function buildEmployeeName(
  employee
) {
  if (!employee) {
    return "";
  }

  if (employee.full_name_th) {
    return employee.full_name_th;
  }

  return [
    employee.first_name_th,
    employee.middle_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildEmployeeLabel(
  employee
) {
  if (!employee) {
    return "-";
  }

  const code =
    employee.employee_code ||
    "";

  const name =
    buildEmployeeName(
      employee
    );

  if (code && name) {
    return `${code} - ${name}`;
  }

  return (
    name ||
    code ||
    "-"
  );
}

export default function EmployeeSkillModal({open,editingData,loading,onCancel,onSubmit,}) {
  const [form] = Form.useForm();
  const [employees, setEmployees] =useState([]);
  const [skills, setSkills] =useState([]);
  const [categories, setCategories] =useState([]);
  const [verifiers, setVerifiers] = useState([]);

  const employeeOptions = useMemo(() => {
    const options =
      (employees || []).map(
        (item) => ({
          value: item.id,
          label:
            buildEmployeeLabel(
              item
            ),
        })
      );

    /*
     * ตอน Edit:
     * ถ้าพนักงานที่เลือกยังไม่อยู่ใน
     * employees list ให้สร้าง option
     * จากข้อมูลที่ติดมากับ row ก่อน
     */
    if (
      editingData?.employee_id &&
      !options.some(
        (item) =>
          String(
            item.value
          ) ===
          String(
            editingData.employee_id
          )
      )
    ) {
      const employee =
        editingData.employees ||
        editingData.employee ||
        {
          id:
            editingData.employee_id,

          employee_code:
            editingData.employee_code,

          full_name_th:
            editingData.employee_name ||
            editingData.full_name_th,

          first_name_th:
            editingData.first_name_th,

          last_name_th:
            editingData.last_name_th,
        };

      const label =
        buildEmployeeLabel(
          employee
        );

      /*
       * มีข้อมูลชื่อจริงค่อยเพิ่ม
       * ไม่เอา UUID มาเป็น label
       */
      if (label !== "-") {
        options.unshift({
          value:
            editingData.employee_id,

          label,
        });
      }
    }

    return options;
  }, [
    employees,
    editingData,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadEmployees();
    loadSkills();
    loadCategories();
    loadVerifiers();
  }, [
    open,
    editingData?.employee_id,
  ]);

  async function loadEmployees() {
  try {
    const res =
      await fetch(
        "/api/admin/employees?all=true&status=active",
        {
          cache: "no-store",
        }
      );

    const json =
      await res
        .json()
        .catch(
          () => null
        );

    let rows =
      res.ok &&
      json?.success &&
      Array.isArray(
        json.data
      )
        ? json.data
        : [];

    /*
     * Edit:
     * ถ้าพนักงานปัจจุบันไม่อยู่ใน
     * active list ให้โหลดรายคนมาเติม
     */
    const selectedId =
      editingData?.employee_id;

    if (
      selectedId &&
      !rows.some(
        (item) =>
          String(item.id) ===
          String(selectedId)
      )
    ) {
      const selectedRes =
        await fetch(
          `/api/admin/employees/${selectedId}`,
          {
            cache: "no-store",
          }
        );

      const selectedJson =
        await selectedRes
          .json()
          .catch(
            () => null
          );

      if (
        selectedRes.ok &&
        selectedJson?.success &&
        selectedJson?.data
      ) {
        rows = [
          selectedJson.data,
          ...rows,
        ];
      }
    }

    setEmployees(
      rows
    );
  } catch (err) {
    console.error(
      "LOAD_EMPLOYEE_OPTIONS_ERROR:",
      err
    );

    setEmployees([]);
  }
}

  async function loadSkills() {
    try {
      const res = await fetch(
        "/api/admin/skills?all=true&status=active"
      );

      const json = await res.json();

      if (json.success) {
        setSkills(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(
        "/api/admin/skill-categories?all=true&status=active"
      );

      const json = await res.json();

      if (json.success) {
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadVerifiers() {
    try {
      const res = await fetch(
        "/api/admin/employees?all=true&status=active"
      );

      const json = await res.json();

      if (json.success) {
        setVerifiers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!open) return;

    if (!editingData) {
      form.resetFields();

      form.setFieldsValue({
        current_level: 1,
        importance_level: "medium",
        is_verified: false,
        status: "active",
        sort_order: 0,
      });

      return;
    }

    form.setFieldsValue({
      employee_id: editingData.employee_id,

      skill_id: editingData.skill_id,

      current_level:
        editingData.current_level,

      target_level:
        editingData.target_level,

      importance_level:
        editingData.importance_level,

      is_verified:
        editingData.is_verified,

      verified_by:
        editingData.verified_by,

      assessment_date:
        editingData.assessment_date
          ? dayjs(
              editingData.assessment_date
            )
          : null,

      expiry_date:
        editingData.expiry_date
          ? dayjs(
              editingData.expiry_date
            )
          : null,

      description:
        editingData.description,

      status:
        editingData.status,

      sort_order:
        editingData.sort_order,
    });
  }, [
    open,
    editingData,
    form,
  ]);

  const handleFinish = (values) => {
    onSubmit({
      ...values,
      assessment_date:
        values.assessment_date
          ? values.assessment_date.format(
              "YYYY-MM-DD"
            )
          : null,

      expiry_date:
        values.expiry_date
          ? values.expiry_date.format(
              "YYYY-MM-DD"
            )
          : null,
    });
  };

  return (
    <Modal
      open={open}
      destroyOnHidden
      mask={{
        closable: false,
      }}
      title={
        editingData
          ? "แก้ไข Employee Skill"
          : "เพิ่ม Employee Skill"
      }
      okText="บันทึก"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() =>
        form.submit()
      }
      width={900}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={
          handleFinish
        }
      >
        <Row gutter={16}>
          {/* =========================
              พนักงาน
          ========================= */}
          <Col xs={24} md={12}>
            <Form.Item
              label="พนักงาน"
              name="employee_id"
              tooltip="เลือกพนักงานเจ้าของทักษะนี้ พิมพ์รหัสหรือชื่อเพื่อค้นหา"
              rules={[
                {
                  required: true,
                  message: "กรุณาเลือกพนักงาน",
                },
              ]}
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="เลือกพนักงาน"
                options={
                  employeeOptions
                }
              />
            </Form.Item>
          </Col>

          {/* =========================
              Skill
          ========================= */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Skill"
              name="skill_id"
              tooltip="เลือกทักษะจากรายการทักษะที่มีอยู่ในระบบ"
              rules={[
                {
                  required: true,
                  message: "กรุณาเลือก Skill",
                },
              ]}
            >
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="เลือก Skill"
              >
                {skills.map((item) => (
                  <Option
                    key={item.id}
                    value={item.id}
                    label={`${item.skill_code} ${item.skill_name}`}
                  >
                    {item.skill_code}
                    {" - "}
                    {item.skill_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* =========================
              Current Level
          ========================= */}
          <Col xs={24} md={6}>
            <Form.Item
              label="Current Level"
              name="current_level"
              tooltip="ระดับความสามารถปัจจุบันของพนักงาน (1 = เริ่มต้น, 10 = เชี่ยวชาญสูงสุด)"
              rules={[
                {
                  required: true,
                  message: "กรุณาระบุ Current Level",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={10}
                placeholder="1-10"
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>
          </Col>

          {/* =========================
              Target Level
          ========================= */}
          <Col xs={24} md={6}>
            <Form.Item
              label="Target Level"
              name="target_level"
              tooltip="ระดับความสามารถเป้าหมายที่ต้องการพัฒนาไปให้ถึง (ไม่บังคับกรอก)"
            >
              <InputNumber
                min={1}
                max={10}
                placeholder="1-10"
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>
          </Col>

          {/* =========================
              Importance
          ========================= */}
          <Col xs={24} md={6}>
            <Form.Item
              label="Importance"
              name="importance_level"
              tooltip="ระดับความสำคัญของทักษะนี้ต่อตำแหน่งงานของพนักงาน"
              rules={[
                {
                  required: true,
                  message: "กรุณาเลือกระดับความสำคัญ",
                },
              ]}
            >
              <Select placeholder="เลือกระดับความสำคัญ">
                <Option value="low">
                  Low
                </Option>

                <Option value="medium">
                  Medium
                </Option>

                <Option value="high">
                  High
                </Option>

                <Option value="critical">
                  Critical
                </Option>
              </Select>
            </Form.Item>
          </Col>

          {/* =========================
              Verified
          ========================= */}
          <Col xs={24} md={6}>
            <Form.Item
              label="Verified"
              name="is_verified"
              valuePropName="checked"
              tooltip="เปิดสวิตช์หากทักษะนี้ผ่านการตรวจสอบ/รับรองแล้ว"
            >
              <Switch
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </Form.Item>
          </Col>

          {/* =========================
              Verified By
          ========================= */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Verified By"
              name="verified_by"
              tooltip="ผู้ที่เป็นคนตรวจสอบและรับรองทักษะนี้ (กรอกคู่กับ Verified)"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="ผู้ตรวจสอบ"
              >
                {verifiers.map((item) => (
                  <Option
                    key={item.id}
                    value={item.id}
                    label={`${item.employee_code} ${item.full_name_th}`}
                  >
                    {item.employee_code}
                    {" - "}
                    {item.full_name_th}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* =========================
              Assessment Date
          ========================= */}
          <Col xs={24} md={6}>
            <Form.Item
              label="Assessment Date"
              name="assessment_date"
              tooltip="วันที่ทำการประเมินระดับทักษะนี้ครั้งล่าสุด"
            >
              <DatePicker
                style={{
                  width: "100%",
                }}
                format="DD/MM/YYYY"
                placeholder="วว/ดด/ปปปป"
              />
            </Form.Item>
          </Col>

          {/* =========================
              Expiry Date
          ========================= */}
          <Col xs={24} md={6}>
            <Form.Item
              label="Expiry Date"
              name="expiry_date"
              tooltip="วันหมดอายุของการรับรองทักษะนี้ (สำหรับทักษะที่ต้องต่ออายุ/รับรองใหม่เป็นระยะ)"
              dependencies={['assessment_date']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const assessDate = getFieldValue('assessment_date');
                    if (!value || !assessDate || value.isAfter(assessDate)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Expiry Date ต้องมากกว่า Assessment Date')
                    );
                  },
                }),
              ]}
            >
              <DatePicker
                style={{
                  width: "100%",
                }}
                format="DD/MM/YYYY"
                placeholder="วว/ดด/ปปปป"
              />
            </Form.Item>
          </Col>

          {/* =========================
              Description
          ========================= */}
          <Col xs={24}>
            <Form.Item
              label="Description"
              name="description"
              tooltip="รายละเอียดเพิ่มเติมเกี่ยวกับทักษะนี้ เช่น บริบทการใช้งาน หรือหมายเหตุอื่นๆ"
            >
              <TextArea
                rows={4}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </Form.Item>
          </Col>

          {/* =========================
              Status
          ========================= */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Status"
              name="status"
              tooltip="สถานะการใช้งานของรายการนี้ในระบบ (Inactive จะไม่แสดงในรายการค้นหาทั่วไป)"
              rules={[
                {
                  required: true,
                  message: "กรุณาเลือกสถานะ",
                },
              ]}
            >
              <Select placeholder="เลือกสถานะ">
                <Option value="active">
                  Active
                </Option>

                <Option value="inactive">
                  Inactive
                </Option>
              </Select>
            </Form.Item>
          </Col>

          {/* =========================
              Sort Order
          ========================= */}
          <Col xs={24} md={12}>
            <Form.Item
              label="Sort Order"
              name="sort_order"
              tooltip="ลำดับการแสดงผลรายการนี้ในตาราง/รายการ (เลขน้อยแสดงก่อน)"
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>
          </Col>

        </Row>
      </Form>
    </Modal>
  );
}