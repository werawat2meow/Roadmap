"use client";

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from "antd";

import {
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import {
  useState,
} from "react";

import {
  useAuth,
} from "@/contexts/AuthContext";

import {
  hasEmployeePortalPermission,
} from "../lib/employeePortalAccess";

import {
  mockLeaveBalances,
} from "../_mock/employeePortalMockData";

const {
  Title,
  Text,
} = Typography;

const {
  TextArea,
} = Input;

const {
  RangePicker,
} = DatePicker;

export default function EmployeeLeavePage() {
  const {
    user,
  } =
    useAuth();

  const [
    form,
  ] =
    Form.useForm();

  const [
    submitted,
    setSubmitted,
  ] =
    useState(false);

  const canView =
    hasEmployeePortalPermission(
      user,
      "ep.leave_requests.view"
    );

  const canCreate =
    hasEmployeePortalPermission(
      user,
      "ep.leave_requests.create"
    );

  if (!canView) {
    return (
      <Alert
        type="warning"
        showIcon
        title="คุณไม่มีสิทธิ์ดูข้อมูลการลา"
      />
    );
  }

  function handleSubmit() {
    setSubmitted(true);

    form.resetFields();
  }

  return (
    <div>
      <div className="mb-5">
        <Title
          level={3}
          className="!mb-1"
        >
          ขออนุมัติการลา
        </Title>

        <Text className="!text-slate-500">
          ตรวจสอบสิทธิ์การลาและส่งคำขอได้จากหน้านี้
        </Text>
      </div>

      {submitted && (
        <Alert
          type="success"
          showIcon
          closable
          icon={
            <CheckCircleOutlined />
          }
          title="บันทึกคำขอ Draft แล้ว"
          description="รอบนี้เป็น Mock Data จึงยังไม่ได้ส่งข้อมูลเข้า Database หรือ Approval Workflow จริง"
          className="!mb-5"
          onClose={() =>
            setSubmitted(
              false
            )
          }
        />
      )}

      <section>
        <div className="mb-3 font-semibold text-slate-800">
          สิทธิ์การลาของฉัน
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {mockLeaveBalances.map(
            (item) => (
              <Card
                key={
                  item.code
                }
                size="small"
                className="!rounded-2xl"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CalendarOutlined />
                  {item.name}
                </div>

                <div className="mt-3 text-2xl font-bold text-slate-800">
                  {item.remaining}{" "}
                  <span className="text-sm font-medium text-slate-400">
                    {item.unit}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  ใช้แล้ว {item.used} / ทั้งหมด {item.entitled} {item.unit}
                </div>
              </Card>
            )
          )}
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <Title
            level={4}
            className="!mb-1"
          >
            แบบฟอร์มขอลางาน
          </Title>

          <Text className="!text-slate-500">
            กรุณากรอกข้อมูลให้ครบก่อนส่งคำขอ
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          disabled={
            !canCreate
          }
          onFinish={
            handleSubmit
          }
        >
          <Row
            gutter={[
              16,
              0,
            ]}
          >
            <Col
              xs={24}
              md={10}
            >
              <Form.Item
                label="ประเภทการลา"
                name="leave_type"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกประเภทการลา",
                  },
                ]}
              >
                <Select
                  placeholder="เลือกประเภทการลา"
                  options={
                    mockLeaveBalances.map(
                      (item) => ({
                        value:
                          item.code,
                        label:
                          `${item.name} (คงเหลือ ${item.remaining} ${item.unit})`,
                      })
                    )
                  }
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={14}
            >
              <Form.Item
                label="วันที่ลา"
                name="leave_dates"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกวันที่ลา",
                  },
                ]}
              >
                <RangePicker
                  format="DD/MM/YYYY"
                  style={{
                    width:
                      "100%",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="เหตุผล"
                name="reason"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุเหตุผล",
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  maxLength={1000}
                  showCount
                  placeholder="ระบุเหตุผลในการลา"
                />
              </Form.Item>
            </Col>
          </Row>

          {canCreate ? (
            <Button
              type="primary"
              htmlType="submit"
              size="large"
            >
              ส่งคำขอ
            </Button>
          ) : (
            <Alert
              type="info"
              showIcon
              title="คุณมีสิทธิ์ดูข้อมูล แต่ไม่มีสิทธิ์สร้างคำขอลา"
            />
          )}
        </Form>
      </section>
    </div>
  );
}
