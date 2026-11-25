"use client";

import { useState } from "react";
import { ExternalLink, FileText, X } from "lucide-react";

type EmployeeDocument = {
  id: string;
  original_filename: string;
  file_url: string;
  created_at: string;
  status?: string | null;
};

type EmployeeDocumentsButtonProps = {
  employeeId: string;
};

export default function EmployeeDocumentsButton({
  employeeId,
}: EmployeeDocumentsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [error, setError] = useState("");

  const openDocuments = async () => {
    setIsOpen(true);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/roadmap/api/employee-documents?employeeId=${encodeURIComponent(employeeId)}`,
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "ไม่สามารถโหลดเอกสารได้");
      }

      setDocuments(result.data || []);
    } catch (requestError: any) {
      setError(requestError?.message || "ไม่สามารถโหลดเอกสารได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDocuments}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
      >
        <FileText className="h-4 w-4" />
        ดูเอกสารแนบ
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  เอกสารแนบของพนักงาน
                </h2>
                <p className="text-xs text-slate-500">
                  Outside Employment Form
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="ปิดหน้าต่างเอกสาร"
              >
                <X className="h-5 w-5 cursor-pointer" />.
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
              {loading && (
                <p className="py-8 text-center text-sm text-slate-500">
                  กำลังโหลดเอกสาร...
                </p>
              )}

              {!loading && error && (
                <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </p>
              )}

              {!loading && !error && documents.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                  ยังไม่มีเอกสารแนบสำหรับพนักงานคนนี้
                </p>
              )}

              {!loading &&
                !error &&
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-rose-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {document.original_filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(document.created_at).toLocaleDateString(
                            "th-TH",
                          )}
                        </p>
                      </div>
                    </div>
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-red-500 via-rose-500 to-red-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-red-500/25 transition-all hover:from-red-600 hover:via-rose-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/30 active:scale-95"
                    >
                      เปิด PDF
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
