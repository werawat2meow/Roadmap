"use client";

import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

/* =========================================================
   Options
========================================================= */

const MENU_TYPE_OPTIONS = [
  {
    label: "Link",
    value: "link",
  },
  {
    label: "Group",
    value: "group",
  },
  {
    label: "Action",
    value: "action",
  },
];

const OPEN_MODE_OPTIONS = [
  {
    label: "Router",
    value: "router",
  },
  {
    label: "Hard Reload",
    value: "hard",
  },
  {
    label: "External",
    value: "external",
  },
];

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
   Initial Values
========================================================= */

export function getInitialPortalMenuItemValues() {
  return {
    system_id: undefined,
    group_id: undefined,
    parent_id: undefined,

    menu_code: "",
    menu_name: "",
    menu_subtitle: "",

    menu_type: "link",

    route_path: "",

    module_code: "",
    page_code: "",

    permission_code: "",
    icon_code: "",

    open_mode: "router",

    sort_order: 0,

    is_visible: true,

    status: "active",
  };
}

/* =========================================================
   Component
========================================================= */

export default function PortalMenuItemForm({
  form,

  systems = [],

  groups = [],

  parentItems = [],

  disabled = false,

  saving = false,

  onFinish,

  onSystemChange,

  onGroupChange,
}) {
  const systemId =
    Form.useWatch(
      "system_id",
      form
    );

  const groupId =
    Form.useWatch(
      "group_id",
      form
    );

  const menuType =
    Form.useWatch(
      "menu_type",
      form
    );

  const openMode =
    Form.useWatch(
      "open_mode",
      form
    );

  const filteredGroups =
    groups.filter(
      (item) =>
        !systemId ||
        item.system_id ===
          systemId
    );

  const filteredParents =
    parentItems.filter(
      (item) => {
        if (
          systemId &&
          item.system_id !==
            systemId
        ) {
          return false;
        }

        if (
          groupId &&
          item.group_id !==
            groupId
        ) {
          return false;
        }

        return true;
      }
    );

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={
        disabled ||
        saving
      }
      initialValues={
        getInitialPortalMenuItemValues()
      }
      onFinish={onFinish}
    >
      <Row gutter={[16, 0]}>
        {/* =================================================
            System
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ระบบ"
            name="system_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกระบบ",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              placeholder="เลือกระบบ"
              options={systems}
              optionFilterProp="label"
              onChange={(value) => {
                onSystemChange?.(
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Group
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Menu Group"
            name="group_id"
          >
            <Select
              showSearch
              allowClear
              placeholder="เลือก Group"
              options={
                filteredGroups
              }
              optionFilterProp="label"
              onChange={(value) => {
                onGroupChange?.(
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Parent
        ================================================= */}

        <Col xs={24}>
          <Form.Item
            label="Parent Menu"
            name="parent_id"
            extra="ใช้เมื่อเมนูนี้เป็นเมนูย่อย เช่น Employee Code อยู่ใต้ Settings"
          >
            <Select
              showSearch
              allowClear
              placeholder="ไม่มี Parent"
              options={
                filteredParents
              }
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Menu Code
        ================================================= */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Menu Code"
            name="menu_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสเมนู",
              },
              {
                pattern:
                  /^[A-Za-z0-9_]+$/,
                message:
                  "ใช้ได้เฉพาะ A-Z, 0-9 และ _",
              },
            ]}
          >
            <Input
              placeholder="เช่น EMPLOYEE_LIST"
              onChange={(event) => {
                const value =
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_]/g,
                      ""
                    );

                form.setFieldValue(
                  "menu_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Menu Name
        ================================================= */}

        <Col
          xs={24}
          md={16}
        >
          <Form.Item
            label="ชื่อเมนู"
            name="menu_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อเมนู",
              },
            ]}
          >
            <Input
              placeholder="เช่น Employee List"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Subtitle
        ================================================= */}

        <Col xs={24}>
          <Form.Item
            label="คำอธิบายเมนู"
            name="menu_subtitle"
          >
            <Input
              placeholder="เช่น จัดการรายชื่อพนักงาน"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Type
        ================================================= */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ประเภทเมนู"
            name="menu_type"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภทเมนู",
              },
            ]}
          >
            <Select
              options={
                MENU_TYPE_OPTIONS
              }
              onChange={(value) => {
                if (
                  value ===
                  "group"
                ) {
                  form.setFieldValue(
                    "route_path",
                    ""
                  );
                }
              }}
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Open Mode
        ================================================= */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รูปแบบการเปิด"
            name="open_mode"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกรูปแบบการเปิด",
              },
            ]}
          >
            <Select
              options={
                OPEN_MODE_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Sort
        ================================================= */}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ลำดับ"
            name="sort_order"
          >
            <InputNumber
              min={0}
              precision={0}
              className="!w-full"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Route
        ================================================= */}

        <Col xs={24}>
          <Form.Item
            label="Route Path"
            name="route_path"
            extra={
              menuType ===
              "group"
                ? "เมนูประเภท Group ไม่ต้องมี Route"
                : openMode ===
                    "external"
                  ? "กรอก URL เต็ม เช่น https://example.com"
                  : "กรอก URL จริงของ Next.js เช่น /admin/employees"
            }
            rules={[
              ({}) => ({
                validator(
                  _,
                  value
                ) {
                  if (
                    menuType ===
                    "group"
                  ) {
                    return Promise.resolve();
                  }

                  if (
                    !String(
                      value || ""
                    ).trim()
                  ) {
                    return Promise.reject(
                      new Error(
                        "กรุณาระบุ Route"
                      )
                    );
                  }

                  if (
                    openMode ===
                      "external" &&
                    !/^https?:\/\//i.test(
                      String(
                        value
                      )
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "External URL ต้องขึ้นต้นด้วย http:// หรือ https://"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              disabled={
                disabled ||
                saving ||
                menuType ===
                  "group"
              }
              placeholder="/admin/employees"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Module
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Module Code"
            name="module_code"
            extra="เช่น ems, access, api"
          >
            <Input
              placeholder="ems"
              onChange={(event) => {
                form.setFieldValue(
                  "module_code",
                  event.target.value
                    .trim()
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9_]/g,
                      ""
                    )
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Page
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Page Code"
            name="page_code"
            extra="เช่น employees, positions, roles"
          >
            <Input
              placeholder="employees"
              onChange={(event) => {
                form.setFieldValue(
                  "page_code",
                  event.target.value
                    .trim()
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9_]/g,
                      ""
                    )
                );
              }}
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Permission
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Permission Code"
            name="permission_code"
            extra="เช่น ems.employees.view"
          >
            <Input
              placeholder="ems.employees.view"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Icon
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="Icon Code"
            name="icon_code"
            extra="เช่น user, setting, team, dashboard"
          >
            <Input
              placeholder="user"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Visible
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="แสดงบน Portal"
            name="is_visible"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="แสดง"
              unCheckedChildren="ซ่อน"
            />
          </Form.Item>
        </Col>

        {/* =================================================
            Status
        ================================================= */}

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="สถานะ"
            name="status"
          >
            <Select
              options={
                STATUS_OPTIONS
              }
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}