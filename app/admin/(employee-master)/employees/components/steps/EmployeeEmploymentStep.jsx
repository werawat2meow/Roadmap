"use client";

import {
  Alert,
  Col,
  DatePicker,
  Divider,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";

import {
  CalendarOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

import {
  useEffect,
} from "react";

import dayjs from "dayjs";

const probationStatusOptions = [
  {
    label: "ทดลองงาน",
    value: "probation",
  },
  {
    label: "ผ่านทดลองงาน",
    value: "passed",
  },
  {
    label: "ไม่ผ่านทดลองงาน",
    value: "failed",
  },
  {
    label: "ไม่ใช้ทดลองงาน",
    value: "not_required",
  },
];

const systemStatusOptions = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
  {
    label: "ลาออก",
    value: "resigned",
  },
];

function toDayjs(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value;
  }

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed
    : null;
}

function makeOptions(
  rows,
  codeKey,
  nameKey
) {
  return rows.map((item) => ({
    value: item.id,

    label: item?.[codeKey]
      ? `${item[codeKey]} - ${
          item?.[nameKey] || "-"
        }`
      : item?.[nameKey] || "-",
  }));
}

export default function EmployeeEmploymentStep({
  form,
  disabled = false,
  masterData = {},
  masterLoading = false,
}) {

  const employmentTypeId = Form.useWatch("employment_type_id",form);

  const startWorkDate =
    Form.useWatch(
      "start_work_date",
      form
    );

  const probationDays =
    Form.useWatch(
      "probation_days",
      form
    );

  const status =
    Form.useWatch(
      "status",
      form
    );

  const employmentTypes =
    masterData.employmentTypes ||
    [];

  const employeeStatuses =
    masterData.employeeStatuses ||
    [];

  const employmentTypeOptions =
    makeOptions(
      employmentTypes,
      "type_code",
      "type_name"
    );

  const employeeStatusOptions =
    makeOptions(
      employeeStatuses,
      "status_code",
      "status_name"
    );

  const selectedEmploymentType = employmentTypes.find((item) => String(item.id) === String(employmentTypeId)) || null;
  const probationRequired = selectedEmploymentType?.probation_required === true;

  const handleEmploymentTypeChange = (value) => {
    if (!value) {
      form.setFieldsValue({
        employment_type_id: undefined,
        employee_status_id: undefined,
        probation_days: 0,
        probation_status: "not_required",
        probation_end_date: null,
      });

      return;
    }

    const selectedType =
      employmentTypes.find(
        (item) =>
          String(item.id) ===
          String(value)
      );

    if (!selectedType) {
      return;
    }

    const isProbation =
      selectedType
        .probation_required === true;

    const defaultProbationDays =
      isProbation
        ? Number(
            selectedType
              .probation_days || 0
          )
        : 0;

    form.setFieldsValue({
      employee_status_id:
        selectedType
          .default_employee_status_id ||
        undefined,

      probation_days:
        defaultProbationDays,

      probation_status:
        isProbation
          ? "probation"
          : "not_required",

      probation_end_date:
        null,
    });
  };
  
  useEffect(() => {
    /*
    * ประเภทการจ้างไม่ต้องทดลองงาน
    */

    if (selectedEmploymentType && !probationRequired) {
      form.setFieldsValue({
        probation_days: 0,
        probation_end_date: null,
        probation_status:
          "not_required",
      });
      return;
    }

    if (!selectedEmploymentType) {
      return;
    }


    if (!startWorkDate || probationDays === null || probationDays === undefined || probationDays === "") {
      form.setFieldValue(
        "probation_end_date",
        null
      );
      return;
    }

    const start = toDayjs(startWorkDate);
    if (!start) {
      return;
    }
    const days = Number(probationDays);
    if (!Number.isFinite(days) || days <= 0) {
      form.setFieldValue(
        "probation_end_date",
        null
      );
      return;
    }

    const endDate =
      start.add(
        days,
        "day"
      );

    form.setFieldValue(
      "probation_end_date",
      endDate
    );
  }, [selectedEmploymentType,probationRequired,startWorkDate,probationDays,form,]);

  return (
    <div>
      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SolutionOutlined />
          ข้อมูลการจ้างงาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ประเภทการจ้าง"
            name="employment_type_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภทการจ้าง",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกประเภทการจ้าง"
              options={
                employmentTypeOptions
              }
              optionFilterProp="label"
              onChange={
                handleEmploymentTypeChange
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สถานะพนักงาน"
            name="employee_status_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะพนักงาน",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกสถานะพนักงาน"
              options={
                employeeStatusOptions
              }
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สถานะระบบ"
            name="status"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะระบบ",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={
                systemStatusOptions
              }
              placeholder="เลือกสถานะ"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <CalendarOutlined />
          วันที่เกี่ยวกับการจ้างงาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่เริ่มงาน"
            name="start_work_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่เริ่มงาน",
              },
            ]}
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันที่เริ่มงาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่บรรจุ"
            name="confirmation_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันที่บรรจุ"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่เกษียณ"
            name="retirement_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันที่เกษียณ"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ClockCircleOutlined />
          การทดลองงาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="จำนวนวันทดลองงาน"
            name="probation_days"
            rules={[
              {
                type: "number",
                min: 0,
                message:
                  "จำนวนวันทดลองงานต้องไม่น้อยกว่า 0",
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              disabled={disabled}
              className="w-full"
              placeholder="เช่น 119"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันสิ้นสุดทดลองงาน"
            name="probation_end_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="วันสิ้นสุดทดลองงาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สถานะทดลองงาน"
            name="probation_status"
          >
            <Select
              disabled={disabled}
              options={
                probationStatusOptions
              }
              placeholder="เลือกสถานะทดลองงาน"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        การสิ้นสุดการจ้างงาน
      </Divider>

      {status === "resigned" && (
        <Alert
          showIcon
          type="warning"
          title="พนักงานลาออก"
          description="กรุณาระบุวันที่ลาออก ระบบจะใช้ข้อมูลนี้ในการประมวลผลรายงานและสิทธิ์การใช้งาน"
          className="mb-5"
        />
      )}

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่ลาออก"
            name="resignation_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
            rules={[
              {
                required:
                  status ===
                  "resigned",
                message:
                  "กรุณาเลือกวันที่ลาออก",
              },
            ]}
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันที่ลาออก"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่สิ้นสุดการจ้าง"
            name="termination_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันที่สิ้นสุด"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}