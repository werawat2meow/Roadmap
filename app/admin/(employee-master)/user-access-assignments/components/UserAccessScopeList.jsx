"use client";

import {
  Alert,
  Button,
  Form,
  Space,
} from "antd";

import {
  PlusOutlined,
} from "@ant-design/icons";

import UserAccessScopeItem from "./UserAccessScopeItem";

/* =========================================================
   Helpers
========================================================= */

export function createEmptyScope(
  index = 0
) {
  return {
    scope_type: "branch",

    company_id: null,

    branch_group_id: null,

    branch_id: null,

    department_id: null,

    division_id: null,

    unit_id: null,

    status: "active",

    sort_order: index,
  };
}

/* =========================================================
   Component
========================================================= */

export default function UserAccessScopeList({
  form,

  disabled = false,

  masterLoading = false,

  companies = [],

  branchGroups = [],

  branches = [],

  departments = [],

  divisions = [],

  units = [],
}) {
  const scopes =
    Form.useWatch(
      "scopes",
      form
    ) || [];

  const hasAllScope =
    scopes.some(
      (scope) =>
        scope?.scope_type ===
        "all"
    );

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="กำหนดขอบเขตข้อมูลที่ Role นี้สามารถเข้าถึงได้"
        description="หนึ่ง Assignment สามารถมีหลายสังกัดได้ แต่ถ้าเลือกทุกสังกัด จะไม่สามารถเลือกขอบเขตอื่นร่วมกัน"
      />

      <Form.List name="scopes">
        {(
          fields,
          {
            add,
            remove,
          }
        ) => (
          <Space
            orientation="vertical"
            size="middle"
            className="w-full"
          >
            {fields.map(
              (field, index) => (
                <UserAccessScopeItem
                  key={field.key}
                  form={form}
                  field={field}
                  index={index}
                  scope={
                    scopes[index] ||
                    createEmptyScope(
                      index
                    )
                  }
                  totalFields={
                    fields.length
                  }
                  disabled={
                    disabled
                  }
                  masterLoading={
                    masterLoading
                  }
                  companies={
                    companies
                  }
                  branchGroups={
                    branchGroups
                  }
                  branches={
                    branches
                  }
                  departments={
                    departments
                  }
                  divisions={
                    divisions
                  }
                  units={units}
                  onRemove={remove}
                />
              )
            )}

            {!disabled && (
              <Button
                block
                type="dashed"
                icon={
                  <PlusOutlined />
                }
                disabled={
                  hasAllScope
                }
                onClick={() =>
                  add(
                    createEmptyScope(
                      fields.length
                    )
                  )
                }
              >
                {hasAllScope
                  ? "เลือกทุกสังกัดแล้ว"
                  : "เพิ่มขอบเขต"}
              </Button>
            )}
          </Space>
        )}
      </Form.List>
    </div>
  );
}