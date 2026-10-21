import { Image, Text, View } from "@react-pdf/renderer";

import { preserveFinalThaiPdfGlyph } from "./fonts";
import { styles } from "./styles";
import type { ContractHeaderProps } from "./types";

export function ContractHeader({ company, logoDataUri }: ContractHeaderProps) {
  const logoSource = logoDataUri?.trim() || null;

  return (
    <View fixed style={styles.header}>
      <View style={styles.headerLogoColumn}>
        {/* react-pdf Image has no HTML alt prop in its public type. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {logoSource ? <Image src={logoSource} style={styles.headerLogo} /> : null}
      </View>

      <View style={styles.headerCompany}>
        {company.nameEN ? (
          <Text style={styles.companyNameEN}>{company.nameEN}</Text>
        ) : null}
        <Text style={styles.companyNameTH}>
          {preserveFinalThaiPdfGlyph(company.nameTH)}
        </Text>
        {company.addressEN ? (
          <Text style={styles.companyAddress}>{company.addressEN}</Text>
        ) : null}
        <Text style={styles.companyAddress}>{company.addressTH}</Text>
      </View>
    </View>
  );
}
