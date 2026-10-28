const PRESENTATION_ROOT = "/presentation";

function showValue(value) {
  const normalized = typeof value === "string" ? value.trim() : value;
  return normalized || "-";
}

function getFullName(application, title) {
  const titleName = title?.title_name_th || title?.title_name_en;
  const parts = [titleName, application?.first_name, application?.last_name]
    .map((value) => (typeof value === "string" ? value.trim() : value))
    .filter(Boolean);

  return parts.join(" ") || "-";
}

function getPositionLevel(positionLevel) {
  return showValue(positionLevel?.level_code || positionLevel?.level_name);
}

export function getDepartmentPresentationBackgrounds(branchCode) {
  const normalized = String(branchCode || "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    return { header: null, footer: null };
  }

  const encodedBranchCode = encodeURIComponent(normalized);
  return {
    header: `${PRESENTATION_ROOT}/${encodedBranchCode}/BG_H.png`,
    footer: `${PRESENTATION_ROOT}/${encodedBranchCode}/BG_F.png`,
  };
}

export function resolveDepartmentPresentationPositionId(application) {
  return application?.final_position_id || null;
}

export function buildDepartmentPresentationPayload({
  application = {},
  title = null,
  position = null,
  positionLevel = null,
  branch = null,
  department = null,
} = {}) {
  const backgrounds = getDepartmentPresentationBackgrounds(
    branch?.branch_code,
  );

  return {
    id: application.id,
    full_name: getFullName(application, title),
    nickname: showValue(application.nickname_th || application.nickname_en),
    emp_code: showValue(application.emp_code),
    position_name: showValue(position?.position_name),
    position_level: getPositionLevel(positionLevel),
    branch_code: showValue(branch?.branch_code),
    branch_name: showValue(branch?.branch_name),
    department_name: showValue(department?.department_name),
    phone_number: showValue(application.phone_number),
    line_id: showValue(application.line_id),
    start_date: application.start_date || null,
    profile_image_url: application.profile_image_url || null,
    branch_logo_url: branch?.branch_image_url || null,
    background_header_url: backgrounds.header,
    background_footer_url: backgrounds.footer,
  };
}

export function buildDepartmentPresentationFields(employee = {}) {
  return [
    { label: "ชื่อ-นามสกุล", value: employee.full_name, span: 2 },
    { label: "ชื่อเล่น", value: employee.nickname },
    { label: "รหัสพนักงาน", value: employee.emp_code },
    { label: "ตำแหน่ง", value: employee.position_name },
    { label: "ระดับ", value: employee.position_level },
    { label: "สังกัด", value: employee.branch_name },
    { label: "แผนก", value: employee.department_name },
    { label: "โทรศัพท์", value: employee.phone_number },
    { label: "ID Line", value: employee.line_id },
    { label: "เริ่มงานวันที่", value: employee.start_date, span: 2 },
  ];
}
