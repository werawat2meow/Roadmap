// PersonalInformation

"use client";

import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  Flex,
} from "antd";

import { uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";
import { AddressSelector } from "@/app/jobs/components/address";

import {
  MilitaryStatus,
  PersonalInformationProps,
  ResidenceType,
} from "@/app/jobs/types/types";

import {
  calculateAge,
  validatePassport,
  validatePhone,
  validateThaiCitizenId,
  validateEmail,
} from "@/app/jobs/types/utils";

const { Title } = Typography;

const { Option } = Select;

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

export default function PersonalInformation({
  form,
  language,
  position,
  value,
  onChange,  
}: PersonalInformationProps) {
    
    const { locale } = useLanguage();

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
                    {/* Other Position                                                 */}
                    {/* -------------------------------------------------------------- */}
                    <Col xs={24} md={12}>
                        <Form.Item label={getUIText(uiText.otherPosition, locale)} required >
                            <Input
                                required
                                name="otherPosition"
                                placeholder={
                                    language === "TH"
                                    ? "กรอกตำแหน่งที่สนใจ"
                                    : "Other Position"
                                }
                                value={value.otherPosition}
                                onChange={(e) => updateField( "otherPosition", e.target.value ) }
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
                        <Form.Item label={getUIText(uiText.lastName, locale)} required
                        >
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
                                onChange={(e) =>
                                updateField("criminalRecord", e.target.value)
                                }
                            >
                                <Space size="large">
                                <Radio value={true}>
                                    {getUIText(uiText.yes, locale)}
                                </Radio>

                                <Radio value={false}>
                                    {getUIText(uiText.no, locale)}
                                </Radio>
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
                                onChange={(e) =>
                                updateField("dishonestyRecord", e.target.value)
                                }
                            >
                                <Space size="large">
                                <Radio value={true}>
                                    {getUIText(uiText.yes, locale)}
                                </Radio>

                                <Radio value={false}>
                                    {getUIText(uiText.no, locale)}
                                </Radio>
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