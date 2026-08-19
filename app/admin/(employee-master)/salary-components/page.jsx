"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import {swalSuccess,swalError,swalConfirm,} from "@/components/Swal";
import {useAuth} from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {hasPermission,} from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";

import SalaryComponentSearch from "./components/SalaryComponentSearch";
import SalaryComponentSummaryCards from "./components/SalaryComponentSummaryCards";
import SalaryComponentTable from "./components/SalaryComponentTable";
import SalaryComponentModal from "./components/SalaryComponentModal";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

export default function SalaryComponentsPage() {

  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const [form] = Form.useForm();

  const canView = hasPermission(user,"ems.salary_components.view");
  const canCreate = hasPermission(user,"ems.salary_components.create");
  const canEdit = hasPermission(user,"ems.salary_components.edit");
  const canDelete = hasPermission(user,"ems.salary_components.delete");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [summary, setSummary] =
    useState({
      total: 0,
      active: 0,
      inactive: 0,
    });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  async function loadData() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.set(
        "page",
        page
      );

      params.set(
        "pageSize",
        pageSize
      );

      if (search) {
        params.set(
          "search",
          search
        );
      }

      if (status) {
        params.set(
          "status",
          status
        );
      }

      const res = await fetch(
        `/api/admin/salary-components?${params}`
      );

      const json =
        await res.json();

      if (!json.success) {
        throw new Error(
          json.error
        );
      }

      setData(
        json.data || []
      );

      setSummary(
        json.summary || {
          total: 0,
          active: 0,
          inactive: 0,
        }
      );

      setTotal(
        json.pagination?.total || 0
      );

    } catch (err) {

      console.error(err);

      swalError(
        "เกิดข้อผิดพลาด",
        err.message
      );

    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    loadData();
  }

  useEffect(() => {
    if (loadingUser) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canView) {
      router.replace("/admin");
    }
  }, [loadingUser, user, canView, router]);

  useEffect(() => {
    if (!canView) return;
    loadData();
  }, [canView,page,pageSize,search,status,]);

  function handleAdd() {
    setSelected(null);
    setModalMode("create");

    form.resetFields();

    form.setFieldsValue({
      component_type: "earning",
      calculation_type: "fixed",
      taxable: true,
      social_security: false,
      provident_fund: false,
      sort_order: 0,
      status: "active",
    });

    setModalOpen(true);
  }

  async function handleView(record) {
    try {
      const res = await fetch(
        `/api/admin/salary-components/${record.id}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      form.resetFields();
      form.setFieldsValue(json.data);

      setSelected(json.data);
      setModalMode("view");
      setModalOpen(true);

    } catch (err) {
      swalError(
        "เกิดข้อผิดพลาด",
        err.message
      );
    }
  }

  async function handleEdit(record) {
    try {
      const res = await fetch(
        `/api/admin/salary-components/${record.id}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      form.resetFields();
      form.setFieldsValue(json.data);

      setSelected(json.data);
      setModalMode("edit");
      setModalOpen(true);

    } catch (err) {
      swalError(
        "เกิดข้อผิดพลาด",
        err.message
      );
    }
  }

  async function handleSave(values) {
    if (modalMode === "view") {
      return;
    }
    try {

      setSaving(true);

      const method =
        modalMode === "edit"
          ? "PATCH"
          : "POST";

      const url =
        modalMode === "edit"
          ? `/api/admin/salary-components/${selected.id}`
          : "/api/admin/salary-components";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      swalSuccess(
        json.message
      );

      setModalOpen(false);

      setSelected(null);

      form.resetFields();

      loadData();

    } catch (err) {

      swalError(
        "เกิดข้อผิดพลาด",
        err.message
      );

    } finally {

      setSaving(false);

    }
  }

  async function handleDelete(record) {
    const result =
      await swalConfirm({
        title: "ยืนยันการลบ",
        text: `ต้องการลบ "${record.component_name}" ใช่หรือไม่`,
      });
    if (!result.isConfirmed) {
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/salary-components/${record.id}`,
        {
          method: "DELETE",
        }
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error);
      }
      swalSuccess(json.message);
      loadData();
    } catch (err) {
      swalError(
        "เกิดข้อผิดพลาด",
        err.message
      );

    }
  }

  function handleSearch(value) {
    setPage(1);
    setSearch(value);
  }

  function handleStatusChange(value) {
    setPage(1);
    setStatus(value || "");
  }

  function handleTableChange(pagination) {
    setPage(
      pagination.current
    );

    setPageSize(
      pagination.pageSize
    );
  }

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <>
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="รายการเงินเดือน"
              subtitle="Salary Components Management"
              loading={loading}
              canRefresh
              canCreate={canCreate}
              createText="เพิ่มรายการเงินเดือน"
              onRefresh={handleRefresh}
              onCreate={handleAdd}
            />
            <PageInfoAlert description="หน้านี้ใช้กำหนดองค์ประกอบของเงินเดือน เช่น เงินเดือนพื้นฐาน ค่าตำแหน่ง OT และรายการหักต่างๆ ที่จะนำไปประกอบเป็นสลิปเงินเดือน" />
          </>
        }
        search={
          <SalaryComponentSearch
            value={search}
            loading={loading}
            onChange={handleSearch}
            onRefresh={handleRefresh}
          />
        }
        summary={
          <SalaryComponentSummaryCards
            summary={summary}
          />
        }
        table={
          <SalaryComponentTable
            loading={loading}
            data={data}
            canEdit={canEdit}
            canDelete={canDelete}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) =>
                `ทั้งหมด ${total.toLocaleString()} รายการ`,
            }}
          />
        }
      />

      <SalaryComponentModal
        open={modalOpen}
        disabled={modalMode === "view"}
        title={
          modalMode === "view"
            ? "รายละเอียดรายการเงินเดือน"
            : modalMode === "edit"
              ? "แก้ไขรายการเงินเดือน"
              : "เพิ่มรายการเงินเดือน"
        }
        form={form}
        saving={saving}
        onCancel={() => {
          setModalOpen(false);
          setSelected(null);
          setModalMode("create");

          form.resetFields();
        }}
        onSubmit={() => {
          if (modalMode === "view") {
            return;
          }

          form.submit();
        }}
      />

      <Form
        form={form}
        component={false}
        onFinish={handleSave}
      />
    </>
  );
}
