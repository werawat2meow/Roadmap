"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import {useAuth} from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { swalSuccess, swalError, swalConfirm, } from "@/components/Swal";
import {hasPermission,} from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PayrollGroupSearch from "./components/PayrollGroupSearch";
import PayrollGroupSummaryCards from "./components/PayrollGroupSummaryCards";
import PayrollGroupTable from "./components/PayrollGroupTable";
import PayrollGroupModal from "./components/PayrollGroupModal";
import PageInfoAlert from "../components/common/PageInfoAlert";

export default function PayrollGroupsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const [form] = Form.useForm();
  
  const canView = hasPermission(user,"ems.payroll_groups.view");
  const canCreate = hasPermission(user,"ems.payroll_groups.create");
  const canEdit = hasPermission(user,"ems.payroll_groups.edit");
  const canDelete = hasPermission(user,"ems.payroll_groups.delete");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] =useState(false);
  const [search, setSearch] =useState("");
  const [data, setData] =useState([]);
  const [summary, setSummary] =
    useState({
      total: 0,
      active: 0,
      inactive: 0,
    });

  // const [payrollCompanies,setPayrollCompanies] =useState([]);
  const [selected,setSelected] =useState(null);
  const [modalOpen,setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [page,setPage] =useState(1);
  const [pageSize,setPageSize] =useState(20);
  const [total,setTotal] =useState(0);


  // async function loadPayrollCompanies() {
  //   try {
  //     const res = await fetch(
  //       "/api/admin/payroll-companies?all=true"
  //     );

  //     const json =
  //       await res.json();

  //     if (json.success) {
  //       setPayrollCompanies(
  //         json.data || []
  //       );
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

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

      const res = await fetch(
        `/api/admin/payroll-groups?${params}`
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
        json.summary || {}
      );

      setTotal(
        json.pagination
          ?.total || 0
      );
    } catch (err) {
      console.error(err);

      swalError(
        err.message
      );
    } finally {
      setLoading(false);
    }
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

  // useEffect(() => {
  //   if (loadingUser || !user || !canView) return;

  //   loadPayrollCompanies();
  // }, [loadingUser, user, canView]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    loadData();
  }, [page, pageSize, search, loadingUser, user, canView]);

  function handleAdd() {
    setSelected(null);
    setModalMode("create");

    form.resetFields();

    form.setFieldsValue({
      payment_frequency: "monthly",
      payment_offset_month: 0,
      sort_order: 0,
      status: "active",
    });

    setModalOpen(true);
  }

  async function handleView(record) {
    try {
      const res = await fetch(
        `/api/admin/payroll-groups/${record.id}`
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
      swalError(err.message);
    }
  }

  async function handleEdit(record) {
    try {
      const res = await fetch(
        `/api/admin/payroll-groups/${record.id}`
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
      swalError(err.message);
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
          ? `/api/admin/payroll-groups/${selected.id}`
          : "/api/admin/payroll-groups";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      swalSuccess(json.message);

      setModalOpen(false);
      setSelected(null);
      setModalMode("create");

      form.resetFields();

      loadData();
    } catch (err) {
      swalError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const confirm =
      await swalConfirm({
        title: "ยืนยันการลบ",

        text: `ต้องการลบ "${record.payroll_group_name}" ใช่หรือไม่`,
      });

    if (!confirm.isConfirmed) {
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/payroll-groups/${record.id}`,
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
      swalError(err.message);
    }
  }

  function handleRefresh() {
    loadData();
  }

  function handleSearch(value) {
    setPage(1);
    setSearch(value);
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
              title="กลุ่มเงินเดือน"
              subtitle="Payroll Groups Management"
              loading={loading}
              canRefresh
              canCreate={canCreate}
              createText="เพิ่มกลุ่มเงินเดือน"
              onRefresh={handleRefresh}
              onCreate={handleAdd}
            />
            <PageInfoAlert description="หน้านี้ใช้จัดกลุ่มพนักงานสำหรับการรัน Payroll เช่น กลุ่มรายวัน, รายเดือน เพื่อให้สามารถประมวลผลแยก batch กันได้" />  
          </>
        }
        search={
          <PayrollGroupSearch
            value={search}
            loading={loading}
            onRefresh={handleRefresh}
            onChange={handleSearch}
          />
        }
        summary={
          <PayrollGroupSummaryCards
            summary={summary}
          />
        }
        table={
          <PayrollGroupTable
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


      <PayrollGroupModal
        open={modalOpen}
        form={form}
        saving={saving}
        disabled={modalMode === "view"}
        onFinish={handleSave}
        title={
          modalMode === "view"
            ? "รายละเอียดกลุ่มเงินเดือน"
            : modalMode === "edit"
              ? "แก้ไขกลุ่มเงินเดือน"
              : "เพิ่มกลุ่มเงินเดือน"
        }
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

    </>
  );
}