import { Text, View } from "@react-pdf/renderer";

import type { ContractTextPart } from "@/app/recruitment/lib/contracts";

import { styles } from "./styles";

interface ContractParagraphProps {
  parts: ContractTextPart[];
  language: "th" | "en";
  highlightDynamicText: boolean;
  minPresenceAhead?: number;
  variant?: "default" | "closing";
}

export function ContractParagraph({
  parts,
  language,
  highlightDynamicText,
  minPresenceAhead = 20,
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

          return (
            <Text key={`${part.variable ?? "text"}-${index}`} style={partStyles}>
              {part.text}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}
