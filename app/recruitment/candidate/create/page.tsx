"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Spin,
  Typography,
  Upload,
  message,
} from "antd";

const { Option } = Select;

import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import type { UploadProps, FormInstance } from "antd";

import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

import {
  ApplicationDocument,
  ComputerSkill,
  EducationHistory,
  EducationSectionProps,
  LanguageSkill,
  PersonalInformationData,
  WorkExperience,
  MilitaryStatus,
  ResidenceType,
  SkillsSectionProps,
  WorkExperienceSectionProps,
  DocumentsSectionProps,
  AddressValue,
} from "@/app/jobs/types/types";

import {
  calculateAge,
  validatePassport,
  validatePhone,
  validateThaiCitizenId,
  validateEmail,
  createComputerSkillRow,
  createDefaultDocuments,
  createEducationRow,
  createLanguageSkillRow,
  createPersonalInformation,
  createWorkRow,
  createOtherDocument,
} from "@/app/jobs/types/utils";

import {
    District,
    Province,
    SubDistrict,
    getDistricts,
    getProvinces,
    getSubDistricts,
} from "@/app/recruitment/candidate/create/address/address.service";

dayjs.extend(customParseFormat);



// รูปแบบข้อมูลตำแหน่งที่ได้จาก API
// หาก API จริงส่ง field ชื่ออื่น ให้ปรับ mapping ในฟังก์ชัน fetchPositions ด้านล่าง
interface PositionOption {
  id: string | number;
  name: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const [locale, setLocale] = useState("TH");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [positionId, setPositionId] = useState<string | number | undefined>( undefined );

  const [personal, setPersonal] =
    useState<PersonalInformationData  >(
      createPersonalInformation()
    );

  const [education, setEducation] =
    useState<EducationHistory[]>([
      createEducationRow(),
    ]);

  const [workExperience, setWorkExperience] =
    useState<WorkExperience[]>([
      createWorkRow(),
    ]);

  const [computerSkills, setComputerSkills] =
    useState<ComputerSkill[]>([
      createComputerSkillRow(),
    ]);

  const [languageSkills, setLanguageSkills] =
    useState<LanguageSkill[]>([
      createLanguageSkillRow(),
    ]);

  const [documents, setDocuments] =
    useState<ApplicationDocument[]>(
      createDefaultDocuments()
    );


  /* ---------------------------------------------------------------------- */
  /*                             Submit Handler                             */
  /* ---------------------------------------------------------------------- */
  const handleSubmit = async () => {
    const payload = {
      positionId: positionId,
      personal,
      education,
      workExperience,
      computerSkills,
      languageSkills,
      // เก็บ metadata ของเอกสารไว้ (id, type, title, fileName)
      // แต่ตัด object File ออก เพราะ JSON.stringify ไม่รองรับ
      documents: documents.map(({ file, ...rest }: any) => rest),
      agreement: {
        certify: true,
        pdpa: true,
      },
    };

    setSaving(true);

    const formData = new FormData();

    // แนบไฟล์จริง โดยใช้ document.id เป็น key
    // ต้องตรงกับฝั่ง API ที่อ่านด้วย formData.get(document.id)
    documents.forEach((doc: any) => {
      if (doc?.file instanceof File) {
        formData.append(doc.id, doc.file, doc.file.name);
      }
    });

    // แนบ payload หลักเป็น JSON string ภายใต้ key "payload"
    // ต้องตรงกับฝั่ง API: formData.get("payload")
    formData.append("payload", JSON.stringify(payload));

    try {
      const response = await fetch("/jobs/api/application", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Cannot save application.");
      }

      message.success(getUIText(uiText.saveSuccess, locale));

      router.push("/recruitment/candidate");
    } catch (error: any) {
      message.error(error?.message ?? "Unable to submit application.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                                  Loading                               */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <div
          style={{
            maxWidth: 1200,
            margin: "30px auto",
            paddingInline: 20,
          }}
        >
          <Skeleton
            active
            paragraph={{
              rows: 12,
            }}
          />
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                                  Error                                 */
  /* ---------------------------------------------------------------------- */

  if (error) {
    return (
      <>
        <div
          style={{
            maxWidth: 900,
            margin: "40px auto",
            paddingInline: 20,
          }}
        >
          <Alert
            type="error"
            showIcon
            message={getUIText(uiText.error, locale)}
            description={error}
          />
        </div>
      </>
    );
  }
  
  /* ----------------------------- Part 2 ต่อ ----------------------------- */
    return (
    <>
      <div
        style={{
          maxWidth: 1200,
          margin: "24px auto 60px",
          paddingInline: 20,
        }}
      >
        <Flex
          vertical
          gap={24}
        >
          {/* -------------------------------------------------------------- */}
          {/* Header                                                         */}
          {/* -------------------------------------------------------------- */}

          <Card>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Title level={2} style={{ marginBottom: 0 }}>
                  {getUIText(uiText.formTitle, locale)}
                </Title>
              </Col>
            </Row>
          </Card>

          {/* -------------------------------------------------------------- */}
          {/* Main Form                                                      */}
          {/* -------------------------------------------------------------- */}

          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
              {/* ---------------------------------------------------------------------- */}
              {/* Personal Information                                                   */}
              {/* ---------------------------------------------------------------------- */}
      
              <PersonalInformation
                form={form}
                language={locale}
                position={positionId}
                onPositionChange={setPositionId}
                value={personal}
                onChange={setPersonal}
              />
      
              {/* ---------------------------------------------------------------------- */}
              {/* Education Background                                                   */}
              {/* ---------------------------------------------------------------------- */}
      
              <EducationSection
                form={form}
                language={locale}
                value={education}
                onChange={setEducation}
              />
      
              {/* ---------------------------------------------------------------------- */}
              {/* Work Experience                                                        */}
              {/* ---------------------------------------------------------------------- */}
      
              <WorkExperienceSection
                form={form}
                language={locale}
                value={workExperience}
                onChange={setWorkExperience}
              />
      
              {/* ---------------------------------------------------------------------- */}
              {/* Skills                                                                 */}
              {/* ---------------------------------------------------------------------- */}
      
              <SkillsSection
                form={form}
                language={locale}
                computerSkills={computerSkills}
                languageSkills={languageSkills}
                onComputerChange={setComputerSkills}
                onLanguageChange={setLanguageSkills}
              />
      
              {/* ---------------------------------------------------------------------- */}
              {/* Required Documents                                                     */}
              {/* ---------------------------------------------------------------------- */}
      
              <DocumentsSection
                  form={form}
                  language={locale}
                  value={documents}
                  onChange={setDocuments}
              />
      
              {/* ---------------------------------------------------------------------- */}
              {/* Submit Button                                                          */}
              {/* ---------------------------------------------------------------------- */}
      
              <Form.Item style={{ marginTop: 32 }}>
                <Space style={{ width: "100%" }}>
                  <Button
                    color="danger" 
                    variant="solid"
                    size="large"
                    onClick={() => router.back()}
                  >
                    {getUIText(uiText.cancel, locale)}
                  </Button>
                  
                  <Button
                    type="primary"
                    size="large"
                    loading={saving}
                    onClick={() => handleSubmit()}
                  >
                    {getUIText(uiText.save, locale)}
                  </Button>
                </Space>
              </Form.Item>
      
          </Form>
        </Flex>
      </div>
    </>
  );
}

/* ========================================================================== */
/*                         Inlined PersonalInformation                       */
/* ========================================================================== */


/* ---------------------------------------------------------------------- */
/*                              Gender Types                              */
/* ---------------------------------------------------------------------- */

type GenderCode = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";

interface GenderOption {
  id: number | string;
  gender_code: GenderCode;
  gender_name_th: string;
  gender_name_en: string;
  status?: string;
  is_default?: boolean;
}

interface MaritalStatusOption {
  id: number | string;
  marital_status_name_th: string;
  marital_status_name_en: string;
  status?: string;
  sort_order?: number;
}

interface NationalityOption {
  id: number | string;
  nationality_name_th: string;
  nationality_name_en: string;
  status?: string;
  sort_order?: number;
}

interface ReligionOption {
  id: number | string;
  religion_name_th: string;
  religion_name_en: string;
  status?: string;
  sort_order?: number;
}

// หมายเหตุ: ไม่ใช้ PersonalInformationProps ที่ import จาก
// @/app/jobs/types/types เพราะ type นั้นออกแบบสำหรับ flow ของ
// "jobs" (สมัครงานตำแหน่งที่ fix มาแล้ว, ไม่มี dropdown เลือกตำแหน่ง)
// ส่วนหน้านี้ (recruitment/candidate/create) เป็นคนละ flow ที่ต้องให้
// ผู้ใช้เลือกตำแหน่งเองผ่าน dropdown จึงประกาศ type ของตัวเองแยกไว้
interface RegisterPersonalInformationProps {
  form: FormInstance;
  language: string;
  position: string | number | undefined;
  onPositionChange: (value: string | number | undefined) => void;
  value: PersonalInformationData;
  onChange: (value: PersonalInformationData) => void;
}

function PersonalInformation({
  form,
  language,
  position,
  onPositionChange,
  value,
  onChange,  
}: RegisterPersonalInformationProps) {
    
    const [locale, setLocale] = useState("TH");

  /* ---------------------------------------------------------------------- */
  /*                          Fetch Position Options                        */
  /* ---------------------------------------------------------------------- */

  

  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPositions = async () => {
      setLoadingPositions(true);

      try {
        const response = await fetch(
          "/recruitment/api/job_description/positions",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Cannot fetch positions (status ${response.status})`
          );
        }

        const result = await response.json();

        // รองรับได้ทั้งกรณี API คืนค่าเป็น array ตรงๆ
        // หรือห่อไว้ใน { data: [...] } / { items: [...] } / { result: [...] }
        const rawList: any[] = Array.isArray(result)
          ? result
          : result?.data ?? result?.items ?? result?.result ?? [];

        const normalized: PositionOption[] = rawList.map((item: any) => ({
          id: item?.id ?? item?.positionId ?? item?.position_id,
          name:
            item?.name ??
            item?.positionName ??
            item?.position_name ??
            item?.title ??
            String(item?.id ?? ""),
        }));

        if (isMounted) {
          setPositions(normalized);
        }
      } catch (err: any) {
        if (isMounted) {
          message.error(
            err?.message ?? "Unable to load position list."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingPositions(false);
        }
      }
    };

    fetchPositions();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                          Sync External Value                           */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    form.setFieldsValue({
      ...value,
      dateOfBirth: value.dateOfBirth
        ? dayjs(value.dateOfBirth)
        : null,
    });
  }, [form, value]);

  /* ---------------------------------------------------------------------- */
  /*                          Fetch Gender Options                          */
  /* ---------------------------------------------------------------------- */

  const [genderOptions, setGenderOptions] = useState<GenderOption[]>([]);
  const [genderLoading, setGenderLoading] = useState<boolean>(true);
  const [genderError, setGenderError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchGenders = async () => {
      try {
        setGenderLoading(true);
        setGenderError(false);

        const res = await fetch("/jobs/api/gender");

        if (!res.ok) {
          throw new Error(`Failed to fetch genders: ${res.status}`);
        }

        const json = await res.json();

        // API route responds with { data: [...] } on success,
        // or { message: string } on error (see app/jobs/api/gender/route.ts).
        const list: GenderOption[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];

        if (list.length === 0) {
          console.warn("Genders API did not return any options:", json);
        }

        if (isMounted) {
          setGenderOptions(list);
        }
      } catch (err) {
        console.error("Error fetching genders:", err);
        if (isMounted) {
          setGenderError(true);
        }
      } finally {
        if (isMounted) {
          setGenderLoading(false);
        }
      }
    };

    fetchGenders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Currently selected gender option (used to derive gender_code for
  // conditional logic below, since the stored value is now the gender id
  // rather than a hardcoded "male" / "female" / "other" string).
  const selectedGenderOption = Array.isArray(genderOptions)
    ? genderOptions.find((g) => String(g.id) === String(value.gender))
    : undefined;

  const selectedGenderCode = selectedGenderOption?.gender_code;

  const isFemale = selectedGenderCode === "FEMALE";
  const isMale = selectedGenderCode === "MALE";

  /* ---------------------------------------------------------------------- */
  /*                       Fetch Marital Status Options                     */
  /* ---------------------------------------------------------------------- */

  const [maritalStatusOptions, setMaritalStatusOptions] = useState<
    MaritalStatusOption[]
  >([]);
  const [maritalStatusLoading, setMaritalStatusLoading] = useState<boolean>(true);
  const [maritalStatusError, setMaritalStatusError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMaritalStatuses = async () => {
      try {
        setMaritalStatusLoading(true);
        setMaritalStatusError(false);

        // NOTE: assumes an API route at app/jobs/api/marital-status/route.ts
        // that mirrors the gender route (Supabase, filtered to status = "active").
        const res = await fetch("/jobs/api/marital-status");

        if (!res.ok) {
          throw new Error(`Failed to fetch marital statuses: ${res.status}`);
        }

        const json = await res.json();

        const list: MaritalStatusOption[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];

        if (list.length === 0) {
          console.warn("Marital statuses API did not return any options:", json);
        }

        // Sort by sort_order (ascending); options without sort_order fall
        // back to their original order.
        const sorted = [...list].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

        if (isMounted) {
          setMaritalStatusOptions(sorted);
        }
      } catch (err) {
        console.error("Error fetching marital statuses:", err);
        if (isMounted) {
          setMaritalStatusError(true);
        }
      } finally {
        if (isMounted) {
          setMaritalStatusLoading(false);
        }
      }
    };

    fetchMaritalStatuses();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                        Fetch Nationality Options                       */
  /* ---------------------------------------------------------------------- */

  const [nationalityOptions, setNationalityOptions] = useState<
    NationalityOption[]
  >([]);
  const [nationalityLoading, setNationalityLoading] = useState<boolean>(true);
  const [nationalityError, setNationalityError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchNationalities = async () => {
      try {
        setNationalityLoading(true);
        setNationalityError(false);

        // NOTE: assumes an API route at app/jobs/api/nationality/route.ts
        // that mirrors the gender route (Supabase, filtered to status =
        // "active", ordered by sort_order).
        const res = await fetch("/jobs/api/nationality");

        if (!res.ok) {
          throw new Error(`Failed to fetch nationalities: ${res.status}`);
        }

        const json = await res.json();

        const list: NationalityOption[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];

        if (list.length === 0) {
          console.warn("Nationalities API did not return any options:", json);
        }

        const sorted = [...list].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

        if (isMounted) {
          setNationalityOptions(sorted);
        }
      } catch (err) {
        console.error("Error fetching nationalities:", err);
        if (isMounted) {
          setNationalityError(true);
        }
      } finally {
        if (isMounted) {
          setNationalityLoading(false);
        }
      }
    };

    fetchNationalities();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                         Fetch Religion Options                         */
  /* ---------------------------------------------------------------------- */

  const [religionOptions, setReligionOptions] = useState<ReligionOption[]>([]);
  const [religionLoading, setReligionLoading] = useState<boolean>(true);
  const [religionError, setReligionError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReligions = async () => {
      try {
        setReligionLoading(true);
        setReligionError(false);

        // NOTE: assumes an API route at app/jobs/api/religion/route.ts
        // that mirrors the gender route (Supabase, filtered to status =
        // "active", ordered by sort_order).
        const res = await fetch("/jobs/api/religion");

        if (!res.ok) {
          throw new Error(`Failed to fetch religions: ${res.status}`);
        }

        const json = await res.json();

        const list: ReligionOption[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];

        if (list.length === 0) {
          console.warn("Religions API did not return any options:", json);
        }

        const sorted = [...list].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

        if (isMounted) {
          setReligionOptions(sorted);
        }
      } catch (err) {
        console.error("Error fetching religions:", err);
        if (isMounted) {
          setReligionError(true);
        }
      } finally {
        if (isMounted) {
          setReligionLoading(false);
        }
      }
    };

    fetchReligions();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                            Update Form Data                            */
  /* ---------------------------------------------------------------------- */

  const updateField = (
    field: keyof typeof value,
    fieldValue: any
  ) => {
    const newValue = {
      ...value,
      [field]: fieldValue,
    };
    onChange(newValue);
  };

  // Auto-select the default gender (is_default = true) once options have
  // loaded, but only if the user hasn't already picked one (e.g. editing
  // an existing application) — never override an existing selection.
  useEffect(() => {
    if (value.gender) return;
    if (!Array.isArray(genderOptions) || genderOptions.length === 0) return;

    const defaultOption = genderOptions.find((g) => g.is_default);

    if (defaultOption) {
      updateField("gender", defaultOption.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genderOptions]);


  const updateDriverLicense = (
    key: keyof typeof value.driverLicense,
    fieldValue: any
  ) => {
    onChange({
      ...value,
      driverLicense: {
        ...value.driverLicense,
        [key]: fieldValue,
      },
    });
  };

  const updateEmergencyContact = (
    key: keyof typeof value.emergencyContact,
    fieldValue: any
  ) => {
    onChange({
      ...value,
      emergencyContact: {
        ...value.emergencyContact,
        [key]: fieldValue,
      },
    });
  };

  /* ---------------------------------------------------------------------- */
  /*                            Event Handlers                              */
  /* ---------------------------------------------------------------------- */

  const handleBirthDate = (
    date: Dayjs | null
  ) => {
    if (!date) {
      onChange({
        ...value,
        dateOfBirth: "",
        age: null,
      });

      return;
    }

    onChange({
      ...value,
      dateOfBirth: date.format("YYYY-MM-DD"),
      age: calculateAge(date),
    });
  };

  /* ---------------------------------------------------------------------- */
  /*                                Options                                 */
  /* ---------------------------------------------------------------------- */

  const residenceOptions: {
    label: string;
    value: ResidenceType;
  }[] = [
    {
      label:getUIText(uiText.residenceOwnHouse, locale),
      value: "own_house",
    },
    {
      label:getUIText(uiText.residenceRentedHouse, locale),
      value: "rented_house",
    },
    {
      label:getUIText(uiText.residenceCondo, locale),
      value: "condominium",
    },
    {
      label:getUIText(uiText.residenceDormitory, locale),
      value: "dormitory",
    },
    {
      label:getUIText(uiText.residenceRelative, locale),
      value: "relative_house",
    },
    {
      label:getUIText(uiText.residenceOther, locale),
      value: "other",
    },
  ];

  const militaryOptions: {
    label: string;
    value: MilitaryStatus;
  }[] = [
    {
      label:getUIText(uiText.militaryNotYet, locale),
      value: "not_served",
    },
    {
      label:getUIText(uiText.militaryDone, locale),
      value: "completed",
    },
    {
      label:getUIText(uiText.militaryExempt, locale),
      value: "exempted",
    },
  ];

  return (
    <>
      <Flex
        vertical
        gap={24}
      >
      {/* Personal Information UI */}

        {/* ---------------------------------------------------------------------- */}
        {/*                   Position Applied + Salary Information                 */}
        {/* ---------------------------------------------------------------------- */}
        <Card>
          <Title level={4} style={{ marginBottom: 24 }}> {getUIText(uiText.positionInfo, locale)} </Title>
          <Row gutter={[16, 16]}>
            {/* -------------------------------------------------------------- */}
            {/* Position Selection                                             */}
            {/* -------------------------------------------------------------- */}
            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.position, locale) ?? "Position"}
                data-field="positionId"
                required
              >
                <Select
                  showSearch
                  allowClear
                  placeholder={ "Select a position" }
                  loading={loadingPositions}
                  value={position}
                  onChange={(value) => onPositionChange(value)}
                  optionFilterProp="label"
                  options={positions.map((pos) => ({
                    value: pos.id,
                    label: pos.name,
                  }))}
                  notFoundContent={
                    loadingPositions ? "Loading..." : "No positions found"
                  }
                />
              </Form.Item>
            </Col>

            {/* -------------------------------------------------------------- */}
            {/* Expected Salary                                                */}
            {/* -------------------------------------------------------------- */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.expectedSalary, locale)} required >
                <InputNumber
                  required
                  name="expectedSalary"
                  style={{ width: "100%" }}
                  min={0}
                  precision={0}
                  placeholder={
                    language === "TH"
                    ? "เช่น 25,000"
                    : "Expected Salary"
                  }
                  value={
                    value.expectedSalary
                    ? Number(value.expectedSalary)
                    : null
                  }
                  onChange={(v) =>
                    updateField("expectedSalary", v == null ? "" : String(v))
                  }
                  suffix={getUIText(uiText.type_salary, locale)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                         Personal Information                            */}
        {/* ---------------------------------------------------------------------- */}
        <Card title={getUIText(uiText.personalInfoSection, locale)} >
          <Row gutter={[16, 16]}>
            {/* First Name */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.firstName, locale)} required >
                <Input
                  required
                  name="firstName"
                  value={value.firstName}
                  onChange={(e) => updateField("firstName", e.target.value) }
                />
              </Form.Item>
            </Col>

            {/* Last Name */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.lastName, locale)} required >
                <Input
                  required
                  name="lastName"
                  value={value.lastName}
                  onChange={(e) => updateField("lastName", e.target.value) }
                />
              </Form.Item>
            </Col>

            {/* Nickname TH */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.nicknameTh, locale)} >
                <Input
                  value={value.nicknameTH}
                  onChange={(e) => updateField("nicknameTH", e.target.value) }
                />
              </Form.Item>
            </Col>

            {/* Nickname EN */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.nicknameEn, locale)} >
                <Input
                  value={value.nicknameEN}
                  onChange={(e) => updateField("nicknameEN", e.target.value) }
                />
              </Form.Item>
            </Col>

            {/* Date of Birth */}
            <Col xs={24} md={8}>
              <Form.Item label={getUIText(uiText.dateOfBirth, locale)} required >
                <DatePicker
                  required
                  name="dateOfBirth"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  value={
                    value.dateOfBirth
                    ? dayjs(value.dateOfBirth)
                    : null
                  }
                  onChange={handleBirthDate}
                />
              </Form.Item>
            </Col>

            {/* Age */}
            <Col xs={24} md={4}>
                <Form.Item label={getUIText(uiText.age, locale)} >
                    <InputNumber
                        style={{ width: "100%" }}
                        disabled
                        value={value.age ?? undefined}
                    />
                </Form.Item>
            </Col>

            {/* Gender */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.gender, locale)} required >
                {genderLoading ? (
                    <Spin size="small" />
                ) : genderError ? (
                  <Typography.Text type="danger">
                      {language === "TH"
                        ? "ไม่สามารถโหลดข้อมูลเพศได้"
                        : "Failed to load gender options"}
                  </Typography.Text>
                ) : (
                  <Radio.Group
                    name="gender"
                    value={value.gender}
                    onChange={(e) => updateField("gender", e.target.value) }
                  >
                    {(Array.isArray(genderOptions) ? genderOptions : []).map((option) => (
                      <Radio key={option.id} value={option.id}>
                          {locale === "TH"
                            ? option.gender_name_th
                            : option.gender_name_en}
                      </Radio>
                    ))}
                  </Radio.Group>
                )}
              </Form.Item>
            </Col>

            {/* Pregnancy */}
            {isFemale && (
              <Col xs={24} md={6}>
                <Form.Item label={getUIText(uiText.pregnancyAge, locale)} >
                  <Input
                    value={value.pregnancyAge}
                    onChange={(e) => updateField( "pregnancyAge", e.target.value ) }
                    suffix={ 
                      language === "TH"
                      ? "เดือน"
                      : "Months"
                    }
                  />
                </Form.Item>
              </Col>
            )}

            {/* Military */}

            {isMale && (
              <Col xs={24}>
                <Form.Item label={getUIText(uiText.militaryStatus, locale)} >
                  <Radio.Group
                    value={value.militaryStatus}
                    onChange={(e) => updateField( "militaryStatus", e.target.value) }
                  >
                    {militaryOptions.map((item) => (
                      <Radio
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </Col>
            )}

            {/* Height */}
            <Col xs={24} md={6}>
              <Form.Item label={getUIText(uiText.height, locale)}>
                <InputNumber
                  style={{ width: "100%" }}
                  value={value.height}
                  onChange={(val) => updateField("height", val)}
                  suffix="cm"
                  min={0}
                />
              </Form.Item>
            </Col>

            {/* Weight */}
            <Col xs={24} md={6}>
              <Form.Item label={getUIText(uiText.weight, locale)}>
                <InputNumber
                  style={{ width: "100%" }}
                  value={value.weight}
                  onChange={(val) => updateField("weight", val)}
                  suffix="kg"
                  min={0}
                />
              </Form.Item>
            </Col>

            {/* Nationality */}
            <Col xs={24} md={6}>
              <Form.Item label={getUIText(uiText.nationality, locale)} >
                <Select
                  showSearch
                  allowClear
                  loading={nationalityLoading}
                  disabled={nationalityLoading || nationalityError}
                  placeholder={
                    nationalityError
                    ? (language === "TH"
                      ? "ไม่สามารถโหลดข้อมูลสัญชาติได้"
                      : "Failed to load nationalities")
                    : (language === "TH"
                      ? "เลือกสัญชาติ"
                      : "Select nationality")
                  }
                  style={{ width: "100%" }}
                  value={value.nationality || undefined}
                  onChange={(v) => updateField("nationality", v)}
                  optionFilterProp="label"
                  options={(Array.isArray(nationalityOptions) ? nationalityOptions : []).map(
                    (option) => ({
                      value: option.id,
                      label:
                          locale === "TH"
                          ? option.nationality_name_th
                          : option.nationality_name_en,
                    })
                  )}
                />
              </Form.Item>
            </Col>

            {/* Religion */}
            <Col xs={24} md={6}>
              <Form.Item label={getUIText(uiText.religion, locale)} >
                <Select
                  showSearch
                  allowClear
                  loading={religionLoading}
                  disabled={religionLoading || religionError}
                  placeholder={
                      religionError
                      ? (language === "TH"
                        ? "ไม่สามารถโหลดข้อมูลศาสนาได้"
                        : "Failed to load religions")
                      : (language === "TH"
                        ? "เลือกศาสนา"
                        : "Select religion")
                  }
                  style={{ width: "100%" }}
                  value={value.religion || undefined}
                  onChange={(v) => updateField("religion", v)}
                  optionFilterProp="label"
                  options={(Array.isArray(religionOptions) ? religionOptions : []).map(
                      (option) => ({
                          value: option.id,
                          label:
                              locale === "TH"
                              ? option.religion_name_th
                              : option.religion_name_en,
                      })
                  )}
                />
              </Form.Item>
            </Col>

            {/* ID / Passport */}
            <Col xs={24}>
              <Form.Item
                name="idCardNo"
                label={getUIText(uiText.idCardNo, locale)}
                required
                validateTrigger="onChange"
                rules={[
                    {
                    validator(_, value) {
                        if (!value) {
                            return Promise.resolve();
                        }
                        if (language === "TH") {
                          if (!/^\d{13}$/.test(value)) {
                            return Promise.reject(
                            new Error("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก")
                            );
                          }
                          if (!validateThaiCitizenId(value)) {
                            return Promise.reject(
                            new Error(getUIText(uiText.invalidThaiId, locale))
                            );
                          }
                          return Promise.resolve();
                        }
                        // Passport
                        if (!validatePassport(value)) {
                          return Promise.reject(  new Error("Invalid passport number") );
                        }
                      return Promise.resolve();
                    },
                    },
                ]}
              >
                <Input
                  value={value.idCardNo}
                  onChange={(e) => {
                    updateField("idCardNo", e.target.value);
                    form.setFieldValue("idCardNo", e.target.value);
                  }}
                  maxLength={language === "TH" ? 13 : 20}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                                Address                                 */}
        {/* ---------------------------------------------------------------------- */}

        <Card title={getUIText(uiText.currentAddress, locale)} >
          <Row gutter={[16, 16]}>
            {/* Address No. */}
            <Col xs={24} md={6}>
              <Form.Item label={getUIText(uiText.addressNo, locale)} required >
                <Input
                  required
                  name="addressNo"
                  value={value.addressNo}
                  onChange={(e) => updateField( "addressNo", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* Village */}
            <Col xs={24} md={6}>
              <Form.Item label={getUIText(uiText.villageNo, locale)} >
                <Input
                  value={value.villageNo}
                  onChange={(e) => updateField( "villageNo", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* Street */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.street, locale)} >
                <Input
                  value={value.street}
                  onChange={(e) => updateField( "street", e.target.value ) }
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={24}>
              <AddressSelector
                value={{
                  provinceId: value.provinceId,
                  districtId: value.districtId,
                  subDistrictId: value.subDistrictId,
                  postalCode: value.postalCode,
                }}
                onChange={(address) =>
                  onChange({
                    ...value,
                    provinceId: address.provinceId,
                    districtId: address.districtId,
                    subDistrictId: address.subDistrictId,
                    postalCode: address.postalCode,
                  })
                }
              />
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.email, locale)}
                required
                validateStatus={
                  value.email &&
                  !validateEmail(value.email)
                  ? "error"
                  : ""
                }
                help={
                  value.email &&
                  !validateEmail(value.email)
                  ? getUIText(uiText.invalidEmail, locale)
                  : ""
                }
              >
                <Input
                  name="email"
                  required
                  value={value.email}
                  placeholder="example@email.com"
                  onChange={(e) => updateField( "email", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* LINE ID */}
            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.lineId, locale)} >
                <Input
                  value={value.lineId}
                  onChange={(e) => updateField( "lineId", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* Phone Number */}
            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.phoneNumber, locale)}
                required
                validateStatus={
                  value.phoneNumber &&
                  !validatePhone(value.phoneNumber)
                  ? "error"
                  : ""
                }
                help={
                  value.phoneNumber &&
                  !validatePhone(value.phoneNumber)
                  ? getUIText(uiText.invalidPhone, locale)
                  : ""
                }
              >
                <Input
                  name="phoneNumber"
                  value={value.phoneNumber}
                  placeholder={ language === "TH" ? "08xxxxxxxx" : "Phone Number" }
                  onChange={(e) => updateField( "phoneNumber", e.target.value ) }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                     Residence / Marital Information                     */}
        {/* ---------------------------------------------------------------------- */}

        <Card title={getUIText(uiText.residenceMaritalStatus, locale)} >
          <Row gutter={[16, 16]}>
            {/* -------------------------------------------------------------- */}
            {/* Residence Type                                                 */}
            {/* -------------------------------------------------------------- */}
            <Col xs={24}>
              <div data-field="residenceType">
                <Form.Item
                  label={getUIText(uiText.residenceType, locale)}
                  required
                >
                  <Radio.Group
                    name="residenceType"
                    style={{ width: "100%" }}
                    value={value.residenceType}
                    onChange={(e) =>
                        updateField( "residenceType", e.target.value )
                    }
                  >
                    <Row gutter={[16, 12]}>
                      {residenceOptions.map((item) => (
                        <Col
                          xs={24}
                          sm={12}
                          md={8}
                          key={item.value}
                        >
                          <Radio value={item.value}>
                            {item.label}
                          </Radio>
                        </Col>
                      ))}
                    </Row>
                  </Radio.Group>
                </Form.Item>
              </div>
            </Col>

            {/* Other Residence */}
            {value.residenceType.includes("other") && (
              <Col xs={24}>
                <Form.Item label={getUIText(uiText.residenceOther, locale)} >
                  <Input
                    value={value.residenceOther}
                    onChange={(e) => updateField( "residenceOther", e.target.value ) }
                    placeholder={
                      language === "TH"
                      ? "กรุณาระบุ"
                      : "Please specify"
                    }
                  />
                </Form.Item>
              </Col>
            )}

            {/* -------------------------------------------------------------- */}
            {/* Marital Status                                                 */}
            {/* -------------------------------------------------------------- */}
            <Col xs={24}>
              <div data-field="maritalStatus">
                <Form.Item  label={getUIText(uiText.maritalStatus, locale)} required >
                  {maritalStatusLoading ? (
                      <Spin size="small" />
                  ) : maritalStatusError ? (
                    <Typography.Text type="danger">
                      {language === "TH"
                        ? "ไม่สามารถโหลดข้อมูลสถานภาพสมรสได้"
                        : "Failed to load marital status options"}
                    </Typography.Text>
                  ) : (
                    <Radio.Group
                      name="maritalStatus"
                      style={{ width: "100%" }}
                      value={value.maritalStatus}
                      onChange={(e) => updateField( "maritalStatus", e.target.value) }
                    >
                      <Row gutter={[16, 12]}>
                        {(Array.isArray(maritalStatusOptions) ? maritalStatusOptions : []).map((item) => (
                          <Col
                            xs={24}
                            sm={12}
                            md={8}
                            key={item.id}
                          >
                            <Radio value={item.id}>
                              {locale === "TH"
                                ? item.marital_status_name_th
                                : item.marital_status_name_en}
                            </Radio>
                          </Col>
                        ))}
                      </Row>
                    </Radio.Group>
                  )}
                </Form.Item>
              </div>
            </Col>

            {/* -------------------------------------------------------------- */}
            {/* Number of Children                                             */}
            {/* -------------------------------------------------------------- */}
            <Col xs={24} md={8}>
              <Form.Item label={getUIText(uiText.numberOfChildren, locale)} >
                <Input
                  value={value.children ?? 0}
                  onChange={(e) => updateField( "children", e.target.value.replace(/\D/g, "") ) }
                  placeholder={
                    language === "TH"
                    ? "0"
                    : "0"
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                           Driver's License                             */}
        {/* ---------------------------------------------------------------------- */}

        <Card title={getUIText(uiText.driverLicense, locale)} >
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div data-field="driverLicense">
                <Form.Item
                  name="driverLicense"
                  label={getUIText(uiText.driverLicense, locale)}
                  required
                >
                  <Space wrap>
                  {/* Car */}
                    <Checkbox
                      checked={value.driverLicense.car}
                      onChange={(e) =>
                      updateDriverLicense("car", e.target.checked)
                      }
                    >
                      {getUIText(uiText.driverLicenseCar, locale)}
                    </Checkbox>

                    {/* Motorcycle */}
                    <Checkbox
                      checked={value.driverLicense.motorcycle}
                      onChange={(e) =>
                      updateDriverLicense("motorcycle", e.target.checked)
                      }
                    >
                      {getUIText(uiText.driverLicenseMotorcycle, locale)}
                    </Checkbox>

                    {/* Other */}
                    <Checkbox
                      checked={value.driverLicense.other}
                      onChange={(e) =>
                      updateDriverLicense("other", e.target.checked)
                      }
                    >
                      {getUIText(uiText.driverLicenseOther, locale)}
                    </Checkbox>
                  </Space>
                </Form.Item>
              </div>
            </Col>

            {/* Other Driver License */}

            {value.driverLicense.other && (
              <Col xs={24}>
                <Form.Item
                  label={
                    language === "TH"
                    ? "ระบุใบอนุญาตอื่นๆ"
                    : "Specify Other License"
                  }
                >
                  <Input
                    value={value.driverLicense.otherText}
                    placeholder={
                      language === "TH"
                      ? "กรุณาระบุ"
                      : "Please specify"
                    }
                    onChange={(e) => updateDriverLicense( "otherText", e.target.value ) }
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                          Emergency Contact                             */}
        {/* ---------------------------------------------------------------------- */}

        <Card title={getUIText(uiText.emergencyContact, locale)} >
          <Row gutter={[16, 16]}>
            {/* Contact Name */}
            <Col xs={24} md={8}>
              <Form.Item label={getUIText(uiText.emergencyContactName, locale)} required >
                <Input
                  required
                  name="emergencyContactName"
                  value={value.emergencyContact.name}
                  placeholder={
                    language === "TH"
                    ? "ชื่อผู้ติดต่อ"
                    : "Contact Name"
                  }
                  onChange={(e) => updateEmergencyContact( "name", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* Contact Phone */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.emergencyPhone, locale)}
                required
                validateStatus={
                value.emergencyContact.phone &&
                !validatePhone(value.emergencyContact.phone)
                  ? "error"
                  : ""
                }
                help={
                value.emergencyContact.phone &&
                !validatePhone(value.emergencyContact.phone)
                  ? language === "TH"
                  ? "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"
                  : "Invalid phone number"
                  : ""
                }
              >
                <Input
                  name="emergencyPhone"
                  value={value.emergencyContact.phone}
                  placeholder={
                    language === "TH"
                    ? "08xxxxxxxx"
                    : "Phone Number"
                  }
                  onChange={(e) => updateEmergencyContact( "phone", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* Relationship */}
            <Col xs={24} md={8}>
              <Form.Item label={getUIText(uiText.emergencyRelationship, locale)} required >
                <Input
                  required
                  name="emergencyRelationship"
                  value={value.emergencyContact.relationship}
                  placeholder={
                    language === "TH"
                    ? "เช่น บิดา, มารดา, พี่ชาย"
                    : "Relationship"
                  }
                  onChange={(e) => updateEmergencyContact( "relationship", e.target.value ) }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---------------------------------------------------------------------- */}
        {/*                    Health & Criminal Record                             */}
        {/* ---------------------------------------------------------------------- */}

        <Card
          title={
            language === "TH"
            ? "ข้อมูลสุขภาพและประวัติ"
            : "Health & Criminal Record"
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {/* -------------------------------------------------------------- */}
            {/* Underlying Disease                                             */}
            {/* -------------------------------------------------------------- */}

            <Col xs={24}>
              <Form.Item label={getUIText(uiText.chronicDisease, locale)} >
                <Input.TextArea
                  rows={3}
                  value={value.underlyingDisease}
                  placeholder={
                    language === "TH"
                    ? "หากไม่มีให้พิมพ์ 'ไม่มี'"
                    : "If none, please enter 'None'"
                  }
                  onChange={(e) => updateField( "underlyingDisease", e.target.value ) }
                />
              </Form.Item>
            </Col>

            {/* -------------------------------------------------------------- */}
            {/* Serious Crime                                                  */}
            {/* -------------------------------------------------------------- */}

            <Col xs={24}>
              <Form.Item
                  label={getUIText(uiText.criminalRecord, locale)}
                  required
              >
                <Radio.Group
                  name="criminalRecord"
                  value={value.criminalRecord}
                  onChange={(e) => updateField("criminalRecord", e.target.value) }
                >
                  <Space size="large">
                    <Radio value={true}> {getUIText(uiText.yes, locale)} </Radio>
                    <Radio value={false}> {getUIText(uiText.no, locale)} </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* -------------------------------------------------------------- */}
            {/* Previous Employment Misconduct                                 */}
            {/* -------------------------------------------------------------- */}

            <Col xs={24}>
              <Form.Item
                  label={getUIText(uiText.dishonestyRecord, locale)}
                  required
              >
                <Radio.Group
                  name="dishonestyRecord"
                  value={value.dishonestyRecord}
                  onChange={(e) => updateField("dishonestyRecord", e.target.value) }
                >
                  <Space size="large">
                    <Radio value={true}> {getUIText(uiText.yes, locale)} </Radio>
                    <Radio value={false}> {getUIText(uiText.no, locale)} </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Flex>
    </>
  );
}

interface Props {
    value: AddressValue;
    onChange: (value: AddressValue) => void;
}

function AddressSelector({
    value,
    onChange,
}: Props) {
  const [locale, setLocale] = useState("TH");

  const [provinceOptions, setProvinceOptions] = useState<Province[]>([]);
  const [districtOptions, setDistrictOptions] = useState<District[]>([]);
  const [subDistrictOptions, setSubDistrictOptions] = useState<SubDistrict[]>([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingSubDistrict, setLoadingSubDistrict] = useState(false);

  useEffect(() => {
      loadProvinces();
  }, []);

  useEffect(() => {
    if (value.provinceId) {
      loadDistricts(value.provinceId);
    } else {
      setDistrictOptions([]);
      setSubDistrictOptions([]);
    }
  }, [value.provinceId]);

  useEffect(() => {
    if (value.districtId) {
      loadSubDistricts(value.districtId);
    } else {
      setSubDistrictOptions([]);
    }
  }, [value.districtId]);

  async function loadProvinces() {
    try {
      setLoadingProvince(true);
      const data = await getProvinces();
      setProvinceOptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProvince(false);
    }
  }

  async function loadDistricts(provinceCode: number) {
    try {
      setLoadingDistrict(true);
      const data = await getDistricts(provinceCode);
      setDistrictOptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDistrict(false);
    }
  }

  async function loadSubDistricts(districtCode: number) {
    try {
      setLoadingSubDistrict(true);
      const data = await getSubDistricts(districtCode);
      setSubDistrictOptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSubDistrict(false);
    }
  }

  async function handleProvinceChange(provinceCode?: number) {
    if (!provinceCode) {
      setDistrictOptions([]);
      setSubDistrictOptions([]);
      onChange({
        provinceId: undefined,
        districtId: undefined,
        subDistrictId: undefined,
        postalCode: "",
      });
      return;
    }
            
    await loadDistricts(provinceCode);
    setSubDistrictOptions([]);
    onChange({
      provinceId: provinceCode,
      districtId: undefined,
      subDistrictId: undefined,
      postalCode: "",
    });
  }

  async function handleDistrictChange(districtCode?: number) {
    if (!districtCode) {
      setSubDistrictOptions([]);
      onChange({
        ...value,
        districtId: undefined,
        subDistrictId: undefined,
        postalCode: "",
      });
      return;
    }      
    await loadSubDistricts(districtCode);
    onChange({
      ...value,
      districtId: districtCode,
      subDistrictId: undefined,
      postalCode: "",
    });
  }

  function handleSubDistrictChange(subDistrictCode?: number) {
    if (!subDistrictCode) {
      onChange({
        ...value,
        subDistrictId: undefined,
        postalCode: "",
      });
      return;
    }
    const selected = subDistrictOptions.find(
      item => item.code === subDistrictCode
    );
    onChange({
      ...value,
      subDistrictId: subDistrictCode,
      postalCode: String(selected?.postal_code ?? ""),
    });
  }

  return (
    <Row gutter={16}>
      {/* Province */}
      <Col xs={24} md={6}>
        <Form.Item
          label={getUIText(uiText.province, locale)}
          required
        >
          <Select
            value={value.provinceId}
            loading={loadingProvince}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={
              locale === "TH"
              ? "เลือกจังหวัด"
              : "Select Province"
            }
            onChange={handleProvinceChange}
            options={provinceOptions.map((item) => ({
              value: item.code,
              label:
                locale === "TH"
                ? item.name_th
                : item.name_en,
            }))}
          />
        </Form.Item>
      </Col>

      {/* District */}
      <Col xs={24} md={6}>
        <Form.Item
          label={getUIText(uiText.district, locale)}
          required
        >
          <Select
            value={value.districtId}
            loading={loadingDistrict}
            allowClear
            disabled={!value.provinceId}
            showSearch
            optionFilterProp="label"
            placeholder={
              locale === "TH"
                ? "เลือกอำเภอ"
                : "Select District"
            }
            onChange={handleDistrictChange}
            options={districtOptions.map((item) => ({
              value: item.code,
              label:
                locale === "TH"
                ? item.name_th
                : item.name_en,
            }))}
          />
        </Form.Item>
      </Col>

      {/* Sub District */}
      <Col xs={24} md={6}>
        <Form.Item
          label={getUIText(uiText.subDistrict, locale)}
          required
        >
          <Select
            value={value.subDistrictId}
            loading={loadingSubDistrict}
            allowClear
            disabled={!value.districtId}
            showSearch
            optionFilterProp="label"
            placeholder={
              locale === "TH"
              ? "เลือกตำบล"
              : "Select Sub District"
            }
            onChange={handleSubDistrictChange}
            options={subDistrictOptions.map((item) => ({
              value: item.code,
              label:
                  locale === "TH"
                  ? item.name_th
                  : item.name_en,
            }))}
          />
        </Form.Item>
      </Col>

      {/* Postal Code */}
      <Col xs={24} md={6}>
        <Form.Item
          label={getUIText(uiText.postalCode, locale)}
          required
        >
          <Input
            value={value.postalCode}
            readOnly
            maxLength={5}
            placeholder={
              locale === "TH"
              ? "กรอกอัตโนมัติจากตำบล"
              : "Auto-filled from Sub District"
            }
          />
        </Form.Item>
      </Col>
    </Row>
  );
}

function EducationSection({
  language,
  value,
  onChange,
}: EducationSectionProps) {

  const [locale, setLocale] = useState("TH");

  /* ---------------------------------------------------------------------- */
  /*                              Handlers                                  */
  /* ---------------------------------------------------------------------- */

  const addRow = () => {
    onChange([...value, createEducationRow()]);
  };

  const removeRow = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof EducationHistory,
    fieldValue: string
  ) => {
    const updated = value.map((item) =>
      item.id === id
        ? { ...item, [field]: fieldValue }
        : item
    );

    onChange(updated);
  };

  return (
    <Card
      title={getUIText(uiText.educationSection, locale)}
      style={{ marginBottom: 24 }}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addRow}
        style={{ marginBottom: 16 }}
      >
        {getUIText(uiText.addRow, locale)}
      </Button>

      {value.map((edu, index) => (
        <Card
          key={edu.id}
          type="inner"
          style={{ marginBottom: 16 }}
          title={`${language === "TH" ? "รายการที่" : "Item"} ${index + 1}`}
          extra={
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(edu.id)}
            >
              {getUIText(uiText.removeRow, locale)}
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Degree Level */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationLevel, locale)}
              >
                <Select
                  value={edu.degreeLevel}
                  onChange={(val) =>
                    updateRow(
                      edu.id,
                      "degreeLevel",
                      val
                    )
                  }
                >
                  <Option value="high_school">
                    {getUIText(uiText.educationLevelHighSchool, locale)}
                  </Option>
                  <Option value="vocational">
                    {getUIText(uiText.educationLevelvocational, locale)}
                  </Option>
                  <Option value="bachelor">
                    {getUIText(uiText.educationLevelBachelor, locale)}
                  </Option>
                  <Option value="other">
                    {getUIText(uiText.educationLevelOthers, locale)}
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Institution */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationInstitution, locale)}
              >
                <Input
                  value={edu.institution}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "institution",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Faculty */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationFaculty, locale)}
              >
                <Input
                  value={edu.faculty}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "faculty",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Major */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationMajor, locale)}
              >
                <Input
                  value={edu.major}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "major",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Year */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationYear, locale)}
              >
                <Input
                  value={edu.graduatedYear}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "graduatedYear",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* GPA */}
            <Col xs={24} md={8}>
              <Form.Item
                label={getUIText(uiText.educationGpa, locale)}
              >
                <Input
                  value={edu.gpa}
                  onChange={(e) =>
                    updateRow(
                      edu.id,
                      "gpa",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}
    </Card>
  );
}

/* ========================================================================== */
/*                            Inlined SkillsSection                          */
/* ========================================================================== */

const { Title } = Typography;

function SkillsSection({
  language,
  computerSkills,
  languageSkills,
  onComputerChange,
  onLanguageChange,
}: SkillsSectionProps) {

  const [locale, setLocale] = useState("TH");
  /* -------------------------------------------------------------------------- */
  /*                              Computer Skills                               */
  /* -------------------------------------------------------------------------- */

  const addComputer = () => {
    onComputerChange([
      ...computerSkills,
      createComputerSkillRow(),
    ]);
  };

  const removeComputer = (id: string) => {
    onComputerChange(
      computerSkills.filter(
        (item) => item.id !== id
      )
    );
  };

  const updateComputer = (
    id: string,
    field: keyof ComputerSkill,
    value: string
  ) => {
    onComputerChange(
      computerSkills.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const updateComputerLevel = (
    id: string,
    field: "good" | "fair",
    checked: boolean
  ) => {
    onComputerChange(
      computerSkills.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          good:
            field === "good"
              ? (checked ? 1 : 0)
              : 0,
          fair:
            field === "fair"
              ? (checked ? 1 : 0)
              : 0,
        };
      })
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              Language Skills                               */
  /* -------------------------------------------------------------------------- */

  const addLanguage = () => {
    onLanguageChange([
      ...languageSkills,
      createLanguageSkillRow(),
    ]);
  };

  const removeLanguage = (id: string) => {
    onLanguageChange(
      languageSkills.filter(
        (item) => item.id !== id
      )
    );
  };

  const updateLanguage = (
    id: string,
    field: keyof LanguageSkill,
    value: string | number
  ) => {
    onLanguageChange(
      languageSkills.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div>
      {/* ---------------------------------------------------------------------- */}
      {/* Computer Skills                                                        */}
      {/* ---------------------------------------------------------------------- */}

      <Card
        title={getUIText(uiText.skillsSection, locale)}
        style={{ marginBottom: 24 }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addComputer}
          style={{ marginBottom: 16 }}
        >
          {getUIText(uiText.addRow, locale)}
        </Button>

        {computerSkills.map((item, index) => (
          <Card
            key={item.id}
            type="inner"
            style={{ marginBottom: 12 }}
            title={`${
              language === "TH"
                ? "รายการ"
                : "Item"
            } ${index + 1}`}
            extra={
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  removeComputer(item.id)
                }
              >
                {getUIText(uiText.removeRow, locale)}
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label={getUIText(uiText.computerSkillSystem, locale)}
                >
                  <Input
                    value={item.system_program}
                    onChange={(e) =>
                      updateComputer(
                        item.id,
                        "system_program",
                        e.target.value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={getUIText(uiText.computerSkillSystem, locale)}
                >
                  <Radio.Group
                    block
                    value={
                      item.good === 1
                        ? "good"
                        : item.fair === 1
                        ? "fair"
                        : undefined
                    }
                    onChange={(e) =>
                      updateComputerLevel(
                        item.id,
                        e.target.value,
                        true
                      )
                    }
                  >
                    <Radio.Button value="good" style={{ width: "50%" }}>
                      {getUIText(uiText.computerSkillGood, locale)}
                    </Radio.Button>

                    <Radio.Button value="fair" style={{ width: "50%" }}>
                      {getUIText(uiText.computerSkillFair, locale)}
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>

      {/* ---------------------------------------------------------------------- */}
      {/* Language Skills                                                        */}
      {/* ---------------------------------------------------------------------- */}

      <Card
        title={getUIText(uiText.languageSkillsSubSection, locale)}
        style={{ marginBottom: 24 }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addLanguage}
          style={{ marginBottom: 16 }}
        >
          {getUIText(uiText.addRow, locale)}
        </Button>

        {languageSkills.map((item, index) => (
          <Card
            key={item.id}
            type="inner"
            style={{ marginBottom: 12 }}
            title={`${getUIText(uiText.languageSkillLanguage, locale)} ${index + 1}`}
            extra={
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  removeLanguage(item.id)
                }
              >
                {getUIText(uiText.removeRow, locale)}
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Form.Item
                  label={getUIText(uiText.languageSkillLanguage, locale)}
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Input
                    className="justify-items-center"
                    value={item.language}
                    onChange={(e) =>
                      updateLanguage(
                        item.id,
                        "language",
                        e.target.value
                      )
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillListening, locale)} 
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
                      value={item.listening}
                      max={10}
                      onChange={(value) =>
                        updateLanguage(
                          item.id,
                          "listening",
                          value
                        )
                      }
                    />
                  </Flex>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillSpeaking, locale)} 
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
                      value={item.speaking}
                      max={10}
                      onChange={(value) =>
                        updateLanguage(
                          item.id,
                          "speaking",
                          value
                        )
                      }
                    />
                  </Flex>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillReading, locale)}
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
                      value={item.reading}
                      max={10}
                      onChange={(value) =>
                        updateLanguage(
                          item.id,
                          "reading",
                          value
                        )
                      }
                    />
                  </Flex>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item 
                  label={getUIText(uiText.languageSkillWriting, locale)}
                  labelCol={{
                    style: {
                      textAlign: "center",
                      width: "100%",
                    },
                  }}
                >
                  <Flex justify="center">
                    <InputNumber
                      style={{ textAlign: "center" }}
                      value={item.writing}
                      max={10}
                      onChange={(value) =>
                        updateLanguage(
                          item.id,
                          "writing",
                          value
                        )
                      }
                    />
                  </Flex>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>
    </div>
  );
}

/* ========================================================================== */
/*                       Inlined WorkExperienceSection                       */
/* ========================================================================== */

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;
const { TextArea } = Input;

function WorkExperienceSection({
  language,
  value,
  onChange,
}: WorkExperienceSectionProps) {

  const [locale, setLocale] = useState("TH");
  /* -------------------------------------------------------------------------- */
  /*                                  Handlers                                  */
  /* -------------------------------------------------------------------------- */

  const addRow = () => {
    onChange([...value, createWorkRow()]);
  };

  const removeRow = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof WorkExperience,
    fieldValue: string
  ) => {
    const updated = value.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]: fieldValue,
          }
        : item
    );

    onChange(updated);
  };

  const PERIOD_FORMAT = "MMM YYYY";

  // แปลง string "Jan 2022 - Dec 2023" กลับเป็น [Dayjs, Dayjs]
  const parsePeriodToRange = (period: string): [Dayjs, Dayjs] | null => {
    if (!period) return null;
    const parts = period.split(" - ");
    if (parts.length !== 2) return null;

    const start = dayjs(parts[0], PERIOD_FORMAT, true);
    const end = dayjs(parts[1], PERIOD_FORMAT, true);

    if (!start.isValid() || !end.isValid()) return null;
    return [start, end];
  };

  // แปลงค่าที่เลือกจาก RangePicker กลับเป็น string เก็บใน work.period
  const formatRangeToPeriod = (
    dates: [Dayjs | null, Dayjs | null] | null
  ): string => {
    if (!dates || !dates[0] || !dates[1]) return "";
    return `${dates[0].format(PERIOD_FORMAT)} - ${dates[1].format(PERIOD_FORMAT)}`;
  };


  /* -------------------------------------------------------------------------- */

  return (
    <Card
      title={getUIText(uiText.workExperienceSection, locale)}
      style={{ marginBottom: 24 }}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addRow}
        style={{ marginBottom: 20 }}
      >
        {getUIText(uiText.addRow, locale)}
      </Button>

      {value.map((work, index) => (
        <Card
          key={work.id}
          type="inner"
          style={{ marginBottom: 20 }}
          title={`${
            language === "TH"
              ? "รายการที่"
              : "Experience"
          } ${index + 1}`}
          extra={
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(work.id)}
            >
              {getUIText(uiText.removeRow, locale)}
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Period */}

            {/* <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workPeriod, locale)}
              >
                <Input
                  placeholder={
                    language === "TH"
                      ? "เช่น ม.ค. 2565 - ธ.ค. 2566"
                      : "Example: Jan 2022 - Dec 2023"
                  }
                  value={work.period}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "period",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col> */}

            <Col xs={24} md={12}>
              <Form.Item label={getUIText(uiText.workPeriod, locale)}>
                <RangePicker
                  picker="month"
                  style={{ width: "100%" }}
                  placeholder={["Jan 2022", "Dec 2023"]}
                  value={parsePeriodToRange(work.period)}
                  onChange={(dates) => {
                    const periodString = formatRangeToPeriod(
                      dates as [Dayjs | null, Dayjs | null]
                    );
                    updateRow(work.id, "period", periodString);
                  }}
                />

                {work.period && (
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 4, fontSize: 13 }}
                  >
                    {language === "TH" ? "ช่วงที่เลือก: " : "Selected: "}
                    {work.period}
                  </Text>
                )}
              </Form.Item>
            </Col>

            {/* Company */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workCompanyName, locale)}
              >
                <Input
                  value={work.companyName}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "companyName",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Position */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workPosition, locale)}
              >
                <Input
                  value={work.position}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "position",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Latest Salary */}

            <Col xs={24} md={12}>
              <Form.Item
                label={getUIText(uiText.workLatestSalary, locale)}
              >
                <Input
                  suffix={getUIText(uiText.type_salary, locale)}
                  value={work.latestSalary}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "latestSalary",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>

            {/* Reason */}

            <Col span={24}>
              <Form.Item
                label={getUIText(uiText.workReasonForLeaving, locale)}
              >
                <TextArea
                  rows={3}
                  value={work.reasonForLeaving}
                  onChange={(e) =>
                    updateRow(
                      work.id,
                      "reasonForLeaving",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}
    </Card>
  );
}

/* ========================================================================== */
/*                         Inlined DocumentsSection                           */
/* ========================================================================== */

const { Text } = Typography;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "video/mp4",
];


function DocumentsSection({
  language,
  value,
  onChange,
}: DocumentsSectionProps) {

  const [locale, setLocale] = useState("TH");
  
  /* -------------------------------------------------------------------------- */
  /*                                  Handlers                                  */
  /* -------------------------------------------------------------------------- */

  const updateDocumentFields = (
    id: string,
    fields: Partial<ApplicationDocument>
  ) => {
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, ...fields } : item
      )
    );
  };

  // const beforeUpload =
  // (id: string): UploadProps["beforeUpload"] =>
  // (file) => {
  //   updateDocumentFields(id, { file, fileName: file.name });
  //   return false;
  // };

  const beforeUpload =
  (id: string): UploadProps["beforeUpload"] =>
  (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error(getUIText(uiText.invalidDocument, locale));
      return Upload.LIST_IGNORE;
    }

    updateDocumentFields(id, {
      file,
      fileName: file.name,
    });

    return false;
  };

  const addOtherDocument = () => {
    onChange([...value, createOtherDocument()]);
  };

  const removeDocument = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const getTitle = (doc: ApplicationDocument) => {
    switch (doc.type) {
      case "photo":
        return getUIText(uiText.docPhoto, locale);

      case "house_registration":
        return getUIText(uiText.docHouseholdReg, locale);

      case "id_card":
        return getUIText(uiText.docIdCard, locale);

      case "education":
        return getUIText(uiText.docEducationCert, locale);

      default:
        return getUIText(uiText.docOther, locale);
    }
  };

  return (
    <Card
      title={getUIText(uiText.documentsSection, locale)}
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addOtherDocument}
        style={{ marginBottom: 16 }}
      >
        {getUIText(uiText.addRow, locale)}
      </Button>

      <Space
        orientation="vertical"
        size={20}
        style={{ width: "100%" }}
      >
        {value.map((doc) => (
          <Card
            key={doc.id}
            type="inner"
            title={getTitle(doc)}
            extra={
              doc.type === "other" && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    removeDocument(doc.id)
                  }
                >
                  {getUIText(uiText.removeRow, locale)}
                </Button>
              )
            }
          >
            <Row gutter={[16, 16]}>
              {doc.type === "other" && (
                <Col span={24}>
                  <Form.Item
                    label={
                      language === "TH"
                        ? "ชื่อเอกสาร"
                        : "Document Name"
                    }
                    required
                  >
                    <Input
                      value={doc.title}
                      onChange={(e) =>
                        updateDocumentFields(doc.id, { title: e.target.value, })
                      }
                    />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} md={16}>
                <Upload
                  accept=".png,.jpg,.jpeg,.pdf,.mp4"
                  maxCount={1}
                  beforeUpload={beforeUpload(
                    doc.id
                  )}
                  showUploadList={false}
                >
                  <Button
                    icon={<UploadOutlined />}
                  >
                    {getUIText(uiText.chooseFile, locale)}
                  </Button>
                </Upload>

                {doc.fileName && (
                  <div
                    style={{
                      marginTop: 10,
                    }}
                  >
                    <Text type="success">
                      {doc.fileName}
                    </Text>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
    </Card>
  );
}