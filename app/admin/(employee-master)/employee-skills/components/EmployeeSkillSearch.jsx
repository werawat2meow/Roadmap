"use client";

import { useEffect, useState } from "react";

import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
} from "antd";

import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  ImportOutlined, 
  ExportOutlined,
} from "@ant-design/icons";

const { Option } = Select;

export default function EmployeeSkillSearch({
  search,
  onSearchChange,

  status,
  onStatusChange,

  employeeId,
  onEmployeeChange,

  skillId,
  onSkillChange,

  categoryId,
  onCategoryChange,

  importanceLevel,
  onImportanceLevelChange,

  isVerified,
  onVerifiedChange,

  canCreate,
  canExport,
  canImport,

  onAdd,
  onRefresh,
  onExport,
  onImport,
}) {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);

  /* =========================
     Load Master
  ========================= */

  useEffect(() => {
    async function loadMaster() {
      await Promise.all([
        loadEmployees(),
        loadSkills(),
        loadCategories(),
      ]);
    }

    loadMaster();
  }, []);

  /* =========================
     Employees
  ========================= */

  async function loadEmployees() {
    try {
      const res = await fetch(
        "/api/admin/employees?all=true&status=active"
      );

      const json = await res.json();

      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  /* =========================
     Skills
  ========================= */

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

  /* =========================
     Categories
  ========================= */

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

  return (
    <>
      {/* =========================
          Row 1
      ========================= */}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="ค้นหารหัสพนักงาน / ชื่อ / Skill"
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
          />
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="สถานะ"
            value={status || undefined}
            onChange={onStatusChange}
          >
            <Option value="active">
              Active
            </Option>

            <Option value="inactive">
              Inactive
            </Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: "100%" }}
            placeholder="พนักงาน"
            value={employeeId || undefined}
            onChange={onEmployeeChange}
          >
            {employees.map((item) => (
              <Option
                key={item.id}
                value={item.id}
                label={`${item.employee_code} ${item.full_name_th}`}
              >
                {item.employee_code} - {item.full_name_th}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: "100%" }}
            placeholder="Skill"
            value={skillId || undefined}
            onChange={onSkillChange}
          >
            {skills.map((item) => (
              <Option
                key={item.id}
                value={item.id}
                label={`${item.skill_code} ${item.skill_name}`}
              >
                {item.skill_code} - {item.skill_name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* =========================
          Row 2
      ========================= */}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: "100%" }}
            placeholder="หมวดหมู่"
            value={categoryId || undefined}
            onChange={onCategoryChange}
          >
            {categories.map((item) => (
              <Option
                key={item.id}
                value={item.id}
                label={item.category_name}
              >
                {item.category_code} - {item.category_name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Importance"
            value={importanceLevel || undefined}
            onChange={onImportanceLevelChange}
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="critical">Critical</Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Verified"
            value={
              isVerified === ""
                ? undefined
                : isVerified
            }
            onChange={onVerifiedChange}
          >
            <Option value={true}>
              Verified
            </Option>

            <Option value={false}>
              Not Verified
            </Option>
          </Select>
        </Col>

        <Col
          xs={24}
          sm={12}
          md={8}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
            >
              Refresh
            </Button>

            {canImport && (
              <Button
                icon={<ImportOutlined />}
                onClick={onImport}
              >
                Import
              </Button>
            )}

            {canExport && (
              <Button
                icon={<ExportOutlined />}
                onClick={onExport}
              >
                Export
              </Button>
            )}

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
              >
                เพิ่มข้อมูล
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </>
  );
}