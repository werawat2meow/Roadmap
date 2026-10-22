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

export function sectionParticipantError(type, participantIds, participants, handovers) {
  if (type === "site_visit" && participantIds.some((id) => !participants.some((participant) => participant.id === id && participant.site_visit_status === "visited"))) {
    return "กรุณาบันทึก Site Visit ให้ครบทุกคนที่เลือกก่อนอัปโหลดหมวดนี้";
  }
  if (type === "handover" && participantIds.some((id) => !handovers.some((handover) => handover.participant_id === id))) {
    return "กรุณาบันทึกส่งมอบให้ครบทุกคนที่เลือกก่อนอัปโหลดหมวดนี้";
  }
  return "";
}

export function replaceSectionPhotos(current, latest, sessionId, type) {
  return [
    ...current.filter((photo) => photo.session_id !== sessionId || photo.photo_type !== type),
    ...latest.filter((photo) => photo.session_id === sessionId && photo.photo_type === type),
  ];
}

export function replacePendingPhoto(current, type, index, file) {
  if (!file) return current;
  return {
    ...current,
    [type]: current[type].map((item, itemIndex) => itemIndex === index ? file : item),
  };
}

export function sectionSlotState(type, uploadedPhotos) {
  const photos = (Array.isArray(uploadedPhotos) ? uploadedPhotos : [])
    .filter((photo) => photo?.photo_type === type)
    .sort((left, right) => {
      const leftSlot = Number.isInteger(left.sort_order) ? left.sort_order : Number.MAX_SAFE_INTEGER;
      const rightSlot = Number.isInteger(right.sort_order) ? right.sort_order : Number.MAX_SAFE_INTEGER;
      return leftSlot - rightSlot || String(left.id).localeCompare(String(right.id));
    });
  if (type === "handover") return { exactComplete: false, slots: [], photos };

  const slots = [null, null, null];
  for (const photo of photos) {
    if (Number.isInteger(photo.sort_order) && photo.sort_order >= 0 && photo.sort_order < slots.length && !slots[photo.sort_order]) {
      slots[photo.sort_order] = photo;
    }
  }
  const exactComplete = photos.length === slots.length && slots.every(Boolean);
  return { exactComplete, slots, photos };
}
