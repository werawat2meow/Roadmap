
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default async function JobDescriptionPage() {

  const { data, error } = await supabase
    .from("recruit_job_description")
    .select(`
      id,
      salary_min,
      salary_max,
      type_of_work,
      updated_at,
      positions ( position_name )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    return <div className="p-6 text-red-600">{error.message}</div>;
  }

  return (
  
    <div className="flex h-full">
      
      <div className="overflow-y-auto p-6 w-full">
        <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Job Description
            </h1>

            <p className="mt-2 text-slate-500">
              หน้านี้เป็นหน้าเริ่มต้นของระบบ Recruitment
            </p>
          </div>
          <div >
            <Link
              href="/recruitment/job_description/create"
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              + เพิ่มข้อมูล
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-sm">
                <tr>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Updated at</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3">
                      {row.positions?.position_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString("th-TH") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/job-description/${row.id}`}
                          className="rounded-xl border px-4 py-2 text-sm"
                        >
                          แก้ไขข้อมูล
                        </Link>
                        {/* <DeleteJobDescriptionButton id={row.id} /> */}
                      </div>
                    </td>
                  </tr>
                ))}

                {(!data || data.length === 0) && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={3}>
                      ยังไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}