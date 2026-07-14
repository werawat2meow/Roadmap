"use client";

import { useEffect , useState } from "react";
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
  Typography,
} from "antd";

import { uiText } from "@/app/jobs/components/translations";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";
import { getUIText } from "@/app/jobs/lib/ui";

import {
  MaritalStatus,
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

import { supabase } from "@/lib/supabaseClient";

const { Title } = Typography;

const { Option } = Select;

export default function PersonalInformation({
  form,
  language,
  position,
  value,
  onChange,  
}: PersonalInformationProps) {
    
    const { locale } = useLanguage();

    const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
    const [districtOptions, setDistrictOptions] = useState<any[]>([]);
    const [subDistrictOptions, setSubDistrictOptions] = useState<any[]>([]);

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

    useEffect(() => {
        // NOTE: loadProvince/handleProvinceChange/handleDistrictChange are async and
        // depend on data being fetched before being read back out of state, so we
        // wait for them (and pass the freshly-fetched data through directly) instead
        // of relying on provinceOptions/districtOptions state, which would still be
        // stale ([]) on this same tick (this was previously causing an unhandled
        // "Cannot read properties of undefined" crash that blanked out all 3 selects).
        (async () => {
            const provinces = await loadProvince();

            let districts: any[] = [];

            if (value.provinceId) {
                districts = await handleProvinceChange(value.provinceId, provinces);
            }

            if (value.districtId) {
                await handleDistrictChange(value.districtId, districts);
            }
        })();
    }, [locale]);

    const loadProvince = async () => {
        const nameField = locale === "TH" ? "name_th" : "name_en";

        const { data } = await supabase
            .from("province")
            .select(`province_id, ${nameField}`)
            .order(nameField);

        setProvinceOptions(data ?? []);

        return data ?? [];
    };

    const handleProvinceChange = async (
        provinceId: number,
        provinceList: any[] = provinceOptions
    ) => {

        const province = provinceList.find(x => x.province_id === provinceId);

        if (!province) { return []; }

        // NOTE: batched into a single onChange call. Calling updateField()
        // repeatedly here would have each call spread from the same stale
        // `value` closure, so later calls (e.g. postalCode) would silently
        // overwrite earlier ones (e.g. provinceId) instead of accumulating.
        onChange({
            ...value,
            provinceId,
            province:
                locale === "TH"
                    ? province.name_th
                    : province.name_en,
            districtId: null,
            district: "",
            subDistrictId: null,
            subDistrict: "",
            postalCode: "",
        });

        const { data } = await supabase
            .from("districts")
            .select("district_id,name_th,name_en")
            .eq("province_id", provinceId)
            .order(locale === "TH" ? "name_th" : "name_en");
        
        setDistrictOptions(data ?? []);
        setSubDistrictOptions([]);

        return data ?? [];
    };

    const handleDistrictChange = async (
        districtId:number,
        districtList: any[] = districtOptions
    )=>{

        const district = districtList.find(x=>x.district_id===districtId);

        if (!district) { return []; }

        // NOTE: batched into a single onChange call for the same reason as
        // handleProvinceChange above.
        onChange({
            ...value,
            districtId,
            district:
                locale === "TH"
                    ? district.name_th
                    : district.name_en,
            subDistrictId: null,
            subDistrict: "",
            postalCode: "",
        });

        const { data } = await supabase
            .from("subdistrict")
            .select("subdistrict_id,name_th,name_en,zipcode")
            .eq("district_id",districtId)
            .order(locale==="TH"?"name_th":"name_en");
        
        setSubDistrictOptions(data ?? []);

        return data ?? [];
    }

    const handleSubDistrictChange = (id:number)=>{
        
        const sub = subDistrictOptions.find(x=>x.subdistrict_id===id);
        
        if (!sub) { return; }

        // NOTE: batched into a single onChange call for the same reason as
        // handleProvinceChange above.
        onChange({
            ...value,
            subDistrictId: id,
            subDistrict:
                locale === "TH"
                    ? sub.name_th
                    : sub.name_en,
            postalCode: sub.zipcode,
        });
    }

    const handleZipcode = async(zip:string)=>{

        console.log(zip);
        
        updateField("postalCode",zip);

        if(zip.length!==5){ return; }

        const { data } = await supabase
            .from("subdistricts")
            .select(`
                id,
                name_th,
                name_en,
                zipcode,
                districts(
                    id,
                    name_th,
                    name_en,
                    province_id,
                    provinces(
                        id,
                        name_th,
                        name_en
                    )
                )
            `)
            .eq("zipcode",zip);

        if(!data?.length){ return; }

        const province=data[0].districts.provinces;

        const districts=[...new Map(
            data.map(x=>[
                x.districts.id,
                x.districts
            ])
        ).values()];

        setDistrictOptions(districts);

        // NOTE: batched into a single onChange call for the same reason as
        // handleProvinceChange above. `postalCode` is included explicitly
        // since the `value` in this closure predates the earlier
        // updateField("postalCode", zip) call.
        onChange({
            ...value,
            postalCode: zip,
            provinceId: province.id,
            province:
                locale === "TH"
                    ? province.name_th
                    : province.name_en,
            districtId: districts[0].id,
            district:
                locale === "TH"
                    ? districts[0].name_th
                    : districts[0].name_en,
        });

        setSubDistrictOptions(data);
    }

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

  const maritalOptions: {
    label: string;
    value: MaritalStatus;
  }[] = [
    {
      label:getUIText(uiText.maritalSingle, locale),
      value: "single",
    },
    {
      label:getUIText(uiText.maritalMarried, locale),
      value: "married",
    },
    {
      label:getUIText(uiText.maritalDivorced, locale),
      value: "divorced",
    },
    {
      label:getUIText(uiText.maritalWidowed, locale),
      value: "widowed",
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
                        <Radio.Group
                            name="gender"
                            value={value.gender}
                            onChange={(e) => updateField("gender", e.target.value) }
                        >
                            <Radio value="male">
                                {getUIText(uiText.genderMale, locale)}
                            </Radio>

                            <Radio value="female">
                                {getUIText(uiText.genderFemale, locale)}
                            </Radio>

                            <Radio value="other">
                                {getUIText(uiText.genderOther, locale)}
                            </Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>

                {/* Pregnancy */}
                {value.gender === "female" && (
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

                {value.gender === "male" && (
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
                    <Form.Item label={getUIText(uiText.height, locale)} >
                        <Input
                            value={value.height}
                            onChange={(e) => updateField("height", e.target.value) }
                            suffix="cm"
                        />
                    </Form.Item>
                </Col>

                {/* Weight */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.weight, locale)} >
                        <Input
                            value={value.weight}
                            onChange={(e) => updateField("weight", e.target.value) }
                            suffix="kg"
                        />
                    </Form.Item>
                </Col>

                {/* Nationality */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.nationality, locale)} >
                        <Input
                            value={value.nationality}
                            onChange={(e) => updateField( "nationality", e.target.value )}
                        />
                    </Form.Item>
                </Col>

                {/* Religion */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.religion, locale)} >
                        <Input
                            value={value.religion}
                            onChange={(e) => updateField("religion", e.target.value) }
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

                {/* Province */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.province, locale)} required >
                        <Select
                            value={value.provinceId}
                            showSearch
                            optionFilterProp="label"
                            onChange={(provinceId) => handleProvinceChange(provinceId)}
                            options={provinceOptions.map(item=>({
                                value:item.province_id,
                                label:
                                    locale==="TH"
                                        ? item.name_th
                                        : item.name_en
                            }))}
                        />
                    </Form.Item>
                </Col>

                {/* District */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.district, locale)} required >
                        <Select
                            value={value.districtId}
                            showSearch
                            optionFilterProp="label"
                            onChange={(districtId) => handleDistrictChange(districtId)}
                            disabled={!value.provinceId}
                            options={districtOptions.map(item=>({
                                value:item.district_id,
                                label:
                                    locale==="TH"
                                        ? item.name_th
                                        : item.name_en
                            }))}
                        />
                    </Form.Item>
                </Col>

                {/* Sub District */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.subDistrict, locale)} required >
                        <Select
                            value={value.subDistrictId}
                            showSearch
                            optionFilterProp="label"
                            onChange={handleSubDistrictChange}
                            disabled={!value.districtId}
                            options={subDistrictOptions.map(item=>({
                                value:item.subdistrict_id,
                                label:
                                    locale==="TH"
                                        ? item.name_th
                                        : item.name_en
                            }))}
                        />
                    </Form.Item>
                </Col>

                {/* Postal Code */}
                <Col xs={24} md={6}>
                    <Form.Item label={getUIText(uiText.postalCode, locale)} required >
                        <Input
                            value={value.postalCode}
                            maxLength={5}
                            onChange={(e)=>
                                handleZipcode(
                                    e.target.value.replace(/\D/g,"")
                                )
                            }
                        />
                    </Form.Item>
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
                            <Radio.Group
                                name="maritalStatus"
                                style={{ width: "100%" }}
                                value={value.maritalStatus}
                                onChange={(e) => updateField( "maritalStatus", e.target.value) }
                            >
                                <Row gutter={[16, 12]}>
                                    {maritalOptions.map((item) => (
                                        <Col
                                            xs={24}
                                            sm={12}
                                            md={8}
                                            key={item.value}
                                        >
                                            <Radio value={item.value}> {item.label} </Radio>
                                        </Col>
                                    ))}
                                </Row>
                            </Radio.Group>
                        </Form.Item>
                    </div>
                </Col>

                {/* -------------------------------------------------------------- */}
                {/* Number of Children                                             */}
                {/* -------------------------------------------------------------- */}
                <Col xs={24} md={8}>
                    <Form.Item label={getUIText(uiText.numberOfChildren, locale)} >
                        <Input
                            value={value.children}
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
    </>
  );
}