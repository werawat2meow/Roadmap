type CompanyLogoRow = {
  logo_path: string | null;
};

export function selectCompanyContractLogo(company: CompanyLogoRow): string | null {
  const logoPath = company.logo_path?.trim().replace(/^\/+/, "");

  if (!logoPath?.startsWith("logo/") || logoPath.includes("\\")) {
    return null;
  }

  const pathSegments = logoPath.split("/");
  if (pathSegments.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }

  return `/${logoPath}`;
}
