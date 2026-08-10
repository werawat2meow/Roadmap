"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import LoadingOrb from "../../../components/LoadingOrb";
import {swalConfirm,swalError,swalSuccess,} from "@/components/Swal";
import { hasPermission } from "@/lib/permissions";
import TaxProfileSearch from "./components/TaxProfileSearch";
import TaxProfileSummaryCards from "./components/TaxProfileSummaryCards";
import TaxProfileTable from "./components/TaxProfileTable";
import TaxProfileModal from "./components/TaxProfileModal";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

export default function TaxProfilesPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const [form] = Form.useForm();

  const canView =hasPermission(user,"ems.tax_profiles.view");
  const canCreate =hasPermission(user,"ems.tax_profiles.create");
  const canEdit =hasPermission(user,"ems.tax_profiles.edit");
  const canDelete =hasPermission(user,"ems.tax_profiles.delete");

  /* =====================================================
     States
  ===================================================== */

  const [loading, setLoading] =useState(true);
  const [saving, setSaving] =useState(false);
  const [modalOpen, setModalOpen] =useState(false);
  const [viewMode, setViewMode] =useState(false);
  const [selected, setSelected] =useState(null);
  const [data, setData] = useState([]);
  const [companies, setCompanies] =useState([]);
  const [summary, setSummary] =
    useState({
      total: 0,
      active: 0,
      inactive: 0,
    });
  const [search, setSearch] =useState("");
  const [status, setStatus] =useState("");
  const [companyId, setCompanyId] =useState("");
  const [taxYear, setTaxYear] =useState("");

  const [page, setPage] =useState(1);
  const [pageSize, setPageSize] =useState(20);
  const [total, setTotal] =useState(0);

  async function loadCompanies() {
    try {
      const res = await fetch(
        "/api/admin/companies?all=true"
      );

      const json =
        await res.json();

      if (!json.success) return;

      setCompanies(json.data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.set("page", page);

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

      if (companyId) {
        params.set(
          "company_id",
          companyId
        );
      }

      if (taxYear) {
        params.set(
          "tax_year",
          taxYear
        );
      }

      const res = await fetch(
        `/api/admin/tax-profiles?${params}`
      );

      const json =
        await res.json();

      if (!json.success) {
        throw new Error(
          json.error
        );
      }

      setData(json.data || []);

      setSummary(
        json.summary || {}
      );

      setTotal(
        json.pagination?.total || 0
      );
    } catch (error) {
      swalError(
        error.message
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

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (!canView) return;
    loadData();
  }, [
    page,
    pageSize,
    search,
    status,
    companyId,
    taxYear,
    canView
  ]);

  function handleAdd() {
    setSelected(null);

    setViewMode(false);

    form.resetFields();

    form.setFieldsValue({
      calculation_method: "progressive",
      personal_allowance: 60000,
      spouse_allowance: 0,
      child_allowance: 0,
      parent_allowance: 0,
      social_security_max: 9000,
      provident_fund_max: 500000,
      status: "active",
    });

    setModalOpen(true);
  }

  function handleView(record) {
    setSelected(record);

    setViewMode(true);

    form.setFieldsValue(record);

    setModalOpen(true);
  }

  function handleEdit(record) {
    setSelected(record);

    setViewMode(false);

    form.setFieldsValue(record);

    setModalOpen(true);
  }

  async function handleSave(values) {
    try {
      setSaving(true);

      const url = selected
        ? `/api/admin/tax-profiles/${selected.id}`
        : "/api/admin/tax-profiles";

      const method = selected
        ? "PATCH"
        : "POST";

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

      swalSuccess(json.message);

      setModalOpen(false);

      setSelected(null);

      form.resetFields();

      loadData();
    } catch (error) {
      swalError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(
        `/api/admin/tax-profiles/${id}`,
        {
          method: "DELETE",
        }
      );

      const json =
        await res.json();

      if (!json.success) {
        throw new Error(
          json.error
        );
      }

      swalSuccess(json.message);

      loadData();
    } catch (error) {
      swalError(error.message);
    }
  }

  function handleRefresh() {
    loadData();
  }

  function handleSearch(value) {
    setSearch(value);

    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value || "");

    setPage(1);
  }

  function handleCompanyChange(value) {
    setCompanyId(value || "");

    setPage(1);
  }

  function handleTaxYearChange(value) {
    setTaxYear(value);

    setPage(1);
  }

  function handleTableChange(
    pagination
  ) {
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
              title="โปรไฟล์ภาษี"
              subtitle="Tax Profiles Management"
              loading={loading}
              canRefresh
              canCreate={canCreate}
              createText="เพิ่มโปรไฟล์ภาษี"
              onRefresh={handleRefresh}
              onCreate={handleAdd}
            />
            <PageInfoAlert description="กำหนดข้อมูลภาษีเงินได้ของพนักงานแต่ละคน เช่น สถานะโสด/สมรส, ค่าลดหย่อนส่วนตัว, ค่าลดหย่อนบุตร และเอกสารประกอบการลดหย่อนภาษี ข้อมูลนี้จะถูกใช้คำนวณภาษีหัก ณ ที่จ่ายในระบบเงินเดือน" />
          
          </>
        }
        search={
          <TaxProfileSearch
            value={search}
            status={status}
            taxYear={taxYear}
            companyId={companyId}
            companies={companies}
            loading={loading}
            onSearch={handleSearch}
            onStatusChange={handleStatusChange}
            onTaxYearChange={handleTaxYearChange}
            onCompanyChange={handleCompanyChange}
            onRefresh={handleRefresh}
          />
        }
        summary={
          <TaxProfileSummaryCards
            summary={summary}
          />
        }
        table={
          <TaxProfileTable
            loading={loading}
            data={data}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) =>
                `ทั้งหมด ${total.toLocaleString()} รายการ`,
            }}
            canEdit={canEdit}
            canDelete={canDelete}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChange={handleTableChange}
          />
        }
      />

      <TaxProfileModal
        open={modalOpen}
        title={
          viewMode
            ? "รายละเอียดโปรไฟล์ภาษี"
            : selected
            ? "แก้ไขโปรไฟล์ภาษี"
            : "เพิ่มโปรไฟล์ภาษี"
        }
        form={form}
        companies={companies}
        saving={saving}
        disabled={viewMode}
        onFinish={handleSave}   
        onCancel={() => {
          setModalOpen(false);

          setSelected(null);

          setViewMode(false);

          form.resetFields();
        }}
        onSubmit={() => {
          form.submit();
        }}
      />
    </>
  );
}
