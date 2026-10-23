import test from "node:test";
import assert from "node:assert/strict";

import { orientationData } from "./readData.mjs";

function database(tables) {
  return {
    from(table) {
      let predicates = [];
      let limit = Number.POSITIVE_INFINITY;
      const query = {
        select() { return query; },
        order() { return query; },
        limit(value) { limit = value; return query; },
        eq(field, value) { predicates.push((row) => row[field] === value); return query; },
        in(field, values) { predicates.push((row) => values.includes(row[field])); return query; },
        gt(field, value) { predicates.push((row) => row[field] > value); return query; },
        then(resolve, reject) {
          const data = (tables[table] || [])
            .filter((row) => predicates.every((predicate) => predicate(row)))
            .sort((a, b) => a.id.localeCompare(b.id))
            .slice(0, limit);
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test("orientationData exposes the employee branch group for activity preview", async () => {
  const db = database({
    recruit_job_applications: [{ id: "application", emp_id: "employee", status: 15 }],
    employees: [{ id: "employee", branch_group_id: "group", first_name_th: "พนักงาน" }],
    branch_groups: [{ id: "group", group_name: "Group A" }],
  });
  const guard = { canAccessEmployee: () => true };

  const result = await orientationData(db, guard);

  assert.equal(result.rows[0].group_name, "Group A");
});
