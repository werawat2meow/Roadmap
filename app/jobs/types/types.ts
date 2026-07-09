// types.ts

import type { FormInstance } from "antd";

export type LanguageCode = "TH" | "EN";

/* -------------------------------------------------------------------------- */
/*                                 Position                                   */
/* -------------------------------------------------------------------------- */

export interface PositionInfo {
  jobId: string;
  positionId: string;
  positionName: string;
  department?: string;
  companyName?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Personal                                  */
/* -------------------------------------------------------------------------- */

export type Gender = "male" | "female" | "other";

export type ResidenceType =
  | "own_house"
  | "rented_house"
  | "condominium"
  | "dormitory"
  | "relative_house"
  | "other";

export type MaritalStatus =
  | "single"
  | "married"
  | "divorced"
  | "widowed";

export type MilitaryStatus =
  | "not_served"
  | "completed"
  | "exempted";

export interface DriverLicense {
  car: boolean;
  motorcycle: boolean;
  other: boolean;
  otherText: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface PersonalInformationData  {
  otherPosition: string;
  expectedSalary: number;
  firstName: string;
  lastName: string;
  nicknameTH: string;
  nicknameEN: string;
  dateOfBirth: string;
  age: number | null;
  gender: Gender;
  pregnancyAge: string;
  militaryStatus: MilitaryStatus | "";
  height: string;
  weight: string;
  nationality: string;
  religion: string;
  idCardNo: string;
  addressNo: string;
  villageNo: string;
  street: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  lineId: string;
  phoneNumber: string;
  residenceType: ResidenceType[];
  residenceOther: string;
  maritalStatus: MaritalStatus[];
  children: string;
  driverLicense: DriverLicense;
  emergencyContact: EmergencyContact;
  underlyingDisease: string;
  criminalRecord: boolean | null;
  dishonestyRecord: boolean | null;
}

/* -------------------------------------------------------------------------- */
/*                                 Education                                  */
/* -------------------------------------------------------------------------- */

export interface EducationHistory {
  id: string;
  degreeLevel: string;
  institution: string;
  faculty: string;
  major: string;
  graduatedYear: string;
  gpa: string;
}

/* -------------------------------------------------------------------------- */
/*                              Work Experience                               */
/* -------------------------------------------------------------------------- */

export interface WorkExperience {
  id: string;
  period: string;
  companyName: string;
  position: string;
  latestSalary: string;
  reasonForLeaving: string;
}

/* -------------------------------------------------------------------------- */
/*                              Computer Skill                                */
/* -------------------------------------------------------------------------- */

export interface ComputerSkill {
  id: string;
  system_program: string;
  good: number | null;
  fair: number | null;
}

/* -------------------------------------------------------------------------- */
/*                               Language Skill                               */
/* -------------------------------------------------------------------------- */

export interface LanguageSkill {
  id: string;
  language: string;
  listening: number | null;
  speaking: number | null;
  reading: number | null;
  writing: number | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Document                                  */
/* -------------------------------------------------------------------------- */

export type DocumentType =
  | "photo"
  | "house_registration"
  | "id_card"
  | "education"
  | "other";

export interface ApplicationDocument {
  id: string;
  type: DocumentType;
  title: string;
  file?: File | null;
  fileName?: string;
  filePath?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Agreement                                  */
/* -------------------------------------------------------------------------- */

export interface Agreement {
  certify: boolean;
  pdpa: boolean;
}

/* -------------------------------------------------------------------------- */
/*                             Submit Payload                                 */
/* -------------------------------------------------------------------------- */

export interface JobApplicationPayload {
  jobId: string;
  positionId: string;
  personal: PersonalInformationData;
  education: EducationHistory[];
  workExperience: WorkExperience[];
  computerSkills: ComputerSkill[];
  languageSkills: LanguageSkill[];
  documents: ApplicationDocument[];
  agreement: Agreement;
}

/* -------------------------------------------------------------------------- */
/*                            Component Props                                 */
/* -------------------------------------------------------------------------- */

export interface ApplicationFormProps {
  language: LanguageCode;
  saving: boolean;
  position: PositionInfo;
  onSubmit: (payload: JobApplicationPayload) => Promise<void>;
}

export interface PersonalInformationProps {
  language: LanguageCode;
  value: PersonalInformationData;
  onChange: (value: PersonalInformationData) => void;
  form: FormInstance;
  position: PositionInfo;
}

export interface EducationSectionProps {
  language: LanguageCode;
  value: EducationHistory[];
  onChange: (value: EducationHistory[]) => void;
  form: FormInstance;
}

export interface WorkExperienceSectionProps {
  language: LanguageCode;
  value: WorkExperience[];
  onChange: (value: WorkExperience[]) => void;
  form: FormInstance;
}

export interface SkillsSectionProps {
  language: LanguageCode;
  computerSkills: ComputerSkill[];
  languageSkills: LanguageSkill[];
  onComputerChange: (value: ComputerSkill[]) => void;
  onLanguageChange: (value: LanguageSkill[]) => void;
  form: FormInstance;
}

export interface DocumentsSectionProps {
  language: LanguageCode;
  value: ApplicationDocument[];
  onChange: (value: ApplicationDocument[]) => void;
  form: FormInstance;
}

export interface AgreementSectionProps {
  language: LanguageCode;
  value: Agreement;
  onChange: (value: Agreement) => void;
  form: FormInstance;
}