// Drafts may be incomplete; submitted scores must have a positive maximum.
export function validateEvaluationScores(body: Record<string, any>): string | null {
  const isScore = (value: unknown) =>
    (typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")) &&
    Number.isFinite(Number(value)) && Number(value) >= 0;

  const fields = ["totalScore", "maxScore", "companyScore", "departmentScore", "expectationScore", "examScore"];
  for (const field of fields) {
    if (body[field] != null && !isScore(body[field])) {
      return "คะแนนต้องเป็นตัวเลขตั้งแต่ศูนย์ขึ้นไป";
    }
  }
  const maximum = body.maxScore == null ? null : Number(body.maxScore);
  for (const field of ["totalScore", "companyScore", "departmentScore", "expectationScore"]) {
    if (maximum !== null && body[field] != null && Number(body[field]) > maximum) {
      return "คะแนนต้องไม่เกินคะแนนเต็ม";
    }
  }

  if (body.scores != null && !Array.isArray(body.scores)) return "ข้อมูลคะแนนไม่ถูกต้อง";
  const scores = body.scores || [];
  const rows = ["companyRows", "departmentRows", "expectationRows"].flatMap((key) =>
    Array.isArray(body.extra_data?.[key]) ? body.extra_data[key] : [],
  );
  for (const row of rows) {
    if (!row || !isScore(row.score ?? 0) || !isScore(row.maxScore ?? 0) ||
        Number(row.score ?? 0) > Number(row.maxScore ?? 0)) {
      return "คะแนนรายข้อต้องอยู่ระหว่างศูนย์และคะแนนเต็มของข้อนั้น";
    }
  }
  for (const score of scores) {
    if (!score || !score.categoryItemId || !isScore(score.score)) return "ข้อมูลคะแนนรายข้อไม่ถูกต้อง";
    // MGR sends row maxima in extra_data; HR sends them in scores[].max.
    const row = rows.find((item) => item.itemId === score.categoryItemId);
    const max = score.max ?? score.weight ?? row?.maxScore ?? maximum;
    if (max != null && (!isScore(max) || Number(score.score) > Number(max))) {
      return "คะแนนรายข้อต้องไม่เกินคะแนนเต็ม";
    }
  }
  if (body.status === "Submitted") {
    if (maximum === null || maximum <= 0 || body.totalScore == null) {
      return "กรุณาระบุคะแนนรวมและคะแนนเต็มก่อนส่งประเมิน";
    }
    const hasExpectations = rows.some((row) => row.topic?.trim() && Number(row.maxScore) > 0);
    if (scores.length === 0 && !hasExpectations) return "กรุณาระบุคะแนนรายข้อก่อนส่งประเมิน";
  }
  return null;
}
