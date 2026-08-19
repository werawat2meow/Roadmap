"use client";

import { useState } from "react";
import {
  Alert,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Switch,
} from "antd";

import dayjs from "dayjs";

import UserAccessScopeList, {
  createEmptyScope,
} from "./UserAccessScopeList";

/* =========================================================
   Constants
========================================================= */

const STATUS_OPTIONS = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

/* =========================================================
   Helpers
========================================================= */

function buildEmployeeName(
  employee
) {
  if (!employee) {
    return "";
  }

  const fullNameTh = [
    employee.first_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullNameEn = [
    employee.first_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    employee.full_name_th ||
    fullNameTh ||
    employee.full_name_en ||
    fullNameEn ||
    ""
  );
}

function makeUserAccountOptions(
  userAccounts = []
) {
  return userAccounts.map(
    (item) => {
      const employee =
        item?.employee ||
        item?.employees ||
        null;

      const employeeCode =
        employee?.employee_code ||
        "";

      const employeeName =
        buildEmployeeName(
          employee
        );

      const username =
        item?.username || "-";

      let label = username;

      if (employeeName) {
        label = employeeCode
          ? `${employeeCode} - ${employeeName} (${username})`
          : `${employeeName} (${username})`;
      }

      return {
        value: item.id,
        label,
        disabled:
          item.is_active === false,
      };
    }
  );
}

function makeRoleOptions(
  roles = []
) {
  return roles.map((item) => ({
    value: item.id,

    label: item.role_code
      ? `${item.role_code} - ${item.role_name}`
      : item.role_name || "-",

    disabled:
      item.is_active === false,
  }));
}

/* =========================================================
   Initial Values
========================================================= */

export function getInitialAssignmentValues() {
  return {
    user_account_id: null,

    role_id: null,

    assignment_name: "",

    is_primary: false,

    status: "active",

    effective_from: dayjs(),

    effective_to: null,

    scopes: [
      createEmptyScope(0),
    ],
  };
}

/* =========================================================
   Component
========================================================= */

export default function UserAccessAssignmentForm({
  form,

  disabled = false,

  masterLoading = false,

  userAccounts = [],

  roles = [],

  companies = [],

  branchGroups = [],

  branches = [],

  departments = [],

  divisions = [],

  units = [],
}) {

  const [saving, setSaving] = useState(false);
  const selectedUserAccountId = Form.useWatch("user_account_id",form);
  const status = Form.useWatch("status",form);
  const userAccountOptions = makeUserAccountOptions(userAccounts);
  const roleOptions = makeRoleOptions(roles);

  /* =======================================================
     Inactive Assignment cannot be Primary
  ======================================================= */

  const handleStatusChange = (
    value
  ) => {
    if (value === "inactive") {
      form.setFieldValue(
        "is_primary",
        false
      );
    }
  };

  const handleUserAccountChange = (userAccountId) => {
    if (!userAccountId) {
      form.setFieldValue(
        "role_id",
        null
      );
      return;
    }

    const selectedUser =
      userAccounts.find(
        (item) =>
          item.id === userAccountId
      );

    const defaultRoleId =
      selectedUser?.role_id ||
      selectedUser?.role?.id ||
      selectedUser?.roles?.id ||
      null;

    form.setFieldValue(
      "role_id",
      defaultRoleId
    );
  };

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      initialValues={
        getInitialAssignmentValues()
      }
    >
      <Alert
        type="info"
        showIcon
        className="mb-5"
        title="Role กำหนดว่าผู้ใช้งานทำอะไรได้ ส่วนขอบเขตสังกัดกำหนดว่าทำกับข้อมูลส่วนใดได้"
      />

      {/* =====================================================
          Assignment Information
      ===================================================== */}

      <Row gutter={16}>
        <Col
          xs={24}
          lg={12}
        >
          <Form.Item
            label="ผู้ใช้งานระบบ"
            name="user_account_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกผู้ใช้งานระบบ",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="เลือกผู้ใช้งานระบบ"
              loading={masterLoading}
              options={userAccountOptions}
              onChange={
                handleUserAccountChange
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          lg={12}
        >
          <Form.Item
            label="บทบาทผู้ใช้งาน"
            name="role_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบทบาทผู้ใช้งาน",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="บทบาทผู้ใช้งาน"
              loading={masterLoading}
              options={roleOptions}
              disabled={
                disabled ||
                saving ||
                Boolean(
                  selectedUserAccountId
                )
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="ชื่อ Assignment"
            name="assignment_name"
          >
            <Input
              maxLength={200}
              showCount
              placeholder="เช่น HR ดูแลหลายสังกัดภูเก็ต"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่เริ่มต้น"
            name="effective_from"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุวันที่เริ่มต้น",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่สิ้นสุด"
            name="effective_to"
            dependencies={[
              "effective_from",
            ]}
            rules={[
              ({ getFieldValue }) => ({
                validator(
                  _,
                  value
                ) {
                  const effectiveFrom =
                    getFieldValue(
                      "effective_from"
                    );

                  if (
                    !value ||
                    !effectiveFrom ||
                    !value.isBefore(
                      effectiveFrom,
                      "day"
                    )
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="ไม่กำหนด"
            />
          </Form.Item>
        </Col>

        <Col
          xs={12}
          md={4}
        >
          <Form.Item
            label="Role หลัก"
            name="is_primary"
            valuePropName="checked"
          >
            <Switch
              disabled={
                disabled ||
                status === "inactive"
              }
              checkedChildren="หลัก"
              unCheckedChildren="ทั่วไป"
            />
          </Form.Item>
        </Col>

        <Col
          xs={12}
          md={4}
        >
          <Form.Item
            label="สถานะ"
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
              options={
                STATUS_OPTIONS
              }
              onChange={
                handleStatusChange
              }
            />
          </Form.Item>
        </Col>
      </Row>

      {/* =====================================================
          Assignment Scopes
      ===================================================== */}

      <Divider
        titlePlacement="left"
      >
        ขอบเขตสังกัด
      </Divider>

      <UserAccessScopeList
        form={form}
        disabled={disabled}
        masterLoading={
          masterLoading
        }
        companies={companies}
        branchGroups={
          branchGroups
        }
        branches={branches}
        departments={
          departments
        }
        divisions={divisions}
        units={units}
      />
    </Form>
  );
}