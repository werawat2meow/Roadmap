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

  const nationalityOptions =
    buildOptions(
      nationalities,
      {
        codeKey:
          "nationality_code",
        nameKey:
          "nationality_name",
        nameEnKey:
          "nationality_name_en",
      }
    );

  const countryOptions =
    buildOptions(countries, {
      codeKey: "country_code",
      nameKey:
        "country_name_th",
      nameEnKey:
        "country_name_en",
    });

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
          >
            <LazyNationalitySelect
              disabled={disabled}
              placeholder="เลือกสัญชาติ"
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
          < LazyCountrySelect  
            disabled={disabled}
            placeholder="เลือกประเทศ"
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
            rules={[
              {
                pattern:
                  /^\d{13}$/,
                message:
                  "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก",
              },
            ]}
          >
            <Input
              disabled={disabled}
              maxLength={13}
              placeholder="เลขบัตรประชาชน"
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
          >
            <Input
              disabled={disabled}
              placeholder="Passport Number"
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
              placeholder="เลือกวันหมดอายุ"
            />
          </Form.Item>
        </Col>
      </Row>

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
    </div>
  );
}