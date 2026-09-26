import { StyleSheet } from "@react-pdf/renderer";

import { CONTRACT_FONT_FAMILY } from "./fonts";

export const CONTRACT_COLORS = {
  black: "#111111",
  english: "#999999",
  dynamic: "#0000CC",
  muted: "#555555",
} as const;

export const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: CONTRACT_COLORS.black,
    fontFamily: CONTRACT_FONT_FAMILY,
    fontSize: 9.5,
    lineHeight: 1.24,
    paddingTop: 118,
    paddingRight: 52,
    paddingBottom: 104,
    paddingLeft: 52,
  },
  pageWithoutFixedFooter: {
    paddingBottom: 48,
  },
  header: {
    position: "absolute",
    top: 26,
    right: 52,
    left: 52,
    height: 86,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerLogoColumn: {
    width: 104,
    height: 86,
    alignItems: "center",
    justifyContent: "flex-start",
    marginRight: 14,
  },
  headerLogo: {
    width: 96,
    height: 86,
    objectFit: "contain",
  },
  headerCompany: {
    flexGrow: 1,
    paddingTop: 0,
  },
  companyNameEN: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.14,
    marginBottom: 4,
  },
  companyNameTH: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.16,
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 9.5,
    lineHeight: 1.22,
    marginBottom: 2,
  },
  contractNumber: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  contractNumberLabel: {
    fontSize: 9.5,
  },
  contractNumberValue: {
    color: CONTRACT_COLORS.dynamic,
    fontSize: 9.5,
    fontWeight: 600,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 15,
  },
  titleTH: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.16,
  },
  titleEN: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.16,
  },
  introduction: {
    marginBottom: 7,
  },
  paragraphGroup: {
    width: "100%",
    marginBottom: 3.5,
  },
  paragraphTH: {
    color: CONTRACT_COLORS.black,
    fontSize: 9.5,
    fontWeight: 500,
    lineHeight: 1.34,
  },
  paragraphEN: {
    color: CONTRACT_COLORS.english,
    fontSize: 8.6,
    fontWeight: 400,
    lineHeight: 1.23,
  },
  thaiBreakOpportunity: {
    fontSize: 0.01,
    lineHeight: 0.01,
  },
  dynamic: {
    color: CONTRACT_COLORS.dynamic,
    fontWeight: 700,
  },
  dynamicWithoutHighlight: {
    color: CONTRACT_COLORS.black,
    fontWeight: 700,
  },
  bold: {
    fontWeight: 700,
  },
  section: {
    width: "100%",
    marginBottom: 5,
  },
  sectionRow: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionNumber: {
    width: 34,
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: 7,
    fontSize: 9.5,
    lineHeight: 1.34,
  },
  sectionContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  childSection: {
    width: "auto",
    marginTop: 3,
  },
  closingSection: {
    width: "100%",
    marginTop: 16,
    marginBottom: 5,
  },
  closingParagraphGroup: {
    marginBottom: 3,
  },
  closingParagraphText: {
    color: CONTRACT_COLORS.black,
    fontSize: 9.5,
    fontWeight: 400,
  },
  closingParagraphTH: {
    lineHeight: 1.34,
  },
  closingParagraphEN: {
    lineHeight: 1.23,
  },
  footerFixed: {
    position: "absolute",
    right: 52,
    bottom: 24,
    left: 52,
    height: 72,
  },
  footerFlow: {
    marginTop: 26,
    height: 78,
  },
  signatureRow: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  signatureColumn: {
    width: "46%",
    alignItems: "center",
  },
  signatureLine: {
    fontSize: 8.8,
    lineHeight: 1.18,
  },
  signatureName: {
    fontSize: 8.6,
    lineHeight: 1.18,
  },
  signaturePosition: {
    fontSize: 8.3,
    lineHeight: 1.18,
  },
});
