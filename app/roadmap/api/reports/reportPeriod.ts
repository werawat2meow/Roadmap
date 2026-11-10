type EvaluationPeriod = {
  evaluation_period?: string | null;
  extra_data?: { evaluationPeriod?: string | null } | null;
  created_at?: string | null;
};

// Reports belong to the month in which the assessment period ends, not approval.
export function getReportPeriodDate(evaluation: EvaluationPeriod): string | null {
  for (const period of [evaluation.evaluation_period, evaluation.extra_data?.evaluationPeriod]) {
    if (typeof period !== "string") continue;
    const match = period.trim().match(/^(\d{4}-\d{2}-\d{2})(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?$/);
    if (!match) continue;
    const end = match[2] || match[1];
    const date = new Date(`${end}T00:00:00Z`);
    if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === end) return end;
  }
  // Preserve access to legacy evaluations that have no assessment period.
  if (!evaluation.created_at) return null;
  const created = new Date(evaluation.created_at);
  if (!Number.isFinite(created.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(created);
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
