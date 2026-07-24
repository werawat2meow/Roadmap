"use client";

import { useCallback, useEffect, useState } from "react";

import CompensationPolicyHeader from "./components/CompensationPolicyHeader";
import CompensationPolicySearch from "./components/CompensationPolicySearch";
import CompensationPolicySummary from "./components/CompensationPolicySummary";
import CompensationPolicyTable from "./components/CompensationPolicyTable";
import CompensationPolicyPagination from "./components/CompensationPolicyPagination";
import CompensationPolicyModal from "./components/CompensationPolicyModal";

export default function CompensationPoliciesPage() {

  const [loading, setLoading] = useState(false);

  const [policies, setPolicies] = useState([]);

  const [companies, setCompanies] = useState([]);

  const [salaryStructures, setSalaryStructures] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    draft: 0,
    review: 0,
    approved: 0,
    expired: 0,
    archived: 0,
    effective_this_month: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [salaryStructureId, setSalaryStructureId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [openModal, setOpenModal] = useState(false);

  const [mode, setMode] = useState("create");

  const [activeTab, setActiveTab] = useState("basic");

  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [form, setForm] = useState({});

  const fetchData = useCallback(async () => {
    try {

      setLoading(true);

      // TODO API

      setPolicies([]);
      setCompanies([]);
      setSalaryStructures([]);

      setSummary({
        total: 0,
        active: 0,
        draft: 0,
        review: 0,
        approved: 0,
        expired: 0,
        archived: 0,
        effective_this_month: 0,
      });

      setTotal(0);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  }, [
    search,
    status,
    companyId,
    salaryStructureId,
    effectiveDate,
    page,
    pageSize,
  ]);

  useEffect(() => {

    fetchData();

  }, [fetchData]);

    const handleCreate = () => {
    setMode("create");
    setActiveTab("basic");
    setSelectedPolicy(null);

    setForm({});

    setOpenModal(true);
  };

  const handleEdit = (policy) => {
    setMode("edit");
    setActiveTab("basic");

    setSelectedPolicy(policy);

    setForm(policy || {});

    setOpenModal(true);
  };

  const handleDuplicate = (policy) => {
    console.log("Duplicate", policy);

    // TODO
  };

  const handleCreateVersion = (policy) => {
    console.log("Create Version", policy);

    // TODO
  };

  const handleCompare = (policy) => {
    console.log("Compare", policy);

    // TODO
  };

  const handleHistory = (policy) => {
    console.log("History", policy);

    // TODO
  };

  const handleArchive = async (policy) => {
    console.log("Archive", policy);

    // TODO
  };

  const handleDelete = async (policy) => {
    console.log("Delete", policy);

    // TODO
  };

  const handleImport = () => {
    console.log("Import");

    // TODO
  };

  const handleExport = () => {
    console.log("Export");

    // TODO
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleClose = () => {
    setOpenModal(false);

    setSelectedPolicy(null);

    setActiveTab("basic");
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      console.log(form);

      // TODO Save API

      handleClose();

      fetchData();

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

    return (
    <div className="space-y-6 p-6">

      <CompensationPolicyHeader
        loading={loading}
        summary={summary}
        selectedPolicy={selectedPolicy}
        canCreate
        canImport
        canExport
        canDuplicate={!!selectedPolicy}
        canVersion={!!selectedPolicy}
        canCompare={!!selectedPolicy}
        canHistory={!!selectedPolicy}
        onRefresh={handleRefresh}
        onImport={handleImport}
        onExport={handleExport}
        onDuplicate={() =>
          selectedPolicy &&
          handleDuplicate(selectedPolicy)
        }
        onCreateVersion={() =>
          selectedPolicy &&
          handleCreateVersion(selectedPolicy)
        }
        onCompare={() =>
          selectedPolicy &&
          handleCompare(selectedPolicy)
        }
        onHistory={() =>
          selectedPolicy &&
          handleHistory(selectedPolicy)
        }
        onCreate={handleCreate}
      />

      <CompensationPolicySearch
        loading={loading}
        search={search}
        status={status}
        companyId={companyId}
        salaryStructureId={salaryStructureId}
        effectiveDate={effectiveDate}
        companies={companies}
        salaryStructures={salaryStructures}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onCompanyChange={setCompanyId}
        onSalaryStructureChange={setSalaryStructureId}
        onEffectiveDateChange={setEffectiveDate}
        onClear={() => {
          setSearch("");
          setStatus("");
          setCompanyId("");
          setSalaryStructureId("");
          setEffectiveDate("");
          setPage(1);
        }}
      />

      <CompensationPolicySummary
        loading={loading}
        summary={summary}
      />

      <CompensationPolicyTable
        loading={loading}
        policies={policies}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onVersion={handleCreateVersion}
        onCompare={handleCompare}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <CompensationPolicyPagination
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
        }}
      />

      <CompensationPolicyModal
        open={openModal}
        loading={loading}
        mode={mode}
        activeTab={activeTab}
        form={form}
        companies={companies}
        salaryStructures={salaryStructures}
        onClose={handleClose}
        onSave={handleSave}
        onTabChange={setActiveTab}
        onChange={setForm}
      />

    </div>
  );
}