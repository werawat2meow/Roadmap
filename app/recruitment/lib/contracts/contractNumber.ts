import { supabaseAdmin } from "@/lib/supabaseServer";
import { cleanText } from "@/lib/employee/employeePayload";

import { ContractDataError } from "./errors";

const CONTRACT_NUMBER_RPC = "get_next_contract_number";

type ContractNumberApplication = {
  id: string;
  company_id: string | null;
  contract_number: string | null;
};

function readContractNumber(value: unknown): string {
  return cleanText(
    Array.isArray(value)
      ? value[0]?.contract_number || value[0]
      : value && typeof value === "object" && "contract_number" in value
        ? value.contract_number
        : value,
  );
}

export async function generateContractNumber(
  application: ContractNumberApplication,
): Promise<string> {
  const existingContractNumber = cleanText(application.contract_number);
  if (existingContractNumber) return existingContractNumber;

  if (!application.company_id) {
    throw new ContractDataError(
      "INCOMPLETE_DATA",
      "ไม่พบ Company สำหรับออกเลขที่สัญญา",
    );
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .select("id, company_code")
    .eq("id", application.company_id)
    .maybeSingle();

  if (companyError || !company) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถดึงข้อมูลบริษัทสำหรับออกเลขที่สัญญาได้",
      { cause: companyError },
    );
  }

  const companyCode = cleanText(company.company_code);
  if (!companyCode) {
    throw new ContractDataError(
      "INCOMPLETE_DATA",
      "ไม่พบ Company Code สำหรับออกเลขที่สัญญา",
    );
  }

  const { data: rawContractNumber, error: contractNumberError } =
    await supabaseAdmin.rpc(CONTRACT_NUMBER_RPC, {
      p_application_id: application.id,
      p_company_id: application.company_id,
      p_company_code: companyCode,
    });

  if (contractNumberError) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถสร้างเลขที่สัญญาจ้างได้",
      { cause: contractNumberError },
    );
  }

  const contractNumber = readContractNumber(rawContractNumber);
  if (!contractNumber) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ระบบสร้างเลขที่สัญญาจ้างไม่สำเร็จ",
    );
  }

  return contractNumber;
}

export async function ensureContractNumberForApplication(
  applicationId: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("recruit_job_applications")
    .select("id, company_id, contract_number")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถตรวจสอบเลขที่สัญญาจ้างได้",
      { cause: error },
    );
  }

  const application = data as ContractNumberApplication | null;
  if (!application) {
    throw new ContractDataError("NOT_FOUND", "ไม่พบข้อมูลใบสมัคร");
  }

  const existingContractNumber = cleanText(application.contract_number);
  if (existingContractNumber) return existingContractNumber;

  const generatedContractNumber = await generateContractNumber(application);
  let updateQuery = supabaseAdmin
    .from("recruit_job_applications")
    .update({ contract_number: generatedContractNumber })
    .eq("id", application.id);

  updateQuery =
    application.contract_number === null
      ? updateQuery.is("contract_number", null)
      : updateQuery.eq("contract_number", application.contract_number);

  const { data: updatedApplication, error: updateError } = await updateQuery
    .select("contract_number")
    .maybeSingle();

  if (updateError) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถบันทึกเลขที่สัญญาจ้างได้",
      { cause: updateError },
    );
  }

  if (updatedApplication) return generatedContractNumber;

  // Another export may have filled the number after the initial read. Keep the
  // number that won the conditional update instead of overwriting it.
  const { data: latestApplication, error: latestError } = await supabaseAdmin
    .from("recruit_job_applications")
    .select("contract_number")
    .eq("id", application.id)
    .maybeSingle();
  const latestContractNumber = cleanText(latestApplication?.contract_number);

  if (latestError || !latestContractNumber) {
    throw new ContractDataError(
      "DATABASE_ERROR",
      "ไม่สามารถยืนยันเลขที่สัญญาจ้างได้",
      { cause: latestError },
    );
  }

  return latestContractNumber;
}
