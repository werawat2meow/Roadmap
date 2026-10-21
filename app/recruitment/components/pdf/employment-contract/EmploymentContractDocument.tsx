import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  createEmployerIntroductionParts,
  createEmploymentContractTemplateVariables,
  employment119DaysSections,
  resolveContractSections,
  type ContractTextPart,
} from "@/app/recruitment/lib/contracts";

import { ContractFooter } from "./ContractFooter";
import { ContractHeader } from "./ContractHeader";
import { ContractParagraph } from "./ContractParagraph";
import { ContractSection } from "./ContractSection";
import { registerEmploymentContractFonts } from "./fonts";
import { styles } from "./styles";
import {
  CONTRACT_PDF_CONFIG,
  DEFAULT_EMPLOYER_SIGNATURE_TYPE,
  type EmploymentContractDocumentProps,
} from "./types";

registerEmploymentContractFonts();

const CONTRACT_TIME_ZONE = "Asia/Bangkok";

function getExportContractDate(date: Date): {
  th: string;
  en: string;
} {
  return {
    th: new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: CONTRACT_TIME_ZONE,
    }).format(date),
    en: new Intl.DateTimeFormat("en-US-u-ca-gregory", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: CONTRACT_TIME_ZONE,
    }).format(date),
  };
}

function staticPart(text: string, bold = false): ContractTextPart {
  return { text, bold };
}

function dynamicPart(text: string): ContractTextPart {
  return { text, dynamic: true, bold: true };
}

export function EmploymentContractDocument({
  data,
  config,
  logoDataUri,
  employerSignatureType = DEFAULT_EMPLOYER_SIGNATURE_TYPE,
}: EmploymentContractDocumentProps) {
  
  const resolvedConfig = { ...CONTRACT_PDF_CONFIG, ...config };
  const exportContractDate = getExportContractDate(new Date());
  const variables = createEmploymentContractTemplateVariables(data);
  const sections = resolveContractSections(
    employment119DaysSections,
    variables,
  );
  const employerIntroduction = createEmployerIntroductionParts(variables);
  const employeeIntroductionTH: ContractTextPart[] = [
    staticPart("กับ "),
    dynamicPart(variables.employeeNameTH),
    staticPart(" ที่อยู่ "),
    dynamicPart(variables.employeeAddressTH),
    staticPart(" ซึ่งต่อไปในสัญญาฉบับนี้เรียกว่า “ลูกจ้าง” อีกฝ่ายหนึ่ง"),
  ];
  const employeeIntroductionEN: ContractTextPart[] = [
    staticPart("And "),
    dynamicPart(variables.employeeNameTH),
    staticPart(", residing at "),
    dynamicPart(variables.employeeAddressEN),
    staticPart(", hereinafter referred to as the “Employee”, of the other part."),
  ];

  return (
    <Document
      title={`Employment Contract ${variables.contractNo}`}
      author={data.company.nameEN ?? data.company.nameTH}
      subject="Employment Contract"
      creator="Recruitment System"
    >
      <Page
        size="A4"
        wrap
        style={[
          styles.page,
          resolvedConfig.showSignatureOnEveryPage
            ? {}
            : styles.pageWithoutFixedFooter,
        ]}
      >
        <ContractHeader
          company={data.company}
          logoDataUri={logoDataUri ?? null}
        />

        {resolvedConfig.showSignatureOnEveryPage ? (
          <ContractFooter
            fixed
            employer={data.employer}
            employee={data.employee}
            employerSignatureType={employerSignatureType}
          />
        ) : null}

        <View style={styles.contractNumber} minPresenceAhead={38}>
          <Text style={styles.contractNumberLabel}>สัญญาจ้างเลขที่ </Text>
          <Text
            style={
              resolvedConfig.highlightDynamicText
                ? styles.contractNumberValue
                : styles.dynamicWithoutHighlight
            }
          >
            {variables.contractNo}
          </Text>
        </View>

        <View wrap={false} style={styles.titleBlock}>
          <Text style={styles.titleTH}>สัญญาจ้าง</Text>
          <Text style={styles.titleEN}>Employment Contract</Text>
        </View>

        <View style={styles.introduction} minPresenceAhead={52}>
          <ContractParagraph
            language="th"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={[
              staticPart("สัญญาฉบับนี้ทำขึ้น ณ เมื่อวันที่ "),
              dynamicPart(exportContractDate.th),
            ]}
          />
          <ContractParagraph
            language="en"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={[
              staticPart("This contract was made on "),
              dynamicPart(exportContractDate.en),
            ]}
          />
        </View>

        <View style={styles.introduction} minPresenceAhead={58}>
          <ContractParagraph
            language="th"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={employerIntroduction.th}
          />
          <ContractParagraph
            language="en"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={employerIntroduction.en}
          />
        </View>

        <View style={styles.introduction} minPresenceAhead={58}>
          <ContractParagraph
            language="th"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={employeeIntroductionTH}
          />
          <ContractParagraph
            language="en"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={employeeIntroductionEN}
          />
        </View>

        <View style={styles.introduction} minPresenceAhead={42}>
          <ContractParagraph
            language="th"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={[
              staticPart("คู่สัญญาทั้งสองฝ่ายได้ตกลงทำสัญญา โดยมีสาระสำคัญดังต่อไปนี้:-"),
            ]}
          />
          <ContractParagraph
            language="en"
            highlightDynamicText={resolvedConfig.highlightDynamicText}
            parts={[
              staticPart(
                "Both parties agree to enter into this contract under the following terms:-",
              ),
            ]}
          />
        </View>

        {sections.map((section) => (
          <ContractSection
            key={section.no}
            section={section}
            highlightDynamicText={resolvedConfig.highlightDynamicText}
          />
        ))}

        {!resolvedConfig.showSignatureOnEveryPage ? (
          <ContractFooter
            employer={data.employer}
            employee={data.employee}
            employerSignatureType={employerSignatureType}
          />
        ) : null}
      </Page>
    </Document>
  );
}

export { fetchImageAsBuffer, fetchImageAsDataUri } from "./fetchImageAsBuffer";
export { CONTRACT_PDF_CONFIG } from "./types";
export type {
  ContractPdfConfig,
  EmploymentContractDocumentProps,
} from "./types";
