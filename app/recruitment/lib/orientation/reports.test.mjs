import test from "node:test";
import assert from "node:assert/strict";

import { employeeGroupLabel } from "./reports.mjs";

test("employeeGroupLabel uses unique employee groups from the selected session", () => {
  const rows = [
    { session_id: "session-1", group_name: "Group A" },
    { session_id: "session-1", group_name: "Group B" },
    { session_id: "session-1", group_name: "Group A" },
    { session_id: "session-1", group_name: "" },
    { session_id: "session-2", group_name: "Other Group" },
  ];

  assert.equal(employeeGroupLabel(rows, "session-1"), "Group A & Group B");
  assert.equal(employeeGroupLabel(rows, "session-2"), "Other Group");
  assert.equal(employeeGroupLabel(rows, "missing"), "-");
});
