// app/jobs/register/[jobId]/utils.ts

import dayjs, { Dayjs } from "dayjs";
import {
  Agreement,
  ApplicationDocument,
  ComputerSkill,
  EducationHistory,
  JobApplicationPayload,
  LanguageSkill,
  PersonalInformationData,
  WorkExperience,
} from "./types";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

/* -------------------------------------------------------------------------- */
/*                               Generate UUID                                */
/* -------------------------------------------------------------------------- */

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

/* -------------------------------------------------------------------------- */
/*                              Calculate Age                                 */
/* -------------------------------------------------------------------------- */

export function calculateAge(
  birthday: string | Dayjs | null
): number | null {
  if (!birthday) return null;

  const birth =
    typeof birthday === "string"
      ? dayjs(birthday)
      : birthday;

  if (!birth.isValid()) return null;

  return dayjs().diff(birth, "year");
}

/* -------------------------------------------------------------------------- */
/*                          Thai Citizen Validation                           */
/* -------------------------------------------------------------------------- */

export function validateThaiCitizenId(
  citizenId: string
): boolean {
  if (!/^\d{13}$/.test(citizenId)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += Number(citizenId.charAt(i)) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;

  return checkDigit === Number(citizenId.charAt(12));
}

/* -------------------------------------------------------------------------- */
/*                           Passport Validation                              */
/* -------------------------------------------------------------------------- */

export function validatePassport(
  passport: string
): boolean {
  return /^[A-Za-z0-9]{6,15}$/.test(passport.trim());
}

/* -------------------------------------------------------------------------- */
/*                              Phone Validation                              */
/* -------------------------------------------------------------------------- */

export function validatePhone(
  phone: string
): boolean {
  return /^[0-9+\-\s]{8,20}$/.test(phone.trim());
}

/* -------------------------------------------------------------------------- */
/*                              Email Validation                              */
/* -------------------------------------------------------------------------- */

export function validateEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* -------------------------------------------------------------------------- */
/*                            Number Validation                               */
/* -------------------------------------------------------------------------- */

export function isNumeric(value: string): boolean {
  return /^[0-9]+(\.[0-9]+)?$/.test(value);
}

/* -------------------------------------------------------------------------- */
/*                               Empty String                                 */
/* -------------------------------------------------------------------------- */

export function isEmpty(value?: string | null) {
  return !value || value.trim() === "";
}

/* -------------------------------------------------------------------------- */
/*                             Default Personal                               */
/* -------------------------------------------------------------------------- */

export function createPersonalInformation(): PersonalInformationData {
  return {
    otherPosition: "",
    expectedSalary: null,
    firstName: "",
    lastName: "",
    nicknameTH: "",
    nicknameEN: "",
    dateOfBirth: "",
    age: null,
    gender: "male",
    pregnancyAge: "",
    militaryStatus: "",
    height: "",
    weight: "",
    nationality: "",
    religion: "",
    idCardNo: "",
    addressNo: "",
    villageNo: "",
    street: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    lineId: "",
    phoneNumber: "",
    residenceType: [],
    residenceOther: "",
    maritalStatus: [],
    children: "",
    driverLicense: {
      car: false,
      motorcycle: false,
      other: false,
      otherText: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    underlyingDisease: "",
    criminalRecord: null,
    dishonestyRecord: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                          Default Education Row                             */
/* -------------------------------------------------------------------------- */

export function createEducationRow(): EducationHistory {
  return {
    id: generateId(),
    degreeLevel: "",
    institution: "",
    faculty: "",
    major: "",
    graduatedYear: "",
    gpa: "",
  };
}

/* -------------------------------------------------------------------------- */
/*                            Default Work Row                                */
/* -------------------------------------------------------------------------- */

export function createWorkRow(): WorkExperience {
  return {
    id: generateId(),
    period: "",
    companyName: "",
    position: "",
    latestSalary: "",
    reasonForLeaving: "",
  };
}

/* -------------------------------------------------------------------------- */
/*                        Default Computer Skill                              */
/* -------------------------------------------------------------------------- */

export function createComputerSkillRow(): ComputerSkill {
  return {
    id: generateId(),
    system_program: "",
    good: "",
    fair: "",
  };
}

/* -------------------------------------------------------------------------- */
/*                        Default Language Skill                              */
/* -------------------------------------------------------------------------- */

export function createLanguageSkillRow(): LanguageSkill {
  return {
    id: generateId(),
    language: "",
    listening: "",
    speaking: "",
    reading: "",
    writing: "",
  };
}

/* -------------------------------------------------------------------------- */
/*                         Default Document List                              */
/* -------------------------------------------------------------------------- */

export function createDefaultDocuments(): ApplicationDocument[] {
  return [
    {
      id: generateId(),
      type: "photo",
      title: "1-inch frontal photograph",
      file: null,
    },
    {
      id: generateId(),
      type: "house_registration",
      title: "House Registration",
      file: null,
    },
    {
      id: generateId(),
      type: "id_card",
      title: "National ID Card",
      file: null,
    },
    {
      id: generateId(),
      type: "education",
      title: "Educational Certificate",
      file: null,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*                       Add Other Document Row                               */
/* -------------------------------------------------------------------------- */

export function createOtherDocument(): ApplicationDocument {
  return {
    id: generateId(),
    type: "other",
    title: "",
    file: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                           Default Agreement                                */
/* -------------------------------------------------------------------------- */

export function createAgreement(): Agreement {
  return {
    certify: false,
    pdpa: false,
  };
}

/* -------------------------------------------------------------------------- */
/*                         Validate Submit Data                               */
/* -------------------------------------------------------------------------- */

export interface ValidationError {
  field: string;
  message: string;
}

export function validateApplication(
  payload: JobApplicationPayload,
  locale: string = "EN"
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isEmpty(payload.personal.otherPosition)) {
    errors.push({
      field: "otherPosition",
      message: `${getUIText(uiText.otherPosition, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.expectedSalary)) {
    errors.push({
      field: "expectedSalary",
      message: `${getUIText(uiText.expectedSalary, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.firstName)) {
    errors.push({
      field: "firstName",
      message: `${getUIText(uiText.firstName, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.lastName)) {
    errors.push({
      field: "lastName",
      message: `${getUIText(uiText.lastName, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.dateOfBirth)) {
    errors.push({
      field: "dateOfBirth",
      message: `${getUIText(uiText.dateOfBirth, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.idCardNo)) {
    errors.push({
      field: "idCardNo",
      message: `${getUIText(uiText.idCardNo, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.addressNo)) {
    errors.push({
      field: "addressNo",
      message: `${getUIText(uiText.addressNo, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }
  
  if (isEmpty(payload.personal.subDistrict)) {
    errors.push({
      field: "subDistrict",
      message: `${getUIText(uiText.subDistrict, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.district)) {
    errors.push({
      field: "district",
      message: `${getUIText(uiText.district, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }
  
  if (isEmpty(payload.personal.province)) {
    errors.push({
      field: "province",
      message: `${getUIText(uiText.province, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }  
  
  if (isEmpty(payload.personal.postalCode)) {
    errors.push({
      field: "postalCode",
      message: `${getUIText(uiText.postalCode, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }
    
  if (payload.personal.residenceType.length == 0) {
    errors.push({
      field: "residenceType",
      message: `${getUIText(uiText.residenceType, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (payload.personal.maritalStatus.length == 0) {
    errors.push({
      field: "maritalStatus",
      message: `${getUIText(uiText.maritalStatus, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }
  
  const license = payload.personal.driverLicense;

  if (
    !license.car &&
    !license.motorcycle &&
    !license.other
  ) {
    errors.push({
      field: "driverLicense",
      message: `${getUIText(uiText.driverLicense, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.emergencyContact.name)) {
    errors.push({
      field: "emergencyContactName",
      message: `${getUIText(uiText.emergencyContactName, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.emergencyContact.phone)) {
    errors.push({
      field: "emergencyPhone",
      message: `${getUIText(uiText.emergencyPhone, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.emergencyContact.relationship)) {
    errors.push({
      field: "emergencyRelationship",
      message: `${getUIText(uiText.emergencyRelationship, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (payload.personal.criminalRecord == null) {
    errors.push({
      field: "criminalRecord",
      message: `${getUIText(uiText.criminalRecord, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (payload.personal.dishonestyRecord == null) {
    errors.push({
      field: "dishonestyRecord",
      message: `${getUIText(uiText.dishonestyRecord, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }
    

  if (isEmpty(payload.personal.phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: `${getUIText(uiText.phoneNumber, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (
    payload.personal.phoneNumber &&
    !validatePhone(payload.personal.phoneNumber)
  ) {
    errors.push({
      field: "phoneNumber",
      message: `${getUIText(uiText.phoneNumber, locale)} ${getUIText(uiText.invalidPhone, locale)}`,
    });
  }

  if (!payload.agreement.certify) {
    errors.push({
      field: "certify",
      message: `${getUIText(uiText.mustAcceptTerms, locale)}`,
    });
  }

  if (!payload.agreement.pdpa) {
    errors.push({
      field: "pdpa",
      message: `${getUIText(uiText.mustAcceptTerms, locale)}`,
    });
  }

  return errors;
}