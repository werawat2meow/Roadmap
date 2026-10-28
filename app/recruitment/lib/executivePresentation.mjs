import { resolvePresentationTheme } from "./presentationTheme.mjs";

const PRESENTATION_ROOT = "/presentation";

export function getExecutivePresentationImageOptions() {
  return { includeQueryParams: true };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : value;
}

function showValue(value) {
  return normalizeText(value) || "-";
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPositiveNumber(value) {
  const number = toNumberOrNull(value);
  return number !== null && number > 0 ? number : null;
}

function getFullName(application, title) {
  const titleName = title?.title_name_th || title?.title_name_en;
  const parts = [titleName, application?.first_name, application?.last_name]
    .map(normalizeText)
    .filter(Boolean);

  return parts.join(" ") || "-";
}

function getPositionLevel(positionLevel) {
  return showValue(positionLevel?.level_code);
}

function getBackgrounds(branchCode) {
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

function buildCompensationItems(application, additionalCosts) {
  const requestedAllowances = [
    ["position_allowance", "ค่าตำแหน่ง"],
    ["living_allowance", "ค่าครองชีพ"],
    ["special_allowance", "ค่าตอบแทนพิเศษ"],
    ["fuel_allowance", "ค่าน้ำมัน"],
    ["oc", "OC"],
    ["phone_allowance", "ค่าโทรศัพท์"],
  ];

  const allowanceItems = requestedAllowances.flatMap(([key, label]) => {
    const amount = toPositiveNumber(application?.[key]);
    return amount === null ? [] : [{ key, label, amount }];
  });

  const additionalItems = (additionalCosts || []).flatMap((item, index) => {
    const amount = toPositiveNumber(item?.amount);
    if (item?.cost_type !== "additional" || amount === null) return [];

    return [
      {
        key: `additional-${index}`,
        label: showValue(item?.topic),
        amount,
      },
    ];
  });

  return [...allowanceItems, ...additionalItems];
}

function buildKpi(application) {
  if (application?.incentive_type !== "KPIs") return null;

  const amount = toNumberOrNull(application?.incentive_amount) ?? 0;
  return {
    probation_amount: amount / 2,
    confirmed_amount: amount,
  };
}

export function buildExecutivePresentationPayload({
  application = {},
  title = null,
  appliedPosition = null,
  finalPosition = null,
  positionLevel = null,
  branch = null,
  department = null,
  division = null,
  additionalCosts = [],
} = {}) {
  const organizationParts = [
    branch?.branch_name,
    department?.department_name,
    division?.division_name,
  ]
    .map(normalizeText)
    .filter(Boolean);
  const backgrounds = getBackgrounds(branch?.branch_code);
  const presentationTheme = resolvePresentationTheme(branch);

  return {
    id: application.id,
    emp_code: showValue(application.emp_code),
    full_name: getFullName(application, title),
    nickname: showValue(application.nickname_th),
    phone_number: showValue(application.phone_number),
    applied_position_name: showValue(appliedPosition?.position_name),
    expected_salary: toNumberOrNull(application.expected_salary),
    final_position_name: showValue(finalPosition?.position_name),
    position_level: getPositionLevel(positionLevel),
    organization: organizationParts.join(" / ") || "-",
    branch_code: showValue(branch?.branch_code),
    branch_name: showValue(branch?.branch_name),
    department_name: showValue(department?.department_name),
    division_name: showValue(division?.division_name),
    base_salary: toNumberOrNull(application.base_salary),
    compensation_items: buildCompensationItems(application, additionalCosts),
    kpi: buildKpi(application),
    start_date: application.start_date || null,
    profile_image_url: application.profile_image_url || null,
    branch_logo_url: branch?.branch_image_url || null,
    background_header_url: backgrounds.header,
    background_footer_url: backgrounds.footer,
    ...presentationTheme,
  };
}
