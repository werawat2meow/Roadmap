import type {
  ContractTemplateVariables,
  ContractTextPart,
} from "./types";

type EmployerIntroductionVariables = Pick<
  ContractTemplateVariables,
  | "companyNameTH"
  | "companyNameEN"
  | "companyAddressTH"
  | "companyAddressEN"
  | "employerNameTH"
  | "employerPositionTH"
>;

function staticPart(text: string): ContractTextPart {
  return { text, dynamic: false, bold: false };
}

function dynamicPart(text: string): ContractTextPart {
  return { text, dynamic: true, bold: true };
}

export function createEmployerIntroductionParts(
  variables: EmployerIntroductionVariables,
): { th: ContractTextPart[]; en: ContractTextPart[] } {
  return {
    th: [
      staticPart("ระหว่าง "),
      dynamicPart(variables.companyNameTH),
      staticPart(" โดยมี "),
      dynamicPart(variables.employerNameTH),
      staticPart(" ตำแหน่ง "),
      dynamicPart(variables.employerPositionTH),
      staticPart(" ที่อยู่ "),
      dynamicPart(variables.companyAddressTH),
      staticPart(" ซึ่งต่อไปในสัญญาฉบับนี้เรียกว่า “นายจ้าง” ฝ่ายหนึ่ง"),
    ],
    en: [
      staticPart("Between "),
      dynamicPart(variables.companyNameEN),
      staticPart(", represented by "),
      dynamicPart(variables.employerNameTH),
      staticPart(", position of "),
      dynamicPart(variables.employerPositionTH),
      staticPart(", located at "),
      dynamicPart(variables.companyAddressEN),
      staticPart(", hereinafter referred to as the “Employer”, of the one part."),
    ],
  };
}
