import { Text, View } from "@react-pdf/renderer";

import type { ContractTextPart } from "@/app/recruitment/lib/contracts";

import { segmentThaiTextForLineBreaks } from "./fonts";
import { styles } from "./styles";

interface ContractParagraphProps {
  parts: ContractTextPart[];
  language: "th" | "en";
  highlightDynamicText: boolean;
  minPresenceAhead?: number;
  variant?: "default" | "closing";
}

const CLOSING_PARAGRAPH_FIRST_LINE_INDENT = "\u00A0".repeat(18);

export function ContractParagraph({
  parts,
  language,
  highlightDynamicText,
  minPresenceAhead = 8,
  variant = "default",
}: ContractParagraphProps) {
  if (parts.length === 0) return null;

  return (
    <View
      style={[
        styles.paragraphGroup,
        variant === "closing" ? styles.closingParagraphGroup : {},
      ]}
      minPresenceAhead={minPresenceAhead}
    >
      <Text
        style={[
          language === "th" ? styles.paragraphTH : styles.paragraphEN,
          variant === "closing" ? styles.closingParagraphText : {},
          variant === "closing" && language === "th"
            ? styles.closingParagraphTH
            : {},
          variant === "closing" && language === "en"
            ? styles.closingParagraphEN
            : {},
        ]}
      >
        {variant === "closing"
          ? CLOSING_PARAGRAPH_FIRST_LINE_INDENT
          : null}
        {parts.map((part, index) => {
          const partStyles = [];

          if (part.bold) partStyles.push(styles.bold);
          if (part.dynamic) {
            partStyles.push(
              highlightDynamicText
                ? styles.dynamic
                : styles.dynamicWithoutHighlight,
            );
          }

          const segments =
            language === "th"
              ? segmentThaiTextForLineBreaks(part.text)
              : [{ text: part.text, breakBefore: false }];

          return segments.map((segment, segmentIndex) => (
            <Text
              key={`${part.variable ?? "text"}-${index}-${segmentIndex}`}
              style={partStyles}
            >
              {segment.breakBefore ? (
                <Text style={styles.thaiBreakOpportunity}> </Text>
              ) : null}
              {segment.text}
            </Text>
          ));
        })}
      </Text>
    </View>
  );
}
