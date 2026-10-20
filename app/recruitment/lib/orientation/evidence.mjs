import { readByIds } from "./readData.mjs";

export async function evidenceForRows(db, rows, guard) {
  const participants = new Map(rows.filter((row) => row.participant_id).map((row) => [row.participant_id, row]));
  const ids = [...participants.keys()];
  const [handovers, links, facilitators] = await Promise.all([
    readByIds(db, "recruit_orientation_handovers", "id,participant_id,receiver_employee_id,receiver_name_snapshot,receiver_position_snapshot,handover_at,handover_location", "participant_id", ids),
    readByIds(db, "recruit_orientation_photo_participants", "id,photo_id,participant_id,handover_id", "participant_id", ids),
    readByIds(db, "recruit_orientation_facilitators", "id,session_id,employee_id,sort_order", "session_id", rows.map((row) => row.session_id)),
  ]);
  const employees = guard ? await readByIds(db, "employees", "id,first_name_th,last_name_th,first_name_en,last_name_en,nickname_th,nickname_en,nick_name,position_id,branch_group_id", "id", [...facilitators.map((f) => f.employee_id), ...handovers.map((h) => h.receiver_employee_id)], (q) => guard.applyEmployeeScope(q)) : [];
  const [positions, groups] = await Promise.all([
    readByIds(db, "positions", "id,position_name", "id", employees.map((e) => e.position_id)),
    readByIds(db, "branch_groups", "id,group_name", "id", employees.map((e) => e.branch_group_id)),
  ]);
  const staff = new Map(employees.map((e) => [e.id, {
    full_name: [e.first_name_th, e.last_name_th].filter(Boolean).join(" ") || [e.first_name_en, e.last_name_en].filter(Boolean).join(" "),
    nickname: e.nickname_th || e.nickname_en || e.nick_name || "",
    position_name: positions.find((p) => p.id === e.position_id)?.position_name || "",
    group_name: groups.find((group) => group.id === e.branch_group_id)?.group_name || "",
  }]));
  const photos = await readByIds(db, "recruit_orientation_photos", "id,session_id,photo_type,taken_at,path_url", "id", links.map((link) => link.photo_id));
  const deliveries = new Map(handovers.map((row) => [row.id, row]));
  const photoMap = new Map(photos.map((row) => [row.id, row]));
  const validLinks = links.filter((link) => {
    const photo = photoMap.get(link.photo_id);
    const participant = participants.get(link.participant_id);
    return photo && participant && photo.session_id === participant.session_id &&
      ["orientation", "site_visit", "handover"].includes(photo.photo_type) && photo.path_url &&
      (photo.photo_type !== "handover" || deliveries.get(link.handover_id)?.participant_id === participant.participant_id);
  });
  return rows.map((row) => ({
    ...row,
    facilitators: facilitators.filter((f) => f.session_id === row.session_id && staff.has(f.employee_id)).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id)).map((f) => ({ id: f.id, ...staff.get(f.employee_id) })),
    handovers: handovers.filter((item) => item.participant_id === row.participant_id).map((item) => ({
      ...item,
      receiver_full_name: staff.get(item.receiver_employee_id)?.full_name || "",
      receiver_nickname: staff.get(item.receiver_employee_id)?.nickname || "",
      receiver_position_name: staff.get(item.receiver_employee_id)?.position_name || "",
    })),
    photos: [...new Set(validLinks.filter((link) => link.participant_id === row.participant_id).map((link) => link.photo_id))].map((id) => {
      const photo = photoMap.get(id);
      // Storage keys stay server-side. The image handler rechecks membership.
      return { id: photo.id, photo_type: photo.photo_type, taken_at: photo.taken_at };
    }),
  }));
}
