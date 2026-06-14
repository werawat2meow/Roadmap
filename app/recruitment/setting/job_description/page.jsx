"use client";

import { useEffect , useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteModal from "@/app/recruitment/components/DeleteModal";

export default function JobDescriptionPage({ initialData }) {

  const router = useRouter();

  const [data, setData] = useState(initialData || []);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/recruitment/api/job_description", {
          method: "GET",
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result?.message || "Fetch failed");
        }

        setData(result.data || []);
      } catch (err) {
        console.error(err);
        alert(err.message || "ดึงข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function handleDelete(item) {
    setDeleteItem(item);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteItem?.id) return;

    setDeleting(true);
    try {
      const res = await fetch(`/recruitment/api/job_description/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || "Delete failed");
      }

      setData((prev) => prev.filter((row) => row.id !== deleteItem.id));
      setDeleteOpen(false);
      setDeleteItem(null);
    } catch (err) {
      alert(err.message || "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }


  return (
    <div className="h-full w-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center rounded-3xl bg-white p-6 shadow-sm">
          <div className="justify-self-center md:justify-self-start">
            <h1 className="text-2xl font-bold text-slate-800"> Job Description </h1>
            <p className="mt-2 text-slate-500"> หน้าจัดการ Job Description </p>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <button
              type="button"
              onClick={() => router.push("/recruitment/setting/job_description/create")}
              className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
              style={{ backgroundColor: "green" }}
            >
              <span>+</span>
              <span>เพิ่มรายการ Job Description</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 w-full">

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">

          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-center text-slate-600">
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Updated at</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {data && data.length > 0 ? (
                  data.map((row) => (
                    <tr key={row.id}>
                      <td>{row.positions?.position_name || "-"}</td>

                      <td>
                        {row.updated_at
                          ? new Date(row.updated_at).toLocaleString("th-TH")
                          : "-"}
                      </td>

                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/recruitment/setting/job-description/${row.id}`}
                            className="rounded-xl border px-4 py-2 text-sm"
                          >
                            แก้ไขข้อมูล
                          </Link>

                          <button
                            onClick={() => handleDelete(row)}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-slate-500 text-center">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <DeleteModal
          open={deleteOpen}
          item={deleteItem}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
          loading={deleting}
        />
      </div>
    </div>
  );
}