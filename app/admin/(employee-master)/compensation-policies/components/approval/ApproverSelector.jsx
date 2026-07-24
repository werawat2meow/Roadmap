"use client";

export default function ApproverSelector({
  step,
  index,

  users = [],
  roles = [],
  positions = [],
  departments = [],
  divisions = [],
  approvalGroups = [],

  addApprover,
  updateApprover,
  removeApprover,
}) {
  const approvers = step.approvers || [];

  const renderSelector = (approver, approverIndex) => {
    switch (step.approver_type) {
      case "user":
        return (
          <select
            value={approver.approver_id || ""}
            onChange={(e) =>
              updateApprover(
                index,
                approverIndex,
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select User
            </option>

            {users.map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.full_name}
              </option>
            ))}
          </select>
        );

      case "role":
        return (
          <select
            value={approver.approver_id || ""}
            onChange={(e) =>
              updateApprover(
                index,
                approverIndex,
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select Role
            </option>

            {roles.map((role) => (
              <option
                key={role.id}
                value={role.id}
              >
                {role.role_name}
              </option>
            ))}
          </select>
        );

      case "position":
        return (
          <select
            value={approver.approver_id || ""}
            onChange={(e) =>
              updateApprover(
                index,
                approverIndex,
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select Position
            </option>

            {positions.map((position) => (
              <option
                key={position.id}
                value={position.id}
              >
                {position.position_name}
              </option>
            ))}
          </select>
        );

      case "department_head":
        return (
          <select
            value={approver.approver_id || ""}
            onChange={(e) =>
              updateApprover(
                index,
                approverIndex,
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select Department
            </option>

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.department_name}
              </option>
            ))}
          </select>
        );

      case "division_head":
        return (
          <select
            value={approver.approver_id || ""}
            onChange={(e) =>
              updateApprover(
                index,
                approverIndex,
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select Division
            </option>

            {divisions.map((division) => (
              <option
                key={division.id}
                value={division.id}
              >
                {division.division_name}
              </option>
            ))}
          </select>
        );

      case "approval_group":
        return (
          <select
            value={approver.approver_id || ""}
            onChange={(e) =>
              updateApprover(
                index,
                approverIndex,
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select Approval Group
            </option>

            {approvalGroups.map((group) => (
              <option
                key={group.id}
                value={group.id}
              >
                {group.group_name}
              </option>
            ))}
          </select>
        );

      case "manager":
        return (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Direct Manager จะถูกค้นหาอัตโนมัติจากโครงสร้างองค์กร
          </div>
        );

      case "hr":
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            ระบบจะค้นหา HR ตามโครงสร้างองค์กรโดยอัตโนมัติ
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-8">

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">

          <div>

            <h4 className="font-semibold text-slate-800">
              Approvers
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              ผู้อนุมัติในขั้นตอนนี้
            </p>

          </div>

          <button
            type="button"
            onClick={() => addApprover(index)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            + Add Approver
          </button>

        </div>

        {approvers.length === 0 && (

          <div className="p-10 text-center text-slate-400">
            ยังไม่มีผู้อนุมัติ
          </div>

        )}

        <div className="space-y-4 p-5">

          {approvers.map((approver, approverIndex) => (

            <div
              key={approver.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="font-medium text-slate-700">
                  Approver {approverIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeApprover(
                      index,
                      approverIndex
                    )
                  }
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
                >
                  Remove
                </button>

              </div>

              {renderSelector(
                approver,
                approverIndex
              )}

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}