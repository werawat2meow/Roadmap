export function displayFinalPositionId(application, status) {
  if (application?.final_position_id != null) {
    return application.final_position_id;
  }
  return status === 12 ? application?.position_id ?? null : null;
}

export function finalPositionUpdate(body) {
  return {
    final_position_id: body?.final_position_id ?? null,
  };
}

export function employeePositionData(application) {
  return {
    position_id: application?.final_position_id ?? null,
  };
}

export function showsFinalPositionSection(status) {
  return status === 12 || status === 17;
}
