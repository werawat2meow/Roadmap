// lib/roadmap/cycleHelper.ts

export type CyclePhase =
  | "NOMINATING"
  | "HR_PREPARING"
  | "EVALUATING"
  | "LOCKED"
  | "NORMAL";

export type RoadmapCycleSettings = {
  nominationAlertStartDay: number;
  nominationAlertEndDay: number;
  nominationStartDay: number;
  nominationEndDay: number;
  hrPrepareDeadlineDay: number;
  evaluationAlertStartDay: number;
  evaluationAlertEndDay: number;
  managerLockDay: number;
};

export const defaultRoadmapCycleSettings: RoadmapCycleSettings = {
  nominationAlertStartDay: 26,
  nominationAlertEndDay: 27,
  nominationStartDay: 26,
  nominationEndDay: 28,
  hrPrepareDeadlineDay: 2,
  evaluationAlertStartDay: 6,
  evaluationAlertEndDay: 7,
  managerLockDay: 9,
};

export function mapCycleSettingsFromApi(data: any): RoadmapCycleSettings {
  return {
    nominationAlertStartDay:
      data?.nomination_alert_start_day ??
      defaultRoadmapCycleSettings.nominationAlertStartDay,
    nominationAlertEndDay:
      data?.nomination_alert_end_day ??
      defaultRoadmapCycleSettings.nominationAlertEndDay,
    nominationStartDay:
      data?.nomination_start_day ??
      defaultRoadmapCycleSettings.nominationStartDay,
    nominationEndDay:
      data?.nomination_end_day ??
      defaultRoadmapCycleSettings.nominationEndDay,
    hrPrepareDeadlineDay:
      data?.hr_prepare_deadline_day ??
      defaultRoadmapCycleSettings.hrPrepareDeadlineDay,
    evaluationAlertStartDay:
      data?.evaluation_alert_start_day ??
      defaultRoadmapCycleSettings.evaluationAlertStartDay,
    evaluationAlertEndDay:
      data?.evaluation_alert_end_day ??
      defaultRoadmapCycleSettings.evaluationAlertEndDay,
    managerLockDay:
      data?.manager_lock_day ?? defaultRoadmapCycleSettings.managerLockDay,
  };
}

function isDayInRange(day: number, start: number, end: number) {
  if (start <= end) {
    return day >= start && day <= end;
  }

  return day >= start || day <= end;
}

export function getEvaluationCycleInfo(
  customDate?: Date,
  settings: RoadmapCycleSettings = defaultRoadmapCycleSettings,
) {
  const now = customDate || new Date();
  const day = now.getDate();

  const isNominationPeriod = isDayInRange(
    day,
    settings.nominationStartDay,
    settings.nominationEndDay,
  );

  const isNominationAlert = isDayInRange(
    day,
    settings.nominationAlertStartDay,
    settings.nominationAlertEndDay,
  );

  const isHrPreparePeriod =
    day > settings.nominationEndDay || day <= settings.hrPrepareDeadlineDay;

  const isEvaluationDueSoon = isDayInRange(
    day,
    settings.evaluationAlertStartDay,
    settings.evaluationAlertEndDay,
  );

  const isManagerLocked = day >= settings.managerLockDay;

  let phase: CyclePhase = "NORMAL";
  if (isNominationPeriod) phase = "NOMINATING";
  else if (isHrPreparePeriod) phase = "HR_PREPARING";
  else if (isManagerLocked) phase = "LOCKED";
  else if (isEvaluationDueSoon) phase = "EVALUATING";

  return {
    day,
    phase,
    isNominationPeriod,
    isNominationAlert,
    isHrPreparePeriod,
    isEvaluationDueSoon,
    isManagerLocked,
  };
}