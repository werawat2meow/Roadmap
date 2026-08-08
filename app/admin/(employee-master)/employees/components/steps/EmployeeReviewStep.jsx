"use client";

import {
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ContactsOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

const { TextArea } = Input;
const { Text } = Typography;

function findById(
  rows = [],
  id
) {
  return rows.find(
    (item) =>
      item.id === id
  );
}

function getValue(
  item,
  keys = []
) {
  if (!item) {
    return "-";
  }

  for (const key of keys) {
    if (item?.[key]) {
      return item[key];
    }
  }

  return "-";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date =
    dayjs.isDayjs(value)
      ? value
      : dayjs(value);

  return date.isValid()
    ? date.format("DD/MM/YYYY")
    : "-";
}

export default function EmployeeReviewStep({
  form,
  mode = "create",
  selectedRecord = null,
  masterData = {},
}) {
  const values =
    Form.useWatch([], form) || {};

  const company = findById(
    masterData.companies,
    values.company_id
  );

  const branchGroup =
    findById(
      masterData.branchGroups,
      values.branch_group_id
    );

  const branch = findById(
    masterData.branches,
    values.branch_id
  );

  const department =
    findById(
      masterData.departments,
      values.department_id
    );

  const division = findById(
    masterData.divisions,
    values.division_id
  );

  const unit = findById(
    masterData.units,
    values.unit_id
  );

  const position = findById(
    masterData.positions,
    values.position_id
  );

  const job = findById(
    masterData.jobs,
    values.job_id
  );

  const employmentType =
    findById(
      masterData.employmentTypes,
      values.employment_type_id
    );

  const employeeStatus =
    findById(
      masterData.employeeStatuses,
      values.employee_status_id
    );

  const payrollCompany =
    findById(
      masterData.payrollCompanies,
      values.payroll_company_id
    );

  const payrollType =
    findById(
      masterData.payrollTypes,
      values.payroll_type_id
    );

  const payrollGroup =
    findById(
      masterData.payrollGroups,
      values.payroll_group_id
    );

  const salaryStructure =
    findById(
      masterData.salaryStructures,
      values.salary_structure_id
    );

  const role = findById(
    masterData.roles,
    values.role_id
  );

  const codeSetting =
    findById(
      masterData.employeeCodeSettings,
      values.employee_code_setting_id
    );

  const fullNameTh = [
    values.first_name_th,
    values.middle_name_th,
    values.last_name_th,
  ]
    .filter(Boolean)
    .join(" ");

  const fullNameEn = [
    values.first_name_en,
    values.middle_name_en,
    values.last_name_en,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <Card
        className="mb-5"
        title={
          <Space>
            <CheckCircleOutlined />
            ตรวจสอบข้อมูลก่อนบันทึก
          </Space>
        }
      >
        <Text type="secondary">
          กรุณาตรวจสอบข้อมูลพนักงานให้ครบถ้วนก่อนกดสร้างพนักงาน
        </Text>
      </Card>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <IdcardOutlined />
          ข้อมูลพนักงาน
        </Space>
      </Divider>

      <Descriptions
        bordered
        size="small"
        column={{
          xs: 1,
          sm: 2,
          lg: 3,
        }}
      >
        <Descriptions.Item label="ชื่อภาษาไทย">
          {fullNameTh || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="ชื่อภาษาอังกฤษ">
          {fullNameEn || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="ชื่อเล่น">
          {values.nickname_th ||
            values.nickname_en ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="วันเกิด">
          {formatDate(
            values.birth_date
          )}
        </Descriptions.Item>

        <Descriptions.Item label="เลขบัตรประชาชน">
          {values.citizen_id || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="หนังสือเดินทาง">
          {values.passport_no ||
            "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ContactsOutlined />
          ข้อมูลติดต่อ
        </Space>
      </Divider>

      <Descriptions
        bordered
        size="small"
        column={{
          xs: 1,
          sm: 2,
          lg: 3,
        }}
      >
        <Descriptions.Item label="โทรศัพท์มือถือ">
          {values.mobile_phone ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="อีเมลส่วนตัว">
          {values.personal_email ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="อีเมลบริษัท">
          {values.work_email ||
            "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ApartmentOutlined />
          องค์กรและตำแหน่ง
        </Space>
      </Divider>

      <Descriptions
        bordered
        size="small"
        column={{
          xs: 1,
          sm: 2,
          lg: 3,
        }}
      >
        <Descriptions.Item label="บริษัท">
          {getValue(company, [
            "company_name_th",
            "company_name_en",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="กรุ๊ปสังกัด">
          {getValue(
            branchGroup,
            ["group_name"]
          )}
        </Descriptions.Item>

        <Descriptions.Item label="สังกัด">
          {getValue(branch, [
            "branch_name",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="แผนก">
          {getValue(
            department,
            ["department_name"]
          )}
        </Descriptions.Item>

        <Descriptions.Item label="ฝ่าย">
          {getValue(division, [
            "division_name",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="หน่วยงาน">
          {getValue(unit, [
            "unit_name",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="ตำแหน่ง">
          {getValue(position, [
            "position_name",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="บทบาทงาน">
          {getValue(job, [
            "job_name",
          ])}
        </Descriptions.Item>
      </Descriptions>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SolutionOutlined />
          การจ้างงาน
        </Space>
      </Divider>

      <Descriptions
        bordered
        size="small"
        column={{
          xs: 1,
          sm: 2,
          lg: 3,
        }}
      >
        <Descriptions.Item label="ประเภทการจ้าง">
          {getValue(
            employmentType,
            [
              "employment_type_name",
              "employment_type_code",
            ]
          )}
        </Descriptions.Item>

        <Descriptions.Item label="สถานะพนักงาน">
          {getValue(
            employeeStatus,
            [
              "status_name",
              "status_code",
            ]
          )}
        </Descriptions.Item>

        <Descriptions.Item label="วันที่เริ่มงาน">
          {formatDate(
            values.start_work_date
          )}
        </Descriptions.Item>

        <Descriptions.Item label="จำนวนวันทดลองงาน">
          {values.probation_days ??
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="สิ้นสุดทดลองงาน">
          {formatDate(
            values.probation_end_date
          )}
        </Descriptions.Item>

        <Descriptions.Item label="สถานะระบบ">
          <Tag
            color={
              values.status ===
              "active"
                ? "green"
                : values.status ===
                  "resigned"
                ? "red"
                : "default"
            }
          >
            {values.status || "-"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <BankOutlined />
          Payroll
        </Space>
      </Divider>

      <Descriptions
        bordered
        size="small"
        column={{
          xs: 1,
          sm: 2,
          lg: 4,
        }}
      >
        <Descriptions.Item label="บริษัทเงินเดือน">
          {getValue(
            payrollCompany,
            [
              "company_name",
              "company_code",
            ]
          )}
        </Descriptions.Item>

        <Descriptions.Item label="รอบจ่ายเงิน">
          {getValue(payrollType, [
            "payroll_type_name",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="กลุ่มเงินเดือน">
          {getValue(
            payrollGroup,
            [
              "payroll_group_name",
            ]
          )}
        </Descriptions.Item>

        <Descriptions.Item label="โครงสร้างเงินเดือน">
          {getValue(
            salaryStructure,
            ["structure_name"]
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SafetyCertificateOutlined />
          รหัสพนักงานและบัญชีผู้ใช้
        </Space>
      </Divider>

      <Descriptions
        bordered
        size="small"
        column={{
          xs: 1,
          sm: 2,
          lg: 3,
        }}
      >
        <Descriptions.Item label="รหัสพนักงาน">
          {mode === "edit"
            ? selectedRecord
                ?.employee_code ||
              "-"
            : "ระบบสร้างอัตโนมัติ"}
        </Descriptions.Item>

        <Descriptions.Item label="รูปแบบรหัส">
          {codeSetting
            ? `${codeSetting.code_name} (${codeSetting.code_pattern})`
            : "-"}
        </Descriptions.Item>

        <Descriptions.Item label="ประเภทพนักงาน">
          {values.employee_type ||
            "-"}
        </Descriptions.Item>

        <Descriptions.Item label="สร้างบัญชีผู้ใช้">
          {mode === "create"
            ? values.create_user_account
              ? "สร้าง"
              : "ไม่สร้าง"
            : values.update_user_account
            ? "อัปเดตบัญชี"
            : "ไม่แก้ไขบัญชี"}
        </Descriptions.Item>

        <Descriptions.Item label="Role">
          {getValue(role, [
            "role_name",
            "role_code",
          ])}
        </Descriptions.Item>

        <Descriptions.Item label="อีเมลเข้าสู่ระบบ">
          {values.auth_email || "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider
        titlePlacement="left"
        plain
      >
        หมายเหตุ
      </Divider>

      <Row>
        <Col xs={24}>
          <Form.Item
            name="remark"
            label="หมายเหตุ"
          >
            <TextArea
              rows={4}
              maxLength={1000}
              showCount
              placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับพนักงาน"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}