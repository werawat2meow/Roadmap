export function assignableEmployeeRows(rows) {
  return rows.filter(
    (row) => !(row.participant_id && row.workflow_status === "completed"),
  );
}

export function sessionDateTimeLocal(session) {
  const date = session?.orientation_date?.slice(0, 10);
  if (!date) return "";

  const time = session.start_time?.slice(0, 5) || "10:00";
  return `${date}T${time}`;
}
