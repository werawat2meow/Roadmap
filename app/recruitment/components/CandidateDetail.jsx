"use client";

import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Table,
  Tag,
  Typography,
} from "antd";

const { Title } = Typography;

const statusColor = {
  1: "default",
  2: "processing",
  3: "success",
  4: "processing",
  5: "processing",
  6: "processing",
  7: "error",
  8: "processing",
  9: "processing",
  10: "success",
  11: "error",
  12: "success",
  13: "success",
  14: "error",
  15: "success",
  16: "default",
  17: "success",
  99: "error",
  0: "error",

};

const statusText = {
  1: "รอพิจารณา",
  2: "HRD ส่งต่อ HRM",
  3: "ผ่านการคัดเลือกเข้าสัมภาษณ์",
  4: "นัดสัมภาษณ์",
  5: "ยืนยันการสัมภาษณ์",
  6: "เลื่อนการสัมภาษณ์",
  7: "ขาดการสัมภาษณ์",
  8: "ส่งต่อการสัมภาษณ์",
  9: "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน",
  10: "ผ่านการคัดเลือก",
  11: "ไม่ผ่านการคัดเลือก",
  12: "นัดวันเริ่มทำงาน",
  13: "เลื่อนวันเริ่มทำงาน",
  14: "ไม่มาทำงานตามนัด",
  15: "อัพเดตเข้าฐานข้อมูลกลาง",
  16: "ยื่น Resume",
  17: "รอเริ่มงาน",
  99: "backlist",
  0: "ยกเลิก",
};

const yesNo = (value) => {
  if (value === true) return "ใช่";
  if (value === false) return "ไม่ใช่";
  return "-";
};

const value = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  return v;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const renderDriverLicense = (driverLicense) => {
  if (!driverLicense) return "-";
  let data = driverLicense;
  // กรณีเก็บเป็น JSON string
  if (typeof driverLicense === "string") {
    try {
      data = JSON.parse(driverLicense);
    } catch {
      return value(driverLicense);
    }
  }

  const items = [];
  if (data.car) { items.push("รถยนต์"); }

  if (data.motorcycle) { items.push("รถจักรยานยนต์"); }

  if (data.other) {
    items.push(
      data.otherText
        ? `อื่น ๆ (${data.otherText})`
        : "อื่น ๆ"
    );
  }

  return items.length ? items.join(", ") : "-";
};

const getResidenceTypeText = (type) => {
  switch (type) {
    case "own_house":
      return getUIText(uiText.residenceOwnHouse, "TH");

    case "rented_house":
      return getUIText(uiText.residenceRentedHouse, "TH");

    case "condominium":
      return getUIText(uiText.residenceCondo, "TH");

    case "dormitory":
      return getUIText(uiText.residenceDormitory, "TH");

    case "relative_house":
      return getUIText(uiText.residenceRelative, "TH");

    case "other":
      return getUIText(uiText.residenceOther, "TH");

    default:
      return value(type);
  }
};

const getMaritalStatusText = (type) => {
  switch (type) {
    case "single":
      return getUIText(uiText.maritalSingle, "TH");

    case "married":
      return getUIText(uiText.maritalMarried, "TH");

    case "divorced":
      return getUIText(uiText.maritalDivorced, "TH");

    case "widowed":
      return getUIText(uiText.maritalWidowed, "TH");

    default:
      return value(type);
  }
};

const getMilitaryStatusText = (type) => {
  switch (type) {
    case "not_served":
      return getUIText(uiText.militaryNotYet, "TH");

    case "completed":
      return getUIText(uiText.militaryDone, "TH");

    case "exempted":
      return getUIText(uiText.militaryExempt, "TH");

    default:
      return value(type);
  }
};

const getGenderText = (type) => {
  switch (type) {
    case "male":
      return getUIText(uiText.genderMale, "TH");

    case "female":
      return getUIText(uiText.genderFemale, "TH");

    case "other":
      return getUIText(uiText.genderOther, "TH");

    default:
      return value(type);
  }
};

export default function CandidateDetail({
  application,
  education,
  workExperience,
  languageSkills,
  systemProgramSkills,
  documents,
  interviews,
}) {

  return (
    <div style={{ padding: 24 }} >

      {/* ====================================================== */}
      {/* Header */}
      {/* ====================================================== */}

      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">

          <Col>
            <Title level={3} style={{ margin: 0 }}>
              รายละเอียดผู้สมัครงาน
            </Title>

            <div style={{ marginTop: 8 }}>
              ตำแหน่ง :

              <strong>
                {" "}
                {application.positions?.position_name || "-"}
              </strong>
            </div>

            { application.from_social_media &&(
              <div style={{ marginTop: 8 }}>
                ทราบข่าวการเปิดรับสมัครจาก : 
                {/* <strong> {application.from_social_media} </strong> */}

                <Tag
                  color={"success"}
                  style={{ fontSize: 16, padding: "6px 14px" }}
                >
                  {application.from_social_media}
                </Tag>

              </div>
            )}
            
          </Col>

          <Col>
            <Tag
              color={statusColor[application.status] || "default"}
              style={{ fontSize: 16, padding: "6px 14px" }}
            >
              {statusText[application.status] || "-"}
            </Tag>
          </Col>

        </Row>
      </Card>

      {/* ====================================================== */}
      {/* ข้อมูลส่วนตัว */}
      {/* ====================================================== */}

      <Card
        title="ข้อมูลส่วนตัว"
        style={{ marginBottom: 24 }}
      >
        <Descriptions
          bordered
          column={2}
          size="middle"
        >
          <Descriptions.Item label="ตำแหน่งที่สมัคร">
            {application.positions?.position_name}
          </Descriptions.Item>

          <Descriptions.Item label="ตำแหน่งอื่นที่ต้องการ">
            {value(application.other_position)}
          </Descriptions.Item>

          <Descriptions.Item label="เงินเดือนที่คาดหวัง" span={2}>
            {value(application.expected_salary)}
          </Descriptions.Item>
        
          <Descriptions.Item label="ชื่อ - นามสกุล">
            {value(application.first_name)+" "+value(application.last_name)}
          </Descriptions.Item>

          <Descriptions.Item label="ชื่อเล่น (ไทย/อังกฤษ)">
            {value(application.nickname_th)+" / "+value(application.nickname_en)}
          </Descriptions.Item>

          <Descriptions.Item label="วันเกิด">
            {formatDate(application.date_of_birth)}
          </Descriptions.Item>

          <Descriptions.Item label="อายุ">
            {value(application.age)}
          </Descriptions.Item>

          <Descriptions.Item label="เพศ">
            {application.genders.gender_name_th}
          </Descriptions.Item>

          {application.gender !== "female" && (
            <Descriptions.Item label="สถานะทางทหาร">
              { getMilitaryStatusText(application.military_status)}
            </Descriptions.Item>
          )}

          {application.gender !== "male" && (
            <Descriptions.Item label="อายุครรภ์">
                {value(application.pregnancy_age)}
            </Descriptions.Item>
          )}

          <Descriptions.Item label="ส่วนสูง">
            {value(application.height)}
          </Descriptions.Item>

          <Descriptions.Item label="น้ำหนัก">
            {value(application.weight)}
          </Descriptions.Item>

          <Descriptions.Item label="สัญชาติ">
            {application.nationalities.nationality_name_th}
          </Descriptions.Item>

          <Descriptions.Item label="ศาสนา">
            {application.religions.religion_name_th}
          </Descriptions.Item>

          <Descriptions.Item label="เลขบัตรประชาชน">
            {value(application.identity_no)}
          </Descriptions.Item>

        </Descriptions>
      </Card>

      {/* ====================================================== */}
      {/* ที่อยู่ */}
      {/* ====================================================== */}

      <Card
        title="ที่อยู่ปัจจุบัน"
        style={{ marginBottom: 24 }}
      >
        <Descriptions
          bordered
          column={2}
          size="middle"
        >
          <Descriptions.Item label="บ้านเลขที่">
            {value(application.current_address_no)}
          </Descriptions.Item>

          <Descriptions.Item label="หมู่">
            {value(application.village_no)}
          </Descriptions.Item>

          <Descriptions.Item label="ถนน">
            {value(application.street)}
          </Descriptions.Item>

          <Descriptions.Item label="ตำบล">
            {value(application.subdistrict_name)}
          </Descriptions.Item>

          <Descriptions.Item label="อำเภอ">
            {value(application.district_name)}
          </Descriptions.Item>

          <Descriptions.Item label="จังหวัด">
            {value(application.province_name)}
          </Descriptions.Item>

          <Descriptions.Item label="รหัสไปรษณีย์">
            {value(application.postal_code)}
          </Descriptions.Item>

          <Descriptions.Item label="LINE ID">
            {value(application.line_id)}
          </Descriptions.Item>

          <Descriptions.Item label="เบอร์โทรศัพท์">
            {value(application.phone_number)}
          </Descriptions.Item>

          <Descriptions.Item label="E-mail">
            {value(application.email)}
          </Descriptions.Item>

          <Descriptions.Item label="ลักษณะที่อยู่อาศัย">
            {getResidenceTypeText(application.residence_type)}
          </Descriptions.Item>

          <Descriptions.Item label="อื่น ๆ">
            {value(application.residence_other)}
          </Descriptions.Item>

        </Descriptions>
      </Card>

      {/* ====================================================== */}
      {/* ข้อมูลครอบครัว */}
      {/* ====================================================== */}

      <Card
        title="ข้อมูลครอบครัว"
        style={{ marginBottom: 24 }}
      >
        <Descriptions
          bordered
          column={2}
          size="middle"
        >
          <Descriptions.Item label="สถานภาพสมรส">
            {application.marital_statuses.marital_status_name_th}
          </Descriptions.Item>

          <Descriptions.Item label="จำนวนบุตร">
            {value(application.children)}
          </Descriptions.Item>

          <Descriptions.Item label="ใบขับขี่">
            {renderDriverLicense(application.driver_license)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ====================================================== */}
      {/* บุคคลที่ติดต่อได้ */}
      {/* ====================================================== */}

      <Card
        title="บุคคลที่ติดต่อกรณีฉุกเฉิน"
        style={{ marginBottom: 24 }}
      >
        <Descriptions
          bordered
          column={3}
          size="middle"
        >
          <Descriptions.Item label="ชื่อ">
            {value(application.emergency_name)}
          </Descriptions.Item>

          <Descriptions.Item label="เบอร์โทรศัพท์">
            {value(application.emergency_phone)}
          </Descriptions.Item>

          <Descriptions.Item label="ความสัมพันธ์">
            {value(application.emergency_relationship)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ====================================================== */}
      {/* สุขภาพ */}
      {/* ====================================================== */}

      <Card
        title="ข้อมูลสุขภาพและประวัติ"
        style={{ marginBottom: 24 }}
      >
        <Descriptions
          bordered
          column={2}
          size="middle"
        >
          <Descriptions.Item label="โรคประจำตัว">
            {yesNo(application.underlying_disease)}
          </Descriptions.Item>

          <Descriptions.Item label="เคยต้องคดีอาญา">
            {yesNo(application.serious_crime)}
          </Descriptions.Item>

          <Descriptions.Item label="เคยทุจริต">
            {yesNo(application.dishonest)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {/* ====================================================== */}
      {/* ประวัติการศึกษา */}
      {/* ====================================================== */}

      <Card
        title="ประวัติการศึกษา"
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="id"
          bordered
          pagination={false}
          dataSource={education}
          locale={{
            emptyText: "ไม่มีข้อมูล",
          }}
          columns={[
            {
              title: "ระดับการศึกษา",
              dataIndex: "degree_level",
              key: "degree_level",
              width: 180,
              render: (value) => {
                switch (value) {
                case "high_school":
                    return "มัธยมศึกษา";

                case "vocational":
                    return "อาชีวศึกษา";

                case "bachelor":
                    return "ปริญญาตรี";

                case "other":
                    return "อื่นๆ";

                default:
                    return value || "-";
                }
              },

            },
            {
              title: "สถาบัน",
              dataIndex: "institution",
              key: "institution",
            },
            {
              title: "คณะ",
              dataIndex: "faculty",
              key: "faculty",
            },
            {
              title: "สาขา",
              dataIndex: "major",
              key: "major",
            },
            {
              title: "ปีที่จบ",
              dataIndex: "graduated_year",
              key: "graduated_year",
              width: 120,
              align: "center",
            },
            {
              title: "GPA",
              dataIndex: "gpa",
              key: "gpa",
              width: 100,
              align: "center",
            },
          ]}
        />
      </Card>

      {/* ====================================================== */}
      {/* ประสบการณ์การทำงาน */}
      {/* ====================================================== */}

      <Card
        title="ประสบการณ์การทำงาน"
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="id"
          bordered
          pagination={false}
          dataSource={workExperience}
          locale={{
            emptyText: "ไม่มีข้อมูล",
          }}
          columns={[
            {
              title: "ระยะเวลา",
              dataIndex: "period",
              key: "period",
              width: 180,
            },
            {
              title: "บริษัท",
              dataIndex: "company_name",
              key: "company_name",
            },
            {
              title: "ตำแหน่ง",
              dataIndex: "position",
              key: "position",
            },
            {
              title: "เงินเดือนล่าสุด",
              dataIndex: "latest_salary",
              key: "latest_salary",
              width: 180,
              align: "right",
              render: (value) =>
                value
                  ? Number(value).toLocaleString()
                  : "-",
            },
            {
              title: "เหตุผลที่ลาออก",
              dataIndex: "reason_for_leaving",
              key: "reason_for_leaving",
            },
          ]}
        />
      </Card>

      {/* ====================================================== */}
      {/* ทักษะ */}
      {/* ====================================================== */}

      <Card title="ทักษะด้านโปรแกรม" style={{ marginBottom: 24 }}>
        <Table
          rowKey="id"
          bordered
          pagination={false}
          dataSource={systemProgramSkills}
          locale={{
            emptyText: "ไม่มีข้อมูล",
          }}
          columns={[
            {
              title: "System",
              dataIndex: "system_program",
              key: "system_program",
            },
            {
              title: "Good",
              dataIndex: "good",
              key: "good",
              width: 90,
              align: "center",
              render: (v) => (v == 1 ? "✓" : ""),
            },
            {
              title: "Fair",
              dataIndex: "fair",
              key: "fair",
              width: 90,
              align: "center",
              render: (v) => (v == 1 ? "✓" : ""),
            },
          ]}
        />
      </Card>

      <Card title="ทักษะด้านภาษา" style={{ marginBottom: 24 }}>
        <Table
          rowKey="id"
          bordered
          pagination={false}
          dataSource={languageSkills}
          locale={{
            emptyText: "ไม่มีข้อมูล",
          }}
          columns={[
            {
              title: "Language",
              dataIndex: "language",
              key: "language",
            },
            {
              title: "Listening",
              dataIndex: "listening",
              key: "listening",
              width: 100,
              align: "center",
            },
            {
              title: "Speaking",
              dataIndex: "speaking",
              key: "speaking",
              width: 100,
              align: "center",
            },
            {
              title: "Reading",
              dataIndex: "reading",
              key: "reading",
              width: 100,
              align: "center",
            },
            {
              title: "Writing",
              dataIndex: "writing",
              key: "writing",
              width: 100,
              align: "center",
            },
          ]}
        />
      </Card>

      {/* ====================================================== */}
      {/* เอกสารแนบ */}
      {/* ====================================================== */}

      <Card
        title="เอกสารแนบ"
      >
        <Table
          rowKey="id"
          bordered
          pagination={false}
          dataSource={documents}
          locale={{
            emptyText: "ไม่มีข้อมูล",
          }}
          columns={[
            {
              title: "ประเภทเอกสาร",
              dataIndex: "document_type",
              key: "document_type",
              width: 180,
            },
            {
              title: "ชื่อเอกสาร",
              dataIndex: "title",
              key: "title",
            },
            {
              title: "ชื่อไฟล์",
              dataIndex: "file_name",
              key: "file_name",
            },
            {
              title: "ดาวน์โหลด",
              key: "download",
              width: 140,
              align: "center",
              render: (_, record) => (
                <Button
                  type="link"
                  href={record.file_url}
                  target="_blank"
                >
                  ดาวน์โหลด
                </Button>
              ),
            },
          ]}
        />
      </Card>
      
      {application.self_presentation_url && (
        <Card title="Presentation" style={{ marginTop: 24 }}>
          <div >
            Presentation URL :{" "}

            {application.self_presentation_url ? (
              <Button
                type="primary"
                href={application.self_presentation_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                เปิด Presentation
              </Button>
            ) : (
              <strong>-</strong>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}