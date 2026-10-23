type SharedContractNameInput = {
  applicationFirstName: string | null | undefined;
  applicationLastName: string | null | undefined;
  employeeFirstName: string | null | undefined;
  employeeLastName: string | null | undefined;
};

type SharedContractNames = {
  firstNameTH: string;
  lastNameTH: string;
  firstNameEN: string;
  lastNameEN: string;
};

function selectSharedName(
  applicationName: string | null | undefined,
  employeeName: string | null | undefined,
): string {
  return applicationName?.trim() || employeeName?.trim() || "";
}

export function resolveSharedContractNames(
  input: SharedContractNameInput,
): SharedContractNames {
  const firstName = selectSharedName(
    input.applicationFirstName,
    input.employeeFirstName,
  );
  const lastName = selectSharedName(
    input.applicationLastName,
    input.employeeLastName,
  );

  return {
    firstNameTH: firstName,
    lastNameTH: lastName,
    firstNameEN: firstName,
    lastNameEN: lastName,
  };
}
