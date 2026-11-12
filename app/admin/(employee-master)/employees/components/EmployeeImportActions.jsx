"use client";

import { useState } from "react";
import { Alert, Button, Modal, message } from "antd";
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { EMPLOYEE_IMPORT_COLUMNS } from "@/lib/imports/employeeListColumns";

export default function EmployeeImportActions({ onImported }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [busy, setBusy] = useState("");
  const [file, setFile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const response = await fetch("/api/admin/employees/import/template", {
        cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "ดาวน์โหลด Template ไม่สำเร็จ");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "employee_import_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      message.error(reason.message || "ดาวน์โหลด Template ไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  async function openImport() {
    setOpen(true);
    setFile(null);
    setPreview(null);
    setError("");
    setCompanies([]);
    setCompanyId("");
    setBusy("options");
    try {
      const response = await fetch("/api/admin/employees/import", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || "โหลดบริษัทไม่สำเร็จ");
      setCompanies(result.companies || []);
      if (result.companies?.length === 1) setCompanyId(result.companies[0].id);
    } catch (reason) {
      setError(reason.message || "โหลดบริษัทไม่สำเร็จ");
    } finally {
      setBusy("");
    }
  }

  async function submit(mode) {
    if (!file) return;
    setBusy(mode);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);
      form.append("company_id", companyId);
      const response = await fetch("/api/admin/employees/import", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (result.rows) setPreview(result);
      if (!response.ok || !result.success)
        throw new Error(result.error || "นำเข้าไม่สำเร็จ");
      if (result.completed) {
        if (result.importedRows) {
          message.success(`นำเข้าพนักงานสำเร็จ ${result.importedRows} รายการ`);
          await onImported?.();
        }
        if (result.failedRows)
          setError(
            `บันทึกไม่สำเร็จ ${result.failedRows} รายการ ดูสาเหตุในตาราง แล้วนำเข้าใหม่เฉพาะรายการที่ไม่สำเร็จ`,
          );
      }
    } catch (reason) {
      setError(reason.message || "นำเข้าไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            loading={downloading}
            onClick={downloadTemplate}
            icon={<DownloadOutlined />}
            className="
      !h-10
      !rounded-xl
      !border-0
      !px-4
      !font-semibold
      !text-white
      !shadow-md
      !shadow-emerald-900/20
      !bg-gradient-to-r
      !from-emerald-800
      !to-green-700
      hover:!from-emerald-900
      hover:!to-green-800
      hover:!text-white
      [&_.anticon]:!text-white
      [&.ant-btn-disabled]:!text-white
    "
          >
            Download template
          </Button>

          <Button
            onClick={openImport}
            icon={<UploadOutlined />}
            className="
      !h-10
      !rounded-xl
      !border-0
      !px-4
      !font-semibold
      !text-white
      !shadow-md
      !shadow-blue-700/20
      !bg-gradient-to-r
      !from-blue-500
      !to-blue-700
      hover:!from-blue-600
      hover:!to-blue-800
      hover:!text-white
      [&_.anticon]:!text-white
      [&.ant-btn-disabled]:!text-white
    "
          >
            Import รายชื่อ
          </Button>
        </div>
      </div>
      <Modal
        open={open}
        centered
        width="min(1180px, 94vw)"
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <CloudUploadOutlined className="text-xl" />
            </div>

            <div>
              <div className="text-lg font-bold text-slate-900">
                Import รายชื่อพนักงาน
              </div>
              <div className="text-xs font-normal text-slate-500">
                อัปโหลด ตรวจสอบตัวอย่าง และยืนยันการนำเข้า
              </div>
            </div>
          </div>
        }
        onCancel={() => {
          if (!busy) setOpen(false);
        }}
        closable={!busy}
        mask={{ closable: !busy }}
        destroyOnHidden
        styles={{
          content: {
            padding: 0,
            overflow: "hidden",
            borderRadius: 24,
          },
          header: {
            margin: 0,
            padding: "22px 26px",
            borderBottom: "1px solid #e2e8f0",
          },
          body: {
            padding: "24px 26px",
            background: "#f8fafc",
          },
          footer: {
            margin: 0,
            padding: "18px 26px",
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
          },
        }}
        footer={[
          <Button
            key="close"
            disabled={Boolean(busy)}
            onClick={() => setOpen(false)}
            className="!h-10 !rounded-xl !border-0 !bg-gradient-to-r !from-red-500 !to-rose-700 !px-5 !font-semibold !text-white !shadow-md !shadow-red-700/20 hover:!from-red-600 hover:!to-rose-800 hover:!text-white [&_.anticon]:!text-white [&.ant-btn-disabled]:!text-white"
          >
            {preview?.completed ? "ปิด" : "ยกเลิก"}
          </Button>,
          !preview?.completed && (
            <Button
              key="preview"
              disabled={!file || Boolean(busy)}
              loading={busy === "preview"}
              onClick={() => submit("preview")}
              className="!h-10 !rounded-xl !border-0 !bg-gradient-to-r !from-amber-400 !to-orange-600 !px-5 !font-semibold !text-white !shadow-md !shadow-orange-700/20 hover:!from-amber-500 hover:!to-orange-700 hover:!text-white [&_.anticon]:!text-white [&.ant-btn-disabled]:!text-white"
            >
              ตรวจสอบและแสดงตัวอย่าง
            </Button>
          ),
          !preview?.completed && (
            <Button
              key="confirm"
              type="primary"
              loading={busy === "confirm"}
              disabled={
                Boolean(busy) || !preview?.validRows || preview?.invalidRows > 0
              }
              onClick={() => submit("confirm")}
              className="!h-10 !rounded-xl !border-0 !bg-gradient-to-r !from-green-500 !to-emerald-700 !px-5 !font-semibold !text-white !shadow-md !shadow-green-700/20 hover:!from-green-600 hover:!to-emerald-800 hover:!text-white [&_.anticon]:!text-white [&.ant-btn-disabled]:!text-white"
            >
              ยืนยันนำเข้า {preview?.validRows || 0} รายการ
            </Button>
          ),
        ]}
      >
        <div className="space-y-4 py-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <InfoCircleOutlined className="mt-0.5 text-lg text-blue-600" />

              <div>
                <div className="font-bold text-blue-950">
                  วิธีนำเข้ารายชื่อพนักงาน
                </div>

                <div className="mt-1 text-sm leading-6 text-blue-900">
                  ดาวน์โหลด Template แล้วกรอกข้อมูล
                  จากนั้นเลือกไฟล์เพื่อตรวจสอบตัวอย่างก่อนยืนยัน
                </div>

                <div className="mt-2 text-xs leading-5 text-blue-800">
                  วันที่ใช้รูปแบบ วัน/เดือน/ปี ค.ศ. เช่น 04/08/2026 = 4 สิงหาคม
                  2026
                  <br />
                  ข้อมูลองค์กรและ Level P สามารถเว้นไว้เติมภายหลังได้
                  <br />
                  รองรับไฟล์ .xlsx ขนาดไม่เกิน 5 MB และไม่เกิน 200 รายการ
                </div>
              </div>
            </div>
          </div>
          {error && <Alert type="error" showIcon title={error} />}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="group block cursor-pointer">
              <div className="mb-2 text-sm font-bold text-slate-800">
                ไฟล์รายชื่อพนักงาน
              </div>

              <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                <InboxOutlined className="text-4xl text-blue-500 transition group-hover:scale-110" />

                <div className="mt-3 font-semibold text-slate-800">
                  {file ? file.name : "คลิกเพื่อเลือกไฟล์ Excel"}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  รองรับเฉพาะ .xlsx ขนาดไม่เกิน 5 MB
                </div>

                <input
                  key={open ? "open" : "closed"}
                  type="file"
                  accept=".xlsx"
                  disabled={Boolean(busy)}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null);
                    setPreview(null);
                    setError("");
                  }}
                  className="sr-only"
                />
              </div>
            </label>
            <label className="block">
              <div className="mb-2 text-sm font-bold text-slate-800">
                บริษัทสำหรับรายการที่ยังไม่ระบุสังกัด
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <select
                  value={companyId}
                  disabled={Boolean(busy) || preview?.completed}
                  onChange={(event) => {
                    setCompanyId(event.target.value);
                    setPreview(null);
                    setError("");
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">ไม่ระบุบริษัท</option>

                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name_th || company.company_code}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-xs leading-5 text-slate-500">
                  จำเป็นเมื่อมีรหัสเก่าหรือสร้างบัญชีเข้าใช้งาน
                  แต่ไม่ได้ระบุสังกัดในไฟล์
                </div>
              </div>
            </label>
          </div>
          {busy && (
            <p role="status" className="text-sm text-emerald-700">
              {busy === "confirm"
                ? "กำลังนำเข้า กรุณารอผลก่อนปิดหน้าต่าง..."
                : busy === "preview"
                  ? "กำลังตรวจสอบไฟล์และข้อมูลในระบบ..."
                  : "กำลังโหลดบริษัท..."}
            </p>
          )}
          {preview && (
            <>
              <Alert
                showIcon
                type={
                  preview.completed
                    ? preview.failedRows
                      ? "warning"
                      : "success"
                    : preview.invalidRows
                      ? "warning"
                      : "success"
                }
                title={
                  preview.completed
                    ? `นำเข้าสำเร็จ ${preview.importedRows} รายการ / ไม่สำเร็จ ${preview.failedRows} รายการ`
                    : `ตัวอย่าง ${preview.rows.length} รายการ — ผ่าน ${preview.validRows} / ต้องแก้ไข ${preview.invalidRows}`
                }
                description={
                  preview.completed
                    ? "สามารถกดแก้ไขจากหน้ารายชื่อเพื่อเติมข้อมูลองค์กรได้"
                    : "ยังไม่มีการบันทึกข้อมูล ตรวจสอบรายชื่อแล้วกดยืนยันนำเข้า หากมีข้อผิดพลาดให้แก้ไขไฟล์และเลือกใหม่"
                }
              />
              <div className="max-h-[50vh] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-slate-800">
                    <tr>
                      <th className="p-3">แถว Excel</th>
                      <th className="p-3">ผลตรวจสอบ / ผลนำเข้า</th>
                      {EMPLOYEE_IMPORT_COLUMNS.map(([key, label]) => (
                        <th key={key} className="p-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`border-t border-slate-200 ${row.errors.length ? "bg-red-50" : "bg-white"}`}
                      >
                        <td className="p-3 align-top">{row.rowNumber}</td>
                        <td className="min-w-64 max-w-lg whitespace-normal p-3 align-top">
                          {row.errors.length ? (
                            <ul className="list-inside list-disc text-red-700">
                              {row.errors.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-emerald-700">
                              {preview.completed
                                ? `นำเข้าสำเร็จ (${row.employeeCode})`
                                : row.incomplete
                                  ? "ผ่าน — เติมข้อมูลองค์กรภายหลัง"
                                  : "ผ่าน"}
                            </span>
                          )}
                          {row.initialLogin && (
                            <p className="mt-2 text-amber-800">
                              ชื่อผู้ใช้: {row.initialLogin.username}
                              <br />
                              รหัสผ่านชั่วคราว:{" "}
                              {row.initialLogin.temporary_password}
                              <br />
                              กรุณาบันทึกก่อนปิดหน้าต่าง
                            </p>
                          )}
                        </td>
                        {EMPLOYEE_IMPORT_COLUMNS.map(([key]) => (
                          <td key={key} className="p-3 align-top">
                            {row.values[key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
