import { Text, View } from "@react-pdf/renderer";

import { styles } from "./styles";
import {
  EMPLOYER_SIGNATURE_TYPE_LABELS,
  type ContractFooterProps,
} from "./types";

function joinName(parts: Array<string | null>): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(" ");
}

export function ContractFooter({
  employer,
  employee,
  employerSignatureType,
  fixed = false,
}: ContractFooterProps) {
  const employerSignatureLabel =
    EMPLOYER_SIGNATURE_TYPE_LABELS[employerSignatureType];
  // positionTH is populated exclusively from positions.position_name.
  const employerPositionName = employer.positionTH;
  // positionTH is populated from recruit_job_applications.position_id
  // joined to positions.position_name.
  const employeePositionName = employee.positionTH;
  const employeeNameTH = joinName([
    employee.prefixTH,
    employee.firstNameTH,
    employee.lastNameTH,
  ]);
  const hasEmployeeNameEN = Boolean(
    employee.firstNameEN?.trim() || employee.lastNameEN?.trim(),
  );
  const employeeNameEN = hasEmployeeNameEN
    ? joinName([
        employee.prefixEN,
        employee.firstNameEN,
        employee.lastNameEN,
      ])
    : "";

  return (
    <View
      fixed={fixed}
      wrap={false}
      style={fixed ? styles.footerFixed : styles.footerFlow}
    >
      <View style={styles.signatureRow}>
        <View style={styles.signatureColumn}>
          <Text style={styles.signatureLine}>ลงชื่อ............................................</Text>
          <Text style={styles.signatureLine}>{employerSignatureLabel}</Text>
          <Text style={styles.signatureName}>({employer.nameTH})</Text>
          {employer.nameEN ? (
            <Text style={styles.signatureName}>({employer.nameEN})</Text>
          ) : null}
          {employerPositionName ? (
            <Text style={styles.signaturePosition}>
              {employerPositionName}
            </Text>
          ) : null}
        </View>

        <View style={styles.signatureColumn}>
          <Text style={styles.signatureLine}>ลงชื่อ............................................</Text>
          <Text style={styles.signatureLine}>ลูกจ้าง</Text>
          <Text style={styles.signatureName}>({employeeNameTH})</Text>
          {employeeNameEN ? (
            <Text style={styles.signatureName}>({employeeNameEN})</Text>
          ) : null}
          {employeePositionName ? (
            <Text style={styles.signaturePosition}>
              {employeePositionName}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
