"use client";

import {ApartmentOutlined,} from "@ant-design/icons";
import EmptyState from "./EmptyState";
import ManagementAssignmentCard from "./ManagementAssignmentCard";

/* =========================================================
    Helpers
========================================================= */
function groupAssignmentsByLevel( assignments = [] ) {
  return assignments.reduce(
    (result, assignment) => {
      const level = assignment.management_level || "UNKNOWN";
      if (!result[level]) {
        result[level] = [];
      }
      result[level].push(
        assignment
      );
      return result;
    },
    {}
  );
}

const LEVEL_ORDER = [
  "P12",
  "P11",
  "P10",
  "P9",
];

const LEVEL_COLOR = {
  P12: "bg-red-100 text-red-700",
  P11: "bg-orange-100 text-orange-700",
  P10: "bg-blue-100 text-blue-700",
  P9: "bg-green-100 text-green-700",
};

/* =========================================================
    Component
========================================================= */

export default function ManagementAssignmentTree({assignments = [],supervisors = {},loading = false,onEdit,onDelete,}) {
  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-16">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"/>
        </div>
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <EmptyState
        icon={<ApartmentOutlined />}
        title="ยังไม่มีสายบังคับบัญชา"
        description="กดเพิ่มข้อมูลเพื่อเริ่มสร้างโครงสร้างองค์กร"
      />
    );
  }

  const grouped = groupAssignmentsByLevel(assignments);

  return (

    <div className="space-y-8">

      {LEVEL_ORDER.map((level) => {

        const items =
          grouped[level] || [];

        if (!items.length) {

          return null;

        }

        return (

          <section
            key={level}
            className="rounded-3xl border border-slate-200 bg-white shadow-sm"
          >

            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-3">

                <span
                  className={`rounded-full px-4 py-2 text-sm font-black ${LEVEL_COLOR[level]}`}
                >

                  {level}

                </span>

                <div>

                  <h2 className="text-lg font-black text-slate-800">

                    Management {level}

                  </h2>

                  <p className="text-sm text-slate-500">

                    จำนวน {items.length} คน

                  </p>

                </div>

              </div>

            </div>

            {/* Cards */}

            <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-2 2xl:grid-cols-3">
                          {items.map((assignment) => {
                const supervisorId =
                  assignment.supervisor_employee_id ||
                  assignment.supervisor_id ||
                  "";

                const supervisor =
                  supervisors?.[supervisorId] ||
                  assignment.supervisor ||
                  assignment.supervisor_employee ||
                  null;

                return (
                  <ManagementAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    supervisor={supervisor}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              })}

            </div>

          </section>

        );
      })}

    </div>
  );
}