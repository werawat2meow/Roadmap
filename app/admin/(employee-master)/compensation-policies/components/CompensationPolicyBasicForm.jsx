"use client";

import {
  BuildingOffice2Icon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function CompensationPolicyBasicForm({
  form = {},
  companies = [],
  salaryStructures = [],
  onChange,
}) {
  const handleChange = (field, value) => {
    if (typeof onChange === "function") {
      onChange((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <div className="space-y-8">

      {/* ========================================================= */}
      {/* BASIC INFORMATION */}
      {/* ========================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <DocumentTextIcon className="h-6 w-6" />
            </div>

            <div>

              <h3 className="text-lg font-bold text-slate-800">
                Basic Information
              </h3>

              <p className="text-sm text-slate-500">
                กำหนดข้อมูลพื้นฐานของ Compensation Policy
              </p>

            </div>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

          {/* ===================================== */}
          {/* Policy Code */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Policy Code
            </label>

            <input
              type="text"
              value={form.policy_code || ""}
              placeholder="AUTO หรือ CP-0001"
              onChange={(e) =>
                handleChange(
                  "policy_code",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              หากเว้นว่าง ระบบสามารถ Generate
              Policy Code ให้อัตโนมัติ
            </p>

          </div>

          {/* ===================================== */}
          {/* Policy Name */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Policy Name
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              type="text"
              value={form.policy_name || ""}
              placeholder="Annual Salary Structure 2027"
              onChange={(e) =>
                handleChange(
                  "policy_name",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

          {/* ===================================== */}
          {/* Policy Name EN */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Policy Name (EN)
            </label>

            <input
              type="text"
              value={form.policy_name_en || ""}
              placeholder="Annual Salary Structure"
              onChange={(e) =>
                handleChange(
                  "policy_name_en",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

          {/* ===================================== */}
          {/* Short Name */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Short Name
            </label>

            <input
              type="text"
              value={form.short_name || ""}
              placeholder="Salary 2027"
              onChange={(e) =>
                handleChange(
                  "short_name",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* ORGANIZATION */}
      {/* ========================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <BuildingOffice2Icon className="h-6 w-6" />
            </div>

            <div>

              <h3 className="text-lg font-bold text-slate-800">
                Organization
              </h3>

              <p className="text-sm text-slate-500">
                เลือกบริษัทและโครงสร้างเงินเดือนที่ต้องการใช้งาน
              </p>

            </div>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

          {/* Company */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Company
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              value={form.company_id || ""}
              onChange={(e) =>
                handleChange(
                  "company_id",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">
                Select Company
              </option>

              {companies.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.company_name_th}
                </option>
              ))}

            </select>

          </div>

          {/* Salary Structure */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Salary Structure
            </label>

            <select
              value={
                form.salary_structure_id || ""
              }
              onChange={(e) =>
                handleChange(
                  "salary_structure_id",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">
                Select Salary Structure
              </option>

              {salaryStructures.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.structure_name}
                </option>
              ))}

            </select>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* POLICY CONFIGURATION */}
      {/* ========================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <DocumentTextIcon className="h-6 w-6" />
            </div>

            <div>

              <h3 className="text-lg font-bold text-slate-800">
                Policy Configuration
              </h3>

              <p className="text-sm text-slate-500">
                กำหนดประเภทของ Compensation Policy
              </p>

            </div>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

          {/* ===================================== */}
          {/* Policy Type */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Policy Type
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              value={form.policy_type || ""}
              onChange={(e) =>
                handleChange(
                  "policy_type",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">
                Select Policy Type
              </option>

              <option value="salary">
                Salary Structure
              </option>

              <option value="allowance">
                Allowance
              </option>

              <option value="bonus">
                Bonus
              </option>

              <option value="commission">
                Commission
              </option>

              <option value="ot">
                Overtime
              </option>

              <option value="benefit">
                Benefit
              </option>

            </select>

          </div>

          {/* ===================================== */}
          {/* Compensation Type */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Compensation Type
            </label>

            <select
              value={form.compensation_type || ""}
              onChange={(e) =>
                handleChange(
                  "compensation_type",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">
                Select Compensation Type
              </option>

              <option value="fixed">
                Fixed
              </option>

              <option value="variable">
                Variable
              </option>

              <option value="mixed">
                Mixed
              </option>

            </select>

          </div>

          {/* ===================================== */}
          {/* Payroll Frequency */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Payroll Frequency
            </label>

            <select
              value={form.payroll_frequency || ""}
              onChange={(e) =>
                handleChange(
                  "payroll_frequency",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >

              <option value="">
                Select Payroll Frequency
              </option>

              <option value="daily">
                Daily
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="biweekly">
                Bi Weekly
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="yearly">
                Yearly
              </option>

            </select>

          </div>

          {/* ===================================== */}
          {/* Currency */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Currency
            </label>

            <select
              value={form.currency || "THB"}
              onChange={(e) =>
                handleChange(
                  "currency",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >

              <option value="THB">
                THB (Thai Baht)
              </option>

              <option value="USD">
                USD
              </option>

              <option value="EUR">
                EUR
              </option>

              <option value="JPY">
                JPY
              </option>

            </select>

          </div>

          {/* ===================================== */}
          {/* Pay Cycle */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Pay Cycle
            </label>

            <input
              type="text"
              value={form.pay_cycle || ""}
              placeholder="25 of every month"
              onChange={(e) =>
                handleChange(
                  "pay_cycle",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

          {/* ===================================== */}
          {/* Round Method */}
          {/* ===================================== */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Round Method
            </label>

            <select
              value={form.round_method || ""}
              onChange={(e) =>
                handleChange(
                  "round_method",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >

              <option value="">
                Select Round Method
              </option>

              <option value="none">
                No Rounding
              </option>

              <option value="up">
                Round Up
              </option>

              <option value="down">
                Round Down
              </option>

              <option value="nearest">
                Nearest
              </option>

            </select>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* POLICY LIFECYCLE */}
      {/* ========================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <DocumentTextIcon className="h-6 w-6" />
            </div>

            <div>

              <h3 className="text-lg font-bold text-slate-800">
                Policy Lifecycle
              </h3>

              <p className="text-sm text-slate-500">
                กำหนดช่วงเวลาการใช้งานและสถานะของ Compensation Policy
              </p>

            </div>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

          {/* Effective Date */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Effective Date
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              type="date"
              value={form.effective_date || ""}
              onChange={(e) =>
                handleChange("effective_date", e.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

          {/* End Date */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              End Date
            </label>

            <input
              type="date"
              value={form.end_date || ""}
              onChange={(e) =>
                handleChange("end_date", e.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

          {/* Status */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Status
            </label>

            <select
              value={form.status || "draft"}
              onChange={(e) =>
                handleChange("status", e.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >

              <option value="draft">Draft</option>

              <option value="review">Review</option>

              <option value="approved">Approved</option>

              <option value="active">Active</option>

              <option value="expired">Expired</option>

              <option value="archived">Archived</option>

            </select>

          </div>

          {/* Version */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Version No.
            </label>

            <input
              type="number"
              min="1"
              value={form.version_no || 1}
              onChange={(e) =>
                handleChange(
                  "version_no",
                  Number(e.target.value)
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* PAYROLL SETTINGS */}
      {/* ========================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <h3 className="text-lg font-bold text-slate-800">
            Payroll Settings
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            กำหนดการคำนวณสำหรับ Payroll และระบบภาษี
          </p>

        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

          {/* Tax */}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">

            <div>

              <div className="font-semibold text-slate-700">
                Tax Calculation
              </div>

              <div className="text-sm text-slate-500">
                นำรายการนี้ไปคำนวณภาษี
              </div>

            </div>

            <input
              type="checkbox"
              checked={form.enable_tax ?? true}
              onChange={(e) =>
                handleChange(
                  "enable_tax",
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

          </label>

          {/* Social */}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">

            <div>

              <div className="font-semibold text-slate-700">
                Social Security
              </div>

              <div className="text-sm text-slate-500">
                นำไปคำนวณประกันสังคม
              </div>

            </div>

            <input
              type="checkbox"
              checked={
                form.enable_social_security ?? true
              }
              onChange={(e) =>
                handleChange(
                  "enable_social_security",
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

          </label>

          {/* Provident */}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">

            <div>

              <div className="font-semibold text-slate-700">
                Provident Fund
              </div>

              <div className="text-sm text-slate-500">
                นำไปคำนวณกองทุนสำรองเลี้ยงชีพ
              </div>

            </div>

            <input
              type="checkbox"
              checked={
                form.enable_provident_fund ?? false
              }
              onChange={(e) =>
                handleChange(
                  "enable_provident_fund",
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

          </label>

          {/* Default */}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">

            <div>

              <div className="font-semibold text-slate-700">
                Default Policy
              </div>

              <div className="text-sm text-slate-500">
                ใช้เป็น Policy หลักของบริษัท
              </div>

            </div>

            <input
              type="checkbox"
              checked={form.is_default ?? false}
              onChange={(e) =>
                handleChange(
                  "is_default",
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

          </label>

          {/* Lock */}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 md:col-span-2">

            <div>

              <div className="font-semibold text-slate-700">
                Lock Policy
              </div>

              <div className="text-sm text-slate-500">
                เมื่อเปิดใช้งาน จะไม่อนุญาตให้แก้ไข Policy นี้ ยกเว้นสร้าง Version ใหม่
              </div>

            </div>

            <input
              type="checkbox"
              checked={form.is_locked ?? false}
              onChange={(e) =>
                handleChange(
                  "is_locked",
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

          </label>

        </div>

      </section>  


      {/* ========================================================= */}
      {/* DESCRIPTION & DOCUMENTATION */}
      {/* ========================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <h3 className="text-lg font-bold text-slate-800">
            Description & Documentation
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            รายละเอียดเพิ่มเติม เอกสารอ้างอิง และหมายเหตุของนโยบาย
          </p>

        </div>

        <div className="grid grid-cols-1 gap-6 p-6">

          {/* Description */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              rows={5}
              value={form.description || ""}
              placeholder="รายละเอียดของ Compensation Policy..."
              onChange={(e) =>
                handleChange(
                  "description",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 resize-none"
            />

          </div>

          {/* Internal Remark */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Internal Remark
            </label>

            <textarea
              rows={4}
              value={form.remark || ""}
              placeholder="ใช้สำหรับบันทึกภายใน..."
              onChange={(e) =>
                handleChange(
                  "remark",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 resize-none"
            />

          </div>

          {/* Tags */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tags / Keywords
            </label>

            <input
              type="text"
              value={form.tags || ""}
              placeholder="salary, annual, executive"
              onChange={(e) =>
                handleChange(
                  "tags",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              คั่นหลาย Tag ด้วยเครื่องหมาย ,
            </p>

          </div>

          {/* Reference */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Reference Document
            </label>

            <input
              type="text"
              value={form.reference_document || ""}
              placeholder="Policy Manual / Google Drive / SharePoint"
              onChange={(e) =>
                handleChange(
                  "reference_document",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* VALIDATION SUMMARY */}
      {/* ========================================================= */}

      <section className="rounded-3xl border border-amber-200 bg-amber-50">

        <div className="border-b border-amber-200 px-6 py-5">

          <h3 className="text-lg font-bold text-amber-700">
            Validation Summary
          </h3>

          <p className="mt-1 text-sm text-amber-600">
            แสดงข้อผิดพลาดก่อนทำการบันทึกข้อมูล
          </p>

        </div>

        <div className="space-y-3 p-6">

          {!form.policy_name && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              • กรุณาระบุ Policy Name
            </div>
          )}

          {!form.company_id && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              • กรุณาเลือก Company
            </div>
          )}

          {!form.policy_type && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              • กรุณาเลือก Policy Type
            </div>
          )}

          {!form.effective_date && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              • กรุณาเลือก Effective Date
            </div>
          )}

          {form.policy_name &&
            form.company_id &&
            form.policy_type &&
            form.effective_date && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✓ ข้อมูลพื้นฐานครบ พร้อมสำหรับการบันทึก
              </div>
            )}

        </div>

      </section>

      {/* ========================================================= */}
      {/* AUDIT INFORMATION */}
      {/* ========================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-slate-50">

        <div className="border-b border-slate-200 px-6 py-5">

          <h3 className="text-lg font-bold text-slate-800">
            Audit Information
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            ข้อมูลนี้แสดงเมื่อแก้ไข Policy เท่านั้น
          </p>

        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Created By
            </label>

            <input
              readOnly
              value={form.created_by_name || "-"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Created At
            </label>

            <input
              readOnly
              value={form.created_at || "-"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Updated By
            </label>

            <input
              readOnly
              value={form.updated_by_name || "-"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Updated At
            </label>

            <input
              readOnly
              value={form.updated_at || "-"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
            />

          </div>

        </div>

      </section>







    </div>
  );
}