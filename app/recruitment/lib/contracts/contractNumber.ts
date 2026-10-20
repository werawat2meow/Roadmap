import { supabaseAdmin } from "@/lib/supabaseServer";
import { cleanText } from "@/lib/employee/employeePayload";
import { ContractDataError } from "./errors";

type ContractNumberApplication = { id: string; company_id: string | null; contract_number: string | null };

// Approval and export must use the same database lock and persisted number.
export async function generateContractNumber(application: ContractNumberApplication): Promise<string> {
  return ensureContractNumberForApplication(application.id);
}

export async function ensureContractNumberForApplication(applicationId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("recruit_ensure_contract_number", { p_application_id: applicationId });
  if (error) {
    if (["PGRST202", "42883"].includes(error.code)) {
      throw new ContractDataError("DATABASE_ERROR", "กรุณาติดตั้ง SQL contract-number-transaction.sql ก่อนส่งออกหรืออนุมัติสัญญา", { cause: error });
    }
    if (error.message?.includes("CONTRACT_NOT_ELIGIBLE")) throw new ContractDataError("NOT_APPROVED", "สถานะใบสมัครเปลี่ยนแล้ว");
    if (error.message?.includes("CONTRACT_NOT_FOUND")) throw new ContractDataError("NOT_FOUND", "ไม่พบใบสมัคร");
    if (error.message?.includes("CONTRACT_COMPANY_INCOMPLETE")) throw new ContractDataError("INCOMPLETE_DATA", "ไม่พบ Company Code สำหรับออกเลขสัญญา");
    throw new ContractDataError("DATABASE_ERROR", "ไม่สามารถออกเลขสัญญาได้", { cause: error });
  }
  const number = cleanText(typeof data === "string" ? data : data?.contract_number);
  if (!number) throw new ContractDataError("DATABASE_ERROR", "ไม่ได้รับเลขสัญญาจากระบบ");
  return number;
}
