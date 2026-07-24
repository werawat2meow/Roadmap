"use client";

const OPTIONS = [
  {
    key: "required",
    label: "Required Step",
    description: "ขั้นตอนนี้จำเป็นต้องดำเนินการ",
  },
  {
    key: "parallel",
    label: "Parallel Approval",
    description: "อนุมัติพร้อมกันได้หลายคน",
  },
  {
    key: "allow_delegate",
    label: "Allow Delegate",
    description: "สามารถมอบหมายผู้อนุมัติแทนได้",
  },
  {
    key: "send_email",
    label: "Send Email",
    description: "ส่งอีเมลแจ้งเตือน",
  },
  {
    key: "send_notification",
    label: "Send Notification",
    description: "ส่ง Notification ภายในระบบ",
  },
  {
    key: "stop_on_reject",
    label: "Stop Workflow On Reject",
    description: "หยุด Workflow ทันทีเมื่อถูกปฏิเสธ",
  },
];

export default function ApprovalOptionList({
  step,
  index,
  updateStep,
}) {
  return (
    <div className="mt-8">

      <h4 className="mb-4 text-base font-semibold text-slate-800">
        Step Options
      </h4>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

        {OPTIONS.map((option) => (

          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
          >

            <input
              type="checkbox"
              className="mt-1"
              checked={!!step[option.key]}
              onChange={(e) =>
                updateStep(
                  index,
                  option.key,
                  e.target.checked
                )
              }
            />

            <div>

              <div className="font-medium text-slate-800">
                {option.label}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {option.description}
              </div>

            </div>

          </label>

        ))}

      </div>

    </div>
  );
}