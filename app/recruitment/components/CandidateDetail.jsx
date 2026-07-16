"use client";

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
  0: "default",
  1: "processing",
  2: "success",
  3: "error",
};

const statusText = {
  0: "รอพิจารณา",
  1: "กำลังพิจารณา",
  2: "ผ่าน",
  3: "ไม่ผ่าน",
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

export default function CandidateDetail({
  application,
  education,
  workExperience,
  skills,
  documents,
}) {
  return (
    <div style={{ padding: 24 }}>

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
            {value(application.gender)}
          </Descriptions.Item>

          {application.gender !== "female" && (
            <Descriptions.Item label="สถานะทางทหาร">
                {(() => {
                switch (application.military_status) {
                    case "not_served":
                    return "ยังไม่ได้เกณฑ์ทหาร";

                    case "completed":
                    return "ผ่านการเกณฑ์ทหารแล้ว";

                    case "exempted":
                    return "ได้รับการยกเว้น";

                    default:
                    return value(application.military_status);
                }
                })()}
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
            {value(application.nationality)}
          </Descriptions.Item>

          <Descriptions.Item label="ศาสนา">
            {value(application.religion)}
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
            {value(application.sub_district)}
          </Descriptions.Item>

          <Descriptions.Item label="อำเภอ">
            {value(application.district)}
          </Descriptions.Item>

          <Descriptions.Item label="จังหวัด">
            {value(application.province)}
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

          <Descriptions.Item label="ลักษณะที่อยู่อาศัย">
            {value(application.residence_type)}
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
            {value(application.marital_status)}
          </Descriptions.Item>

          <Descriptions.Item label="จำนวนบุตร">
            {value(application.children)}
          </Descriptions.Item>

          <Descriptions.Item label="ใบขับขี่">
            {typeof application.driver_license === "object"
              ? JSON.stringify(application.driver_license)
              : value(application.driver_license)}
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

      <Card
        title="ทักษะ"
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="id"
          bordered
          pagination={false}
          dataSource={skills}
          locale={{
            emptyText: "ไม่มีข้อมูล",
          }}
          columns={[
            {
              title: "ประเภท",
              dataIndex: "skill_type",
              key: "skill_type",
              width: 140,
            },
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
        style={{ marginBottom: 24 }}
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
    </div>
  );
}