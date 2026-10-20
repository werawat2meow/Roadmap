const employerSignatureTypes = new Set([
  "employer",
  "authorized_representative",
]);

export function automaticContractExportValues(signers, stored = {}) {
  const signer = signers.find((item) => item.id === stored.signerId);
  if (!signer || !employerSignatureTypes.has(stored.employerSignatureType)) return null;

  return {
    signerId: signer.id,
    employerSignatureType: stored.employerSignatureType,
  };
}
