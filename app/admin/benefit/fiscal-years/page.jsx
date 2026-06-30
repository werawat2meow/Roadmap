"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {Button,Card,DatePicker,Form,Input,InputNumber,message,Modal,Popconfirm,Space,Switch,Table,Tag,} from "antd";

import {PlusOutlined,ReloadOutlined,EditOutlined,DeleteOutlined,} from "@ant-design/icons";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

export default function BenefitFiscalYearsPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const canCreate = hasPermission(user, "benefit.master.create") ||
    hasPermission(user, "benefit.master.manage");

  const canUpdate =
    hasPermission(user, "benefit.master.update") ||
    hasPermission(user, "benefit.master.manage");

  const canDelete =
    hasPermission(user, "benefit.master.delete") ||
    hasPermission(user, "benefit.master.manage");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");

  const [editingRow, setEditingRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadData = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    keyword = search
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(
        `/api/admin/benefit/fiscal-years?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(result.data || []);

      setPagination({
        current: result.page || page,
        pageSize: result.pageSize || pageSize,
        total: result.total || 0,
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, pagination.pageSize, "");
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, pagination.pageSize, search);
    }, 500);

    return () => clearTimeout(timer);

    // eslint-disable-next-line
  }, [search]);

  const openCreate = () => {
    setEditingRow(null);

    form.resetFields();

    form.setFieldsValue({
      fiscal_year: new Date().getFullYear(),
      fiscal_name: `FY ${new Date().getFullYear()}`,
      start_date: dayjs(`${new Date().getFullYear()}-01-01`),
      end_date: dayjs(`${new Date().getFullYear()}-12-31`),
      sort_order: 1,
      is_current: false,
      is_closed: false,
      is_active: true,
    });

    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingRow(record);

    form.setFieldsValue({
      fiscal_year: record.fiscal_year,
      fiscal_name: record.fiscal_name,
      start_date: record.start_date
        ? dayjs(record.start_date)
        : null,
      end_date: record.end_date
        ? dayjs(record.end_date)
        : null,
      description: record.description,
      sort_order: record.sort_order,
      is_current: record.is_current,
      is_closed: record.is_closed,
      is_active: record.is_active,
    });

    setModalOpen(true);
  };
    const handleDelete = async (record) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/benefit/fiscal-years/${record.id}`,{method: "DELETE",});
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "ลบข้อมูลไม่สำเร็จ");
      }

      message.success(result.message || "ลบข้อมูลสำเร็จ");
      loadData(1, pagination.pageSize, search);
    } catch (error) {
      message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const startDate = values.start_date;
      const endDate = values.end_date;

      if (endDate.isBefore(startDate, "day")) {
        message.error("End Date ต้องไม่น้อยกว่า Start Date");
        return;
      }

      if (Number(values.fiscal_year) !== Number(startDate.format("YYYY"))) {
        message.error("Fiscal Year ต้องตรงกับปีของ Start Date");
        return;
      }

      setSaving(true);

      const payload = {
        fiscal_year: Number(values.fiscal_year),
        fiscal_name: values.fiscal_name,
        start_date: startDate.format("YYYY-MM-DD"),
        end_date: endDate.format("YYYY-MM-DD"),
        description: values.description || "",
        sort_order: values.sort_order || 1,
        is_current: values.is_current ?? false,
        is_closed: values.is_closed ?? false,
        is_active: values.is_active ?? true,
      };

      const url = editingRow ? `/api/admin/benefit/fiscal-years/${editingRow.id}` : "/api/admin/benefit/fiscal-years";
      const method = editingRow ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      message.success(result.message || "บันทึกข้อมูลสำเร็จ");

      setModalOpen(false);
      setEditingRow(null);
      form.resetFields();

      loadData(pagination.current, pagination.pageSize, search);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Fiscal Year",
      dataIndex: "fiscal_year",
      width: 130,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Name",
      dataIndex: "fiscal_name",
      width: 220,
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Current",
      dataIndex: "is_current",
      width: 120,
      align: "center",
      render: (value) =>
        value ? <Tag color="green">Current</Tag> : <Tag>Normal</Tag>,
    },
    {
      title: "Closed",
      dataIndex: "is_closed",
      width: 120,
      align: "center",
      render: (value) =>
        value ? <Tag color="red">Closed</Tag> : <Tag color="blue">Open</Tag>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 120,
      align: "center",
      render: (value) =>
        value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "Action",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space>
          {canUpdate && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          )}

          {canDelete && (
            <Popconfirm
              title="ยืนยันการลบ?"
              description="ต้องการลบ Fiscal Year นี้หรือไม่"
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
    return (
    <div className="p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-2xl font-bold text-slate-800">Fiscal Year</div>
          <div className="text-sm text-slate-500">
            Master Setup สำหรับกำหนดปีงบประมาณของระบบสวัสดิการ
          </div>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              loadData(pagination.current, pagination.pageSize, search)
            }
          >
            Refresh
          </Button>

          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Fiscal Year
            </Button>
          )}
        </Space>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <Input.Search
            allowClear
            placeholder="ค้นหา Fiscal Name / รายละเอียด"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(value) => loadData(1, pagination.pageSize, value)}
            className="max-w-md"
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            onChange: (page, pageSize) => loadData(page, pageSize, search),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingRow ? "Edit Fiscal Year" : "Add Fiscal Year"}
        open={modalOpen}
        forceRender
        onCancel={() => {
          setModalOpen(false);
          setEditingRow(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        destroyOnHidden
      >

        <Form form={form} layout="vertical">
          <Form.Item
            label="Fiscal Year"
            name="fiscal_year"
            rules={[
              { required: true, message: "กรุณากรอก Fiscal Year" },
            ]}
          >
            <InputNumber min={2000} max={2500} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Fiscal Name"
            name="fiscal_name"
            rules={[
              { required: true, message: "กรุณากรอก Fiscal Name" },
            ]}
          >
            <Input placeholder="เช่น FY 2026" />
          </Form.Item>

          <Form.Item
            label="Start Date"
            name="start_date"
            rules={[
              { required: true, message: "กรุณาเลือก Start Date" },
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="end_date"
            dependencies={["start_date"]}
            rules={[
              { required: true, message: "กรุณาเลือก End Date" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue("start_date");

                  if (!startDate || !value) {
                    return Promise.resolve();
                  }

                  if (value.isBefore(startDate, "day")) {
                    return Promise.reject(
                      new Error("End Date ต้องไม่น้อยกว่า Start Date")
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม" />
          </Form.Item>

          <Form.Item label="Sort Order" name="sort_order">
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Current Fiscal Year"
            name="is_current"
            valuePropName="checked"
          >
            <Switch checkedChildren="Current" unCheckedChildren="Normal" />
          </Form.Item>

          <Form.Item
            label="Closed Fiscal Year"
            name="is_closed"
            valuePropName="checked"
          >
            <Switch checkedChildren="Closed" unCheckedChildren="Open" />
          </Form.Item>

          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>

      </Modal>
    </div>
  );
}