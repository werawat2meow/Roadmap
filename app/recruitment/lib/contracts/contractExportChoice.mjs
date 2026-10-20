export async function persistContractExportChoice(
  db,
  applicationId,
  signerId,
  employerSignatureType,
) {
  const { error } = await db
    .from("recruit_job_applications")
    .update({
      contract_signer_id: signerId,
      employer_signature_type: employerSignatureType,
    })
    .eq("id", applicationId);

  if (error) throw error;
}
