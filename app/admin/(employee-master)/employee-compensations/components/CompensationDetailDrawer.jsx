"use client";

import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { useEffect, useMemo } from "react";
import {
  employeeName,
  formatDate,
  formatMoney,
  statusMeta,
} from "./compensationUi";

const { Text } = Typography;

export default function CompensationDetailDrawer({
  open,
  loading = false,
  savingComponents = false,
  record,
  salaryComponents = [],
  canEdit = false,
  onClose,
  onSaveComponents,
}) {
  const [componentForm] = Form.useForm();
  const editableComponents = record?.status === "draft" && canEdit;

  useEffect(() => {
    if (!open || !record) return;
    componentForm.setFieldsValue({
      components: (record.components || []).map((item) => ({
        salary_component_id: item.salary_component_id,
        calculation_type: item.calculation_type || "fixed",
        amount: Number(item.amount || 0),
        percentage:
          item.percentage === null || item.percentage === undefined
            ? null
            : Number(item.percentage),
        status: item.status || "active",
        remark: item.remark || "",
      })),
    });
  }, [open, record?.id]);

  const historyColumns = useMemo(
    () => [
      {
        title: "เงินเดือน",
        dataIndex: "base_salary",
        render: (value, row) => formatMoney(value, row.currency_code),
      },
      {
        title: "มีผลตั้งแต่",
        dataIndex: "effective_from",
        render: formatDate,
      },
      {
        title: "ถึง",
        dataIndex: "effective_to",
        render: formatDate,
      },
      {
        title: "แหล่งที่มา",
        dataIndex: "source_type",
        render: (value) => value || "-",
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        render: (value) => {
          const meta = statusMeta(value);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
    ],
    []
  );

  return (
    <Drawer
      open={open}
      size="large"
      title="Compensation Profile"
      onClose={onClose}
      loading={loading}
    >
      {!record ? (
        <Empty />
      ) : (
        <>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="พนักงาน" span={2}>
              <strong>{record.employee?.employee_code || "-"}</strong>{" "}
              {employeeName(record.employee)}
            </Descriptions.Item>
            <Descriptions.Item label="เงินเดือนปัจจุบัน">
              {formatMoney(record.base_salary, record.currency_code)}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะ">
              <Tag color={statusMeta(record.status).color}>
                {statusMeta(record.status).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Salary Structure / แถบเงินเดือน">
              {record.salary_structure?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Position Level Band">
              {record.position_level_band?.band_name ||
                record.position_level_band?.band_code ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Band Min">
              {record.band_min_snapshot == null
                ? "-"
                : formatMoney(record.band_min_snapshot, record.currency_code)}
            </Descriptions.Item>
            <Descriptions.Item label="Band Mid">
              {record.band_mid_snapshot == null
                ? "-"
                : formatMoney(record.band_mid_snapshot, record.currency_code)}
            </Descriptions.Item>
            <Descriptions.Item label="Band Max">
              {record.band_max_snapshot == null
                ? "-"
                : formatMoney(record.band_max_snapshot, record.currency_code)}
            </Descriptions.Item>
            <Descriptions.Item label="มีผลตั้งแต่">
              {formatDate(record.effective_from)}
            </Descriptions.Item>
            <Descriptions.Item label="สิ้นสุด">
              {formatDate(record.effective_to)}
            </Descriptions.Item>
          </Descriptions>

          <Divider titlePlacement="left">องค์ประกอบค่าตอบแทน</Divider>

          {!editableComponents && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              title="รายการ Active/Inactive จะไม่แก้ Components ตรง ๆ เพื่อรักษาประวัติ หากต้องเปลี่ยนให้สร้าง Salary Adjustment"
            />
          )}

          <Form form={componentForm} layout="vertical">
            <Form.List name="components">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" className="w-full" size={12}>
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-12"
                    >
                      <Form.Item
                        {...field}
                        className="!mb-0 md:col-span-4"
                        label="รายการเงินเดือน"
                        name={[field.name, "salary_component_id"]}
                        rules={[{ required: true, message: "เลือกรายการ" }]}
                      >
                        <Select
                          disabled={!editableComponents}
                          showSearch
                          optionFilterProp="label"
                          options={salaryComponents}
                        />
                      </Form.Item>

                      <Form.Item
                        className="!mb-0 md:col-span-2"
                        label="วิธีคำนวณ"
                        name={[field.name, "calculation_type"]}
                      >
                        <Select
                          disabled={!editableComponents}
                          options={[
                            { value: "fixed", label: "Fixed" },
                            { value: "percentage", label: "%" },
                            { value: "formula", label: "Formula" },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        className="!mb-0 md:col-span-2"
                        label="จำนวนเงิน"
                        name={[field.name, "amount"]}
                      >
                        <InputNumber
                          disabled={!editableComponents}
                          min={0}
                          precision={2}
                          className="w-full"
                        />
                      </Form.Item>

                      <Form.Item
                        className="!mb-0 md:col-span-2"
                        label="เปอร์เซ็นต์"
                        name={[field.name, "percentage"]}
                      >
                        <InputNumber
                          disabled={!editableComponents}
                          min={0}
                          precision={4}
                          className="w-full"
                        />
                      </Form.Item>

                      <div className="flex items-end md:col-span-2">
                        <Button
                          danger
                          block
                          disabled={!editableComponents}
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          ลบ
                        </Button>
                      </div>

                      <Form.Item
                        className="!mb-0 md:col-span-12"
                        label="หมายเหตุ"
                        name={[field.name, "remark"]}
                      >
                        <Input disabled={!editableComponents} />
                      </Form.Item>
                    </div>
                  ))}

                  {editableComponents && (
                    <Space>
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() =>
                          add({
                            calculation_type: "fixed",
                            amount: 0,
                            percentage: null,
                            status: "active",
                          })
                        }
                      >
                        เพิ่ม Component
                      </Button>
                      <Button
                        type="primary"
                        loading={savingComponents}
                        icon={<SaveOutlined />}
                        onClick={() => {
                          componentForm.validateFields().then((values) => {
                            onSaveComponents?.(values.components || []);
                          });
                        }}
                      >
                        บันทึก Components
                      </Button>
                    </Space>
                  )}
                </Space>
              )}
            </Form.List>
          </Form>

          <Divider titlePlacement="left">ประวัติเงินเดือน</Divider>
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={record.history || []}
            columns={historyColumns}
            locale={{ emptyText: <Text type="secondary">ไม่มีประวัติ</Text> }}
          />
        </>
      )}
    </Drawer>
  );
}
