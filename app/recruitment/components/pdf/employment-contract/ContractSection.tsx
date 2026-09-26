import { Fragment } from "react";
import { Text, View } from "@react-pdf/renderer";

import type { ContractSection as ContractSectionData } from "@/app/recruitment/lib/contracts";

import { ContractParagraph } from "./ContractParagraph";
import { styles } from "./styles";

interface ContractSectionProps {
  section: ContractSectionData;
  highlightDynamicText: boolean;
  depth?: number;
}

const KEEP_PARAGRAPH_PAIR_TOGETHER_CHARACTER_LIMIT = 1_600;

function getPartsLength(parts: ContractSectionData["th"]): number {
  return parts.reduce((total, part) => total + part.text.length, 0);
}

function formatSectionNumber(sectionNumber: string): string {
  const normalized = sectionNumber.trim();

  if (!normalized || normalized === "-" || normalized.endsWith(".")) {
    return normalized;
  }

  return `${normalized}.`;
}

export function ContractSection({
  section,
  highlightDynamicText,
  depth = 0,
}: ContractSectionProps) {
  const isClosingStatement = section.no.trim().length === 0;
  const isBulletSection = depth > 0 && section.no === "-";
  const paragraphPairLength =
    getPartsLength(section.th) + getPartsLength(section.en ?? []);
  const keepParagraphPairTogether =
    isBulletSection ||
    paragraphPairLength <= KEEP_PARAGRAPH_PAIR_TOGETHER_CHARACTER_LIMIT;
  const hasChildren = Boolean(section.children?.length);
  const sectionStyle = [
    styles.section,
    depth > 0 ? styles.childSection : {},
    depth > 0 ? { marginLeft: 34 * depth } : {},
  ];

  if (isClosingStatement) {
    return (
      <View wrap={false} style={styles.closingSection}>
        <ContractParagraph
          parts={section.th}
          language="th"
          variant="closing"
          highlightDynamicText={highlightDynamicText}
        />
        {section.en && section.en.length > 0 ? (
          <ContractParagraph
            parts={section.en}
            language="en"
            variant="closing"
            highlightDynamicText={highlightDynamicText}
          />
        ) : null}
      </View>
    );
  }

  const sectionRow = (
    <View
      wrap={!keepParagraphPairTogether}
      style={styles.sectionRow}
    >
      <Text style={styles.sectionNumber}>
        {formatSectionNumber(section.no)}
      </Text>
      <View style={styles.sectionContent}>
        <ContractParagraph
          parts={section.th}
          language="th"
          minPresenceAhead={0}
          highlightDynamicText={highlightDynamicText}
        />
        {section.en && section.en.length > 0 ? (
          <ContractParagraph
            parts={section.en}
            language="en"
            minPresenceAhead={0}
            highlightDynamicText={highlightDynamicText}
          />
        ) : null}
      </View>
    </View>
  );

  if (hasChildren) {
    return (
      <Fragment>
        <View
          wrap={false}
          style={sectionStyle}
          minPresenceAhead={60}
        >
          {sectionRow}
        </View>

        {section.children?.map((child, index) => (
          <ContractSection
            key={`${child.no}-${index}`}
            section={child}
            highlightDynamicText={highlightDynamicText}
            depth={depth + 1}
          />
        ))}
      </Fragment>
    );
  }

  return (
    <View
      wrap
      style={sectionStyle}
      minPresenceAhead={depth === 0 ? 20 : 12}
    >
      {sectionRow}
    </View>
  );
}
