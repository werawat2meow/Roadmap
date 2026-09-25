"use client";

import {
  Avatar,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Upload,
} from "antd";

import {
  CameraOutlined,
  IdcardOutlined,
  UserOutlined,
} from "@ant-design/icons";

import EmployeeBirthPlaceSelector from "../EmployeeBirthPlaceSelector";
import LazyNationalitySelect from "@/app/components/selects/LazyNationalitySelect";
import LazyCountrySelect from "@/app/components/selects/LazyCountrySelect";

import { useEffect } from "react";
import dayjs from "dayjs";

const bloodGroupOptions = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "AB", value: "AB" },
  { label: "O", value: "O" },
  { label: "ไม่ระบุ", value: "unknown" },
];

function toDayjs(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value;
  }

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed
    : null;
}

/* =========================================================
   Enterprise Identity Validation
========================================================= */

function normalizeCitizenId(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 13);
}

function isValidThaiCitizenId(value) {
  const citizenId =
    normalizeCitizenId(value);

  if (!/^\d{13}$/.test(citizenId)) {
    return false;
  }

  let sum = 0;

  for (
    let index = 0;
    index < 12;
    index += 1
  ) {
    sum +=
      Number(citizenId[index]) *
      (13 - index);
  }

  const expectedCheckDigit =
    (11 - (sum % 11)) % 10;

  return (
    expectedCheckDigit ===
    Number(citizenId[12])
  );
}

function normalizePassportNo(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

function isValidPassportNo(value) {
  const passportNo =
    normalizePassportNo(value);

  /*
    Passport ไม่มีรูปแบบเดียวกันทุกประเทศ
    จึงไม่บังคับ 9 ตัวแบบตายตัว

    Employee Master รองรับ:
    - A-Z
    - 0-9
    - 6 ถึง 20 ตัวอักษร
  */
  return /^[A-Z0-9]{6,20}$/.test(
    passportNo
  );
}

function isThaiNationality(item) {
  if (!item) {
    return false;
  }

  const codes = [
    item.nationality_code,
    item.iso2,
    item.iso3,
  ]
    .map((value) =>
      String(value || "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean);

  if (
    codes.includes("TH") ||
    codes.includes("THA") ||
    codes.includes("THAI")
  ) {
    return true;
  }

  const nameTh =
    String(
      item.nationality_name_th ||
      ""
    ).trim();

  const nameEn =
    String(
      item.nationality_name_en ||
      ""
    )
      .trim()
      .toLowerCase();

  return (
    nameTh === "ไทย" ||
    nameTh === "สัญชาติไทย" ||
    nameEn === "thai" ||
    nameEn === "thailand"
  );
}

function buildOptions(rows = [],{codeKey,nameKey,nameEnKey,}) {
  return rows.map((item) => {
    const code = item?.[codeKey];
    const name =
      item?.[nameKey] ||
      item?.[nameEnKey] ||
      "-";

    return {
      value: item.id,
      label: code
        ? `${code} - ${name}`
        : name,
    };
  });
}

export default function EmployeePersonalStep({
  form,
  disabled = false,
  masterData = {},
  masterLoading = false,
  uploadLoading = false,
  onPhotoChange,
}) {
  
  
  const photoUrl =
    Form.useWatch(
      "employee_photo_url",
      form
    );

  const nationalityId = Form.useWatch("nationality_id",form);

  const countryId = Form.useWatch("country_id", form);

  const titles =
    masterData.titles || [];

  const genders =
    masterData.genders || [];

  const maritalStatuses =
    masterData.maritalStatuses || [];

  const religions =
    masterData.religions || [];

  const nationalities =
    masterData.nationalities || [];

  const countries =
    masterData.countries || [];

  const selectedNationality =
    nationalities.find(
      (item) =>
        String(item?.id || "") ===
        String(nationalityId || "")
    ) || null;

  const nationalityResolved =
    Boolean(
      nationalityId &&
      selectedNationality
    );

  const isThaiEmployee =
    nationalityResolved &&
    isThaiNationality(
      selectedNationality
    );

  const isForeignEmployee =
    nationalityResolved &&
    !isThaiEmployee;

  /*
   * สัญชาติเป็น Source of Truth ของเอกสารยืนยันตัวตน
   * - ไทย      => บังคับเลขบัตรประชาชน 13 หลัก
   * - ต่างชาติ => บังคับ Passport
   *
   * ถ้าเคยกรอกเลขบัตรประชาชนตอนเลือกสัญชาติไทย
   * แล้วเปลี่ยนเป็นต่างชาติ ต้องล้างค่าเดิมออกทันที
   * เพื่อไม่ให้ Step ภาษีหยิบ Citizen ID เก่าไปใช้อ้างอิง
   */
  useEffect(() => {
    if (!isForeignEmployee) {
      return;
    }

    const currentCitizenId =
      form.getFieldValue(
        "citizen_id"
      );

    if (!currentCitizenId) {
      return;
    }

    form.setFields([
      {
        name: "citizen_id",
        value: "",
        errors: [],
      },
    ]);
  }, [
    form,
    isForeignEmployee,
  ]);

  /*
   * สถานที่เกิดแบบ จังหวัด / อำเภอ / ตำบล
   * ใช้เฉพาะพนักงานสัญชาติไทย
   *
   * สำคัญ:
   * ล้างค่าเฉพาะเมื่อระบบยืนยันแล้วว่าเป็น "ต่างชาติ"
   * เพื่อไม่ให้ค่าเดิมของพนักงานไทยถูกล้างระหว่าง Master Data กำลังโหลด
   */
  useEffect(() => {
    if (
      !nationalityResolved ||
      isThaiEmployee
    ) {
      return;
    }

    form.setFieldsValue({
      birth_province_code:
        undefined,
      birth_district_code:
        undefined,
      birth_subdistrict_code:
        undefined,
      birth_postcode: "",
      birth_place: "",
    });
  }, [
    form,
    nationalityResolved,
    isThaiEmployee,
  ]);

  const titleOptions =
    buildOptions(titles, {
      codeKey: "title_code",
      nameKey: "title_name_th",
      nameEnKey: "title_name_en",
    });

  const genderOptions =
    buildOptions(genders, {
      codeKey: "gender_code",
      nameKey: "gender_name_th",
      nameEnKey: "gender_name_en",
    });

  const maritalStatusOptions =
    buildOptions(
      maritalStatuses,
      {
        codeKey:"marital_status_code",
        nameKey:"marital_status_name_th",
        nameEnKey:"marital_status_name_en",
      }
    );

  const religionOptions =
    buildOptions(religions, {
      codeKey: "religion_code",
      nameKey: "religion_name",
      nameEnKey:
        "religion_name_en",
    });

  const nationalityOptions = buildOptions(nationalities,
    {
      codeKey:
        "nationality_code",

      nameKey:
        "nationality_name_th",

      nameEnKey:
        "nationality_name_en",
    }
  );

  const nationalityInitialOption =
    nationalityOptions.find(
      (option) =>
        option.value ===
        nationalityId
    ) || null;

  const countryOptions =
    buildOptions(countries, {
      codeKey: "country_code",
      nameKey:
        "country_name_th",
      nameEnKey:
        "country_name_en",
    });

  const countryInitialOption =
    countryOptions.find(
      (option) =>
        option.value ===
        countryId
    ) || null;

  return (
    <div>
      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <UserOutlined />
          ข้อมูลชื่อพนักงาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          lg={6}
        >
          <Card
            size="small"
            className="mb-4 text-center"
          >
            <Avatar
              size={120}
              src={photoUrl || undefined}
              icon={<UserOutlined />}
            />

            <div className="mt-4">
              <Upload
                accept="image/*"
                showUploadList={false}
                disabled={
                  disabled ||
                  uploadLoading
                }
                beforeUpload={(file) => {
                  onPhotoChange?.(file);

                  return false;
                }}
              >
                <Space
                  orientation="vertical"
                  size={4}
                >
                  <CameraOutlined />

                  <span>
                    เลือกรูปพนักงาน
                  </span>
                </Space>
              </Upload>
            </div>

            <Form.Item
              name="employee_photo_path"
              hidden
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="employee_photo_url"
              hidden
            >
              <Input />
            </Form.Item>
          </Card>
        </Col>

        <Col
          xs={24}
          lg={18}
        >
          <Row gutter={[16, 0]}>
            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="คำนำหน้า"
                name="title_id"
              >
                <Select
                  showSearch
                  allowClear
                  loading={
                    masterLoading
                  }
                  disabled={disabled}
                  placeholder="เลือกคำนำหน้า"
                  options={
                    titleOptions
                  }
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="ชื่อภาษาไทย"
                name="first_name_th"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      "กรุณากรอกชื่อภาษาไทย",
                  },
                ]}
              >
                <Input
                  disabled={disabled}
                  placeholder="ชื่อ"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="ชื่อกลางภาษาไทย"
                name="middle_name_th"
              >
                <Input
                  disabled={disabled}
                  placeholder="ชื่อกลาง"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="นามสกุลภาษาไทย"
                name="last_name_th"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      "กรุณากรอกนามสกุลภาษาไทย",
                  },
                ]}
              >
                <Input
                  disabled={disabled}
                  placeholder="นามสกุล"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="ชื่อภาษาอังกฤษ"
                name="first_name_en"
              >
                <Input
                  disabled={disabled}
                  placeholder="First name"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="ชื่อกลางภาษาอังกฤษ"
                name="middle_name_en"
              >
                <Input
                  disabled={disabled}
                  placeholder="Middle name"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="นามสกุลภาษาอังกฤษ"
                name="last_name_en"
              >
                <Input
                  disabled={disabled}
                  placeholder="Last name"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={3}
            >
              <Form.Item
                label="ชื่อเล่นไทย"
                name="nickname_th"
              >
                <Input
                  disabled={disabled}
                  placeholder="ชื่อเล่น"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={3}
            >
              <Form.Item
                label="ชื่อเล่นอังกฤษ"
                name="nickname_en"
              >
                <Input
                  disabled={disabled}
                  placeholder="Nickname"
                />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <IdcardOutlined />
          ข้อมูลส่วนบุคคล
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="เพศ"
            name="gender_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกเพศ"
              options={genderOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันเกิด"
            name="birth_date"
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันเกิด"
              disabledDate={(current) =>
                current &&
                current.isAfter(
                  dayjs(),
                  "day"
                )
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="หมู่เลือด"
            name="blood_group"
          >
            <Select
              allowClear
              disabled={disabled}
              placeholder="เลือกหมู่เลือด"
              options={
                bloodGroupOptions
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สถานภาพสมรส"
            name="marital_status_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกสถานภาพสมรส"
              options={
                maritalStatusOptions
              }
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ศาสนา"
            name="religion_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              placeholder="เลือกศาสนา"
              options={
                religionOptions
              }
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สัญชาติ"
            name="nationality_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสัญชาติ",
              },
            ]}
          >
            <LazyNationalitySelect
                disabled={disabled}
                placeholder="เลือกสัญชาติ"
                initialOption={
                  nationalityInitialOption
                }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ประเทศ"
            name="country_id"
          >
          <LazyCountrySelect
            disabled={disabled}
            placeholder="เลือกประเทศ"
            initialOption={
              countryInitialOption
            }
          />
          </Form.Item>
          
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="เลขบัตรประชาชน"
            name="citizen_id"
            dependencies={[
              "nationality_id",
            ]}
            normalize={(value) =>
              normalizeCitizenId(
                value
              )
            }
            rules={[
              () => ({
                validator(
                  _,
                  value
                ) {
                  const citizenId =
                    normalizeCitizenId(
                      value
                    );

                  if (!citizenId) {
                    if (isThaiEmployee) {
                      return Promise.reject(
                        new Error(
                          "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
                        )
                      );
                    }

                    return Promise.resolve();
                  }

                  if (
                    !/^\d{13}$/.test(
                      citizenId
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"
                      )
                    );
                  }

                  if (
                    !isValidThaiCitizenId(
                      citizenId
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบเลขทั้ง 13 หลัก"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              disabled={
                disabled ||
                !nationalityId ||
                isForeignEmployee
              }
              inputMode="numeric"
              maxLength={13}
              autoComplete="off"
              placeholder={
                isThaiEmployee
                  ? "กรอกเลขบัตรประชาชน 13 หลัก"
                  : "เลขบัตรประชาชน"
              }
              onChange={(event) => {
                form.setFieldValue(
                  "citizen_id",
                  normalizeCitizenId(
                    event.target.value
                  )
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="เลขหนังสือเดินทาง"
            name="passport_no"
            dependencies={[
              "nationality_id",
            ]}
            normalize={(value) =>
              normalizePassportNo(
                value
              )
            }
            rules={[
              () => ({
                validator(
                  _,
                  value
                ) {
                  const passportNo =
                    normalizePassportNo(
                      value
                    );

                  if (!passportNo) {
                    if (isForeignEmployee) {
                      return Promise.reject(
                        new Error(
                          "กรุณากรอกเลขหนังสือเดินทาง (Passport)"
                        )
                      );
                    }

                    return Promise.resolve();
                  }

                  if (
                    !isValidPassportNo(
                      passportNo
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "เลขหนังสือเดินทางต้องเป็น A-Z หรือ 0-9 จำนวน 6-20 ตัว"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              disabled={
                disabled ||
                !nationalityId
              }
              maxLength={20}
              autoComplete="off"
              placeholder={
                isForeignEmployee
                  ? "กรอก Passport Number"
                  : "Passport Number (ถ้ามี)"
              }
              onChange={(event) => {
                form.setFieldValue(
                  "passport_no",
                  normalizePassportNo(
                    event.target.value
                  )
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันหมดอายุหนังสือเดินทาง"
            name="passport_expire_date"
            dependencies={[
              "nationality_id",
              "passport_no",
            ]}
            getValueProps={(value) => ({
              value: toDayjs(value),
            })}
            normalize={(value) =>
              toDayjs(value)
            }
          >
            <DatePicker
              disabled={
                disabled ||
                !nationalityId
              }
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันหมดอายุ (ถ้ามี)"
            />
          </Form.Item>
        </Col>
      </Row>

     
      {isThaiEmployee ? (
        <>
          <Divider
            titlePlacement="left"
            plain
          >
            สถานที่เกิด
          </Divider>

          <EmployeeBirthPlaceSelector
            form={form}
            disabled={disabled}
          />
        </>
      ) : null}
    </div>
  );
}
