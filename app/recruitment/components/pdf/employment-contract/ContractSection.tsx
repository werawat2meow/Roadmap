import { Text, View } from "@react-pdf/renderer";

import type { ContractSection as ContractSectionData } from "@/app/recruitment/lib/contracts";

import { ContractParagraph } from "./ContractParagraph";
import { styles } from "./styles";

interface ContractSectionProps {
  section: ContractSectionData;
  highlightDynamicText: boolean;
  depth?: number;
}

export function ContractSection({
  section,
  highlightDynamicText,
  depth = 0,
}: ContractSectionProps) {
  const isClosingStatement = section.no.trim().length === 0;
  const isBulletSection = depth > 0 && section.no === "-";

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

  return (
    <View
      wrap={!isBulletSection}
      style={[styles.section, depth > 0 ? styles.childSection : {}]}
      minPresenceAhead={depth === 0 ? 38 : 26}
    >
      <View style={styles.sectionRow}>
        <Text style={styles.sectionNumber}>{section.no}</Text>
        <View style={styles.sectionContent}>
          <ContractParagraph
            parts={section.th}
            language="th"
            highlightDynamicText={highlightDynamicText}
          />
          {section.en && section.en.length > 0 ? (
            <ContractParagraph
              parts={section.en}
              language="en"
              highlightDynamicText={highlightDynamicText}
            />
          ) : null}

          {section.children?.map((child, index) => (
            <ContractSection
              key={`${child.no}-${index}`}
              section={child}
              highlightDynamicText={highlightDynamicText}
              depth={depth + 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
