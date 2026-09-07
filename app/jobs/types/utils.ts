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
  return /^[A-Z]{2}\d{7}$/.test(passport.trim().toUpperCase());
}

/* -------------------------------------------------------------------------- */
/*                              Phone Validation                              */
/* -------------------------------------------------------------------------- */

export function validatePhone(phone: string): boolean {
  return /^(06|08|09)\d{8}$/.test(phone);
}

/* -------------------------------------------------------------------------- */
/*                              Email Validation                              */
/* -------------------------------------------------------------------------- */

export function validateEmail(
  email: string
): boolean {
  return /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(
    email
  );
}

/* -------------------------------------------------------------------------- */
/*                         Plain Text Validation                              */
/* -------------------------------------------------------------------------- */

export function validatePlainText(value: string): boolean {
  return /^[\p{L}\p{N}\s]*$/u.test(value);
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
    // NOTE: fixed from `0`. `0` is falsy in JS, so any `value.title ? x : y`
    // or `value.title || null` check elsewhere would silently treat a
    // genuinely selected title (if its id ever were 0) as "not selected".
    // `null` is the correct "nothing selected" sentinel, and matches the
    // `string | null` type in types.ts.
    title: null,
    firstName: "",
    lastName: "",
    nicknameTH: "",
    nicknameEN: "",
    dateOfBirth: "",
    age: null,
    // NOTE: fixed from "male". gender stores a gender option id (see
    // types.ts), not a "male"/"female" literal, so "male" was never a real
    // id — and being truthy, it silently prevented the "auto-select default
    // gender from the API" effect in PersonalInformation.tsx from ever
    // running (`if (value.gender) return;`). "" matches nationality/religion.
    gender: "",
    pregnancyAge: "",
    militaryStatus: "",
    height: null,
    weight: null,
    nationality: "",
    religion: "",
    idCardNo: "",
    addressNo: "",
    villageNo: "",
    street: "",
    provinceId: null,
    districtId: null,
    subDistrictId: null,
    province: "",
    district: "",
    subDistrict: "",
    postalCode: "",
    email:"",
    lineId: "",
    phoneNumber: "",
    residenceType: "",
    residenceOther: "",
    maritalStatus: "",
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
    graduatedYear: 0,
    gpa: 0,
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
    latestSalary: null,
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
    good: null,
    fair: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                        Default Language Skill                              */
/* -------------------------------------------------------------------------- */

export function createLanguageSkillRow(): LanguageSkill {
  return {
    id: generateId(),
    language: "",
    listening: 0,
    speaking: 0,
    reading: 0,
    writing: 0,
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
    from_social_media:"",
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

  const plainTextFields: Array<keyof PersonalInformationData> = [
    "otherPosition",
    "firstName",
    "lastName",
    "nicknameTH",
    "nicknameEN",
    "addressNo",
    "villageNo",
    "street",
    "lineId",
    "residenceOther",
    "underlyingDisease",
  ];

  for (const field of plainTextFields) {
    const value = payload.personal[field];
    if (typeof value === "string" && !validatePlainText(value)) {
      errors.push({
        field,
        message:
          locale === "TH"
            ? "กรุณากรอกข้อมูลโดยไม่ใช้อักขระพิเศษ"
            : "Please do not use special characters",
      });
    }
  }

  if (isEmpty(payload.personal.otherPosition)) {
    errors.push({
      field: "otherPosition",
      message: `${getUIText(uiText.otherPosition, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (payload.personal.expectedSalary == 0) {
    errors.push({
      field: "expectedSalary",
      message: `${getUIText(uiText.expectedSalary, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.title)) {
    errors.push({
      field: "title",
      message: `${getUIText(uiText.title, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.gender)) {
    errors.push({
      field: "gender",
      message: `${getUIText(uiText.gender, locale)} ${getUIText(uiText.requiredField, locale)}`,
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
  
  // if (isEmpty(payload.personal.subDistrict)) {
  //   errors.push({
  //     field: "subDistrict",
  //     message: `${getUIText(uiText.subDistrict, locale)} ${getUIText(uiText.requiredField, locale)}`,
  //   });
  // }

  // if (isEmpty(payload.personal.district)) {
  //   errors.push({
  //     field: "district",
  //     message: `${getUIText(uiText.district, locale)} ${getUIText(uiText.requiredField, locale)}`,
  //   });
  // }
  
  // if (isEmpty(payload.personal.province)) {
  //   errors.push({
  //     field: "province",
  //     message: `${getUIText(uiText.province, locale)} ${getUIText(uiText.requiredField, locale)}`,
  //   });
  // }  
  
  // if (isEmpty(payload.personal.postalCode)) {
  //   errors.push({
  //     field: "postalCode",
  //     message: `${getUIText(uiText.postalCode, locale)} ${getUIText(uiText.requiredField, locale)}`,
  //   });
  // }

  if (isEmpty(payload.personal.email)) {
    errors.push({
      field: "email",
      message: `${getUIText(uiText.email, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (isEmpty(payload.personal.phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: `${getUIText(uiText.phoneNumber, locale)} ${getUIText(uiText.requiredField, locale)}`,
    });
  }

  if (payload.personal.email && !validateEmail(payload.personal.email)) {
    errors.push({
      field: "email",
      message: `${getUIText(uiText.email, locale)} ${getUIText(uiText.invalidEmail, locale)}`,
    });
  }

  if (payload.personal.idCardNo) {
    const validIdentity =
      locale === "TH"
        ? /^\d{13}$/.test(payload.personal.idCardNo) &&
          validateThaiCitizenId(payload.personal.idCardNo)
        : validatePassport(payload.personal.idCardNo);

    if (!validIdentity) {
      errors.push({
        field: "idCardNo",
        message:
          locale === "TH"
            ? "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลักและถูกต้อง"
            : "Invalid passport number",
      });
    }
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

  if (
    payload.personal.emergencyContact.phone &&
    !validatePhone(payload.personal.emergencyContact.phone)
  ) {
    errors.push({
      field: "emergencyPhone",
      message: `${getUIText(uiText.emergencyPhone, locale)} ${getUIText(uiText.invalidPhone, locale)}`,
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


/* -------------------------------------------------------------------------- */
/*                    Merge Initial Data With Default Rows                    */
/* -------------------------------------------------------------------------- */
// ใช้ตอน prefill ฟอร์มจากข้อมูลที่มีอยู่แล้ว (จาก API)
// ทุกฟังก์ชันจะ fallback เป็นค่า default เดิมถ้าไม่มีข้อมูลส่งมา
// เพื่อรองรับกรณี API ยังส่งข้อมูลมาไม่ครบทุก field ในตอนนี้

export function mergePersonalInformation(
  data?: Partial<PersonalInformationData> | null
): PersonalInformationData {
  const base = createPersonalInformation();

  if (!data) return base;

  return {
    ...base,
    ...data,
    driverLicense: {
      ...base.driverLicense,
      ...(data.driverLicense ?? {}),
    },
    emergencyContact: {
      ...base.emergencyContact,
      ...(data.emergencyContact ?? {}),
    },
  };
}

export function mergeEducationRows(
  data?: Partial<EducationHistory>[] | null
): EducationHistory[] {
  if (!data || data.length === 0) {
    return [createEducationRow()];
  }

  return data.map((row) => ({
    ...createEducationRow(),
    ...row,
    id: row.id ?? generateId(),
  }));
}

export function mergeWorkExperienceRows(
  data?: Partial<WorkExperience>[] | null
): WorkExperience[] {
  if (!data || data.length === 0) {
    return [createWorkRow()];
  }

  return data.map((row) => ({
    ...createWorkRow(),
    ...row,
    id: row.id ?? generateId(),
  }));
}

export function mergeComputerSkillRows(
  data?: Partial<ComputerSkill>[] | null
): ComputerSkill[] {
  if (!data || data.length === 0) {
    return [createComputerSkillRow()];
  }

  return data.map((row) => ({
    ...createComputerSkillRow(),
    ...row,
    id: row.id ?? generateId(),
  }));
}

export function mergeLanguageSkillRows(
  data?: Partial<LanguageSkill>[] | null
): LanguageSkill[] {
  if (!data || data.length === 0) {
    return [createLanguageSkillRow()];
  }

  return data.map((row) => ({
    ...createLanguageSkillRow(),
    ...row,
    id: row.id ?? generateId(),
  }));
}

export function mergeDocuments(
  data?: Partial<ApplicationDocument>[] | null
): ApplicationDocument[] {
  const defaults = createDefaultDocuments();

  if (!data || data.length === 0) {
    return defaults;
  }

  const byType = new Map<string, Partial<ApplicationDocument>>();
  const others: Partial<ApplicationDocument>[] = [];

  data.forEach((doc) => {
    if (doc.type && doc.type !== "other") {
      byType.set(doc.type, doc);
    } else {
      others.push(doc);
    }
  });

  const merged = defaults.map((def) => {
    const found = byType.get(def.type);

    if (!found) return def;

    // กรอง key ที่เป็น undefined ออกก่อน ไม่ให้ไปทับค่า default โดยไม่ตั้งใจ
    const cleaned = Object.fromEntries(
      Object.entries(found).filter(([, v]) => v !== undefined)
    ) as Partial<ApplicationDocument>;

    return {
      ...def,
      ...cleaned,
      file: null, // ไฟล์จริงต้องอัปโหลดใหม่เสมอ ใช้ fileName/filePath/fileUrl แสดงว่ามีอยู่แล้ว
    };
  });

  others.forEach((doc) => {
    merged.push({
      id: doc.id ?? generateId(),
      type: "other",
      title: doc.title ?? "",
      file: null,
      fileName: doc.fileName,
      filePath: doc.filePath,
    });
  });

  return merged;
}

export function mergeAgreement(
  data?: Partial<Agreement> | null
): Agreement {
  return {
    ...createAgreement(),
    ...(data ?? {}),
  };
}

/* -------------------------------------------------------------------------- */
/*              Map API (snake_case) Documents → Form Shape                   */
/* -------------------------------------------------------------------------- */
// แปลง document rows จาก API (document_type, file_name, file_path, file_url)
// เป็น Partial<ApplicationDocument> (camelCase) ก่อนส่งเข้า mergeDocuments

export function mapApiDocuments(
  apiDocs?: Record<string, any>[] | null
): Partial<ApplicationDocument>[] {
  if (!apiDocs || apiDocs.length === 0) return [];

  return apiDocs.map((doc) => ({
    id: doc.id ?? generateId(),
    type: (doc.document_type ?? "other") as ApplicationDocument["type"],
    title: doc.title ?? "",
    fileName: doc.file_name ?? undefined,
    filePath: doc.file_path ?? undefined,
  }));
}