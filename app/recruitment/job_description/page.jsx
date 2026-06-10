"use client";

export default function JobDescriptionPage() {
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
              <button
                type="button"
                onClick={() => router.push("/recruitment/job_description/create")}
                className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
                style={{ backgroundColor: "green" }}
              >
                <span>+</span>
                <span>เพิ่มรายการ Job Description</span>
              </button>
            </div>
          </div>
        </div>

      </div>
  );
}