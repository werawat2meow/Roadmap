import { supabaseAdmin } from "@/lib/supabaseServer";

import { ContractDataError } from "./errors";
import {
  formatContractDateEN,
  formatContractDateTH,
  toContractNumber,
  type ContractNumericValue,
} from "./formatContractData";
import type {
  ContractAccessScope,
  ContractSigner,
  EmploymentContractBaseData,
  EmploymentContractData,
} from "./types";

const CONTRACT_APPLICATION_STATUSES = [15, 17];

type ContractApplicationRow = {
  id: string;
  status: number | null;
  emp_id: string | null;
  title_id: string | null;
  first_name: string | null;
  last_name: string | null;
  current_address_no: string | null;
  village_no: number | null;
  street: string | null;
  province_id: string | number | null;
  district_id: string | number | null;
  subdistrict_id: string | number | null;
  postal_code: string | null;
  company_id: string | null;
  branch_id: string | null;
  department_id: string | null;
  division_id: string | null;
  unit_id: string | null;
  position_id: string | null;
  position_level_id: string | null;
  start_date: string | null;
  hire_date: string | null;
  probation_end_date: string | null;
  probation_days: number | null;
  contract_number: string | null;
  base_salary: ContractNumericValue;
  position_allowance: ContractNumericValue;
};

type CompanyRow = {
  id: string;
  company_name_th: string;
  company_name_en: string | null;
  address: string | null;
  province_code: string | number | null;
  district_code: string | number | null;
  subdistrict_code: string | number | null;
  postcode: string | null;
};

type BranchRow = {
  id: string;
  branch_image_url: string | null;
};

type EmployeeRow = {
  id: string;
  title_id: string | null;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string | null;
  last_name_en: string | null;
};

type TitleRow = {
  title_name_th: string;
  title_name_en: string;
};

type PositionRow = {
  position_name: string;
};

type DepartmentRow = {
  department_name: string;
};

type PositionLevelRow = {
  level_code: string;
  level_name: string;
};

type GeothaiAddressType = "province" | "district" | "subdistrict";

type GeothaiName = {
  nameTH: string;
  nameEN: string;
};

type ResolvedGeothaiAddress = {
  province: GeothaiName | null;
  district: GeothaiName | null;
  subdistrict: GeothaiName | null;
};

type GeothaiAddressCodes = {
  provinceId: string | number | null;
  districtId: string | number | null;
  subdistrictId: string | number | null;
};

type ApprovedContractScope = {
  id: string;
  companyId: string;
  branchId: string | null;
};

function ensureContractId(contractId: string): string {
  const normalized = contractId.trim();

  if (!normalized) {
    throw new ContractDataError("INVALID_ID", "กรุณาระบุรหัสใบสมัคร");
  }

  return normalized;
}

function joinNonEmpty(values: Array<string | number | null | undefined>): string | null {
  const result = values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return result || null;
}

function isGeothaiApiData(
  value: unknown,
): value is { name_th: string; name_en: string } {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;
  return typeof data.name_th === "string" && typeof data.name_en === "string";
}

async function getGeothaiName(
  requestUrl: string,
  type: GeothaiAddressType,
  id: string | number | null,
): Promise<GeothaiName | null> {
  if (id === null || String(id).trim() === "") return null;

  const url = new URL("/jobs/api/geothai", requestUrl);
  url.searchParams.set("type", type);
  url.searchParams.set("id", String(id));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data?: unknown }).data
        : null;

    if (!response.ok || !isGeothaiApiData(data)) {
      throw new Error(`Invalid geothai ${type} response`);
    }

    return {
      nameTH: data.name_th.trim(),
      nameEN: data.name_en.trim(),
    };
  } catch (error) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถอ่านข้อมูลที่อยู่จากระบบข้อมูลจังหวัดได้",
      { cause: error },
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveGeothaiAddress(
  requestUrl: string,
  codes: GeothaiAddressCodes,
): Promise<ResolvedGeothaiAddress> {
  const [province, district, subdistrict] = await Promise.all([
    getGeothaiName(requestUrl, "province", codes.provinceId),
    getGeothaiName(requestUrl, "district", codes.districtId),
    getGeothaiName(requestUrl, "subdistrict", codes.subdistrictId),
  ]);

  return { province, district, subdistrict };
}

function combineAmount(
  salaryValue: ContractNumericValue,
  allowanceValue: ContractNumericValue
): number | null {
  const salary = toContractNumber(salaryValue);
  const allowance = toContractNumber(allowanceValue);

  if (salary === null && allowance === null) return null;
  return (salary ?? 0) + (allowance ?? 0);
}

async function getApprovedApplication(contractId: string): Promise<ContractApplicationRow> {
  const id = ensureContractId(contractId);
  const { data, error } = await supabaseAdmin
    .from("recruit_job_applications")
    .select(`
      id,
      status,
      emp_id,
      title_id,
      first_name,
      last_name,
      current_address_no,
      village_no,
      street,
      province_id,
      district_id,
      subdistrict_id,
      postal_code,
      company_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      position_level_id,
      start_date,
      hire_date,
      probation_end_date,
      probation_days,
      contract_number,
      base_salary,
      position_allowance
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ContractDataError("DATABASE_ERROR", "ไม่สามารถอ่านข้อมูลใบสมัครได้", {
      cause: error,
    });
  }

  const application = data as ContractApplicationRow | null;

  if (!application) {
    throw new ContractDataError("NOT_FOUND", "ไม่พบข้อมูลใบสมัคร");
  }

  if (!CONTRACT_APPLICATION_STATUSES.includes(Number(application.status))) {
    throw new ContractDataError(
      "NOT_APPROVED",
      "สามารถจัดทำสัญญาได้เฉพาะใบสมัครสถานะ 15 หรือ 17"
    );
  }

  return application;
}

async function getApprovedContractScope(contractId: string): Promise<ApprovedContractScope> {
  const application = await getApprovedApplication(contractId);

  if (!application.company_id) {
    throw new ContractDataError(
      "INCOMPLETE_DATA",
      "ใบสมัครยังไม่มี company_id สำหรับกำหนดขอบเขตผู้ลงนาม"
    );
  }

  return {
    id: application.id,
    companyId: application.company_id,
    branchId: application.branch_id,
  };
}

export async function getEmploymentContractData(
  contractId: string,
  requestUrl: string,
): Promise<EmploymentContractBaseData> {
  const application = await getApprovedApplication(contractId);

  if (!application.company_id || (Number(application.status) === 15 && !application.emp_id)) {
    throw new ContractDataError(
      "INCOMPLETE_DATA",
      "ใบสมัครที่อนุมัติแล้วต้องมี company_id และ emp_id"
    );
  }

  const [
    companyResult,
    branchResult,
    employeeResult,
    positionResult,
    departmentResult,
    levelResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from("companies")
        .select(
          "id, company_name_th, company_name_en, address, province_code, district_code, subdistrict_code, postcode"
        )
        .eq("id", application.company_id)
        .maybeSingle(),
      application.branch_id
        ? supabaseAdmin
            .from("branches")
            .select("id, branch_image_url")
            .eq("id", application.branch_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      application.emp_id ? supabaseAdmin
        .from("employees")
        .select(
          "id, title_id, first_name_th, last_name_th, first_name_en, last_name_en"
        )
        .eq("id", application.emp_id)
        .maybeSingle() : Promise.resolve({ data: null, error: null }),
      application.position_id
        ? supabaseAdmin
            .from("positions")
            .select("position_name")
            .eq("id", application.position_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      application.department_id
        ? supabaseAdmin
            .from("departments")
            .select("department_name")
            .eq("id", application.department_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      application.position_level_id
        ? supabaseAdmin
            .from("position_levels")
            .select("level_code, level_name")
            .eq("id", application.position_level_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const firstError = [
    companyResult.error,
    branchResult.error,
    employeeResult.error,
    positionResult.error,
    departmentResult.error,
    levelResult.error,
  ].find(Boolean);

  if (firstError) {
    throw new ContractDataError("DATABASE_ERROR", "ไม่สามารถอ่านข้อมูลประกอบสัญญาได้", {
      cause: firstError,
    });
  }

  const company = companyResult.data as CompanyRow | null;
  const branch = branchResult.data as BranchRow | null;
  const employee = employeeResult.data as EmployeeRow | null;
  const position = positionResult.data as PositionRow | null;
  const department = departmentResult.data as DepartmentRow | null;
  const level = levelResult.data as PositionLevelRow | null;

  if (!company || (Number(application.status) === 15 && !employee)) {
    throw new ContractDataError(
      "INCOMPLETE_DATA",
      "ไม่พบข้อมูลบริษัทหรือพนักงานที่เชื่อมกับใบสมัคร"
    );
  }

  const titleId = employee?.title_id ?? application.title_id;
  const companyGeothaiAddressPromise = resolveGeothaiAddress(requestUrl, {
    provinceId: company.province_code,
    districtId: company.district_code,
    subdistrictId: company.subdistrict_code,
  });
  const [titleResult, employeeGeothaiAddress, companyGeothaiAddress] = await Promise.all([
    titleId
      ? supabaseAdmin
          .from("titles")
          .select("title_name_th, title_name_en")
          .eq("id", titleId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    resolveGeothaiAddress(requestUrl, { provinceId: application.province_id, districtId: application.district_id, subdistrictId: application.subdistrict_id }),
    companyGeothaiAddressPromise,
  ]);

  if (titleResult.error) {
    throw new ContractDataError("DATABASE_ERROR", "ไม่สามารถอ่านข้อมูลคำนำหน้าชื่อได้", {
      cause: titleResult.error,
    });
  }

  const title = titleResult.data as TitleRow | null;
  const startDate = Number(application.status) === 17 ? application.start_date : application.start_date ?? application.hire_date;
  const salary = toContractNumber(application.base_salary);
  const positionAllowance = toContractNumber(application.position_allowance);
  if (Number(application.status) === 17 && (!startDate || !formatContractDateTH(startDate) || !application.probation_end_date ||
    !formatContractDateTH(application.probation_end_date) || !(application.probation_days > 0) ||
    salary === null || salary < 0 || !(employee?.first_name_th || application.first_name)?.trim() ||
    !(employee?.last_name_th || application.last_name)?.trim() || !company.company_name_th?.trim() ||
    !company.address?.trim() || !application.current_address_no?.trim() || !position?.position_name || !department?.department_name)) {
    throw new ContractDataError("INCOMPLETE_DATA", "กรุณาตรวจชื่อ ที่อยู่ บริษัท ตำแหน่ง ฝ่าย วันเริ่มงาน ระยะทดลองงาน และเงินเดือนให้ครบ");
  }

  return {
    contract: {
      id: application.id,
      contractNo: application.contract_number,
      contractDateTH: null,
      contractDateEN: null,
      startDateTH: formatContractDateTH(startDate),
      startDateEN: formatContractDateEN(startDate),
      endDateTH: formatContractDateTH(application.probation_end_date),
      endDateEN: formatContractDateEN(application.probation_end_date),
      durationDays: application.probation_days,
      probationDays: application.probation_days,
    },
    company: {
      id: company.id,
      branchId: application.branch_id,
      logo: branch?.branch_image_url ?? null,
      nameTH: company.company_name_th,
      nameEN: company.company_name_en,
      addressTH: joinNonEmpty([
        company.address,
        companyGeothaiAddress.subdistrict?.nameTH,
        companyGeothaiAddress.district?.nameTH,
        companyGeothaiAddress.province?.nameTH,
        company.postcode,
      ]),
      addressEN: joinNonEmpty([
        company.address,
        companyGeothaiAddress.subdistrict?.nameEN,
        companyGeothaiAddress.district?.nameEN,
        companyGeothaiAddress.province?.nameEN,
        company.postcode,
      ]),
    },
    employee: {
      id: employee?.id ?? null,
      prefixTH: title?.title_name_th ?? null,
      firstNameTH: employee?.first_name_th || application.first_name || "",
      lastNameTH: employee?.last_name_th || application.last_name || "",
      prefixEN: title?.title_name_en ?? null,
      firstNameEN: employee?.first_name_en ?? null,
      lastNameEN: employee?.last_name_en ?? null,
      addressTH: joinNonEmpty([
        application.current_address_no,
        application.village_no,
        application.street,
        employeeGeothaiAddress.subdistrict?.nameTH,
        employeeGeothaiAddress.district?.nameTH,
        employeeGeothaiAddress.province?.nameTH,
        application.postal_code,
      ]),
      addressEN: joinNonEmpty([
        application.current_address_no,
        application.village_no,
        application.street,
        employeeGeothaiAddress.subdistrict?.nameEN,
        employeeGeothaiAddress.district?.nameEN,
        employeeGeothaiAddress.province?.nameEN,
        application.postal_code,
      ]),
      positionTH: position?.position_name ?? null,
      positionEN: position?.position_name ?? null,
      departmentTH: department?.department_name ?? null,
      departmentEN: department?.department_name ?? null,
      level: joinNonEmpty([level?.level_code, level?.level_name]),
      salary,
      positionAllowance,
      totalSalary: combineAmount(application.base_salary, application.position_allowance),
    },
  };
}

export async function getContractSigners(
  contractId: string
): Promise<ContractSigner[]> {
  await getApprovedContractScope(contractId);

  const { data: signerRows, error: signerError } = await supabaseAdmin
    .from("recruit_contract_signatories")
    .select("id, emp_name_th, emp_name_en, position_id, status")
    .eq("status", true)
    .order("id", { ascending: true });

  if (signerError) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถอ่านข้อมูลผู้ลงนามได้",
      { cause: signerError }
    );
  }

  const positionIds = Array.from(
    new Set(
      (signerRows ?? [])
        .map((signer) => signer.position_id)
        .filter(
          (positionId): positionId is string | number =>
            positionId !== null && positionId !== undefined
        )
    )
  );
  const positionNameById = new Map<string, string>();

  if (positionIds.length > 0) {
    const { data: positionRows, error: positionError } = await supabaseAdmin
      .from("positions")
      .select("id, position_name")
      .in("id", positionIds);

    if (positionError) {
      throw new ContractDataError(
        "DATABASE_ERROR",
        "ไม่สามารถอ่านข้อมูลตำแหน่งผู้ลงนามได้",
        { cause: positionError }
      );
    }

    for (const position of positionRows ?? []) {
      if (position.position_name?.trim()) {
        positionNameById.set(
          String(position.id),
          position.position_name.trim()
        );
      }
    }
  }

  return (signerRows ?? []).map((signer) => ({
    id: String(signer.id),
    employeeId: null,
    nameTH: signer.emp_name_th,
    nameEN: signer.emp_name_en,
    positionTH:
      signer.position_id === null || signer.position_id === undefined
        ? null
        : positionNameById.get(String(signer.position_id)) ?? null,
    positionEN: null,
    signerType: null,
  }));
}

export async function getContractAccessScope(
  contractId: string
): Promise<ContractAccessScope> {
  const application = await getApprovedApplication(contractId);

  return {
    id: application.id,
    employee_id: application.emp_id,
    company_id: application.company_id,
    branch_id: application.branch_id,
    department_id: application.department_id,
    division_id: application.division_id,
    unit_id: application.unit_id,
  };
}

export async function buildEmploymentContractData(
  contractId: string,
  selectedSigner: ContractSigner,
  requestUrl: string,
): Promise<EmploymentContractData> {
  const [contract, allowedSigners] = await Promise.all([
    getEmploymentContractData(contractId, requestUrl),
    getContractSigners(contractId),
  ]);
  const signer = allowedSigners.find((item) => item.id === selectedSigner.id);

  if (!signer) {
    throw new ContractDataError(
      "SIGNER_NOT_ALLOWED",
      "ผู้ลงนามไม่อยู่ในขอบเขตของสัญญานี้หรือไม่ได้เปิดใช้งาน"
    );
  }

  return {
    ...contract,
    employer: {
      id: signer.id,
      employeeId: signer.employeeId,
      nameTH: signer.nameTH,
      nameEN: signer.nameEN,
      positionTH: signer.positionTH,
      positionEN: signer.positionEN,
      signerType: signer.signerType,
    },
  };
}
